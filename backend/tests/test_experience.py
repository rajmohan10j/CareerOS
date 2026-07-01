import os

os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.api.document import router as document_router
from app.api.experience import router as experience_router
from app.api.health import router as health_router
from app.api.job import router as job_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.config import settings
from app.core.database import get_session
from app.models.application import Application  # noqa: F401
from app.models.document import Document  # noqa: F401
from app.models.experience import Experience  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.skill import Skill  # noqa: F401
from app.repositories.experience import ExperienceRepository
from app.schemas.experience import ExperienceCreate, ExperienceUpdate
from app.services.experience_service import ExperienceService

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)
_test_app.include_router(document_router)
_test_app.include_router(job_router)
_test_app.include_router(experience_router)


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


class TestExperienceAPI:
    def test_list_returns_empty_initially(self, _session):
        client = TestClient(_test_app)
        response = client.get("/experiences")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_and_get(self, _session):
        client = TestClient(_test_app)
        payload = {"company": "Acme", "title": "Engineer", "description": "Built things"}
        create_resp = client.post("/experiences", json=payload)
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert data["company"] == "Acme"
        assert data["title"] == "Engineer"
        assert data["description"] == "Built things"
        assert "id" in data

        exp_id = data["id"]
        get_resp = client.get(f"/experiences/{exp_id}")
        assert get_resp.status_code == 200
        assert get_resp.json() == data

    def test_get_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.get("/experiences/999")
        assert response.status_code == 404

    def test_update(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/experiences", json={"title": "Junior"})
        exp_id = create_resp.json()["id"]
        update_resp = client.put(
            f"/experiences/{exp_id}", json={"title": "Senior", "company": "Acme"}
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["title"] == "Senior"
        assert data["company"] == "Acme"

    def test_update_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.put("/experiences/999", json={"title": "nope"})
        assert response.status_code == 404

    def test_delete(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/experiences", json={"title": "Delete Me"})
        exp_id = create_resp.json()["id"]
        del_resp = client.delete(f"/experiences/{exp_id}")
        assert del_resp.status_code == 204
        get_resp = client.get(f"/experiences/{exp_id}")
        assert get_resp.status_code == 404

    def test_delete_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.delete("/experiences/999")
        assert response.status_code == 404

    def test_list_returns_multiple(self, _session):
        client = TestClient(_test_app)
        client.post("/experiences", json={"title": "A"})
        client.post("/experiences", json={"title": "B"})
        response = client.get("/experiences")
        assert response.status_code == 200
        assert len(response.json()) == 2


class TestExperienceService:
    def test_create(self, _session):
        repo = ExperienceRepository(_session)
        svc = ExperienceService(repo)
        exp = svc.create(ExperienceCreate(company="Acme", title="Engineer"))
        assert exp.id is not None
        assert exp.title == "Engineer"
        assert exp.company == "Acme"

    def test_list(self, _session):
        repo = ExperienceRepository(_session)
        svc = ExperienceService(repo)
        svc.create(ExperienceCreate(title="A"))
        svc.create(ExperienceCreate(title="B"))
        assert len(svc.list_all()) == 2

    def test_get_by_id_returns_none(self, _session):
        repo = ExperienceRepository(_session)
        svc = ExperienceService(repo)
        assert svc.get_by_id(999) is None

    def test_update(self, _session):
        repo = ExperienceRepository(_session)
        svc = ExperienceService(repo)
        created = svc.create(ExperienceCreate(title="Junior"))
        updated = svc.update(created.id, ExperienceUpdate(title="Senior", company="Acme"))
        assert updated is not None
        assert updated.title == "Senior"
        assert updated.company == "Acme"

    def test_update_returns_none(self, _session):
        repo = ExperienceRepository(_session)
        svc = ExperienceService(repo)
        assert svc.update(999, ExperienceUpdate(title="nope")) is None

    def test_delete(self, _session):
        repo = ExperienceRepository(_session)
        svc = ExperienceService(repo)
        created = svc.create(ExperienceCreate(title="Del"))
        assert svc.delete(created.id) is True
        assert svc.get_by_id(created.id) is None

    def test_delete_returns_false(self, _session):
        repo = ExperienceRepository(_session)
        svc = ExperienceService(repo)
        assert svc.delete(999) is False


class TestExperienceNoRegression:
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

    def test_job_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/jobs", json={"title": "Engineer", "company": "Acme"})
        assert resp.status_code == 201

    def test_all_modules_together(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/documents", json={"filename": "doc.pdf"})
        client.post("/resumes", json={"title": "My Resume"})
        client.post("/jobs", json={"title": "New Job"})
        client.post("/experiences", json={"title": "Exp 1"})
        assert client.get("/health").status_code == 200
        assert client.get("/profile").status_code == 200
        assert client.get("/resumes").status_code == 200
        assert client.get("/documents").status_code == 200
        assert client.get("/jobs").status_code == 200
        assert client.get("/experiences").status_code == 200


class TestExperienceRepository:
    def test_list_returns_empty(self, _session):
        repo = ExperienceRepository(_session)
        assert repo.list_all() == []

    def test_create_and_get_by_id(self, _session):
        repo = ExperienceRepository(_session)
        exp = Experience(profile_id=1, title="Engineer", company="Acme")
        created = repo.create(exp)
        fetched = repo.get_by_id(created.id)
        assert fetched is not None
        assert fetched.title == "Engineer"

    def test_get_by_id_returns_none(self, _session):
        repo = ExperienceRepository(_session)
        assert repo.get_by_id(999) is None

    def test_delete_returns_true(self, _session):
        repo = ExperienceRepository(_session)
        exp = Experience(profile_id=1, title="Del")
        created = repo.create(exp)
        assert repo.delete(created.id) is True

    def test_delete_returns_false(self, _session):
        repo = ExperienceRepository(_session)
        assert repo.delete(999) is False
