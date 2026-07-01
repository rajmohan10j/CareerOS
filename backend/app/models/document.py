from sqlmodel import Field

from app.models.database import BaseTable


class Document(BaseTable, table=True):
    __tablename__ = "documents"
    profile_id: int = Field(default=1, nullable=False)
    filename: str = Field(default="untitled")
    file_type: str = Field(default="txt")
    file_size: int | None = Field(default=None)
    content_type: str | None = Field(default=None)
    title: str | None = Field(default=None)
    content: str | None = Field(default=None)
    metadata_json: str | None = Field(default=None)
    category: str | None = Field(default=None)
    source: str | None = Field(default=None)
