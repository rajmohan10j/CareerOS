from sqlmodel import Session, select

from app.models.experience import Experience


class ExperienceRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Experience]:
        statement = select(Experience).order_by(Experience.updated_at.desc())
        return list(self.session.exec(statement).all())

    def get_by_id(self, experience_id: int) -> Experience | None:
        return self.session.get(Experience, experience_id)

    def create(self, experience: Experience) -> Experience:
        self.session.add(experience)
        self.session.commit()
        self.session.refresh(experience)
        return experience

    def update(self, experience: Experience) -> Experience:
        self.session.add(experience)
        self.session.commit()
        self.session.refresh(experience)
        return experience

    def delete(self, experience_id: int) -> bool:
        experience = self.session.get(Experience, experience_id)
        if experience is None:
            return False
        self.session.delete(experience)
        self.session.commit()
        return True
