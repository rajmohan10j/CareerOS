from sqlmodel import Field

from app.models.database import BaseTable


class Job(BaseTable, table=True):
    __tablename__ = "jobs"
    profile_id: int = Field(default=1, nullable=False)
    company: str | None = Field(default=None)
    title: str | None = Field(default=None)
    location: str | None = Field(default=None)
    url: str | None = Field(default=None)
    source: str | None = Field(default=None)
    jd_text: str | None = Field(default=None)
    status: str | None = Field(default=None)
    score: int | None = Field(default=None)
    remote: bool | None = Field(default=None)
    employment_type: str | None = Field(default=None)
    salary_range: str | None = Field(default=None)
    skills: str | None = Field(default=None)
    requirements: str | None = Field(default=None)
    experience: str | None = Field(default=None)
    notes: str | None = Field(default=None)
    evaluation_json: str | None = Field(default=None)
    fit_score: int | None = Field(default=None)
