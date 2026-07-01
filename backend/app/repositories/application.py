from sqlmodel import Session, select

from app.models.application import Application


class ApplicationRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Application]:
        statement = select(Application).order_by(Application.updated_at.desc())
        return list(self.session.exec(statement).all())

    def get_by_id(self, application_id: int) -> Application | None:
        return self.session.get(Application, application_id)

    def create(self, application: Application) -> Application:
        self.session.add(application)
        self.session.commit()
        self.session.refresh(application)
        return application

    def update(self, application: Application) -> Application:
        self.session.add(application)
        self.session.commit()
        self.session.refresh(application)
        return application

    def delete(self, application_id: int) -> bool:
        application = self.session.get(Application, application_id)
        if application is None:
            return False
        self.session.delete(application)
        self.session.commit()
        return True

    def list_by_status(self, status: str) -> list[Application]:
        statement = select(Application).where(Application.status == status).order_by(Application.updated_at.desc())
        return list(self.session.exec(statement).all())

    def list_by_job(self, job_id: int) -> list[Application]:
        statement = select(Application).where(Application.job_id == job_id).order_by(Application.updated_at.desc())
        return list(self.session.exec(statement).all())
