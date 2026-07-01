from sqlmodel import Session, select

from app.models.job import Job


class JobRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Job]:
        statement = select(Job).order_by(Job.updated_at.desc())
        return list(self.session.exec(statement).all())

    def get_by_id(self, job_id: int) -> Job | None:
        return self.session.get(Job, job_id)

    def create(self, job: Job) -> Job:
        self.session.add(job)
        self.session.commit()
        self.session.refresh(job)
        return job

    def update(self, job: Job) -> Job:
        self.session.add(job)
        self.session.commit()
        self.session.refresh(job)
        return job

    def delete(self, job_id: int) -> bool:
        job = self.session.get(Job, job_id)
        if job is None:
            return False
        self.session.delete(job)
        self.session.commit()
        return True

    def search(self, query: str) -> list[Job]:
        like = f"%{query}%"
        statement = (
            select(Job)
            .where(
                Job.title.like(like)  # type: ignore[union-attr]
                | Job.company.like(like)  # type: ignore[union-attr]
                | Job.jd_text.like(like)  # type: ignore[union-attr]
                | Job.location.like(like)  # type: ignore[union-attr]
            )
            .order_by(Job.updated_at.desc())
        )
        return list(self.session.exec(statement).all())
