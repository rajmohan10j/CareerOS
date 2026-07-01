import os

os.environ["DATABASE_URL"] = "sqlite://"

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.api.document import router as document_router
from app.api.health import router as health_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.config import settings
from app.core.database import get_session
from app.models.document import Document  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.repositories.document import DocumentRepository
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.ai_service import AIService
from app.services.document_service import DocumentService

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)
_test_app.include_router(document_router)


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


class TestDocumentAPI:
    def test_list_returns_empty_initially(self, _session):
        client = TestClient(_test_app)
        response = client.get("/documents")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_and_get(self, _session):
        client = TestClient(_test_app)
        payload = {"filename": "resume.pdf", "file_type": "pdf", "title": "My Resume"}
        create_resp = client.post("/documents", json=payload)
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert data["filename"] == "resume.pdf"
        assert data["file_type"] == "pdf"
        assert data["title"] == "My Resume"
        assert "id" in data

        doc_id = data["id"]
        get_resp = client.get(f"/documents/{doc_id}")
        assert get_resp.status_code == 200
        assert get_resp.json() == data

    def test_get_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.get("/documents/999")
        assert response.status_code == 404

    def test_update(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/documents", json={"filename": "doc.txt"})
        doc_id = create_resp.json()["id"]

        update_resp = client.put(f"/documents/{doc_id}", json={"title": "Updated"})
        assert update_resp.status_code == 200
        assert update_resp.json()["title"] == "Updated"

    def test_update_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.put("/documents/999", json={"title": "nope"})
        assert response.status_code == 404

    def test_delete(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/documents", json={"filename": "del.txt"})
        doc_id = create_resp.json()["id"]

        del_resp = client.delete(f"/documents/{doc_id}")
        assert del_resp.status_code == 204

        get_resp = client.get(f"/documents/{doc_id}")
        assert get_resp.status_code == 404

    def test_delete_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.delete("/documents/999")
        assert response.status_code == 404

    def test_list_returns_multiple(self, _session):
        client = TestClient(_test_app)
        client.post("/documents", json={"filename": "a.pdf"})
        client.post("/documents", json={"filename": "b.pdf"})
        response = client.get("/documents")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_search_by_title(self, _session):
        client = TestClient(_test_app)
        client.post("/documents", json={"filename": "resume.pdf", "title": "Software Engineer Resume"})
        client.post("/documents", json={"filename": "cover.pdf", "title": "Cover Letter"})
        response = client.get("/documents/search?q=engineer")
        assert response.status_code == 200
        results = response.json()
        assert len(results) == 1
        assert results[0]["title"] == "Software Engineer Resume"

    def test_search_by_content(self, _session):
        client = TestClient(_test_app)
        client.post("/documents", json={"filename": "doc.txt", "content": "Python developer with 5 years experience"})
        client.post("/documents", json={"filename": "other.txt", "content": "Marketing specialist"})
        response = client.get("/documents/search?q=Python")
        assert response.status_code == 200
        results = response.json()
        assert len(results) == 1

    def test_search_empty_query(self, _session):
        client = TestClient(_test_app)
        client.post("/documents", json={"filename": "a.pdf"})
        client.post("/documents", json={"filename": "b.pdf"})
        response = client.get("/documents/search?q=")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_parse_with_ai(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/documents", json={
            "filename": "doc.txt", "content": "John Doe, Software Engineer, 5 years at Google",
        })
        doc_id = create_resp.json()["id"]
        fake_metadata = '{"title": "Resume", "summary": "Engineer", "key_entities": ["John Doe", "Google"]}'
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake_metadata
            resp = client.post(f"/documents/{doc_id}/parse")
        assert resp.status_code == 200
        assert resp.json()["metadata_json"] == fake_metadata

    def test_parse_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.post("/documents/999/parse")
        assert response.status_code == 404

    def test_classify_with_ai(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/documents", json={
            "filename": "doc.txt", "content": "This is a resume for a software engineer",
        })
        doc_id = create_resp.json()["id"]
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "resume"
            resp = client.post(f"/documents/{doc_id}/classify")
        assert resp.status_code == 200
        assert resp.json()["category"] == "resume"

    def test_classify_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.post("/documents/999/classify")
        assert response.status_code == 404


