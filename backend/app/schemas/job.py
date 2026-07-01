from datetime import datetime

from pydantic import BaseModel


class JobCreate(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    url: str | None = None
    source: str | None = None
    jd_text: str | None = None
    status: str | None = None
    remote: bool | None = None
    employment_type: str | None = None
    salary_range: str | None = None
    skills: str | None = None
    requirements: str | None = None
    experience: str | None = None
    notes: str | None = None


class JobUpdate(BaseModel):
    title: str | None = None
    company: str | None = None
    location: str | None = None
    url: str | None = None
    source: str | None = None
    jd_text: str | None = None
    status: str | None = None
    remote: bool | None = None
    employment_type: str | None = None
    salary_range: str | None = None
    skills: str | None = None
    requirements: str | None = None
    experience: str | None = None
    notes: str | None = None
    evaluation_json: str | None = None
    fit_score: int | None = None


class JobResponse(BaseModel):
    id: int
    profile_id: int
    company: str | None = None
    title: str | None = None
    location: str | None = None
    url: str | None = None
    source: str | None = None
    jd_text: str | None = None
    status: str | None = None
    score: int | None = None
    remote: bool | None = None
    employment_type: str | None = None
    salary_range: str | None = None
    skills: str | None = None
    requirements: str | None = None
    experience: str | None = None
    notes: str | None = None
    evaluation_json: str | None = None
    fit_score: int | None = None
    created_at: datetime
    updated_at: datetime


class JobEvaluateTextRequest(BaseModel):
    description: str
    url: str | None = None


class JobEvaluateResponse(BaseModel):
    job_id: int | None = None
    fit_score: float | None = None
    recommendation: str | None = None
    matched_skills: list[str] = []
    missing_skills: list[str] = []
    experience_match: str | None = None
    location_match: str | None = None
    summary: str | None = None
    risks: list[str] = []
    resume_suggestions: list[str] = []
