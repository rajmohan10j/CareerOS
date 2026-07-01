import os

os.environ["DATABASE_URL"] = "sqlite://"

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.api.application import router as application_router
from app.api.ats import router as ats_router
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
from app.models.experience import Experience
from app.models.job import Job
from app.models.profile import Profile
from app.models.resume import Resume
from app.models.skill import Skill
from app.repositories.job import JobRepository
from app.repositories.resume import ResumeRepository
from app.schemas.ats import (
    AtsAnalyzeRequest,
    AtsAnalyzeResponse,
    AtsOptimizeRequest,
    AtsScoreRequest,
    AtsScoreResponse,
)
from app.services.ai_service import AIService
from app.services.ats_service import (
    AtsService,
    _analyze_formatting,
    _build_analyze_prompt,
    _build_optimize_prompt,
    _build_score_prompt,
    _match_keywords,
    _parse_skills_from_text,
)

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)
_test_app.include_router(document_router)
_test_app.include_router(experience_router)
_test_app.include_router(skill_router)
_test_app.include_router(application_router)
_test_app.include_router(job_router)
_test_app.include_router(ats_router)


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


def _create_resume(session: Session, content: str = "Test resume content\n\n## Experience\nEngineer at Acme\n") -> int:
    repo = ResumeRepository(session)
    r = Resume(profile_id=1, title="Test Resume", content=content, version=1, is_latest=True)
    created = repo.create(r)
    return created.id


def _create_job(session: Session, jd_text: str = "We need an engineer", skills: str | None = "['Python', 'SQL']") -> int:
    repo = JobRepository(session)
    j = Job(
        profile_id=1,
        title="Engineer",
        company="Acme",
        jd_text=jd_text,
        skills=skills,
    )
    created = repo.create(j)
    return created.id


