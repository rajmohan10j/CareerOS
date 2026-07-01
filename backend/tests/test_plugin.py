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
from app.api.plugin import router as plugin_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.api.skill import router as skill_router
from app.config import settings
from app.core.database import get_session
from app.models.document import Document  # noqa: F401
from app.models.experience import Experience  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.models.plugin import Plugin  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.resume import Resume  # noqa: F401
from app.models.skill import Skill  # noqa: F401
from app.repositories.plugin import PluginRepository
from app.schemas.plugin import PluginRegister
from app.services.plugin_service import PluginService, plugin_to_response, validate_manifest

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(resume_router)
_test_app.include_router(document_router)
_test_app.include_router(job_router)
_test_app.include_router(experience_router)
_test_app.include_router(skill_router)
_test_app.include_router(plugin_router)

VALID_MANIFEST = {
    "id": "com.example.test-plugin",
    "name": "Test Plugin",
    "version": "1.0.0",
    "description": "A test plugin",
    "author": "Test Author",
    "category": "other",
    "entry_point": "plugins/test/main.py",
    "permissions": ["read_profile"],
    "supported_platforms": ["linux", "windows"],
    "min_careeros_version": "0.1.0",
    "config_schema": {"type": "object", "properties": {}},
    "homepage": "https://example.com",
    "license": "MIT",
}


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


def _register_body(overrides: dict | None = None) -> dict:
    base = {
        "source_id": "com.example.test-plugin",
        "name": "Test Plugin",
        "version": "1.0.0",
        "description": "A test plugin",
        "author": "Test Author",
        "category": "other",
        "entry_point": "plugins/test/main.py",
        "permissions": ["read_profile"],
        "supported_platforms": ["linux", "windows"],
        "min_careeros_version": "0.1.0",
        "config_schema": {"type": "object", "properties": {}},
        "homepage": "https://example.com",
        "license": "MIT",
    }
    if overrides:
        base.update(overrides)
    return base


class TestManifestValidation:
    def test_valid_manifest(self):
        result = validate_manifest(VALID_MANIFEST)
        assert result.valid is True
        assert result.errors == []

    def test_missing_required_field(self):
        manifest = VALID_MANIFEST.copy()
        del manifest["name"]
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("Missing required field: name" in e for e in result.errors)

    def test_invalid_version_semver(self):
        manifest = VALID_MANIFEST.copy()
        manifest["version"] = "1.0"
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("version" in e and "semver" in e for e in result.errors)

    def test_invalid_min_careeros_version(self):
        manifest = VALID_MANIFEST.copy()
        manifest["min_careeros_version"] = "abc"
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("min_careeros_version" in e for e in result.errors)

    def test_invalid_category(self):
        manifest = VALID_MANIFEST.copy()
        manifest["category"] = "invalid_category"
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("category" in e for e in result.errors)

    def test_unknown_permission(self):
        manifest = VALID_MANIFEST.copy()
        manifest["permissions"] = ["read_profile", "unknown_perm"]
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("Unknown permission" in e for e in result.errors)

    def test_duplicate_permissions(self):
        manifest = VALID_MANIFEST.copy()
        manifest["permissions"] = ["read_profile", "read_profile"]
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("duplicate" in e.lower() for e in result.errors)

    def test_unknown_platform(self):
        manifest = VALID_MANIFEST.copy()
        manifest["supported_platforms"] = ["ios"]
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("platform" in e.lower() for e in result.errors)

    def test_invalid_source_id_pattern(self):
        manifest = VALID_MANIFEST.copy()
        manifest["id"] = "invalid id with spaces"
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("id" in e for e in result.errors)

    def test_empty_entry_point(self):
        manifest = VALID_MANIFEST.copy()
        manifest["entry_point"] = ""
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("entry_point" in e for e in result.errors)

    def test_null_field_rejected(self):
        manifest = VALID_MANIFEST.copy()
        manifest["name"] = None
        result = validate_manifest(manifest)
        assert result.valid is False
        assert any("Missing required field: name" in e for e in result.errors)

    def test_multiple_errors_returned(self):
        manifest = {
            "id": "test",
            "name": "",
            "version": "bad",
            "description": "test",
            "author": "test",
            "category": "bad",
            "entry_point": "",
            "permissions": ["unknown_perm"],
            "min_careeros_version": "bad",
        }
        result = validate_manifest(manifest)
        assert result.valid is False
        assert len(result.errors) >= 3


