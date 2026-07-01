from datetime import datetime

from pydantic import BaseModel

VALID_SOURCE_TYPES = frozenset({
    "profile", "resume", "document", "job", "application",
    "note", "plugin", "other",
})


class KnowledgeCreate(BaseModel):
    source_id: str
    source_type: str
    title: str | None = None
    content: str | None = None
    metadata: dict | None = None


class KnowledgeChunkItem(BaseModel):
    index: int
    text: str
    token_count: int


class KnowledgeChunkRequest(BaseModel):
    knowledge_id: int
    chunk_size: int = 500
    overlap: int = 50


class KnowledgeSearch(BaseModel):
    query: str
    source_type: str | None = None
    limit: int = 20


class KnowledgeSearchResult(BaseModel):
    id: int
    source_id: str
    source_type: str
    title: str | None = None
    content_snippet: str | None = None
    chunk_count: int = 0
    score: float = 0.0


class KnowledgeResponse(BaseModel):
    id: int
    source_id: str
    source_type: str
    title: str | None = None
    content: str | None = None
    chunks: list[KnowledgeChunkItem] = []
    metadata: dict | None = None
    chunk_count: int = 0
    indexed: bool = False
    created_at: datetime
    updated_at: datetime
