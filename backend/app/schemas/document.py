from datetime import datetime

from pydantic import BaseModel


class DocumentCreate(BaseModel):
    filename: str = "untitled"
    file_type: str = "txt"
    file_size: int | None = None
    content_type: str | None = None
    title: str | None = None
    content: str | None = None
    category: str | None = None
    source: str | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    category: str | None = None
    metadata_json: str | None = None


class DocumentResponse(BaseModel):
    id: int
    profile_id: int
    filename: str
    file_type: str
    file_size: int | None = None
    content_type: str | None = None
    title: str | None = None
    content: str | None = None
    metadata_json: str | None = None
    category: str | None = None
    source: str | None = None
    created_at: datetime
    updated_at: datetime
