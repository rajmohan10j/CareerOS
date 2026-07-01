from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.document import DocumentRepository
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.ai_service import AIService
from app.services.document_service import DocumentService, document_to_response

router = APIRouter()


def _service(session: Session) -> DocumentService:
    return DocumentService(
        DocumentRepository(session),
        ai_service=AIService(),
    )


@router.get("/documents")
def list_documents(session: Session = Depends(get_session)):
    service = _service(session)
    docs = service.list_all()
    return [document_to_response(d) for d in docs]


@router.get("/documents/search")
def search_documents(q: str = Query(""), session: Session = Depends(get_session)):
    service = _service(session)
    docs = service.search(q)
    return [document_to_response(d) for d in docs]


@router.get("/documents/{document_id}")
def get_document(document_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    doc = service.get_by_id(document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_to_response(doc)


@router.post("/documents", status_code=201)
def create_document(body: DocumentCreate, session: Session = Depends(get_session)):
    service = _service(session)
    doc = service.create(body)
    return document_to_response(doc)


@router.post("/documents/{document_id}/parse")
async def parse_document(document_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    doc = await service.parse(document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_to_response(doc)


@router.post("/documents/{document_id}/classify")
async def classify_document(document_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    doc = await service.classify(document_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_to_response(doc)


@router.put("/documents/{document_id}")
def update_document(
    document_id: int, body: DocumentUpdate, session: Session = Depends(get_session)
):
    service = _service(session)
    doc = service.update(document_id, body)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document_to_response(doc)


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(document_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.delete(document_id):
        raise HTTPException(status_code=404, detail="Document not found")