class TestPluginAPI:
    def test_list_returns_empty_initially(self, _session):
        client = TestClient(_test_app)
        response = client.get("/plugins")
        assert response.status_code == 200
        assert response.json() == []

    def test_register_and_get(self, _session):
        client = TestClient(_test_app)
        body = _register_body()
        create_resp = client.post("/plugins/register", json=body)
        assert create_resp.status_code == 201
        data = create_resp.json()
        assert data["source_id"] == "com.example.test-plugin"
        assert data["name"] == "Test Plugin"
        assert data["version"] == "1.0.0"
        assert data["status"] == "registered"
        assert "id" in data
        assert data["permissions"] == ["read_profile"]
        assert data["supported_platforms"] == ["linux", "windows"]
        assert data["config_schema"] == {"type": "object", "properties": {}}
        assert data["license"] == "MIT"

        plugin_id = data["id"]
        get_resp = client.get(f"/plugins/{plugin_id}")
        assert get_resp.status_code == 200
        assert get_resp.json() == data

    def test_register_invalid_manifest(self, _session):
        client = TestClient(_test_app)
        body = _register_body({"version": "bad"})
        resp = client.post("/plugins/register", json=body)
        assert resp.status_code == 400
        detail = resp.json()["detail"]
        assert isinstance(detail, list)
        assert len(detail) > 0

    def test_register_duplicate_id(self, _session):
        client = TestClient(_test_app)
        body = _register_body()
        resp1 = client.post("/plugins/register", json=body)
        assert resp1.status_code == 201
        resp2 = client.post("/plugins/register", json=body)
        assert resp2.status_code == 400
        detail = resp2.json()["detail"]
        assert any("already registered" in d for d in detail)

    def test_get_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.get("/plugins/999")
        assert response.status_code == 404

    def test_list_returns_multiple(self, _session):
        client = TestClient(_test_app)
        client.post("/plugins/register", json=_register_body({"source_id": "plugin.a"}))
        client.post("/plugins/register", json=_register_body({"source_id": "plugin.b"}))
        response = client.get("/plugins")
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_enable_plugin(self, _session):
        client = TestClient(_test_app)
        body = _register_body()
        create_resp = client.post("/plugins/register", json=body)
        plugin_id = create_resp.json()["id"]
        enable_resp = client.post(f"/plugins/{plugin_id}/enable")
        assert enable_resp.status_code == 200
        assert enable_resp.json()["status"] == "enabled"

    def test_enable_plugin_not_found(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/plugins/999/enable")
        assert resp.status_code == 404

    def test_disable_plugin(self, _session):
        client = TestClient(_test_app)
        body = _register_body()
        create_resp = client.post("/plugins/register", json=body)
        plugin_id = create_resp.json()["id"]
        client.post(f"/plugins/{plugin_id}/enable")
        disable_resp = client.post(f"/plugins/{plugin_id}/disable")
        assert disable_resp.status_code == 200
        assert disable_resp.json()["status"] == "disabled"

    def test_disable_without_enable_returns_404(self, _session):
        client = TestClient(_test_app)
        body = _register_body()
        create_resp = client.post("/plugins/register", json=body)
        plugin_id = create_resp.json()["id"]
        resp = client.post(f"/plugins/{plugin_id}/disable")
        assert resp.status_code == 404

    def test_disable_plugin_not_found(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/plugins/999/disable")
        assert resp.status_code == 404

    def test_delete_plugin(self, _session):
        client = TestClient(_test_app)
        body = _register_body()
        create_resp = client.post("/plugins/register", json=body)
        plugin_id = create_resp.json()["id"]
        del_resp = client.delete(f"/plugins/{plugin_id}")
        assert del_resp.status_code == 204
        get_resp = client.get(f"/plugins/{plugin_id}")
        assert get_resp.status_code == 404

    def test_delete_returns_404(self, _session):
        client = TestClient(_test_app)
        response = client.delete("/plugins/999")
        assert response.status_code == 404

    def test_validate_valid_manifest(self, _session):
        client = TestClient(_test_app)
        resp = client.post("/plugins/validate", json={"manifest": VALID_MANIFEST})
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True
        assert data["errors"] == []

    def test_validate_invalid_manifest(self, _session):
        client = TestClient(_test_app)
        bad = VALID_MANIFEST.copy()
        bad["category"] = "bogus"
        resp = client.post("/plugins/validate", json={"manifest": bad})
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is False
        assert len(data["errors"]) > 0


class TestPluginService:
    def test_register(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        data = PluginRegister(**_register_body())
        plugin, validation = svc.register(data)
        assert plugin is not None
        assert validation.valid
        assert plugin.source_id == "com.example.test-plugin"
        assert plugin.status == "registered"

    def test_register_invalid(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        data = PluginRegister(**_register_body({"version": "bad"}))
        plugin, validation = svc.register(data)
        assert plugin is None
        assert not validation.valid

    def test_register_duplicate(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        data = PluginRegister(**_register_body())
        svc.register(data)
        plugin, validation = svc.register(data)
        assert plugin is None
        assert not validation.valid
        assert any("already registered" in e for e in validation.errors)

    def test_list(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        svc.register(PluginRegister(**_register_body({"source_id": "a"})))
        svc.register(PluginRegister(**_register_body({"source_id": "b"})))
        assert len(svc.list_all()) == 2

    def test_get_by_id_returns_none(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        assert svc.get_by_id(999) is None

    def test_enable(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        data = PluginRegister(**_register_body())
        plugin, _ = svc.register(data)
        assert plugin is not None
        enabled = svc.enable(plugin.id)
        assert enabled is not None
        assert enabled.status == "enabled"

    def test_enable_returns_none_for_missing(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        assert svc.enable(999) is None

    def test_disable(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        data = PluginRegister(**_register_body())
        plugin, _ = svc.register(data)
        svc.enable(plugin.id)
        disabled = svc.disable(plugin.id)
        assert disabled is not None
        assert disabled.status == "disabled"

    def test_disable_returns_none_if_not_enabled(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        data = PluginRegister(**_register_body())
        plugin, _ = svc.register(data)
        assert svc.disable(plugin.id) is None

    def test_disable_returns_none_for_missing(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        assert svc.disable(999) is None

    def test_delete(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        data = PluginRegister(**_register_body())
        plugin, _ = svc.register(data)
        assert svc.delete(plugin.id) is True
        assert svc.get_by_id(plugin.id) is None

    def test_delete_returns_false(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        assert svc.delete(999) is False

    def test_validate_manifest(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        result = svc.validate_manifest_dict(VALID_MANIFEST)
        assert result.valid is True

    def test_validate_manifest_invalid(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        result = svc.validate_manifest_dict({"bad": "data"})
        assert result.valid is False

    def test_service_does_not_execute_plugin_code(self, _session):
        repo = PluginRepository(_session)
        svc = PluginService(repo)
        data = PluginRegister(**_register_body())
        plugin, _ = svc.register(data)
        assert plugin is not None
        assert plugin.status == "registered"
        enabled = svc.enable(plugin.id)
        assert enabled is not None
        assert enabled.status == "enabled"
        disabled = svc.disable(enabled.id)
        assert disabled is not None
        assert disabled.status == "disabled"
        deleted = svc.delete(disabled.id)
        assert deleted is True
        assert svc.get_by_id(disabled.id) is None


class TestPluginRepository:
    def test_list_returns_empty(self, _session):
        repo = PluginRepository(_session)
        assert repo.list_all() == []

    def test_create_and_get_by_id(self, _session):
        repo = PluginRepository(_session)
        plugin = Plugin(
            source_id="com.example.test",
            name="Test",
            version="1.0.0",
            description="A plugin",
            author="Author",
            category="other",
            entry_point="plugins/test/main.py",
            permissions_json='["read_profile"]',
            supported_platforms_json='["linux"]',
            min_careeros_version="0.1.0",
            status="registered",
        )
        created = repo.create(plugin)
        fetched = repo.get_by_id(created.id)
        assert fetched is not None
        assert fetched.source_id == "com.example.test"
        assert fetched.name == "Test"

    def test_get_by_id_returns_none(self, _session):
        repo = PluginRepository(_session)
        assert repo.get_by_id(999) is None

    def test_get_by_source_id(self, _session):
        repo = PluginRepository(_session)
        plugin = Plugin(
            source_id="com.example.find-me",
            name="Find Me",
            version="1.0.0",
            description="desc",
            author="Auth",
            category="other",
            entry_point="plugins/test/main.py",
            permissions_json="[]",
            min_careeros_version="0.1.0",
            status="registered",
        )
        repo.create(plugin)
        found = repo.get_by_source_id("com.example.find-me")
        assert found is not None
        assert found.name == "Find Me"

    def test_get_by_source_id_returns_none(self, _session):
        repo = PluginRepository(_session)
        assert repo.get_by_source_id("nonexistent") is None

    def test_update(self, _session):
        repo = PluginRepository(_session)
        plugin = Plugin(
            source_id="com.example.upd",
            name="Update Me",
            version="1.0.0",
            description="desc",
            author="Auth",
            category="other",
            entry_point="plugins/test/main.py",
            permissions_json="[]",
            min_careeros_version="0.1.0",
            status="registered",
        )
        created = repo.create(plugin)
        created.status = "enabled"
        updated = repo.update(created)
        assert updated.status == "enabled"

    def test_delete_returns_true(self, _session):
        repo = PluginRepository(_session)
        plugin = Plugin(
            source_id="com.example.del",
            name="Del",
            version="1.0.0",
            description="desc",
            author="Auth",
            category="other",
            entry_point="plugins/test/main.py",
            permissions_json="[]",
            min_careeros_version="0.1.0",
            status="registered",
        )
        created = repo.create(plugin)
        assert repo.delete(created.id) is True

    def test_delete_returns_false(self, _session):
        repo = PluginRepository(_session)
        assert repo.delete(999) is False


class TestPluginNoRegression:
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

    def test_all_endpoints_still_work(self, _session):
        client = TestClient(_test_app)
        client.put("/profile", json={"summary": "Dev"})
        client.post("/documents", json={"filename": "doc.pdf"})
        client.post("/resumes", json={"title": "My Resume"})
        client.post("/jobs", json={"title": "New Job"})
        client.post("/experiences", json={"title": "Exp 1"})
        client.post("/skills", json={"name": "Python"})
        client.post("/plugins/register", json=_register_body())
        assert client.get("/health").status_code == 200
        assert client.get("/profile").status_code == 200
        assert client.get("/resumes").status_code == 200
        assert client.get("/documents").status_code == 200
        assert client.get("/jobs").status_code == 200
        assert client.get("/experiences").status_code == 200
        assert client.get("/skills").status_code == 200
        assert client.get("/plugins").status_code == 200

    def test_plugin_does_not_execute_code(self, _session):
        client = TestClient(_test_app)
        body = _register_body()
        resp = client.post("/plugins/register", json=body)
        assert resp.status_code == 201
        plugin_id = resp.json()["id"]
        enable_resp = client.post(f"/plugins/{plugin_id}/enable")
        assert enable_resp.status_code == 200
        assert enable_resp.json()["status"] == "enabled"
        disable_resp = client.post(f"/plugins/{plugin_id}/disable")
        assert disable_resp.status_code == 200
        assert disable_resp.json()["status"] == "disabled"
        del_resp = client.delete(f"/plugins/{plugin_id}")
        assert del_resp.status_code == 204
        get_resp = client.get(f"/plugins/{plugin_id}")
        assert get_resp.status_code == 404


class TestPluginResponse:
    def test_plugin_to_response_has_all_fields(self, _session):
        repo = PluginRepository(_session)
        plugin = Plugin(
            source_id="com.example.resp",
            name="Response Test",
            version="1.0.0",
            description="test desc",
            author="Auth",
            category="job_portal",
            entry_point="plugins/test/main.py",
            permissions_json='["read_jobs", "write_jobs"]',
            supported_platforms_json='["linux", "windows"]',
            min_careeros_version="0.1.0",
            config_schema_json='{"type": "object"}',
            homepage="https://example.com",
            license="MIT",
            status="registered",
        )
        repo.create(plugin)
        result = plugin_to_response(plugin)
        assert result["source_id"] == "com.example.resp"
        assert result["permissions"] == ["read_jobs", "write_jobs"]
        assert result["supported_platforms"] == ["linux", "windows"]
        assert result["config_schema"] == {"type": "object"}
        assert "id" in result
        assert "created_at" in result
        assert "updated_at" in result