class TestAtsAPI:
    def test_score_without_resume_returns_400(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/ats/score", json={"resume_id": 999, "job_description": "JD text"})
        assert resp.status_code == 400

    def test_score_without_jd_returns_400(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        resp = client.post("/ats/score", json={"resume_id": 1})
        assert resp.status_code == 400

    def test_score_with_resume_no_content_returns_400(self, _session):
        client = TestClient(_test_app)
        r = ResumeRepository(_session).create(Resume(profile_id=1, title="Empty"))
        resp = client.post("/ats/score", json={"resume_id": r.id, "job_description": "JD"})
        assert resp.status_code == 400

    def test_score_without_ai_returns_basic_score(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        resp = client.post("/ats/score", json={"resume_id": 1, "job_description": "We need an engineer"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["resume_id"] == 1
        assert data["ats_score"] is None
        assert isinstance(data["keyword_match_rate"], float) or data["keyword_match_rate"] is None
        assert isinstance(data["matched_keywords"], list)
        assert isinstance(data["missing_keywords"], list)
        assert isinstance(data["formatting_score"], float) or data["formatting_score"] is None
        assert isinstance(data["compliance_issues"], list)
        assert isinstance(data["suggestions"], list)

    def test_score_with_ai_returns_full(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        fake = (
            '{"ats_score": 78, "formatting_score": 85, '
            '"compliance_issues": ["Missing standard section"], '
            '"suggestions": ["Add keywords"]}'
        )
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake
            resp = client.post(
                "/ats/score",
                json={"resume_id": 1, "job_description": "We need a Python engineer"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ats_score"] == 78.0
        assert data["formatting_score"] == 85.0
        assert "Missing standard section" in data["compliance_issues"]
        assert "Add keywords" in data["suggestions"]

    def test_score_with_job_id_uses_stored_jd(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        _create_job(_session, jd_text="Python backend developer")
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = '{"ats_score": 82}'
            resp = client.post("/ats/score", json={"resume_id": 1, "job_id": 1})
        assert resp.status_code == 200
        assert resp.json()["ats_score"] == 82.0

    def test_score_with_job_id_not_found_returns_400(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        resp = client.post("/ats/score", json={"resume_id": 1, "job_id": 999})
        assert resp.status_code == 400

    def test_analyze_returns_structured_response(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        fake = (
            '{"ats_score": 85, "formatting_score": 80, '
            '"compliance_issues": [], "section_scores": {"contact": 90, "experience": 80}, '
            '"suggestions": ["Use more keywords"], '
            '"content_analysis": "Good alignment with role"}'
        )
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake
            resp = client.post(
                "/ats/analyze",
                json={"resume_id": 1, "job_description": "Engineer needed"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ats_score"] == 85.0
        assert data["formatting_score"] == 80.0
        assert data["section_scores"] == {"contact": 90, "experience": 80}
        assert data["content_analysis"] == "Good alignment with role"
        assert data["suggestions"] == ["Use more keywords"]

    def test_analyze_with_skills_matching(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        client.post("/skills", json={"name": "Python", "category": "Language"})
        _create_job(_session, jd_text="Python dev", skills="['Python', 'SQL', 'K8s']")
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = '{"ats_score": 70}'
            resp = client.post("/ats/analyze", json={"resume_id": 1, "job_id": 1})
        assert resp.status_code == 200
        data = resp.json()
        assert "Python" in data["matched_keywords"]
        assert "K8s" in data["missing_keywords"]

    def test_analyze_without_ai_returns_basic(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        resp = client.post(
            "/ats/analyze",
            json={"resume_id": 1, "job_description": "Engineer role"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ats_score"] is None
        assert isinstance(data["section_scores"], dict)

    def test_analyze_returns_400_on_missing_resume(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/ats/analyze", json={"resume_id": 999, "job_description": "JD"})
        assert resp.status_code == 400

    def test_optimize_creates_new_version(self, _session):
        client = TestClient(_test_app)
        rid = _create_resume(_session, content="Original resume content here")
        fake_optimized = "# ATS Optimized Resume\n\n## Skills\nPython, SQL"
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake_optimized
            resp = client.post(
                "/ats/optimize",
                json={"resume_id": rid, "job_description": "Python engineer needed"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["resume_id"] == rid
        assert data["optimized_content"] == fake_optimized
        assert data["version"] == 2

        get_resp = client.get(f"/resumes/{rid}")
        assert get_resp.status_code == 200
        assert get_resp.json()["is_latest"] is False

        get_resp2 = client.get("/resumes")
        versions = get_resp2.json()
        latest = [v for v in versions if v["is_latest"]]
        assert len(latest) == 1
        assert latest[0]["content"] == fake_optimized

    def test_optimize_returns_400_on_missing_resume(self, _session):
        client = TestClient(_test_app)
        resp = client.post(
            "/ats/optimize",
            json={"resume_id": 999, "job_description": "JD"},
        )
        assert resp.status_code == 400

    def test_optimize_returns_400_on_no_content(self, _session):
        client = TestClient(_test_app)
        r = ResumeRepository(_session).create(Resume(profile_id=1, title="Empty"))
        resp = client.post(
            "/ats/optimize",
            json={"resume_id": r.id, "job_description": "JD"},
        )
        assert resp.status_code == 400

    def test_optimize_with_job_id(self, _session):
        client = TestClient(_test_app)
        rid = _create_resume(_session)
        _create_job(_session)
        fake = "# ATS Resume"
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake
            resp = client.post(
                "/ats/optimize",
                json={"resume_id": rid, "job_id": 1},
            )
        assert resp.status_code == 200
        assert resp.json()["optimized_content"] == fake

    def test_optimize_with_target_role(self, _session):
        client = TestClient(_test_app)
        rid = _create_resume(_session)
        fake = "# Optimized"
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = fake
            resp = client.post(
                "/ats/optimize",
                json={"resume_id": rid, "job_description": "Dev needed", "target_role": "Senior Dev"},
            )
        assert resp.status_code == 200
        assert resp.json()["optimized_content"] == fake


class TestAtsService:
    def test_score_resume_not_found(self, _session):
        svc = AtsService(ResumeRepository(_session))
        with pytest.raises(ValueError, match="not found"):
            import asyncio
            asyncio.run(svc.score(AtsScoreRequest(resume_id=999, job_description="JD")))

    def test_score_no_jd(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="T", content="Content"))
        svc = AtsService(repo)
        with pytest.raises(ValueError, match="No job description"):
            import asyncio
            asyncio.run(svc.score(AtsScoreRequest(resume_id=1)))

    def test_score_no_content(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="T"))
        svc = AtsService(repo)
        with pytest.raises(ValueError, match="no content"):
            import asyncio
            asyncio.run(svc.score(AtsScoreRequest(resume_id=1, job_description="JD")))

    def test_score_without_ai(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="T", content="Test resume"))
        svc = AtsService(repo)
        import asyncio
        result = asyncio.run(svc.score(AtsScoreRequest(resume_id=1, job_description="Engineer needed")))
        assert isinstance(result, AtsScoreResponse)
        assert result.ats_score is None
        assert result.resume_id == 1

    def test_score_with_ai(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="T", content="Test resume"))
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = '{"ats_score": 88, "formatting_score": 90, "compliance_issues": [], "suggestions": ["Add skills"]}'
        svc = AtsService(repo, ai_service=mock_ai)
        import asyncio
        result = asyncio.run(svc.score(AtsScoreRequest(resume_id=1, job_description="Engineer")))
        assert result.ats_score == 88.0
        assert result.formatting_score == 90.0
        assert result.suggestions == ["Add skills"]

    def test_score_with_skills_matching(self, _session):
        from app.repositories.skill import SkillRepository
        resume_repo = ResumeRepository(_session)
        resume_repo.create(Resume(profile_id=1, title="T", content="Content"))
        skill_repo = SkillRepository(_session)
        skill_repo.create(Skill(name="Python", category="Lang", profile_id=1))
        svc = AtsService(resume_repo, skill_repository=skill_repo, ai_service=AsyncMock(spec=AIService))
        import asyncio
        result = asyncio.run(svc.score(AtsScoreRequest(
            resume_id=1, job_description="Python dev",
        )))
        assert result.matched_keywords == []

    def test_score_with_job_skills_matching(self, _session):
        from app.repositories.skill import SkillRepository
        resume_repo = ResumeRepository(_session)
        resume_repo.create(Resume(profile_id=1, title="T", content="Content"))
        skill_repo = SkillRepository(_session)
        skill_repo.create(Skill(name="Python", category="Lang", profile_id=1))
        job_repo = JobRepository(_session)
        job_repo.create(Job(profile_id=1, jd_text="JD", skills="['Python', 'SQL']"))
        svc = AtsService(resume_repo, job_repository=job_repo, skill_repository=skill_repo, ai_service=AsyncMock(spec=AIService))
        import asyncio
        result = asyncio.run(svc.score(AtsScoreRequest(resume_id=1, job_id=1)))
        assert "Python" in result.matched_keywords
        assert "SQL" in result.missing_keywords
        assert result.keyword_match_rate == 0.5

    def test_analyze_resume_not_found(self, _session):
        svc = AtsService(ResumeRepository(_session))
        with pytest.raises(ValueError, match="not found"):
            import asyncio
            asyncio.run(svc.analyze(AtsAnalyzeRequest(resume_id=999, job_description="JD")))

    def test_analyze_no_jd(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="T", content="Content"))
        svc = AtsService(repo)
        with pytest.raises(ValueError, match="No job description"):
            import asyncio
            asyncio.run(svc.analyze(AtsAnalyzeRequest(resume_id=1)))

    def test_analyze_without_ai(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="T", content="Content"))
        svc = AtsService(repo)
        import asyncio
        result = asyncio.run(svc.analyze(AtsAnalyzeRequest(resume_id=1, job_description="Engineer")))
        assert isinstance(result, AtsAnalyzeResponse)
        assert result.ats_score is None
        assert isinstance(result.section_scores, dict)

    def test_analyze_with_ai(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="T", content="Content"))
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = (
            '{"ats_score": 75, "formatting_score": 80, "compliance_issues": [], '
            '"section_scores": {"contact": 90, "experience": 70}, '
            '"suggestions": ["Fix header"], "content_analysis": "Room for improvement"}'
        )
        svc = AtsService(repo, ai_service=mock_ai)
        import asyncio
        result = asyncio.run(svc.analyze(AtsAnalyzeRequest(resume_id=1, job_description="Engineer")))
        assert result.ats_score == 75.0
        assert result.section_scores == {"contact": 90, "experience": 70}
        assert result.content_analysis == "Room for improvement"

    def test_analyze_with_skills_from_job(self, _session):
        from app.repositories.skill import SkillRepository
        resume_repo = ResumeRepository(_session)
        resume_repo.create(Resume(profile_id=1, title="T", content="Content"))
        skill_repo = SkillRepository(_session)
        skill_repo.create(Skill(name="Python", category="Lang", profile_id=1))
        job_repo = JobRepository(_session)
        job_repo.create(Job(profile_id=1, jd_text="JD", skills="['Python', 'Docker']"))
        svc = AtsService(resume_repo, job_repository=job_repo, skill_repository=skill_repo, ai_service=AsyncMock(spec=AIService))
        import asyncio
        result = asyncio.run(svc.analyze(AtsAnalyzeRequest(resume_id=1, job_id=1)))
        assert "Python" in result.matched_keywords
        assert "Docker" in result.missing_keywords

    def test_optimize_creates_resume_version(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="Original", content="Old content", version=1, is_latest=True))
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = "New optimized content"
        svc = AtsService(repo, ai_service=mock_ai)
        import asyncio
        result = asyncio.run(svc.optimize(AtsOptimizeRequest(
            resume_id=1, job_description="Engineer needed",
        )))
        assert result.resume_id == 1
        assert result.optimized_content == "New optimized content"
        assert result.version == 2

        original = repo.get_by_id(1)
        assert original is not None
        assert original.is_latest is False
        assert original.content == "Old content"

        latest_version = repo.get_latest_version(1)
        assert latest_version == 2

    def test_optimize_not_found(self, _session):
        svc = AtsService(ResumeRepository(_session))
        with pytest.raises(ValueError, match="not found"):
            import asyncio
            asyncio.run(svc.optimize(AtsOptimizeRequest(resume_id=999, job_description="JD")))

    def test_optimize_no_content(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="Empty"))
        svc = AtsService(repo)
        with pytest.raises(ValueError, match="no content"):
            import asyncio
            asyncio.run(svc.optimize(AtsOptimizeRequest(resume_id=1, job_description="JD")))

    def test_optimize_no_ai(self, _session):
        repo = ResumeRepository(_session)
        repo.create(Resume(profile_id=1, title="T", content="Content"))
        svc = AtsService(repo)
        with pytest.raises(ValueError, match="AI service"):
            import asyncio
            asyncio.run(svc.optimize(AtsOptimizeRequest(resume_id=1, job_description="JD")))

    def test_optimize_with_skills_and_experience_in_prompt(self, _session):
        from app.repositories.experience import ExperienceRepository
        from app.repositories.skill import SkillRepository
        resume_repo = ResumeRepository(_session)
        resume_repo.create(Resume(profile_id=1, title="T", content="Content"))
        skill_repo = SkillRepository(_session)
        skill_repo.create(Skill(name="Python", category="Lang", profile_id=1))
        exp_repo = ExperienceRepository(_session)
        exp_repo.create(Experience(company="Acme", title="Dev", description="Built stuff", profile_id=1))
        mock_ai = AsyncMock(spec=AIService)
        mock_ai.generate.return_value = "Optimized"
        svc = AtsService(resume_repo, skill_repository=skill_repo, experience_repository=exp_repo, ai_service=mock_ai)
        import asyncio
        result = asyncio.run(svc.optimize(AtsOptimizeRequest(
            resume_id=1, job_description="Python dev",
        )))
        assert result.optimized_content == "Optimized"
        mock_ai.generate.assert_called_once()
        prompt = mock_ai.generate.call_args[0][0]
        assert "Python" in prompt
        assert "Acme" in prompt


class TestFormattingAnalyzer:
    def test_clean_resume_scores_100(self):
        content = (
            "## Contact\nname@email.com\n"
            "## Professional Summary\nDev\n"
            "## Experience\nEngineer at Acme\n"
            "## Education\nMIT\n"
            "## Skills\nPython\n"
            "## Certifications\nNone"
        )
        score, issues = _analyze_formatting(content)
        assert score == 100.0
        assert len(issues) == 0

    def test_tables_detected(self):
        content = "| Skill | Level |\n| --- | --- |\n| Python | 5 |"
        score, issues = _analyze_formatting(content)
        assert score <= 85.0
        assert any("Tables" in i for i in issues)

    def test_images_detected(self):
        content = "## Skills\n![Python]()\n## Experience\nWorked at Acme"
        score, issues = _analyze_formatting(content)
        assert score <= 90.0
        assert any("Images" in i for i in issues)

    def test_missing_sections(self):
        content = "## Stuff\nSome content"
        score, issues = _analyze_formatting(content)
        assert any("Missing standard section" in i for i in issues)

    def test_long_lines_detected(self):
        content = "x" * 150
        score, issues = _analyze_formatting(content)
        assert any("Long lines" in i for i in issues)

    def test_non_ascii_detected(self):
        content = "Résumé for Enginéer role\n## Experience\nAcme"
        score, issues = _analyze_formatting(content)
        assert any("Non-ASCII" in i for i in issues)

    def test_score_never_below_zero(self):
        content = "x" * 150 + "\n" + "| tbl |\n|---|\n" + "![]()" + "\nRésumé\n" * 10
        score, issues = _analyze_formatting(content)
        assert score >= 0.0
        assert score < 100.0

    def test_multiple_issues_accumulate(self):
        content = "| tbl |\n|---|\n![]()\nNonASCII char: ñ"
        score, issues = _analyze_formatting(content)
        assert score < 100.0
        assert len(issues) >= 2


class TestKeywordMatching:
    def test_basic_match(self):
        skills = [Skill(name="Python", category="Lang", profile_id=1)]
        matched, missing = _match_keywords("['Python', 'SQL']", skills)
        assert matched == ["Python"]
        assert missing == ["SQL"]

    def test_no_jd_skills(self):
        skills = [Skill(name="Python", category="Lang", profile_id=1)]
        matched, missing = _match_keywords(None, skills)
        assert matched == []
        assert missing == []

    def test_empty_jd_skills(self):
        skills = [Skill(name="Python", category="Lang", profile_id=1)]
        matched, missing = _match_keywords("", skills)
        assert matched == []
        assert missing == []

    def test_no_user_skills(self):
        matched, missing = _match_keywords("['Python']", [])
        assert matched == []
        assert missing == ["Python"]

    def test_case_insensitive(self):
        skills = [Skill(name="python", category="Lang", profile_id=1)]
        matched, missing = _match_keywords("['Python']", skills)
        assert matched == ["Python"]
        assert missing == []

    def test_parse_skills_from_text_list(self):
        assert _parse_skills_from_text("['Python', 'SQL']") == ["Python", "SQL"]

    def test_parse_skills_from_text_comma(self):
        assert _parse_skills_from_text("Python, SQL") == ["Python", "SQL"]

    def test_parse_skills_from_text_none(self):
        assert _parse_skills_from_text(None) == []

    def test_parse_skills_from_text_empty(self):
        assert _parse_skills_from_text("") == []


class TestPromptBuilding:
    def test_score_prompt_includes_content(self):
        prompt = _build_score_prompt(None, "Resume content", "JD content", [], [])
        assert "Resume content" in prompt
        assert "JD content" in prompt
        assert "No skills listed" in prompt
        assert "No experience listed" in prompt
        assert "Not provided" in prompt

    def test_score_prompt_includes_skills_and_experience(self):
        skills = [Skill(name="Python", category="Lang", profile_id=1)]
        exp = [Experience(company="Acme", title="Eng", description="Built", profile_id=1)]
        prompt = _build_score_prompt(None, "Content", "JD", skills, exp)
        assert "Python" in prompt
        assert "Acme" in prompt
        assert "Eng" in prompt

    def test_score_prompt_includes_profile(self):
        profile = Profile(summary="Dev with 5yr exp", user_id=1)
        prompt = _build_score_prompt(profile, "Content", "JD", [], [])
        assert "Dev with 5yr exp" in prompt

    def test_analyze_prompt_includes_section_scores_instruction(self):
        prompt = _build_analyze_prompt(None, "Content", "JD", [], [])
        assert "section_scores" in prompt
        assert "content_analysis" in prompt
        assert "ats_score" in prompt

    def test_optimize_prompt_includes_guidelines(self):
        prompt = _build_optimize_prompt("Content", "JD", "Senior Engineer", [], [])
        assert "Senior Engineer" in prompt
        assert "ATS optimization guidelines" in prompt
        assert "Do not invent" in prompt
        assert "standard section headers" in prompt


class TestAtsNoRegression:
    def test_health_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_profile_still_works(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Engineer"})
        resp = client.get("/profile")
        assert resp.status_code == 200
        assert resp.json()["summary"] == "Engineer"

    def test_resume_still_works(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "# Resume"
            resp = client.post("/resumes/generate", json={"target_role": "Engineer"})
        assert resp.status_code == 200

    def test_job_still_works(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        resp = client.post("/jobs", json={"title": "Test"})
        assert resp.status_code == 201

    def test_skill_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/skills", json={"name": "Python"})
        assert resp.status_code == 201

    def test_experience_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/experiences", json={"title": "Dev", "company": "Acme"})
        assert resp.status_code == 201

    def test_application_still_works(self, _session):
        client = TestClient(_test_app)
        client.post("/jobs", json={"title": "Job"})
        client.post("/resumes", json={"title": "Resume"})
        resp = client.post("/applications", json={"job_id": 1, "resume_id": 1})
        assert resp.status_code == 201

    def test_document_still_works(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/documents", json={"filename": "test.pdf"})
        assert resp.status_code == 201

    def test_all_endpoints_together(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/resumes", json={"title": "R"})
        client.post("/jobs", json={"title": "J"})
        client.post("/documents", json={"filename": "f.pdf"})
        client.post("/experiences", json={"title": "E"})
        client.post("/skills", json={"name": "S"})
        client.post("/applications", json={"job_id": 1, "resume_id": 1})
        assert client.get("/health").status_code == 200
        assert client.get("/profile").status_code == 200
        assert client.get("/resumes").status_code == 200
        assert client.get("/jobs").status_code == 200
        assert client.get("/documents").status_code == 200
        assert client.get("/experiences").status_code == 200
        assert client.get("/skills").status_code == 200
        assert client.get("/applications").status_code == 200
        # ATS routes exist (tested via POST in other tests)

    def test_at_score_response_model_shape(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        resp = client.post("/ats/score", json={"resume_id": 1, "job_description": "Test"})
        assert resp.status_code == 200
        body = resp.json()
        assert "resume_id" in body
        assert "ats_score" in body
        assert "keyword_match_rate" in body
        assert "matched_keywords" in body
        assert "missing_keywords" in body
        assert "formatting_score" in body
        assert "compliance_issues" in body
        assert "suggestions" in body

    def test_ats_analyze_response_model_shape(self, _session):
        client = TestClient(_test_app)
        _create_resume(_session)
        resp = client.post("/ats/analyze", json={"resume_id": 1, "job_description": "Test"})
        assert resp.status_code == 200
        body = resp.json()
        assert "resume_id" in body
        assert "ats_score" in body
        assert "keyword_match_rate" in body
        assert "matched_keywords" in body
        assert "missing_keywords" in body
        assert "formatting_score" in body
        assert "compliance_issues" in body
        assert "section_scores" in body
        assert "suggestions" in body
        assert "content_analysis" in body
