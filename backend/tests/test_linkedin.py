import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.core.database import get_session
from app.main import app
from app.models.profile import Profile
from app.models.skill import Skill
from app.models.experience import Experience
from app.schemas.linkedin import LinkedInSearchRequest, LinkedInStatusResponse, LinkedInImportRequest
from app.services.linkedin_service import LinkedInService
from app.services.linkedin_bridge import LinkedInBridge


@pytest.fixture(name="db_session")
def db_session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        # Seed test candidate profile and skills
        profile = Profile(id=1, full_name="Raj Mohan", email="raj@example.com", target_roles="Director of Engineering, Operations Lead")
        session.add(profile)
        session.add(Skill(id=1, profile_id=1, name="Python", category="technical"))
        session.add(Skill(id=2, profile_id=1, name="Operations", category="leadership"))
        session.add(Skill(id=3, profile_id=1, name="Agile", category="management"))
        session.commit()
        yield session


@pytest.fixture(name="client")
def client_fixture(db_session: Session):
    def get_session_override():
        return db_session

    app.dependency_overrides[get_session] = get_session_override
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_linkedin_status_endpoint(client: TestClient):
    response = client.get("/linkedin/status")
    assert response.status_code == 200
    data = response.json()
    assert "available" in data
    assert "logged_in" in data
    assert "message" in data


def test_linkedin_search_validation_empty_keywords(client: TestClient):
    response = client.post("/linkedin/search", json={"keywords": "   "})
    assert response.status_code == 400
    assert "Keywords cannot be empty" in response.json()["detail"]


@pytest.mark.asyncio
async def test_linkedin_search_mocked(client: TestClient):
    mock_results = {
        "keywords": "Operations Director",
        "location": "Remote",
        "total_found": 1,
        "jobs": [
            {
                "job_id": "4480997164",
                "title": "Director of Business Operations",
                "company": "Monks Media",
                "location": "Remote",
                "url": "https://www.linkedin.com/jobs/view/4480997164/",
                "apply_type": "easy_apply",
                "apply_url": "https://www.linkedin.com/jobs/view/4480997164/",
                "snippet": "We are seeking a senior Operations leader with Python and Agile experience to lead teams.",
            }
        ],
        "errors": [],
    }

    with patch.object(LinkedInBridge, "search_jobs", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_results
        response = client.post(
            "/linkedin/search",
            json={"keywords": "Operations Director", "location": "Remote", "easy_apply": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["keywords"] == "Operations Director"
        assert len(data["jobs"]) == 1
        job = data["jobs"][0]
        assert job["title"] == "Director of Business Operations"
        assert job["company"] == "Monks Media"
        assert job["apply_type"] == "easy_apply"
        assert job["fit_score"] is not None
        assert "Operations" in job["matched_skills"]
        assert "Python" in job["matched_skills"]


@pytest.mark.asyncio
async def test_linkedin_import_job(client: TestClient):
    import_payload = {
        "job_id": "4480997164",
        "title": "Director of Engineering",
        "company": "Tech Corp",
        "location": "Remote",
        "url": "https://www.linkedin.com/jobs/view/4480997164/",
        "jd_text": "Looking for leadership in Python and Operations management.",
        "apply_type": "easy_apply",
        "apply_url": "https://www.linkedin.com/jobs/view/4480997164/",
    }

    response = client.post("/linkedin/import", json=import_payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["imported"] is True
    assert res_data["job_id"] == "4480997164"
    assert res_data["title"] == "Director of Engineering"

    # Verify job appears in CareerOS /jobs
    list_res = client.get("/jobs")
    assert list_res.status_code == 200
    all_jobs = list_res.json()
    created_job = next((j for j in all_jobs if j["title"] == "Director of Engineering"), None)
    assert created_job is not None
    assert created_job["source"] == "linkedin"
    assert created_job["company"] == "Tech Corp"


@pytest.mark.asyncio
async def test_linkedin_job_details(client: TestClient):
    mock_detail = {
        "job_id": "4480997164",
        "title": "Operations Director",
        "company": "Monks Media",
        "location": "Remote",
        "url": "https://www.linkedin.com/jobs/view/4480997164/",
        "apply_type": "external",
        "apply_url": "https://monks.applytojob.com/apply/123",
        "full_text": "About the job:\nFull JD text with Python, Agile, and Operations details.",
    }

    with patch.object(LinkedInBridge, "get_job_details", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_detail
        response = client.get("/linkedin/jobs/4480997164")
        assert response.status_code == 200
        data = response.json()
        assert data["job_id"] == "4480997164"
        assert data["apply_url"] == "https://monks.applytojob.com/apply/123"
        assert data["fit_score"] is not None
        assert "Operations" in data["matched_skills"]
