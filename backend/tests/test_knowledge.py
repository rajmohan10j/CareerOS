import os

os.environ["DATABASE_URL"] = "sqlite://"

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.api.document import router as document_router
from app.api.experience import router as experience_router
from app.api.health import router as health_router
from app.api.job import router as job_router
from app.api.knowledge import router as knowledge_router
from app.api.plugin import router as plugin_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.api.skill import router as skill_router
from app.config import settings
from app.core.database import get_session
from app.models.document import Document  # noqa: F401
from app.models.experience import Experience  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.knowledge import Knowledge  # noqa: F401
from app.models.plugin import Plugin  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.skill import Skill  # noqa: F401
from app.repositories.knowledge import KnowledgeRepository
from app.schemas.knowledge import KnowledgeCreate
from app.services.ai_service import AIService
from app.services.chunking_service import chunk_text, chunk_text_fixed_size
from app.services.knowledge_service import KnowledgeService

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)
_test_app.include_router(document_router)
_test_app.include_router(job_router)
_test_app.include_router(experience_router)
_test_app.include_router(skill_router)
_test_app.include_router(plugin_router)
_test_app.include_router(knowledge_router)


@pytest.fixture(autouse=True)
def _session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        _test_app.dependency_overrides[get_session] = lambda: session
        yield session
        _test_app.dependency_overrides.clear()


class TestChunking:
    def test_chunk_simple_text(self):
        text = "This is a short piece of text."
        chunks = chunk_text(text, chunk_size=500, overlap=50)
        assert len(chunks) == 1
        assert chunks[0].text == text
        assert chunks[0].index == 0

    def test_chunk_long_text(self):
        words = ["word"] * 1000
        text = " ".join(words)
        chunks = chunk_text(text, chunk_size=200, overlap=20)
        assert len(chunks) > 1
        assert chunks[0].index == 0
        assert chunks[-1].index == len(chunks) - 1

    def test_chunk_empty_text(self):
        chunks = chunk_text("", chunk_size=500, overlap=50)
        assert chunks == []

    def test_chunk_fixed_size(self):
        words = ["word"] * 300
        text = " ".join(words)
        chunks = chunk_text_fixed_size(text, chunk_size=100, overlap=10)
        assert len(chunks) > 1
        assert all(c.token_count <= 100 for c in chunks)

    def test_chunk_fixed_size_empty(self):
        chunks = chunk_text_fixed_size("")
        assert chunks == []

    def test_chunk_preserves_order(self):
        text = "First paragraph. Second paragraph. Third paragraph."
        chunks = chunk_text(text, chunk_size=500, overlap=0)
        assert len(chunks) == 1
        assert "First" in chunks[0].text
        assert "Third" in chunks[0].text

    def test_chunk_paragraph_split(self):
        text = "Para one.\n\nPara two.\n\nPara three."
        chunks = chunk_text(text, chunk_size=5, overlap=2)
        assert len(chunks) >= 2


