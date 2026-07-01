import os

os.environ["DATABASE_URL"] = "sqlite://"

import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.api.analytics import router as analytics_router
from app.api.application import router as application_router
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
from app.models.application import Application  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.experience import Experience  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.knowledge import Knowledge  # noqa: F401
from app.models.plugin import Plugin  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.skill import Skill  # noqa: F401

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)
_test_app.include_router(document_router)
_test_app.include_router(job_router)
_test_app.include_router(experience_router)
_test_app.include_router(skill_router)
_test_app.include_router(application_router)
_test_app.include_router(plugin_router)
_test_app.include_router(knowledge_router)
_test_app.include_router(analytics_router)


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


class TestAnalyticsEmpty:
    def test_summary_empty(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["profile"]["exists"] is False
        assert data["resumes"]["total"] == 0
        assert data["jobs"]["total"] == 0
        assert data["applications"]["total"] == 0
        assert data["documents"]["total"] == 0
        assert data["knowledge"]["total"] == 0
        assert data["plugins"]["total"] == 0
        assert data["ats"]["total_scores"] == 0
        assert "generated_at" in data

    def test_profile_empty(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/profile")
        assert resp.status_code == 200
        data = resp.json()
        assert data["exists"] is False
        assert data["completeness_pct"] == 0.0
        assert data["fields_populated"] == 0

    def test_resumes_empty(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/resumes")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_jobs_empty(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/jobs")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_applications_empty(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/applications")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_documents_empty(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/documents")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_knowledge_empty(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/knowledge")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_plugins_empty(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/plugins")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0


class TestAnalyticsWithData:
    def _seed(self, session: Session):
        session.add(Profile(
            user_id=1,
            summary="A developer",
            target_roles='["Developer"]',
            industries='["Tech"]',
        ))
        session.add(Resume(profile_id=1, title="Resume A", content="Content A", version=1, is_latest=True))
        session.add(Resume(profile_id=1, title="Resume B", content="Content B", version=2, is_latest=True))
        session.add(Job(profile_id=1, company="Co", title="Dev", status="saved", score=85))
        session.add(Job(profile_id=1, company="Co2", title="Sr Dev", status="applied", score=90, fit_score=80))
        session.add(Application(profile_id=1, job_id=1, status="applied", resume_id=1))
        session.add(Application(profile_id=1, job_id=2, status="interview"))
        session.add(Application(profile_id=1, status="saved"))
        session.add(Document(profile_id=1, filename="doc1.pdf", category="resume", source="upload", file_size=1024))
        session.add(Document(profile_id=1, filename="doc2.txt", category="cover_letter", source="manual", file_size=512))
        session.add(Knowledge(source_id="k1", source_type="document", title="K1", content="Content", chunk_count=3))
        session.add(Knowledge(source_id="k2", source_type="resume", title="K2", content="Content", chunk_count=5,
                              embedding_json="[[0.1]]"))
        session.add(Plugin(source_id="p1", name="P1", version="1.0.0", category="ats", entry_point="main",
                           min_careeros_version="0.1.0", status="enabled"))
        session.add(Plugin(source_id="p2", name="P2", version="1.0.0", category="analysis", entry_point="main",
                           min_careeros_version="0.1.0", status="registered"))
        session.commit()

    def test_summary_with_data(self, _session):
        self._seed(_session)
        client = TestClient(_test_app)
        resp = client.get("/analytics/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["profile"]["exists"] is True
        assert data["profile"]["completeness_pct"] == 60.0
        assert data["profile"]["fields_populated"] == 3
        assert data["resumes"]["total"] == 2
        assert data["resumes"]["latest_version"] == 2
        assert data["resumes"]["has_content"] == 2
        assert data["jobs"]["total"] == 2
        assert data["jobs"]["by_status"]["saved"] == 1
        assert data["jobs"]["by_status"]["applied"] == 1
        assert data["jobs"]["with_score"] == 2
        assert data["jobs"]["avg_score"] == 87.5
        assert data["applications"]["total"] == 3
        assert data["applications"]["by_status"]["applied"] == 1
        assert data["applications"]["by_status"]["interview"] == 1
        assert data["applications"]["by_status"]["saved"] == 1
        assert data["applications"]["with_resume"] == 1
        assert data["documents"]["total"] == 2
        assert data["documents"]["by_category"]["resume"] == 1
        assert data["documents"]["by_category"]["cover_letter"] == 1
        assert data["documents"]["by_source"]["upload"] == 1
        assert data["documents"]["by_source"]["manual"] == 1
        assert data["documents"]["total_size_bytes"] == 1536
        assert data["knowledge"]["total"] == 2
        assert data["knowledge"]["by_source_type"]["document"] == 1
        assert data["knowledge"]["by_source_type"]["resume"] == 1
        assert data["knowledge"]["indexed"] == 1
        assert data["knowledge"]["total_chunks"] == 8
        assert data["plugins"]["total"] == 2
        assert data["plugins"]["by_status"]["enabled"] == 1
        assert data["plugins"]["by_status"]["registered"] == 1
        assert data["plugins"]["by_category"]["ats"] == 1
        assert data["plugins"]["by_category"]["analysis"] == 1
        assert data["ats"]["total_scores"] == 3
        assert data["ats"]["avg_ats_score"] == 85.0

    def test_ats_with_evaluation_json(self, _session):
        session = _session
        session.add(Job(profile_id=1, company="Co", title="Dev", status="saved",
                        evaluation_json=json.dumps({
                            "keyword_match_rate": 0.75,
                            "formatting_score": 88.0,
                        })))
        session.commit()
        client = TestClient(_test_app)
        resp = client.get("/analytics/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ats"]["total_scores"] == 0
        assert data["ats"]["avg_keyword_match_rate"] == 0.8
        assert data["ats"]["avg_formatting_score"] == 88.0

    def test_analytics_endpoints_individually(self, _session):
        self._seed(_session)
        client = TestClient(_test_app)
        for endpoint in ["profile", "resumes", "jobs", "applications", "documents", "knowledge", "plugins"]:
            resp = client.get(f"/analytics/{endpoint}")
            assert resp.status_code == 200
            assert "total" in resp.json() or "exists" in resp.json()

    def test_recent_activity(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/summary")
        data = resp.json()
        assert data["recent_activity"]["last_activity"] is None
        # seed data and verify last_activity exists
        self._seed(_session)
        resp2 = client.get("/analytics/summary")
        data2 = resp2.json()
        assert data2["recent_activity"]["last_activity"] is not None


class TestAnalyticsNoRegression:
    def test_health_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_profile_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.put("/profile", json={"summary": "Engineer"})
        assert resp.status_code == 200

    def test_existing_endpoints_still_work(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/documents", json={"filename": "doc.pdf"})
        client.post("/resumes", json={"title": "My Resume"})
        client.post("/jobs", json={"title": "New Job"})
        client.post("/experiences", json={"title": "Exp 1"})
        client.post("/skills", json={"name": "Python"})
        client.post("/knowledge", json={"source_id": "test", "source_type": "note"})
        assert client.get("/health").status_code == 200
        assert client.get("/profile").status_code == 200
        assert client.get("/resumes").status_code == 200
        assert client.get("/documents").status_code == 200
        assert client.get("/jobs").status_code == 200
        assert client.get("/experiences").status_code == 200
        assert client.get("/skills").status_code == 200
        assert client.get("/knowledge").status_code == 200
        assert client.get("/analytics/summary").status_code == 200

    def test_no_live_ollama_required(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/analytics/summary")
        assert resp.status_code == 200
        assert resp.json()["profile"]["exists"] is False

    def test_all_analytics_endpoints_return_json(self, _session):
        client = TestClient(_test_app)
        endpoints = [
            "/analytics/summary",
            "/analytics/profile",
            "/analytics/resumes",
            "/analytics/jobs",
            "/analytics/applications",
            "/analytics/documents",
            "/analytics/knowledge",
            "/analytics/plugins",
        ]
        for ep in endpoints:
            resp = client.get(ep)
            assert resp.status_code == 200
            content_type = resp.headers.get("content-type", "")
            assert "json" in content_type, f"{ep} did not return JSON"
