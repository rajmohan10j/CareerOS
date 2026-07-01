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
from app.api.skill import router as skill_router
from app.config import settings
from app.core.database import get_session
from app.models.document import Document  # noqa: F401
from app.models.experience import Experience  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.skill import Skill  # noqa: F401
from app.repositories.skill import SkillRepository
from app.schemas.skill import SkillCreate, SkillUpdate
from app.services.skill_service import SkillService

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)
_test_app.include_router(document_router)
_test_app.include_router(job_router)
_test_app.include_router(experience_router)
_test_app.include_router(skill_router)


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


class TestSkillAPI:
    def test_list_returns_empty_initially(self, _session):
        client = TestClient(_test_app)
        response = client.get("/skills")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_and_get(self, _session):
        client = TestClient(_test_app)
        payload = {"name": "Python", "category": "Language", "proficiency": 5}
        create_resp = client.post("/skills", json=payload)
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert data["name"] == "Python"
        assert data["category"] == "Language"
        assert data["proficiency"] == 5
        assert "id" in data

        skill_id = data["id"]
        get_resp = client.get(f"/skills/{skill_id}")
        assert get_resp.status_code == 200
        assert get_resp.json() == data

    def test_get_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.get("/skills/999")
        assert response.status_code == 404

    def test_update(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/skills", json={"name": "Python"})
        skill_id = create_resp.json()["id"]
        update_resp = client.put(f"/skills/{skill_id}", json={"proficiency": 4, "category": "Language"})
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["proficiency"] == 4
        assert data["category"] == "Language"

    def test_update_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.put("/skills/999", json={"name": "nope"})
        assert response.status_code == 404

    def test_delete(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/skills", json={"name": "Delete Me"})
        skill_id = create_resp.json()["id"]
        del_resp = client.delete(f"/skills/{skill_id}")
        assert del_resp.status_code == 204
        get_resp = client.get(f"/skills/{skill_id}")
        assert get_resp.status_code == 404

    def test_delete_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.delete("/skills/999")
        assert response.status_code == 404

    def test_list_returns_multiple(self, _session):
        client = TestClient(_test_app)
        client.post("/skills", json={"name": "A"})
        client.post("/skills", json={"name": "B"})
        response = client.get("/skills")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_list_by_category(self, _session):
        client = TestClient(_test_app)
        client.post("/skills", json={"name": "Python", "category": "Language"})
        client.post("/skills", json={"name": "SQL", "category": "Language"})
        client.post("/skills", json={"name": "Project Mgmt", "category": "Soft Skill"})
        response = client.get("/skills?category=Language")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_create_with_proficiency(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/skills", json={"name": "Go", "proficiency": 3})
        assert resp.status_code == 201
        assert resp.json()["proficiency"] == 3


class TestSkillService:
    def test_create(self, _session):
        repo = SkillRepository(_session)
        svc = SkillService(repo)
        skill = svc.create(SkillCreate(name="Python", category="Language", proficiency=5))
        assert skill.id is not None
        assert skill.name == "Python"
        assert skill.proficiency == 5

    def test_list(self, _session):
        repo = SkillRepository(_session)
        svc = SkillService(repo)
        svc.create(SkillCreate(name="A"))
        svc.create(SkillCreate(name="B"))
        assert len(svc.list_all()) == 2

    def test_get_by_id_returns_none(self, _session):
        repo = SkillRepository(_session)
        svc = SkillService(repo)
        assert svc.get_by_id(999) is None

    def test_update(self, _session):
        repo = SkillRepository(_session)
        svc = SkillService(repo)
        created = svc.create(SkillCreate(name="Python", proficiency=3))
        updated = svc.update(created.id, SkillUpdate(proficiency=5, category="Language"))
        assert updated is not None
        assert updated.proficiency == 5
        assert updated.category == "Language"

    def test_update_returns_none(self, _session):
        repo = SkillRepository(_session)
        svc = SkillService(repo)
        assert svc.update(999, SkillUpdate(name="nope")) is None

    def test_delete(self, _session):
        repo = SkillRepository(_session)
        svc = SkillService(repo)
        created = svc.create(SkillCreate(name="Del"))
        assert svc.delete(created.id) is True
        assert svc.get_by_id(created.id) is None

    def test_delete_returns_false(self, _session):
        repo = SkillRepository(_session)
        svc = SkillService(repo)
        assert svc.delete(999) is False

    def test_list_by_category(self, _session):
        repo = SkillRepository(_session)
        svc = SkillService(repo)
        svc.create(SkillCreate(name="Python", category="Language"))
        svc.create(SkillCreate(name="SQL", category="Language"))
        svc.create(SkillCreate(name="Mgmt", category="Soft Skill"))
        assert len(svc.list_by_category("Language")) == 2
        assert len(svc.list_by_category("Soft Skill")) == 1
        assert len(svc.list_by_category("Other")) == 0


class TestSkillNoRegression:
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

    def test_experience_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/experiences", json={"title": "Engineer", "company": "Acme"})
        assert resp.status_code == 201

    def test_all_modules_together(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/documents", json={"filename": "doc.pdf"})
        client.post("/resumes", json={"title": "My Resume"})
        client.post("/jobs", json={"title": "New Job"})
        client.post("/experiences", json={"title": "Exp 1"})
        client.post("/skills", json={"name": "Python"})
        assert client.get("/health").status_code == 200
        assert client.get("/profile").status_code == 200
        assert client.get("/resumes").status_code == 200
        assert client.get("/documents").status_code == 200
        assert client.get("/jobs").status_code == 200
        assert client.get("/experiences").status_code == 200
        assert client.get("/skills").status_code == 200


class TestSkillRepository:
    def test_list_returns_empty(self, _session):
        repo = SkillRepository(_session)
        assert repo.list_all() == []

    def test_create_and_get_by_id(self, _session):
        repo = SkillRepository(_session)
        skill = Skill(profile_id=1, name="Python", category="Language")
        created = repo.create(skill)
        fetched = repo.get_by_id(created.id)
        assert fetched is not None
        assert fetched.name == "Python"

    def test_get_by_id_returns_none(self, _session):
        repo = SkillRepository(_session)
        assert repo.get_by_id(999) is None

    def test_delete_returns_true(self, _session):
        repo = SkillRepository(_session)
        skill = Skill(profile_id=1, name="Del")
        created = repo.create(skill)
        assert repo.delete(created.id) is True

    def test_delete_returns_false(self, _session):
        repo = SkillRepository(_session)
        assert repo.delete(999) is False

    def test_list_by_category(self, _session):
        repo = SkillRepository(_session)
        repo.create(Skill(profile_id=1, name="Python", category="Language"))
        repo.create(Skill(profile_id=1, name="SQL", category="Language"))
        repo.create(Skill(profile_id=1, name="Mgmt", category="Soft Skill"))
        assert len(repo.list_by_category("Language")) == 2
        assert len(repo.list_by_category("Other")) == 0
