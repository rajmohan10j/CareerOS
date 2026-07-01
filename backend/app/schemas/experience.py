from datetime import datetime

from pydantic import BaseModel


class ExperienceCreate(BaseModel):
    company: str | None = None
    title: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None
    achievements_json: str | None = None


class ExperienceUpdate(BaseModel):
    company: str | None = None
    title: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None
    achievements_json: str | None = None


class ExperienceResponse(BaseModel):
    id: int
    profile_id: int
    company: str | None = None
    title: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None
    achievements_json: str | None = None
    created_at: datetime
    updated_at: datetime