class TestDocumentService:
    def test_create(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        doc = svc.create(DocumentCreate(filename="test.pdf", title="Test"))
        assert doc.id is not None
        assert doc.filename == "test.pdf"

    def test_list(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        svc.create(DocumentCreate(filename="a.pdf"))
        svc.create(DocumentCreate(filename="b.pdf"))
        assert len(svc.list_all()) == 2

    def test_get_by_id_returns_none(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        assert svc.get_by_id(999) is None

    def test_update(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        created = svc.create(DocumentCreate(filename="doc.txt"))
        updated = svc.update(created.id, DocumentUpdate(title="Updated"))
        assert updated is not None
        assert updated.title == "Updated"

    def test_update_returns_none(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        assert svc.update(999, DocumentUpdate(title="nope")) is None

    def test_delete(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        created = svc.create(DocumentCreate(filename="del.txt"))
        assert svc.delete(created.id) is True
        assert svc.get_by_id(created.id) is None

    def test_delete_returns_false(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        assert svc.delete(999) is False

    def test_search(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        svc.create(DocumentCreate(filename="resume.pdf", title="Engineer Resume"))
        svc.create(DocumentCreate(filename="cover.pdf", title="Cover Letter"))
        results = svc.search("engineer")
        assert len(results) == 1

    def test_parse_without_ai_returns_unchanged(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        doc = svc.create(DocumentCreate(filename="doc.txt", content="Some content"))
        import asyncio
        result = asyncio.run(svc.parse(doc.id))
        assert result is not None
        assert result.metadata_json is None

    def test_parse_with_ai(self, _session):
        repo = DocumentRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = '{"title": "Parsed"}'
        svc = DocumentService(repo, ai_service=mock_ai)
        doc = svc.create(DocumentCreate(filename="doc.txt", content="Some content"))
        import asyncio
        result = asyncio.run(svc.parse(doc.id))
        assert result is not None
        assert result.metadata_json == '{"title": "Parsed"}'

    def test_parse_returns_none_for_missing(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        import asyncio
        result = asyncio.run(svc.parse(999))
        assert result is None

    def test_classify_without_ai_returns_unchanged(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        doc = svc.create(DocumentCreate(filename="doc.txt", content="Some content"))
        import asyncio
        result = asyncio.run(svc.classify(doc.id))
        assert result is not None
        assert result.category is None

    def test_classify_with_ai(self, _session):
        repo = DocumentRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = "resume"
        svc = DocumentService(repo, ai_service=mock_ai)
        doc = svc.create(DocumentCreate(filename="doc.txt", content="Some content"))
        import asyncio
        result = asyncio.run(svc.classify(doc.id))
        assert result is not None
        assert result.category == "resume"

    def test_classify_falls_back_to_other(self, _session):
        repo = DocumentRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = "unknown_category"
        svc = DocumentService(repo, ai_service=mock_ai)
        doc = svc.create(DocumentCreate(filename="doc.txt", content="Some content"))
        import asyncio
        result = asyncio.run(svc.classify(doc.id))
        assert result is not None
        assert result.category == "other"

    def test_classify_returns_none_for_missing(self, _session):
        repo = DocumentRepository(_session)
        svc = DocumentService(repo)
        import asyncio
        result = asyncio.run(svc.classify(999))
        assert result is None

    def test_parse_no_content_returns_unchanged(self, _session):
        repo = DocumentRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        svc = DocumentService(repo, ai_service=mock_ai)
        doc = svc.create(DocumentCreate(filename="doc.txt"))
        import asyncio
        result = asyncio.run(svc.parse(doc.id))
        assert result is not None
        assert result.metadata_json is None
        mock_ai.generate.assert_not_called()

    def test_classify_no_content_returns_unchanged(self, _session):
        repo = DocumentRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        svc = DocumentService(repo, ai_service=mock_ai)
        doc = svc.create(DocumentCreate(filename="doc.txt"))
        import asyncio
        result = asyncio.run(svc.classify(doc.id))
        assert result is not None
        assert result.category is None
        mock_ai.generate.assert_not_called()


class TestDocumentNoRegression:
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

    def test_resume_still_works(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        fake = "# Resume"
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake
            resp = client.post("/resumes/generate", json={"target_role": "Engineer"})
        assert resp.status_code == 200
        assert resp.json()["content"] == fake

    def test_document_and_profile_both_work(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/documents", json={"filename": "test.pdf"})
        health = client.get("/health")
        assert health.status_code == 200
        profile = client.get("/profile")
        assert profile.status_code == 200
        docs = client.get("/documents")
        assert docs.status_code == 200
        assert len(docs.json()) == 1


class TestDocumentRepository:
    def test_list_returns_empty(self, _session):
        repo = DocumentRepository(_session)
        assert repo.list_all() == []

    def test_create_and_get_by_id(self, _session):
        repo = DocumentRepository(_session)
        doc = Document(profile_id=1, filename="test.pdf", file_type="pdf")
        created = repo.create(doc)
        fetched = repo.get_by_id(created.id)
        assert fetched is not None
        assert fetched.filename == "test.pdf"

    def test_get_by_id_returns_none(self, _session):
        repo = DocumentRepository(_session)
        assert repo.get_by_id(999) is None

    def test_delete_returns_true(self, _session):
        repo = DocumentRepository(_session)
        doc = Document(profile_id=1, filename="del.pdf", file_type="pdf")
        created = repo.create(doc)
        assert repo.delete(created.id) is True

    def test_delete_returns_false(self, _session):
        repo = DocumentRepository(_session)
        assert repo.delete(999) is False

    def test_search_by_title(self, _session):
        repo = DocumentRepository(_session)
        repo.create(Document(profile_id=1, filename="a.pdf", title="Engineer Resume"))
        repo.create(Document(profile_id=1, filename="b.pdf", title="Cover Letter"))
        results = repo.search("engineer")
        assert len(results) == 1

    def test_search_by_content(self, _session):
        repo = DocumentRepository(_session)
        repo.create(Document(profile_id=1, filename="a.txt", content="Python developer skills"))
        repo.create(Document(profile_id=1, filename="b.txt", content="Marketing experience"))
        results = repo.search("Python")
        assert len(results) == 1

    def test_search_by_filename(self, _session):
        repo = DocumentRepository(_session)
        repo.create(Document(profile_id=1, filename="resume_john.pdf"))
        repo.create(Document(profile_id=1, filename="cover_letter.pdf"))
        results = repo.search("resume")
        assert len(results) == 1

    def test_search_by_category(self, _session):
        repo = DocumentRepository(_session)
        repo.create(Document(profile_id=1, filename="a.pdf", category="resume"))
        repo.create(Document(profile_id=1, filename="b.pdf", category="certificate"))
        results = repo.search("certificate")
        assert len(results) == 1
