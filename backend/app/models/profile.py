from sqlmodel import Field

from app.models.database import BaseTable


class Profile(BaseTable, table=True):
    __tablename__ = "profiles"
    user_id: int = Field(default=1, nullable=False)
    summary: str | None = Field(default=None)
    target_roles: str | None = Field(default=None)
    industries: str | None = Field(default=None)
    locations: str | None = Field(default=None)
    salary_expectations: str | None = Field(default=None)
    preferences_json: str | None = Field(default=None)
