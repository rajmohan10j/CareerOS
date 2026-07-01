from sqlmodel import Field

from app.models.database import BaseTable


class Skill(BaseTable, table=True):
    __tablename__ = "skills"
    profile_id: int = Field(default=1, nullable=False)
    name: str | None = Field(default=None)
    category: str | None = Field(default=None)
    proficiency: int | None = Field(default=None)
    evidence: str | None = Field(default=None)
