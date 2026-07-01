from sqlmodel import Session, select, update

from app.models.resume import Resume


class ResumeRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(self) -> list[Resume]:
        statement = select(Resume).order_by(Resume.updated_at.desc())
        return list(self.session.exec(statement).all())

    def get_by_id(self, resume_id: int) -> Resume | None:
        return self.session.get(Resume, resume_id)

    def create(self, resume: Resume) -> Resume:
        self.session.add(resume)
        self.session.commit()
        self.session.refresh(resume)
        return resume

    def update(self, resume: Resume) -> Resume:
        self.session.add(resume)
        self.session.commit()
        self.session.refresh(resume)
        return resume

    def delete(self, resume_id: int) -> bool:
        resume = self.session.get(Resume, resume_id)
        if resume is None:
            return False
        self.session.delete(resume)
        self.session.commit()
        return True

    def mark_previous_as_not_latest(self, profile_id: int) -> None:
        statement = (
            update(Resume)
            .where(Resume.profile_id == profile_id)
            .where(Resume.is_latest)
            .values(is_latest=False)
        )
        self.session.exec(statement)
        self.session.commit()

    def get_latest_version(self, profile_id: int) -> int:
        statement = (
            select(Resume.version)
            .where(Resume.profile_id == profile_id)
            .order_by(Resume.version.desc())
            .limit(1)
        )
        result = self.session.exec(statement).first()
        return result if result is not None else 0