class TestKnowledgeAPI:
    def test_list_returns_empty_initially(self, _session):
        client = TestClient(_test_app)
        response = client.get("/knowledge")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_and_get(self, _session):
        client = TestClient(_test_app)
        payload = {
            "source_id": "doc-001",
            "source_type": "document",
            "title": "Test Document",
            "content": "This is test content.",
        }
        create_resp = client.post("/knowledge", json=payload)
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert data["source_id"] == "doc-001"
        assert data["source_type"] == "document"
        assert data["title"] == "Test Document"
        assert "id" in data
        assert data["chunk_count"] == 0

        kid = data["id"]
        get_resp = client.get(f"/knowledge/{kid}")
        assert get_resp.status_code == 200
        assert get_resp.json() == data

    def test_create_invalid_source_type(self, _session):
        client = TestClient(_test_app)
        payload = {
            "source_id": "bad-001",
            "source_type": "invalid_type",
            "title": "Bad",
        }
        resp = client.post("/knowledge", json=payload)
        assert resp.status_code == 400

    def test_get_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.get("/knowledge/999")
        assert response.status_code == 404

    def test_list_returns_multiple(self, _session):
        client = TestClient(_test_app)
        client.post("/knowledge", json={"source_id": "a", "source_type": "note"})
        client.post("/knowledge", json={"source_id": "b", "source_type": "note"})
        response = client.get("/knowledge")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_delete(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/knowledge", json={"source_id": "del-001", "source_type": "note"})
        kid = create_resp.json()["id"]
        del_resp = client.delete(f"/knowledge/{kid}")
        assert del_resp.status_code == 204
        get_resp = client.get(f"/knowledge/{kid}")
        assert get_resp.status_code == 404

    def test_delete_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.delete("/knowledge/999")
        assert response.status_code == 404

    def test_chunk_endpoint(self, _session):
        client = TestClient(_test_app)
        content = " ".join(["word"] * 1000)
        create_resp = client.post("/knowledge", json={
            "source_id": "chunk-test",
            "source_type": "document",
            "content": content,
        })
        kid = create_resp.json()["id"]
        chunk_resp = client.post("/knowledge/chunk", json={
            "knowledge_id": kid, "chunk_size": 200, "overlap": 20,
        })
        assert chunk_resp.status_code == 200
        data = chunk_resp.json()
        assert data["chunk_count"] > 1
        assert len(data["chunks"]) > 1

    def test_chunk_returns_404(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/knowledge/chunk", json={"knowledge_id": 999})
        assert resp.status_code == 404

    def test_search_keyword(self, _session):
        client = TestClient(_test_app)
        client.post("/knowledge", json={
            "source_id": "s1", "source_type": "document",
            "title": "Python Developer", "content": "Experienced in Python and Django",
        })
        client.post("/knowledge", json={
            "source_id": "s2", "source_type": "document",
            "title": "Marketing", "content": "Marketing specialist with SEO skills",
        })
        search_resp = client.post("/knowledge/search", json={"query": "Python"})
        assert search_resp.status_code == 200
        results = search_resp.json()
        assert len(results) == 1
        assert results[0]["title"] == "Python Developer"

    def test_search_by_source_type(self, _session):
        client = TestClient(_test_app)
        client.post("/knowledge", json={
            "source_id": "r1", "source_type": "resume",
            "title": "Resume A",
        })
        client.post("/knowledge", json={
            "source_id": "j1", "source_type": "job",
            "title": "Job A",
        })
        search_resp = client.post("/knowledge/search", json={
            "query": "Resume", "source_type": "resume",
        })
        assert search_resp.status_code == 200
        results = search_resp.json()
        assert len(results) == 1

    def test_list_by_source_type(self, _session):
        client = TestClient(_test_app)
        client.post("/knowledge", json={"source_id": "r1", "source_type": "resume"})
        client.post("/knowledge", json={"source_id": "r2", "source_type": "resume"})
        client.post("/knowledge", json={"source_id": "j1", "source_type": "job"})
        resp = client.get("/knowledge?source_type=resume")
        assert resp.status_code == 200
        assert len(resp.json()) == 2
        resp2 = client.get("/knowledge?source_type=job")
        assert len(resp2.json()) == 1

    def test_list_by_invalid_source_type(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/knowledge?source_type=bogus")
        assert resp.status_code == 400

    def test_get_by_source(self, _session):
        client = TestClient(_test_app)
        client.post("/knowledge", json={
            "source_id": "doc-abc", "source_type": "document",
            "title": "ABC Doc",
        })
        client.post("/knowledge", json={
            "source_id": "doc-abc", "source_type": "document",
            "title": "ABC Doc V2",
        })
        resp = client.get("/knowledge/source/document/doc-abc")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_by_source_unknown_type(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/knowledge/source/bogus/xyz")
        assert resp.status_code == 400

    def test_index_placeholder(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/knowledge", json={
            "source_id": "idx-test",
            "source_type": "document",
            "title": "Indexable",
            "content": "Some text to index.",
        })
        kid = create_resp.json()["id"]
        client.post("/knowledge/chunk", json={"knowledge_id": kid, "chunk_size": 500})
        with patch.object(AIService, "embed", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = [[0.1, 0.2, 0.3]]
            resp = client.post("/knowledge/index", json={"knowledge_id": kid})
        assert resp.status_code == 200
        data = resp.json()
        assert data["indexed"] is True

    def test_index_all_placeholder(self, _session):
        client = TestClient(_test_app)
        client.post("/knowledge", json={
            "source_id": "a", "source_type": "document",
            "content": "Text A",
        })
        client.post("/knowledge", json={
            "source_id": "b", "source_type": "note",
            "content": "Text B",
        })
        with patch.object(AIService, "embed", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = [[0.1], [0.2]]
            resp = client.post("/knowledge/index")
        assert resp.status_code == 200
        assert "indexed" in resp.json()
        assert "total" in resp.json()

    def test_index_no_ai_fallback(self, _session):
        session = _session
        repo = KnowledgeRepository(session)
        svc = KnowledgeService(repo)
        data = KnowledgeCreate(source_id="no-ai", source_type="note", content="test")
        record = svc.create(data)
        svc.chunk_knowledge(record.id, chunk_size=50)
        result = svc.index_knowledge(record.id)
        assert result is not None
        assert result.embedding_json is None


class TestKnowledgeService:
    def test_create(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        data = KnowledgeCreate(source_id="s1", source_type="document", title="Doc")
        record = svc.create(data)
        assert record.id is not None
        assert record.source_id == "s1"
        assert record.source_type == "document"

    def test_list(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        svc.create(KnowledgeCreate(source_id="a", source_type="note"))
        svc.create(KnowledgeCreate(source_id="b", source_type="note"))
        assert len(svc.list_all()) == 2

    def test_get_by_id_returns_none(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        assert svc.get_by_id(999) is None

    def test_delete(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        record = svc.create(KnowledgeCreate(source_id="del", source_type="note"))
        assert svc.delete(record.id) is True
        assert svc.get_by_id(record.id) is None

    def test_delete_returns_false(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        assert svc.delete(999) is False

    def test_chunk_knowledge(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        data = KnowledgeCreate(source_id="c1", source_type="document", content="word " * 500)
        record = svc.create(data)
        updated = svc.chunk_knowledge(record.id, chunk_size=100, overlap=10)
        assert updated is not None
        assert updated.chunk_count > 1

    def test_chunk_knowledge_no_content(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        data = KnowledgeCreate(source_id="nc", source_type="note")
        record = svc.create(data)
        updated = svc.chunk_knowledge(record.id)
        assert updated is not None
        assert updated.chunk_count == 0

    def test_chunk_knowledge_returns_none(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        assert svc.chunk_knowledge(999) is None

    def test_search(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        svc.create(KnowledgeCreate(source_id="s1", source_type="document", content="Python skills"))
        svc.create(KnowledgeCreate(source_id="s2", source_type="document", content="Java skills"))
        results = svc.search("Python")
        assert len(results) == 1
        assert results[0].source_id == "s1"

    def test_search_with_source_filter(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        svc.create(KnowledgeCreate(source_id="r1", source_type="resume", content="Engineer"))
        svc.create(KnowledgeCreate(source_id="j1", source_type="job", content="Engineer job"))
        results = svc.search("Engineer", source_type="resume")
        assert len(results) == 1
        assert results[0].source_type == "resume"

    def test_list_by_source_type(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        svc.create(KnowledgeCreate(source_id="a", source_type="resume"))
        svc.create(KnowledgeCreate(source_id="b", source_type="resume"))
        svc.create(KnowledgeCreate(source_id="c", source_type="job"))
        assert len(svc.list_by_source_type("resume")) == 2
        assert len(svc.list_by_source_type("job")) == 1

    def test_get_by_source(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        svc.create(KnowledgeCreate(source_id="doc-abc", source_type="document"))
        svc.create(KnowledgeCreate(source_id="doc-abc", source_type="document"))
        svc.create(KnowledgeCreate(source_id="other", source_type="note"))
        assert len(svc.get_by_source("document", "doc-abc")) == 2
        assert len(svc.get_by_source("document", "nonexistent")) == 0

    def test_validate_source_type(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        assert svc.validate_source_type("resume") is True
        assert svc.validate_source_type("profile") is True
        assert svc.validate_source_type("bogus") is False

    def test_reindex_no_ai(self, _session):
        repo = KnowledgeRepository(_session)
        svc = KnowledgeService(repo)
        result = svc.reindex_all()
        assert result == {"indexed": 0, "message": "No AI service available"}


class TestKnowledgeRepository:
    def test_list_returns_empty(self, _session):
        repo = KnowledgeRepository(_session)
        assert repo.list_all() == []

    def test_create_and_get_by_id(self, _session):
        repo = KnowledgeRepository(_session)
        record = Knowledge(source_id="s1", source_type="document", title="Test")
        created = repo.create(record)
        fetched = repo.get_by_id(created.id)
        assert fetched is not None
        assert fetched.source_id == "s1"

    def test_get_by_id_returns_none(self, _session):
        repo = KnowledgeRepository(_session)
        assert repo.get_by_id(999) is None

    def test_delete_returns_true(self, _session):
        repo = KnowledgeRepository(_session)
        record = Knowledge(source_id="del", source_type="note")
        created = repo.create(record)
        assert repo.delete(created.id) is True

    def test_delete_returns_false(self, _session):
        repo = KnowledgeRepository(_session)
        assert repo.delete(999) is False

    def test_search_by_keyword_title(self, _session):
        repo = KnowledgeRepository(_session)
        repo.create(Knowledge(source_id="a", source_type="doc", title="Python Doc"))
        repo.create(Knowledge(source_id="b", source_type="doc", title="Java Doc"))
        results = repo.search_by_keyword("Python")
        assert len(results) == 1
        assert results[0].title == "Python Doc"

    def test_search_by_keyword_content(self, _session):
        repo = KnowledgeRepository(_session)
        repo.create(Knowledge(source_id="a", source_type="doc", content="Strong Django skills"))
        repo.create(Knowledge(source_id="b", source_type="doc", content="Marketing experience"))
        results = repo.search_by_keyword("Django")
        assert len(results) == 1

    def test_search_with_source_type_filter(self, _session):
        repo = KnowledgeRepository(_session)
        repo.create(Knowledge(source_id="r1", source_type="resume", content="Engineer"))
        repo.create(Knowledge(source_id="j1", source_type="job", content="Engineer"))
        results = repo.search_by_keyword("Engineer", source_type="resume")
        assert len(results) == 1
        assert results[0].source_type == "resume"

    def test_search_with_limit(self, _session):
        repo = KnowledgeRepository(_session)
        for i in range(5):
            repo.create(Knowledge(source_id=str(i), source_type="doc", content="Common text"))
        results = repo.search_by_keyword("Common", limit=2)
        assert len(results) == 2

    def test_list_by_source_type(self, _session):
        repo = KnowledgeRepository(_session)
        repo.create(Knowledge(source_id="a", source_type="resume"))
        repo.create(Knowledge(source_id="b", source_type="resume"))
        repo.create(Knowledge(source_id="c", source_type="job"))
        assert len(repo.list_by_source_type("resume")) == 2
        assert len(repo.list_by_source_type("job")) == 1
        assert len(repo.list_by_source_type("other")) == 0

    def test_get_by_source(self, _session):
        repo = KnowledgeRepository(_session)
        repo.create(Knowledge(source_id="doc-abc", source_type="document"))
        repo.create(Knowledge(source_id="doc-abc", source_type="document"))
        repo.create(Knowledge(source_id="other", source_type="note"))
        assert len(repo.get_by_source("document", "doc-abc")) == 2
        assert len(repo.get_by_source("document", "nonexistent")) == 0


class TestKnowledgeNoRegression:
    def test_health_still_works(self, _session):
        client = TestClient(_test_app)
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_profile_still_works(self, _session):
        client = TestClient(_test_app)
        put_resp = client.put("/profile", json={"summary": "Engineer"})
        assert put_resp.status_code == 200
        get_resp = client.get("/profile")
        assert get_resp.status_code == 200
        assert get_resp.json()["summary"] == "Engineer"

    def test_all_endpoints_still_work(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/documents", json={"filename": "doc.pdf"})
        client.post("/resumes", json={"title": "My Resume"})
        client.post("/jobs", json={"title": "New Job"})
        client.post("/experiences", json={"title": "Exp 1"})
        client.post("/skills", json={"name": "Python"})
        client.post("/knowledge", json={
            "source_id": "regression-test",
            "source_type": "note",
            "title": "Regression",
        })
        assert client.get("/health").status_code == 200
        assert client.get("/profile").status_code == 200
        assert client.get("/resumes").status_code == 200
        assert client.get("/documents").status_code == 200
        assert client.get("/jobs").status_code == 200
        assert client.get("/experiences").status_code == 200
        assert client.get("/skills").status_code == 200
        assert client.get("/knowledge").status_code == 200

    def test_no_live_ollama_required(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/knowledge", json={
            "source_id": "no-ollama", "source_type": "note",
            "title": "No Ollama", "content": "This works without Ollama.",
        })
        assert resp.status_code == 201
        kid = resp.json()["id"]
        get_resp = client.get(f"/knowledge/{kid}")
        assert get_resp.status_code == 200
        search_resp = client.post("/knowledge/search", json={"query": "Ollama"})
        assert search_resp.status_code == 200
        assert len(search_resp.json()) == 1
