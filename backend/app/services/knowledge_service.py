import json
from datetime import datetime, timezone
from typing import Any

from app.models.knowledge import Knowledge
from app.repositories.knowledge import KnowledgeRepository
from app.schemas.knowledge import (
    KnowledgeChunkItem,
    KnowledgeCreate,
    KnowledgeSearchResult,
    VALID_SOURCE_TYPES,
)
from app.services.chunking_service import chunk_text
from app.services.ai_service import AIService


def knowledge_to_response(knowledge: Knowledge) -> dict:
    chunks_raw = knowledge.chunks_json
    chunks: list[KnowledgeChunkItem] = []
    if chunks_raw:
        try:
            raw_list = json.loads(chunks_raw)
            chunks = [KnowledgeChunkItem(**c) for c in raw_list]
        except (json.JSONDecodeError, TypeError):
            chunks = []

    metadata_raw = knowledge.metadata_json
    metadata: dict[str, Any] | None = None
    if metadata_raw:
        try:
            metadata = json.loads(metadata_raw)
        except (json.JSONDecodeError, TypeError):
            metadata = None

    has_embedding = knowledge.embedding_json is not None and knowledge.embedding_json != ""

    return {
        "id": knowledge.id,
        "source_id": knowledge.source_id,
        "source_type": knowledge.source_type,
        "title": knowledge.title,
        "content": knowledge.content,
        "chunks": [c.model_dump() for c in chunks],
        "metadata": metadata,
        "chunk_count": knowledge.chunk_count,
        "indexed": has_embedding,
        "created_at": knowledge.created_at.replace(tzinfo=None).isoformat()
        if knowledge.created_at
        else None,
        "updated_at": knowledge.updated_at.replace(tzinfo=None).isoformat()
        if knowledge.updated_at
        else None,
    }


class KnowledgeService:
    def __init__(
        self,
        knowledge_repository: KnowledgeRepository,
        ai_service: AIService | None = None,
    ) -> None:
        self._repo = knowledge_repository
        self._ai_service = ai_service

    def list_all(self) -> list[Knowledge]:
        return self._repo.list_all()

    def get_by_id(self, knowledge_id: int) -> Knowledge | None:
        return self._repo.get_by_id(knowledge_id)

    def create(self, data: KnowledgeCreate) -> Knowledge:
        metadata_str = json.dumps(data.metadata) if data.metadata else None
        knowledge = Knowledge(
            source_id=data.source_id,
            source_type=data.source_type,
            title=data.title,
            content=data.content,
            metadata_json=metadata_str,
            chunk_count=0,
        )
        return self._repo.create(knowledge)

    def delete(self, knowledge_id: int) -> bool:
        return self._repo.delete(knowledge_id)

    def chunk_knowledge(
        self, knowledge_id: int, chunk_size: int = 500, overlap: int = 50
    ) -> Knowledge | None:
        knowledge = self._repo.get_by_id(knowledge_id)
        if knowledge is None:
            return None
        if not knowledge.content:
            return knowledge

        chunks = chunk_text(knowledge.content, chunk_size, overlap)
        knowledge.chunks_json = json.dumps([c.model_dump() for c in chunks])
        knowledge.chunk_count = len(chunks)
        knowledge.updated_at = datetime.now(timezone.utc)
        return self._repo.update(knowledge)

    def index_knowledge(self, knowledge_id: int) -> Knowledge | None:
        knowledge = self._repo.get_by_id(knowledge_id)
        if knowledge is None:
            return None
        if self._ai_service is None:
            return knowledge
        if not knowledge.chunks_json:
            knowledge = self.chunk_knowledge(knowledge_id)
            if knowledge is None:
                return None

        try:
            import asyncio

            chunks_raw = knowledge.chunks_json
            if not chunks_raw:
                return knowledge
            chunk_list = json.loads(chunks_raw)
            texts = [c["text"] for c in chunk_list]
            embeddings = asyncio.run(self._ai_service.embed(texts))
            knowledge.embedding_json = json.dumps(embeddings)
            knowledge.indexed_at = datetime.now(timezone.utc).isoformat()
            knowledge.updated_at = datetime.now(timezone.utc)
            return self._repo.update(knowledge)
        except Exception:
            return knowledge

    def search(
        self, query: str, source_type: str | None = None, limit: int = 20
    ) -> list[KnowledgeSearchResult]:
        results = self._repo.search_by_keyword(query, source_type, limit)
        out: list[KnowledgeSearchResult] = []
        for r in results:
            snippet = r.content[:200] if r.content else None
            out.append(KnowledgeSearchResult(
                id=r.id,
                source_id=r.source_id,
                source_type=r.source_type,
                title=r.title,
                content_snippet=snippet,
                chunk_count=r.chunk_count,
                score=1.0,
            ))
        return out

    def list_by_source_type(self, source_type: str) -> list[Knowledge]:
        return self._repo.list_by_source_type(source_type)

    def get_by_source(self, source_type: str, source_id: str) -> list[Knowledge]:
        return self._repo.get_by_source(source_type, source_id)

    def validate_source_type(self, source_type: str) -> bool:
        return source_type in VALID_SOURCE_TYPES

    def reindex_all(self) -> dict:
        if self._ai_service is None:
            return {"indexed": 0, "message": "No AI service available"}
        all_records = self._repo.list_all()
        count = 0
        for record in all_records:
            result = self.index_knowledge(record.id)
            if result and result.embedding_json:
                count += 1
        return {"indexed": count, "total": len(all_records)}
