from sqlmodel import Session, select

from app.models.document import Document


class DocumentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Document]:
        statement = select(Document).order_by(Document.updated_at.desc())
        return list(self.session.exec(statement).all())

    def get_by_id(self, document_id: int) -> Document | None:
        return self.session.get(Document, document_id)

    def create(self, document: Document) -> Document:
        self.session.add(document)
        self.session.commit()
        self.session.refresh(document)
        return document

    def update(self, document: Document) -> Document:
        self.session.add(document)
        self.session.commit()
        self.session.refresh(document)
        return document

    def delete(self, document_id: int) -> bool:
        document = self.session.get(Document, document_id)
        if document is None:
            return False
        self.session.delete(document)
        self.session.commit()
        return True

    def search(self, query: str) -> list[Document]:
        like = f"%{query}%"
        statement = (
            select(Document)
            .where(
                Document.title.like(like)  # type: ignore[union-attr]
                | Document.content.like(like)  # type: ignore[union-attr]
                | Document.filename.like(like)  # type: ignore[union-attr]
                | Document.category.like(like)  # type: ignore[union-attr]
            )
            .order_by(Document.updated_at.desc())
        )
        return list(self.session.exec(statement).all())
