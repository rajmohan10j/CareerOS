from datetime import datetime

from pydantic import BaseModel


VALID_CATEGORIES = {
    "job_portal",
    "resume_export",
    "ai_provider",
    "browser_extension",
    "document_import",
    "notification",
    "other",
}

VALID_PERMISSIONS = {
    "read_profile",
    "write_profile",
    "read_resume",
    "write_resume",
    "read_jobs",
    "write_jobs",
    "read_documents",
    "write_documents",
    "use_ai",
    "network_access",
    "browser_access",
    "filesystem_read",
    "filesystem_write",
    "notifications",
}

VALID_PLATFORMS = {"windows", "linux", "macos", "web", "browser_extension"}

VALID_STATUSES = {"registered", "enabled", "disabled"}

REQUIRED_MANIFEST_FIELDS = {
    "id", "name", "version", "description", "author",
    "category", "entry_point", "permissions", "min_careeros_version",
}


class PluginRegister(BaseModel):
    source_id: str
    name: str
    version: str
    description: str | None = None
    author: str | None = None
    category: str
    entry_point: str
    permissions: list[str] = []
    supported_platforms: list[str] = []
    min_careeros_version: str
    config_schema: dict | None = None
    homepage: str | None = None
    license: str | None = None


class PluginValidate(BaseModel):
    manifest: dict


class PluginValidationResult(BaseModel):
    valid: bool
    errors: list[str] = []


class PluginStatusUpdate(BaseModel):
    pass


class PluginResponse(BaseModel):
    id: int
    source_id: str
    name: str
    version: str
    description: str | None = None
    author: str | None = None
    category: str
    entry_point: str
    permissions: list[str]
    supported_platforms: list[str]
    min_careeros_version: str
    config_schema: dict | None = None
    homepage: str | None = None
    license: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
