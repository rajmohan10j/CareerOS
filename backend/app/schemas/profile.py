from datetime import datetime

from pydantic import BaseModel


class ProfileCreate(BaseModel):
    name: str = "Primary Profile"
    summary: str | None = None
    target_roles: list[str] | None = None
    industries: list[str] | None = None
    locations: list[str] | None = None
    salary_expectations: dict | None = None
    preferences_json: dict | None = None
    is_active: bool = False


class ProfileUpdate(BaseModel):
    name: str | None = None
    summary: str | None = None
    target_roles: list[str] | None = None
    industries: list[str] | None = None
    locations: list[str] | None = None
    salary_expectations: dict | None = None
    preferences_json: dict | None = None
    is_active: bool | None = None


class ProfileResponse(BaseModel):
    id: int
    name: str = "Primary Profile"
    is_active: bool = True
    summary: str | None = None
    target_roles: list[str] | None = None
    industries: list[str] | None = None
    locations: list[str] | None = None
    salary_expectations: dict | None = None
    preferences_json: dict | None = None
    created_at: datetime
    updated_at: datetime
