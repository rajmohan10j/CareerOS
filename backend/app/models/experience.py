from sqlmodel import Field

from app.models.database import BaseTable


class Experience(BaseTable, table=True):
    __tablename__ = "experiences"
    profile_id: int = Field(default=1, nullable=False)
    company: str | None = Field(default=None)
    title: str | None = Field(default=None)
    start_date: str | None = Field(default=None)
    end_date: str | None = Field(default=None)
    description: str | None = Field(default=None)
    achievements_json: str | None = Field(default=None)
