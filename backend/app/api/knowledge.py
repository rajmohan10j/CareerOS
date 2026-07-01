from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.knowledge import KnowledgeRepository
from app.schemas.knowledge import (
    KnowledgeChunkRequest,
    KnowledgeCreate,
    KnowledgeSearch,
    VALID_SOURCE_TYPES,
)
from app.services.ai_service import AIService
from app.services.knowledge_service import KnowledgeService, knowledge_to_response

router = APIRouter()


def _service(session: Session) -> KnowledgeService:
    return KnowledgeService(
        KnowledgeRepository(session),
        ai_service=AIService(),
    )


@router.get("/knowledge")
def list_knowledge(
    source_type: str = Query(None),
    session: Session = Depends(get_session),
):
    service = _service(session)
    if source_type:
        if source_type not in VALID_SOURCE_TYPES:
            valid = ", ".join(sorted(VALID_SOURCE_TYPES))
            raise HTTPException(
                status_code=400,
                detail=f"Invalid source_type '{source_type}'. Valid: {valid}",
            )
        records = service.list_by_source_type(source_type)
    else:
        records = service.list_all()
    return [knowledge_to_response(r) for r in records]


@router.post("/knowledge", status_code=201)
def create_knowledge(body: KnowledgeCreate, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.validate_source_type(body.source_type):
        valid = ", ".join(sorted(VALID_SOURCE_TYPES))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid source_type '{body.source_type}'. Valid: {valid}",
        )
    knowledge = service.create(body)
    return knowledge_to_response(knowledge)


@router.get("/knowledge/{knowledge_id}")
def get_knowledge(knowledge_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    knowledge = service.get_by_id(knowledge_id)
    if knowledge is None:
        raise HTTPException(status_code=404, detail="Knowledge record not found")
    return knowledge_to_response(knowledge)


@router.delete("/knowledge/{knowledge_id}", status_code=204)
def delete_knowledge(knowledge_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.delete(knowledge_id):
        raise HTTPException(status_code=404, detail="Knowledge record not found")


@router.post("/knowledge/chunk")
def chunk_knowledge(body: KnowledgeChunkRequest, session: Session = Depends(get_session)):
    service = _service(session)
    knowledge = service.chunk_knowledge(body.knowledge_id, body.chunk_size, body.overlap)
    if knowledge is None:
        raise HTTPException(status_code=404, detail="Knowledge record not found")
    return knowledge_to_response(knowledge)


@router.post("/knowledge/index")
def index_knowledge(body: KnowledgeChunkRequest | None = None, session: Session = Depends(get_session)):
    service = _service(session)
    if body and body.knowledge_id:
        knowledge = service.index_knowledge(body.knowledge_id)
        if knowledge is None:
            raise HTTPException(status_code=404, detail="Knowledge record not found")
        return knowledge_to_response(knowledge)
    result = service.reindex_all()
    return result


@router.post("/knowledge/search")
def search_knowledge(body: KnowledgeSearch, session: Session = Depends(get_session)):
    service = _service(session)
    results = service.search(body.query, body.source_type, body.limit)
    return [r.model_dump() for r in results]


@router.get("/knowledge/source/{source_type}/{source_id}")
def get_knowledge_by_source(
    source_type: str,
    source_id: str,
    session: Session = Depends(get_session),
):
    if source_type not in VALID_SOURCE_TYPES:
        valid = ", ".join(sorted(VALID_SOURCE_TYPES))
        raise HTTPException(
            status_code=400,
            detail=f"Invalid source_type '{source_type}'. Valid: {valid}",
        )
    service = _service(session)
    records = service.get_by_source(source_type, source_id)
    return [knowledge_to_response(r) for r in records]
