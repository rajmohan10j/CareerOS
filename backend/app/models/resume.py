from sqlmodel import Field

from app.models.database import BaseTable


class Resume(BaseTable, table=True):
    __tablename__ = "resumes"
    profile_id: int = Field(default=1, nullable=False)
    title: str = Field(default="Untitled Resume")
    content: str | None = Field(default=None)
    target_role: str | None = Field(default=None)
    job_description: str | None = Field(default=None)
    version: int = Field(default=1)
    is_latest: bool = Field(default=True)
