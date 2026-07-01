from datetime import datetime

from pydantic import BaseModel


class SkillCreate(BaseModel):
    name: str | None = None
    category: str | None = None
    proficiency: int | None = None
    evidence: str | None = None


class SkillUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    proficiency: int | None = None
    evidence: str | None = None


class SkillResponse(BaseModel):
    id: int
    profile_id: int
    name: str | None = None
    category: str | None = None
    proficiency: int | None = None
    evidence: str | None = None
    created_at: datetime
    updated_at: datetime
