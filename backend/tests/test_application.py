import os

os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.api.application import router as application_router
from app.api.document import router as document_router
from app.api.experience import router as experience_router
from app.api.health import router as health_router
from app.api.job import router as job_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.api.skill import router as skill_router
from app.config import settings
from app.core.database import get_session
from app.models.application import Application  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.experience import Experience  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.skill import Skill  # noqa: F401
from app.repositories.application import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationUpdate
from app.services.application_service import ApplicationService

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)
_test_app.include_router(document_router)
_test_app.include_router(job_router)
_test_app.include_router(experience_router)
_test_app.include_router(skill_router)
_test_app.include_router(application_router)


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


class TestApplicationAPI:
    def test_list_returns_empty_initially(self, _session):
        client = TestClient(_test_app)
        response = client.get("/applications")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_and_get(self, _session):
        client = TestClient(_test_app)
        payload = {"job_id": 1, "status": "applied", "notes": "Good fit"}
        create_resp = client.post("/applications", json=payload)
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert data["job_id"] == 1
        assert data["status"] == "applied"
        assert data["notes"] == "Good fit"
        assert "id" in data

        app_id = data["id"]
        get_resp = client.get(f"/applications/{app_id}")
        assert get_resp.status_code == 200
        assert get_resp.json() == data

    def test_get_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.get("/applications/999")
        assert response.status_code == 404

    def test_update(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/applications", json={"status": "saved"})
        app_id = create_resp.json()["id"]
        update_resp = client.put(f"/applications/{app_id}", json={"status": "applied", "notes": "Applied!"})
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["status"] == "applied"
        assert data["notes"] == "Applied!"

    def test_update_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.put("/applications/999", json={"status": "nope"})
        assert response.status_code == 404

    def test_delete(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/applications", json={"status": "saved"})
        app_id = create_resp.json()["id"]
        del_resp = client.delete(f"/applications/{app_id}")
        assert del_resp.status_code == 204
        get_resp = client.get(f"/applications/{app_id}")
        assert get_resp.status_code == 404

    def test_delete_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.delete("/applications/999")
        assert response.status_code == 404

    def test_list_returns_multiple(self, _session):
        client = TestClient(_test_app)
        client.post("/applications", json={"status": "saved"})
        client.post("/applications", json={"status": "applied"})
        response = client.get("/applications")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_list_by_status(self, _session):
        client = TestClient(_test_app)
        client.post("/applications", json={"status": "applied", "job_id": 1})
        client.post("/applications", json={"status": "applied", "job_id": 2})
        client.post("/applications", json={"status": "saved", "job_id": 3})
        response = client.get("/applications?status=applied")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_list_by_job(self, _session):
        client = TestClient(_test_app)
        client.post("/applications", json={"status": "applied", "job_id": 5})
        client.post("/applications", json={"status": "saved", "job_id": 5})
        client.post("/applications", json={"status": "saved", "job_id": 6})
        response = client.get("/applications?job_id=5")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_default_status_is_saved(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/applications", json={})
        assert resp.status_code == 201
        assert resp.json()["status"] == "saved"

    def test_create_with_resume(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/applications", json={"resume_id": 1, "status": "applied"})
        assert resp.status_code == 201
        assert resp.json()["resume_id"] == 1


class TestApplicationService:
    def test_create(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        app = svc.create(ApplicationCreate(job_id=1, status="applied"))
        assert app.id is not None
        assert app.status == "applied"
        assert app.job_id == 1

    def test_list(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        svc.create(ApplicationCreate(status="saved"))
        svc.create(ApplicationCreate(status="applied"))
        assert len(svc.list_all()) == 2

    def test_get_by_id_returns_none(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        assert svc.get_by_id(999) is None

    def test_update(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        created = svc.create(ApplicationCreate(status="saved"))
        updated = svc.update(created.id, ApplicationUpdate(status="applied", notes="Done"))
        assert updated is not None
        assert updated.status == "applied"
        assert updated.notes == "Done"

    def test_update_returns_none(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        assert svc.update(999, ApplicationUpdate(status="nope")) is None

    def test_delete(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        created = svc.create(ApplicationCreate(status="saved"))
        assert svc.delete(created.id) is True
        assert svc.get_by_id(created.id) is None

    def test_delete_returns_false(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        assert svc.delete(999) is False

    def test_default_status(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        app = svc.create(ApplicationCreate())
        assert app.status == "saved"

    def test_list_by_status(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        svc.create(ApplicationCreate(status="applied"))
        svc.create(ApplicationCreate(status="applied"))
        svc.create(ApplicationCreate(status="saved"))
        assert len(svc.list_by_status("applied")) == 2
        assert len(svc.list_by_status("saved")) == 1
        assert len(svc.list_by_status("rejected")) == 0

    def test_list_by_job(self, _session):
        repo = ApplicationRepository(_session)
        svc = ApplicationService(repo)
        svc.create(ApplicationCreate(job_id=1))
        svc.create(ApplicationCreate(job_id=1))
        svc.create(ApplicationCreate(job_id=2))
        assert len(svc.list_by_job(1)) == 2
        assert len(svc.list_by_job(3)) == 0


class TestApplicationNoRegression:
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

    def test_skill_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/skills", json={"name": "Python"})
        assert resp.status_code == 201

    def test_all_modules_together(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/documents", json={"filename": "doc.pdf"})
        client.post("/resumes", json={"title": "My Resume"})
        client.post("/jobs", json={"title": "New Job"})
        client.post("/experiences", json={"title": "Exp 1"})
        client.post("/skills", json={"name": "Python"})
        client.post("/applications", json={"status": "applied", "job_id": 1})
        assert client.get("/health").status_code == 200
        assert client.get("/profile").status_code == 200
        assert client.get("/resumes").status_code == 200
        assert client.get("/documents").status_code == 200
        assert client.get("/jobs").status_code == 200
        assert client.get("/experiences").status_code == 200
        assert client.get("/skills").status_code == 200
        assert client.get("/applications").status_code == 200


class TestApplicationRepository:
    def test_list_returns_empty(self, _session):
        repo = ApplicationRepository(_session)
        assert repo.list_all() == []

    def test_create_and_get_by_id(self, _session):
        repo = ApplicationRepository(_session)
        app = Application(profile_id=1, job_id=1, status="applied")
        created = repo.create(app)
        fetched = repo.get_by_id(created.id)
        assert fetched is not None
        assert fetched.status == "applied"

    def test_get_by_id_returns_none(self, _session):
        repo = ApplicationRepository(_session)
        assert repo.get_by_id(999) is None

    def test_delete_returns_true(self, _session):
        repo = ApplicationRepository(_session)
        app = Application(profile_id=1, status="saved")
        created = repo.create(app)
        assert repo.delete(created.id) is True

    def test_delete_returns_false(self, _session):
        repo = ApplicationRepository(_session)
        assert repo.delete(999) is False

    def test_list_by_status(self, _session):
        repo = ApplicationRepository(_session)
        repo.create(Application(profile_id=1, status="applied"))
        repo.create(Application(profile_id=1, status="applied"))
        repo.create(Application(profile_id=1, status="saved"))
        assert len(repo.list_by_status("applied")) == 2

    def test_list_by_job(self, _session):
        repo = ApplicationRepository(_session)
        repo.create(Application(profile_id=1, job_id=10, status="applied"))
        repo.create(Application(profile_id=1, job_id=10, status="saved"))
        repo.create(Application(profile_id=1, job_id=20, status="applied"))
        assert len(repo.list_by_job(10)) == 2
