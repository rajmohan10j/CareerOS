from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.core.database import get_session
from app.main import app as _test_app
from app.models.portal import Portal
from app.repositories.portal import PortalRepository
from app.schemas.portal import PortalCreate, PortalUpdate
from app.services.portal_service import PortalService


@pytest.fixture(name="_session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(autouse=True)
def _override_session(_session):
    def _get_test_session():
        yield _session

    _test_app.dependency_overrides[get_session] = _get_test_session
    yield
    _test_app.dependency_overrides.clear()


class TestPortalService:
    def test_seed_defaults_populates_portals(self, _session):
        repo = PortalRepository(_session)
        svc = PortalService(repo)
        portals = svc.list_all()
        assert len(portals) >= 5
        slugs = [p.slug for p in portals]
        assert "linkedin" in slugs
        assert "naukri" in slugs
        assert "indeed" in slugs
        assert "google" in slugs

    def test_create_custom_portal(self, _session):
        repo = PortalRepository(_session)
        svc = PortalService(repo)
        created = svc.create(PortalCreate(
            name="Foundit",
            domain="foundit.in",
            search_url_template="https://www.foundit.in/srp/results?query={role}&locations={location}",
            color="#8b5cf6",
            icon="🟣"
        ))
        assert created.id is not None
        assert created.slug == "foundit"
        assert created.domain == "foundit.in"

    def test_update_portal(self, _session):
        repo = PortalRepository(_session)
        svc = PortalService(repo)
        created = svc.create(PortalCreate(
            name="Instahyre",
            domain="instahyre.com",
            search_url_template="https://www.instahyre.com/jobs?q={role}",
        ))
        updated = svc.update(created.id, PortalUpdate(name="Instahyre Premium", color="#10b981"))
        assert updated is not None
        assert updated.name == "Instahyre Premium"
        assert updated.color == "#10b981"

    def test_delete_portal(self, _session):
        repo = PortalRepository(_session)
        svc = PortalService(repo)
        created = svc.create(PortalCreate(
            name="TempPortal",
            domain="tempportal.com",
            search_url_template="https://tempportal.com/jobs",
        ))
        assert svc.delete(created.id) is True
        assert svc.get_by_id(created.id) is None

    def test_detect_portal_from_url(self, _session):
        repo = PortalRepository(_session)
        svc = PortalService(repo)
        svc.seed_defaults()
        det = svc.detect_portal_from_url("https://www.naukri.com/job-listings-director-1234")
        assert det["source"] == "naukri"

        det_li = svc.detect_portal_from_url("https://www.linkedin.com/jobs/view/5678")
        assert det_li["source"] == "linkedin"

        det_unknown = svc.detect_portal_from_url("https://randomcompany.com/career/123")
        assert det_unknown["source"] == "other"

    def test_build_search_url(self, _session):
        repo = PortalRepository(_session)
        svc = PortalService(repo)
        svc.seed_defaults()
        url = svc.build_search_url("indeed", "Placement Director", "Bangalore")
        assert "Placement%20Director" in url
        assert "Bangalore" in url


class TestPortalEndpoints:
    def test_list_portals_api(self, _session):
        client = TestClient(_test_app)
        resp = client.get("/portals")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 5

    def test_create_and_delete_portal_api(self, _session):
        client = TestClient(_test_app)
        create_resp = client.post("/portals", json={
            "name": "Wellfound",
            "domain": "wellfound.com",
            "search_url_template": "https://wellfound.com/jobs?role={role}",
            "color": "#ef4444",
            "icon": "✌️"
        })
        assert create_resp.status_code == 201
        portal_id = create_resp.json()["id"]

        get_resp = client.get(f"/portals/{portal_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["name"] == "Wellfound"

        del_resp = client.delete(f"/portals/{portal_id}")
        assert del_resp.status_code == 204

    def test_detect_portal_api(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/portals/detect", json={"url": "https://in.indeed.com/viewjob?jk=12345"})
        assert resp.status_code == 200
        assert resp.json()["source"] == "indeed"

    def test_generate_search_urls_api(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/portals/search-urls", json={"role": "Director", "location": "Bangalore"})
        assert resp.status_code == 200
        results = resp.json()
        assert len(results) >= 5
        assert any(r["name"] == "LinkedIn" for r in results)
        assert any(r["name"] == "Naukri" for r in results)
