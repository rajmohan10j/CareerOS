from datetime import datetime

from pydantic import BaseModel


class ProfileUpdate(BaseModel):
    summary: str | None = None
    target_roles: list[str] | None = None
    industries: list[str] | None = None
    locations: list[str] | None = None
    salary_expectations: dict | None = None
    preferences_json: dict | None = None


class ProfileResponse(BaseModel):
    id: int
    summary: str | None = None
    target_roles: list[str] | None = None
    industries: list[str] | None = None
    locations: list[str] | None = None
    salary_expectations: dict | None = None
    preferences_json: dict | None = None
    created_at: datetime
    updated_at: datetime
