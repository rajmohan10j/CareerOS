from datetime import datetime, timezone

from app.models.document import Document
from app.repositories.document import DocumentRepository
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.services.ai_service import AIService


def document_to_response(doc: Document) -> dict:
    return {
        "id": doc.id,
        "profile_id": doc.profile_id,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "file_size": doc.file_size,
        "content_type": doc.content_type,
        "title": doc.title,
        "content": doc.content,
        "metadata_json": doc.metadata_json,
        "category": doc.category,
        "source": doc.source,
        "created_at": doc.created_at.replace(tzinfo=None).isoformat() if doc.created_at else None,
        "updated_at": doc.updated_at.replace(tzinfo=None).isoformat() if doc.updated_at else None,
    }


def _build_parse_prompt(content: str) -> str:
    lines = [
        "You are a document intelligence assistant.",
        "Extract structured information from the following document content.",
        "Return a JSON object with these keys:",
        '  - "title": the document title',
        '  - "summary": a brief summary of the document',
        '  - "key_entities": list of key entities found (names, dates, organizations, skills)',
        '  - "metadata": any other relevant metadata',
        "",
        "Document content:",
        content,
    ]
    return "\n".join(lines)


def _build_classify_prompt(content: str) -> str:
    lines = [
        "You are a document classifier.",
        "Categorize the following document into one of these categories:",
        "resume, certificate, transcript, job_description, cover_letter, other.",
        "Return only the category name, nothing else.",
        "",
        "Document content:",
        content,
    ]
    return "\n".join(lines)


class DocumentService:
    def __init__(
        self,
        document_repository: DocumentRepository,
        ai_service: AIService | None = None,
    ) -> None:
        self._doc_repo = document_repository
        self._ai_service = ai_service

    def list_all(self) -> list[Document]:
        return self._doc_repo.list_all()

    def get_by_id(self, document_id: int) -> Document | None:
        return self._doc_repo.get_by_id(document_id)

    def create(self, data: DocumentCreate) -> Document:
        doc = Document(
            profile_id=1,
            filename=data.filename,
            file_type=data.file_type,
            file_size=data.file_size,
            content_type=data.content_type,
            title=data.title,
            content=data.content,
            category=data.category,
            source=data.source,
        )
        return self._doc_repo.create(doc)

    def update(self, document_id: int, data: DocumentUpdate) -> Document | None:
        doc = self._doc_repo.get_by_id(document_id)
        if doc is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(doc, field, value)
        doc.updated_at = datetime.now(timezone.utc)
        return self._doc_repo.update(doc)

    def delete(self, document_id: int) -> bool:
        return self._doc_repo.delete(document_id)

    def search(self, query: str) -> list[Document]:
        return self._doc_repo.search(query)

    async def parse(self, document_id: int) -> Document | None:
        doc = self._doc_repo.get_by_id(document_id)
        if doc is None:
            return None
        if doc.content is None:
            return doc
        if self._ai_service is None:
            return doc

        prompt = _build_parse_prompt(doc.content)
        result = await self._ai_service.generate(prompt, task_type="reasoning")
        doc.metadata_json = result.strip()
        doc.updated_at = datetime.now(timezone.utc)
        return self._doc_repo.update(doc)

    async def classify(self, document_id: int) -> Document | None:
        doc = self._doc_repo.get_by_id(document_id)
        if doc is None:
            return None
        if doc.content is None:
            return doc
        if self._ai_service is None:
            return doc

        prompt = _build_classify_prompt(doc.content)
        result = await self._ai_service.generate(prompt, task_type="reasoning")
        classification = result.strip().lower()
        valid = {"resume", "certificate", "transcript", "job_description", "cover_letter", "other"}
        if classification in valid:
            doc.category = classification
        else:
            doc.category = "other"
        doc.updated_at = datetime.now(timezone.utc)
        return self._doc_repo.update(doc)
