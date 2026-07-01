from datetime import datetime

from pydantic import BaseModel


class ApplicationCreate(BaseModel):
    job_id: int | None = None
    resume_id: int | None = None
    status: str | None = None
    applied_at: str | None = None
    notes: str | None = None
    follow_up_date: str | None = None


class ApplicationUpdate(BaseModel):
    job_id: int | None = None
    resume_id: int | None = None
    status: str | None = None
    applied_at: str | None = None
    notes: str | None = None
    follow_up_date: str | None = None


class ApplicationResponse(BaseModel):
    id: int
    profile_id: int
    job_id: int | None = None
    resume_id: int | None = None
    status: str | None = None
    applied_at: str | None = None
    notes: str | None = None
    follow_up_date: str | None = None
    created_at: datetime
    updated_at: datetime
