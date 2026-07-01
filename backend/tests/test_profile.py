import os

os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.api.health import router as health_router
from app.api.profile import router as profile_router
from app.config import settings
from app.core.database import get_session
from app.models.profile import Profile  # noqa: F401 - register table
from app.repositories.profile import ProfileRepository
from app.services.profile import ProfileService, profile_to_response

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)


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


class TestProfileAPI:
    def test_get_returns_empty_when_no_profile(self, _session):
        client = TestClient(_test_app)
        response = client.get("/profile")
        assert response.status_code == 200
        assert response.json() == {}

    def test_put_creates_and_get_returns(self, _session):
        client = TestClient(_test_app)
        payload = {
            "summary": "Engineer",
            "target_roles": ["Senior"],
            "industries": ["Tech"],
            "locations": ["Remote"],
            "salary_expectations": {"min": 100},
            "preferences_json": {"key": "val"},
        }
        put_resp = client.put("/profile", json=payload)
        assert put_resp.status_code == 200
        data = put_resp.json()
        assert data["summary"] == "Engineer"
        assert data["target_roles"] == ["Senior"]
        assert data["industries"] == ["Tech"]
        assert data["locations"] == ["Remote"]
        assert data["salary_expectations"] == {"min": 100}
        assert data["preferences_json"] == {"key": "val"}
        assert "id" in data

        get_resp = client.get("/profile")
        assert get_resp.status_code == 200
        assert get_resp.json() == data

    def test_put_updates_partial(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "v1", "target_roles": ["A"]})
        resp = client.put("/profile", json={"summary": "v2", "industries": ["Tech"]})
        assert resp.status_code == 200
        data = resp.json()
        assert data["summary"] == "v2"
        assert data["target_roles"] == ["A"]
        assert data["industries"] == ["Tech"]

    def test_health_still_works(self, _session):
        client = TestClient(_test_app)
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestProfileService:
    def test_get_returns_none_when_no_profile(self, _session):
        repo = ProfileRepository(_session)
        svc = ProfileService(repo)
        assert svc.get() is None

    def test_put_creates_new_profile(self, _session):
        from app.schemas.profile import ProfileUpdate

        repo = ProfileRepository(_session)
        svc = ProfileService(repo)
        data = ProfileUpdate(
            summary="Experienced engineer",
            target_roles=["Senior Engineer", "Lead"],
            industries=["Tech"],
            locations=["Remote"],
            salary_expectations={"min": 120000},
            preferences_json={"remote_only": True},
        )
        profile = svc.update(data)
        assert profile.id is not None
        assert profile.summary == "Experienced engineer"

    def test_put_updates_existing(self, _session):
        from app.schemas.profile import ProfileUpdate

        repo = ProfileRepository(_session)
        svc = ProfileService(repo)
        svc.update(ProfileUpdate(summary="v1", target_roles=["A"]))
        svc.update(ProfileUpdate(summary="v2", industries=["Tech"]))
        profile = svc.get()
        assert profile is not None
        assert profile.summary == "v2"

    def test_profile_to_response_parses_json(self):
        profile = Profile(
            id=1,
            summary="hello",
            target_roles='["A","B"]',
            industries='["Tech"]',
            locations='["Remote"]',
            salary_expectations='{"min":100}',
            preferences_json='{"key":"val"}',
        )
        result = profile_to_response(profile)
        assert result["summary"] == "hello"
        assert result["target_roles"] == ["A", "B"]
        assert result["industries"] == ["Tech"]
        assert result["locations"] == ["Remote"]
        assert result["salary_expectations"] == {"min": 100}
        assert result["preferences_json"] == {"key": "val"}


class TestProfileRepository:
    def test_get_returns_none_initially(self, _session):
        repo = ProfileRepository(_session)
        assert repo.get() is None

    def test_upsert_and_get(self, _session):
        repo = ProfileRepository(_session)
        profile = Profile(summary="test")
        saved = repo.upsert(profile)
        assert saved.id is not None
        assert saved.summary == "test"

        fetched = repo.get()
        assert fetched is not None
        assert fetched.id == saved.id
