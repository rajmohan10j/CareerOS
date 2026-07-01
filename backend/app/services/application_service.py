from datetime import datetime, timezone

from app.models.application import Application
from app.repositories.application import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationUpdate


def application_to_response(application: Application) -> dict:
    return {
        "id": application.id,
        "profile_id": application.profile_id,
        "job_id": application.job_id,
        "resume_id": application.resume_id,
        "status": application.status,
        "applied_at": application.applied_at,
        "notes": application.notes,
        "follow_up_date": application.follow_up_date,
        "created_at": application.created_at.replace(tzinfo=None).isoformat()
        if application.created_at
        else None,
        "updated_at": application.updated_at.replace(tzinfo=None).isoformat()
        if application.updated_at
        else None,
    }


class ApplicationService:
    def __init__(self, application_repository: ApplicationRepository) -> None:
        self._repo = application_repository

    def list_all(self) -> list[Application]:
        return self._repo.list_all()

    def get_by_id(self, application_id: int) -> Application | None:
        return self._repo.get_by_id(application_id)

    def create(self, data: ApplicationCreate) -> Application:
        application = Application(
            profile_id=1,
            job_id=data.job_id,
            resume_id=data.resume_id,
            status=data.status or "saved",
            applied_at=data.applied_at,
            notes=data.notes,
            follow_up_date=data.follow_up_date,
        )
        return self._repo.create(application)

    def update(self, application_id: int, data: ApplicationUpdate) -> Application | None:
        application = self._repo.get_by_id(application_id)
        if application is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(application, field, value)
        application.updated_at = datetime.now(timezone.utc)
        return self._repo.update(application)

    def delete(self, application_id: int) -> bool:
        return self._repo.delete(application_id)

    def list_by_status(self, status: str) -> list[Application]:
        return self._repo.list_by_status(status)

    def list_by_job(self, job_id: int) -> list[Application]:
        return self._repo.list_by_job(job_id)
