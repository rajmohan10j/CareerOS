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
from app.api.job import router as job_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.config import settings
from app.core.database import get_session
from app.models.document import Document  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.repositories.job import JobRepository
from app.schemas.job import JobCreate, JobUpdate
from app.services.ai_service import AIService
from app.services.job_service import JobService

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)
_test_app.include_router(document_router)
_test_app.include_router(job_router)


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


class TestJobAPI:
    def test_list_returns_empty_initially(self, _session):
        client = TestClient(_test_app)
        response = client.get("/jobs")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_and_get(self, _session):
        client = TestClient(_test_app)
        payload = {"title": "Engineer", "company": "Acme", "jd_text": "We need an engineer"}
        create_resp = client.post("/jobs", json=payload)
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert data["title"] == "Engineer"
        assert data["company"] == "Acme"
        assert data["jd_text"] == "We need an engineer"
        assert data["status"] == "saved"
        assert "id" in data

        job_id = data["id"]
        get_resp = client.get(f"/jobs/{job_id}")
        assert get_resp.status_code == 200
        assert get_resp.json() == data

    def test_get_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.get("/jobs/999")
        assert response.status_code == 404

    def test_update(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/jobs", json={"title": "Junior"})
        job_id = create_resp.json()["id"]
        update_resp = client.put(f"/jobs/{job_id}", json={"title": "Senior", "status": "applied"})
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["title"] == "Senior"
        assert data["status"] == "applied"

    def test_update_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.put("/jobs/999", json={"title": "nope"})
        assert response.status_code == 404

    def test_delete(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/jobs", json={"title": "Delete Me"})
        job_id = create_resp.json()["id"]
        del_resp = client.delete(f"/jobs/{job_id}")
        assert del_resp.status_code == 204
        get_resp = client.get(f"/jobs/{job_id}")
        assert get_resp.status_code == 404

    def test_delete_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.delete("/jobs/999")
        assert response.status_code == 404

    def test_list_returns_multiple(self, _session):
        client = TestClient(_test_app)
        client.post("/jobs", json={"title": "A"})
        client.post("/jobs", json={"title": "B"})
        response = client.get("/jobs")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_search_by_title(self, _session):
        client = TestClient(_test_app)
        client.post("/jobs", json={"title": "Software Engineer"})
        client.post("/jobs", json={"title": "Marketing Manager"})
        response = client.get("/jobs/search?q=software")
        assert response.status_code == 200
        results = response.json()
        assert len(results) == 1
        assert results[0]["title"] == "Software Engineer"

    def test_search_by_company(self, _session):
        client = TestClient(_test_app)
        client.post("/jobs", json={"company": "Google", "title": "Engineer"})
        client.post("/jobs", json={"company": "Meta", "title": "Designer"})
        response = client.get("/jobs/search?q=google")
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_search_empty_query(self, _session):
        client = TestClient(_test_app)
        client.post("/jobs", json={"title": "A"})
        client.post("/jobs", json={"title": "B"})
        response = client.get("/jobs/search?q=")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_analyze_with_ai(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/jobs", json={
            "jd_text": "We need a Python developer with 5 years experience",
        })
        job_id = create_resp.json()["id"]
        fake_result = (
            '{"title": "Python Developer", "company": "Unknown", '
            '"skills": ["Python", "SQL"], "requirements": ["5 years exp"], '
            '"experience": "5 years", "location": "Remote", '
            '"remote": true, "salary_range": "$100k-$150k", "employment_type": "full-time"}'
        )
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake_result
            resp = client.post(f"/jobs/{job_id}/analyze")
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Python Developer"
        assert data["location"] == "Remote"
        assert data["remote"] is True

    def test_analyze_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.post("/jobs/999/analyze")
        assert response.status_code == 404

    def test_analyze_no_jd_text_returns_unchanged(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/jobs", json={"title": "No JD"})
        job_id = create_resp.json()["id"]
        response = client.post(f"/jobs/{job_id}/analyze")
        assert response.status_code == 200
        assert response.json()["title"] == "No JD"

    def test_evaluate_needs_profile(self, _session):
        client = TestClient(_test_app)
        response = client.post("/jobs/evaluate-text", json={"description": "Engineer needed"})
        assert response.status_code == 400
        assert "profile" in response.json()["detail"].lower()

    def test_evaluate_text_with_ai(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Experienced Python developer"})
        fake_result = (
            '{"fit_score": 85, "summary": "Great match", '
            '"strengths": ["Python"], "gaps": ["No management exp"], '
            '"risks": [], "recommendation": "apply", "reasoning": "Strong skill match"}'
        )
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake_result
            resp = client.post("/jobs/evaluate-text", json={
                "description": "Python developer needed",
            })
        assert resp.status_code == 200
        data = resp.json()
        assert data["fit_score"] == 85
        assert "apply" in data["evaluation_json"]

    def test_evaluate_existing_job(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        create_resp = client.post("/jobs", json={
            "jd_text": "Senior engineer needed",
        })
        job_id = create_resp.json()["id"]
        fake_result = (
            '{"fit_score": 70, "summary": "Decent match", '
            '"strengths": [], "gaps": [], '
            '"risks": [], "recommendation": "consider", "reasoning": "Ok fit"}'
        )
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake_result
            resp = client.post(f"/jobs/{job_id}/evaluate")
        assert resp.status_code == 200
        data = resp.json()
        assert data["fit_score"] == 70
        assert data["evaluation_json"] == fake_result

    def test_evaluate_existing_returns_404(self, _session):
        client = TestClient(_test_app)
        with patch.object(AIService, "generate", new_callable=AsyncMock):
            response = client.post("/jobs/999/evaluate")
        assert response.status_code == 404


class TestJobService:
    def test_create(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        job = svc.create(JobCreate(title="Engineer", company="Acme"))
        assert job.id is not None
        assert job.title == "Engineer"
        assert job.status == "saved"

    def test_list(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        svc.create(JobCreate(title="A"))
        svc.create(JobCreate(title="B"))
        assert len(svc.list_all()) == 2

    def test_get_by_id_returns_none(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        assert svc.get_by_id(999) is None

    def test_update(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        created = svc.create(JobCreate(title="Junior"))
        updated = svc.update(created.id, JobUpdate(title="Senior", status="applied"))
        assert updated is not None
        assert updated.title == "Senior"
        assert updated.status == "applied"

    def test_update_returns_none(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        assert svc.update(999, JobUpdate(title="nope")) is None

    def test_delete(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        created = svc.create(JobCreate(title="Del"))
        assert svc.delete(created.id) is True
        assert svc.get_by_id(created.id) is None

    def test_delete_returns_false(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        assert svc.delete(999) is False

    def test_search(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        svc.create(JobCreate(title="Engineer", company="Google"))
        svc.create(JobCreate(title="Designer", company="Meta"))
        assert len(svc.search("engineer")) == 1
        assert len(svc.search("google")) == 1
        assert len(svc.search("meta")) == 1

    def test_analyze_without_ai_returns_unchanged(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        job = svc.create(JobCreate(jd_text="Some text", title="Original"))
        import asyncio
        result = asyncio.run(svc.analyze(job.id))
        assert result is not None
        assert result.title == "Original"

    def test_analyze_with_ai(self, _session):
        repo = JobRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = (
            '{"title": "AI Engineer", "skills": ["Python", "ML"], '
            '"requirements": ["5 years"], "location": "Remote", "remote": true}'
        )
        svc = JobService(repo, ai_service=mock_ai)
        job = svc.create(JobCreate(jd_text="ML engineer needed"))
        import asyncio
        result = asyncio.run(svc.analyze(job.id))
        assert result is not None
        assert result.title == "AI Engineer"
        assert result.location == "Remote"
        assert result.remote is True

    def test_analyze_no_jd_text(self, _session):
        repo = JobRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        svc = JobService(repo, ai_service=mock_ai)
        job = svc.create(JobCreate(title="No JD"))
        import asyncio
        result = asyncio.run(svc.analyze(job.id))
        assert result is not None
        assert result.title == "No JD"
        mock_ai.generate.assert_not_called()

    def test_analyze_returns_none_for_missing(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        import asyncio
        assert asyncio.run(svc.analyze(999)) is None

    def test_evaluate_without_profile_repo_unchanged(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        job = svc.create(JobCreate(jd_text="Engineer needed"))
        import asyncio
        result = asyncio.run(svc.evaluate(job.id))
        assert result is not None
        assert result.evaluation_json is None

    def test_evaluate_without_ai_unchanged(self, _session):
        from app.repositories.profile import ProfileRepository
        repo = JobRepository(_session)
        ProfileRepository(_session).upsert(Profile(summary="Dev", user_id=1))
        svc = JobService(repo, profile_repository=ProfileRepository(_session))
        job = svc.create(JobCreate(jd_text="Engineer needed"))
        import asyncio
        result = asyncio.run(svc.evaluate(job.id))
        assert result is not None
        assert result.evaluation_json is None

    def test_evaluate_with_ai(self, _session):
        from app.repositories.profile import ProfileRepository
        ProfileRepository(_session).upsert(Profile(summary="Python dev", user_id=1))
        repo = JobRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = (
            '{"fit_score": 90, "summary": "Great", "strengths": ["Python"], '
            '"gaps": [], "risks": [], "recommendation": "apply", "reasoning": "Good match"}'
        )
        svc = JobService(repo, profile_repository=ProfileRepository(_session), ai_service=mock_ai)
        job = svc.create(JobCreate(jd_text="Python engineer needed"))
        import asyncio
        result = asyncio.run(svc.evaluate(job.id))
        assert result is not None
        assert result.fit_score == 90
        assert result.evaluation_json is not None

    def test_evaluate_no_jd_text(self, _session):
        from app.repositories.profile import ProfileRepository
        ProfileRepository(_session).upsert(Profile(summary="Dev", user_id=1))
        repo = JobRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        svc = JobService(repo, profile_repository=ProfileRepository(_session), ai_service=mock_ai)
        job = svc.create(JobCreate(title="No JD"))
        import asyncio
        result = asyncio.run(svc.evaluate(job.id))
        assert result is not None
        assert result.evaluation_json is None
        mock_ai.generate.assert_not_called()

    def test_evaluate_returns_none_for_missing(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo)
        import asyncio
        assert asyncio.run(svc.evaluate(999)) is None

    def test_evaluate_text_raises_without_profile_repo(self, _session):
        repo = JobRepository(_session)
        svc = JobService(repo, ai_service=AIService())
        from app.schemas.job import JobEvaluateTextRequest
        with pytest.raises(ValueError, match="Profile repository"):
            import asyncio
            asyncio.run(svc.evaluate_text(JobEvaluateTextRequest(description="Test")))

    def test_evaluate_text_raises_without_ai(self, _session):
        from app.repositories.profile import ProfileRepository
        repo = JobRepository(_session)
        svc = JobService(repo, profile_repository=ProfileRepository(_session))
        from app.schemas.job import JobEvaluateTextRequest
        with pytest.raises(ValueError, match="AI service"):
            import asyncio
            asyncio.run(svc.evaluate_text(JobEvaluateTextRequest(description="Test")))

    def test_evaluate_text_raises_without_profile(self, _session):
        from app.repositories.profile import ProfileRepository
        repo = JobRepository(_session)
        svc = JobService(repo, profile_repository=ProfileRepository(_session), ai_service=AIService())
        from app.schemas.job import JobEvaluateTextRequest
        with pytest.raises(ValueError, match="profile"):
            import asyncio
            asyncio.run(svc.evaluate_text(JobEvaluateTextRequest(description="Test")))

    def test_evaluate_text_with_ai(self, _session):
        from app.repositories.profile import ProfileRepository
        ProfileRepository(_session).upsert(Profile(summary="Dev", user_id=1))
        repo = JobRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = (
            '{"fit_score": 75, "summary": "Good", "strengths": [], '
            '"gaps": [], "risks": [], "recommendation": "consider", "reasoning": "Ok"}'
        )
        svc = JobService(repo, profile_repository=ProfileRepository(_session), ai_service=mock_ai)
        from app.schemas.job import JobEvaluateTextRequest
        import asyncio
        result = asyncio.run(svc.evaluate_text(JobEvaluateTextRequest(description="Engineer role")))
        assert result["fit_score"] == 75
        assert "consider" in result["evaluation_json"]

    def test_evaluate_text_fit_score_none_on_bad_json(self, _session):
        from app.repositories.profile import ProfileRepository
        ProfileRepository(_session).upsert(Profile(summary="Dev", user_id=1))
        repo = JobRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = "not valid json"
        svc = JobService(repo, profile_repository=ProfileRepository(_session), ai_service=mock_ai)
        from app.schemas.job import JobEvaluateTextRequest
        import asyncio
        result = asyncio.run(svc.evaluate_text(JobEvaluateTextRequest(description="Engineer role")))
        assert result["fit_score"] is None
        assert result["evaluation_json"] == "not valid json"

    def test_analyze_handles_non_remote_null(self, _session):
        repo = JobRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = '{"title": "Dev", "remote": false}'
        svc = JobService(repo, ai_service=mock_ai)
        job = svc.create(JobCreate(jd_text="In-office"))
        import asyncio
        result = asyncio.run(svc.analyze(job.id))
        assert result is not None
        assert result.remote is False

    def test_analyze_handles_remote_unknown(self, _session):
        repo = JobRepository(_session)
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = '{"title": "Dev", "remote": null}'
        svc = JobService(repo, ai_service=mock_ai)
        job = svc.create(JobCreate(jd_text="Some job"))
        import asyncio
        result = asyncio.run(svc.analyze(job.id))
        assert result is not None
        assert result.remote is None


class TestJobNoRegression:
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

    def test_document_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/documents", json={"filename": "test.pdf"})
        assert resp.status_code == 201

    def test_all_modules_together(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/documents", json={"filename": "doc.pdf"})
        client.post("/resumes", json={"title": "My Resume"})
        client.post("/jobs", json={"title": "New Job"})
        assert client.get("/health").status_code == 200
        assert client.get("/profile").status_code == 200
        assert client.get("/resumes").status_code == 200
        assert client.get("/documents").status_code == 200
        assert client.get("/jobs").status_code == 200


class TestJobRepository:
    def test_list_returns_empty(self, _session):
        repo = JobRepository(_session)
        assert repo.list_all() == []

    def test_create_and_get_by_id(self, _session):
        repo = JobRepository(_session)
        job = Job(profile_id=1, title="Engineer", company="Acme")
        created = repo.create(job)
        fetched = repo.get_by_id(created.id)
        assert fetched is not None
        assert fetched.title == "Engineer"

    def test_get_by_id_returns_none(self, _session):
        repo = JobRepository(_session)
        assert repo.get_by_id(999) is None

    def test_delete_returns_true(self, _session):
        repo = JobRepository(_session)
        job = Job(profile_id=1, title="Del")
        created = repo.create(job)
        assert repo.delete(created.id) is True

    def test_delete_returns_false(self, _session):
        repo = JobRepository(_session)
        assert repo.delete(999) is False

    def test_search_by_title(self, _session):
        repo = JobRepository(_session)
        repo.create(Job(profile_id=1, title="Software Engineer"))
        repo.create(Job(profile_id=1, title="Marketing Lead"))
        assert len(repo.search("software")) == 1

    def test_search_by_company(self, _session):
        repo = JobRepository(_session)
        repo.create(Job(profile_id=1, company="Google", title="Eng"))
        repo.create(Job(profile_id=1, company="Meta", title="Des"))
        assert len(repo.search("google")) == 1

    def test_search_by_jd_text(self, _session):
        repo = JobRepository(_session)
        repo.create(Job(profile_id=1, jd_text="Python backend developer needed"))
        repo.create(Job(profile_id=1, jd_text="Frontend React developer"))
        assert len(repo.search("Python")) == 1
