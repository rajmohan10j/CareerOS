from sqlmodel import Session, select, or_

from app.models.knowledge import Knowledge


class KnowledgeRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Knowledge]:
        statement = select(Knowledge).order_by(Knowledge.updated_at.desc())
        return list(self.session.exec(statement).all())

    def get_by_id(self, knowledge_id: int) -> Knowledge | None:
        return self.session.get(Knowledge, knowledge_id)

    def create(self, knowledge: Knowledge) -> Knowledge:
        self.session.add(knowledge)
        self.session.commit()
        self.session.refresh(knowledge)
        return knowledge

    def update(self, knowledge: Knowledge) -> Knowledge:
        self.session.add(knowledge)
        self.session.commit()
        self.session.refresh(knowledge)
        return knowledge

    def delete(self, knowledge_id: int) -> bool:
        knowledge = self.session.get(Knowledge, knowledge_id)
        if knowledge is None:
            return False
        self.session.delete(knowledge)
        self.session.commit()
        return True

    def search_by_keyword(self, query: str, source_type: str | None = None, limit: int = 20) -> list[Knowledge]:
        like = f"%{query}%"
        statement = (
            select(Knowledge)
            .where(
                or_(
                    Knowledge.title.like(like),  # type: ignore[union-attr]
                    Knowledge.content.like(like),  # type: ignore[union-attr]
                )
            )
            .order_by(Knowledge.updated_at.desc())
        )
        if source_type:
            statement = statement.where(Knowledge.source_type == source_type)
        statement = statement.limit(limit)
        return list(self.session.exec(statement).all())

    def list_by_source_type(self, source_type: str) -> list[Knowledge]:
        statement = (
            select(Knowledge)
            .where(Knowledge.source_type == source_type)
            .order_by(Knowledge.updated_at.desc())
        )
        return list(self.session.exec(statement).all())

    def get_by_source(self, source_type: str, source_id: str) -> list[Knowledge]:
        statement = (
            select(Knowledge)
            .where(Knowledge.source_type == source_type, Knowledge.source_id == source_id)
            .order_by(Knowledge.updated_at.desc())
        )
        return list(self.session.exec(statement).all())
