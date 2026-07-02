from datetime import datetime

from pydantic import BaseModel


class ResumeCreate(BaseModel):
    title: str = "Untitled Resume"
    content: str | None = None
    target_role: str | None = None
    job_description: str | None = None


class ResumeUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    target_role: str | None = None
    job_description: str | None = None


class ResumeResponse(BaseModel):
    id: int
    profile_id: int
    title: str
    content: str | None = None
    target_role: str | None = None
    job_description: str | None = None
    version: int
    is_latest: bool
    created_at: datetime
    updated_at: datetime


class ResumeGenerateRequest(BaseModel):
    target_role: str
    job_description: str | None = None
