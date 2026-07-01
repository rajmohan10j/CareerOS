import os

os.environ["DATABASE_URL"] = "sqlite://"

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.api.health import router as health_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.config import settings
from app.core.database import get_session
from app.models.profile import Profile  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.repositories.resume import ResumeRepository
from app.schemas.resume import ResumeCreate, ResumeGenerateRequest, ResumeUpdate
from app.services.ai_service import AIService
from app.services.resume_service import ResumeService

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)


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


class TestResumeAPI:
    def test_list_returns_empty_initially(self, _session):
        client = TestClient(_test_app)
        response = client.get("/resumes")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_and_get(self, _session):
        client = TestClient(_test_app)
        payload = {"title": "My Resume", "target_role": "Engineer"}
        create_resp = client.post("/resumes", json=payload)
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert data["title"] == "My Resume"
        assert data["target_role"] == "Engineer"
        assert data["version"] == 1
        assert data["is_latest"] is True
        assert "id" in data

        resume_id = data["id"]
        get_resp = client.get(f"/resumes/{resume_id}")
        assert get_resp.status_code == 200
        assert get_resp.json() == data

    def test_get_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.get("/resumes/999")
        assert response.status_code == 404

    def test_update_resume(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/resumes", json={"title": "v1"})
        resume_id = create_resp.json()["id"]

        update_resp = client.put(f"/resumes/{resume_id}", json={"title": "v2"})
        assert update_resp.status_code == 200
        assert update_resp.json()["title"] == "v2"

    def test_update_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.put("/resumes/999", json={"title": "nope"})
        assert response.status_code == 404

    def test_delete_resume(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/resumes", json={"title": "delete me"})
        resume_id = create_resp.json()["id"]

        del_resp = client.delete(f"/resumes/{resume_id}")
        assert del_resp.status_code == 204

        get_resp = client.get(f"/resumes/{resume_id}")
        assert get_resp.status_code == 404

    def test_delete_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.delete("/resumes/999")
        assert response.status_code == 404

    def test_list_returns_multiple(self, _session):
        client = TestClient(_test_app)
        client.post("/resumes", json={"title": "A"})
        client.post("/resumes", json={"title": "B"})
        response = client.get("/resumes")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_generate_requires_profile(self, _session):
        client = TestClient(_test_app)
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "# Resume\n\nExperience: ..."
            response = client.post("/resumes/generate", json={"target_role": "Engineer"})
        assert response.status_code == 400
        assert "profile" in response.json()["detail"].lower()

    def test_generate_creates_resume(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Experienced dev"})
        fake_content = "# John Doe\n\n## Experience\n- Built things"
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake_content
            response = client.post(
                "/resumes/generate",
                json={"target_role": "Senior Engineer", "job_description": "Need AI skills"},
            )
        assert response.status_code == 200
        data = response.json()
        assert data["content"] == fake_content
        assert data["target_role"] == "Senior Engineer"
        assert data["job_description"] == "Need AI skills"
        assert data["version"] == 1
        assert data["is_latest"] is True

    def test_generate_increments_version(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        fake = "# Resume"
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake
            r1 = client.post("/resumes/generate", json={"target_role": "Engineer"})
            r2 = client.post("/resumes/generate", json={"target_role": "Senior Engineer"})
        assert r1.json()["version"] == 1
        assert r2.json()["version"] == 2
        assert r2.json()["is_latest"] is True
        get_r1 = client.get(f"/resumes/{r1.json()['id']}")
        assert get_r1.json()["is_latest"] is False


class TestResumeService:
    def test_create(self, _session):
        repo = ResumeRepository(_session)
        svc = ResumeService(repo)
        resume = svc.create(ResumeCreate(title="Test", target_role="Engineer"))
        assert resume.id is not None
        assert resume.title == "Test"
        assert resume.version == 1

    def test_list(self, _session):
        repo = ResumeRepository(_session)
        svc = ResumeService(repo)
        svc.create(ResumeCreate(title="A"))
        svc.create(ResumeCreate(title="B"))
        resumes = svc.list()
        assert len(resumes) == 2

    def test_get_by_id_returns_none(self, _session):
        repo = ResumeRepository(_session)
        svc = ResumeService(repo)
        assert svc.get_by_id(999) is None

    def test_update(self, _session):
        repo = ResumeRepository(_session)
        svc = ResumeService(repo)
        created = svc.create(ResumeCreate(title="v1"))
        updated = svc.update(created.id, ResumeUpdate(title="v2"))
        assert updated is not None
        assert updated.title == "v2"

    def test_update_returns_none(self, _session):
        repo = ResumeRepository(_session)
        svc = ResumeService(repo)
        assert svc.update(999, ResumeUpdate(title="nope")) is None

    def test_delete(self, _session):
        repo = ResumeRepository(_session)
        svc = ResumeService(repo)
        created = svc.create(ResumeCreate(title="del"))
        assert svc.delete(created.id) is True
        assert svc.get_by_id(created.id) is None

    def test_delete_returns_false(self, _session):
        repo = ResumeRepository(_session)
        svc = ResumeService(repo)
        assert svc.delete(999) is False

    def test_generate_raises_without_profile_repo(self, _session):
        repo = ResumeRepository(_session)
        svc = ResumeService(repo, ai_service=AIService())
        with pytest.raises(ValueError, match="Profile repository"):
            import asyncio

            asyncio.run(svc.generate(ResumeGenerateRequest(target_role="Engineer")))

    @pytest.mark.asyncio
    async def test_generate_raises_without_ai_service(self, _session):
        repo = ResumeRepository(_session)
        from app.repositories.profile import ProfileRepository

        svc = ResumeService(repo, profile_repository=ProfileRepository(_session))
        with pytest.raises(ValueError, match="AI service"):
            await svc.generate(ResumeGenerateRequest(target_role="Engineer"))

    @pytest.mark.asyncio
    async def test_generate_creates_versioned_resume(self, _session):
        from app.repositories.profile import ProfileRepository

        ProfileRepository(_session).upsert(Profile(summary="Dev", user_id=1))
        repo = ResumeRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = "# Generated Resume"
        svc = ResumeService(
            repo, profile_repository=ProfileRepository(_session), ai_service=mock_ai
        )

        resume = await svc.generate(ResumeGenerateRequest(target_role="Engineer"))
        assert resume.content == "# Generated Resume"
        assert resume.version == 1

        resume2 = await svc.generate(ResumeGenerateRequest(target_role="Senior Engineer"))
        assert resume2.version == 2

    def test_generate_needs_profile(self, _session):
        from app.repositories.profile import ProfileRepository

        repo = ResumeRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        svc = ResumeService(
            repo, profile_repository=ProfileRepository(_session), ai_service=mock_ai
        )
        with pytest.raises(ValueError, match="profile"):
            import asyncio

            asyncio.run(svc.generate(ResumeGenerateRequest(target_role="Engineer")))


class TestResumeNoRegression:
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

    def test_resume_and_profile_both_work(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/resumes", json={"title": "My Resume"})
        health_resp = client.get("/health")
        assert health_resp.status_code == 200
        profile_resp = client.get("/profile")
        assert profile_resp.status_code == 200
        resumes_resp = client.get("/resumes")
        assert resumes_resp.status_code == 200
        assert len(resumes_resp.json()) == 1


class TestResumeRepository:
    def test_list_returns_empty(self, _session):
        repo = ResumeRepository(_session)
        assert repo.list() == []

    def test_create_and_get_by_id(self, _session):
        repo = ResumeRepository(_session)
        resume = Resume(profile_id=1, title="Test", version=1, is_latest=True)
        created = repo.create(resume)
        fetched = repo.get_by_id(created.id)
        assert fetched is not None
        assert fetched.title == "Test"

    def test_get_by_id_returns_none(self, _session):
        repo = ResumeRepository(_session)
        assert repo.get_by_id(999) is None

    def test_delete_returns_true(self, _session):
        repo = ResumeRepository(_session)
        resume = Resume(profile_id=1, title="Del", version=1, is_latest=True)
        created = repo.create(resume)
        assert repo.delete(created.id) is True

    def test_delete_returns_false(self, _session):
        repo = ResumeRepository(_session)
        assert repo.delete(999) is False

    def test_mark_previous_as_not_latest(self, _session):
        repo = ResumeRepository(_session)
        r1 = repo.create(Resume(profile_id=1, title="v1", version=1, is_latest=True))
        repo.mark_previous_as_not_latest(1)
        repo.create(Resume(profile_id=1, title="v2", version=2, is_latest=True))
        assert repo.get_by_id(r1.id).is_latest is False

    def test_get_latest_version(self, _session):
        repo = ResumeRepository(_session)
        assert repo.get_latest_version(1) == 0
        repo.create(Resume(profile_id=1, title="v1", version=1, is_latest=True))
        assert repo.get_latest_version(1) == 1
        repo.create(Resume(profile_id=1, title="v2", version=2, is_latest=True))
        assert repo.get_latest_version(1) == 2
