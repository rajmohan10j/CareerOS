from sqlmodel import Field

from app.models.database import BaseTable


class Application(BaseTable, table=True):
    __tablename__ = "applications"
    profile_id: int = Field(default=1, nullable=False)
    job_id: int | None = Field(default=None)
    resume_id: int | None = Field(default=None)
    status: str | None = Field(default=None)
    applied_at: str | None = Field(default=None)
    notes: str | None = Field(default=None)
    follow_up_date: str | None = Field(default=None)
