from sqlmodel import Field

from app.models.database import BaseTable


class Knowledge(BaseTable, table=True):
    __tablename__ = "knowledge"
    source_id: str = Field(max_length=255, nullable=False)
    source_type: str = Field(max_length=64, nullable=False)
    title: str | None = Field(default=None, max_length=512)
    content: str | None = Field(default=None)
    chunks_json: str | None = Field(default=None)
    metadata_json: str | None = Field(default=None)
    embedding_json: str | None = Field(default=None)
    chunk_count: int = Field(default=0)
    indexed_at: str | None = Field(default=None)
