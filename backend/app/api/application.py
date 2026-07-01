from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.application import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationUpdate
from app.services.application_service import ApplicationService, application_to_response

router = APIRouter()


def _service(session: Session) -> ApplicationService:
    return ApplicationService(ApplicationRepository(session))


@router.get("/applications")
def list_applications(
    status: str = Query(None),
    job_id: int = Query(None),
    session: Session = Depends(get_session),
):
    service = _service(session)
    if status:
        applications = service.list_by_status(status)
    elif job_id:
        applications = service.list_by_job(job_id)
    else:
        applications = service.list_all()
    return [application_to_response(a) for a in applications]


@router.get("/applications/{application_id}")
def get_application(application_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    application = service.get_by_id(application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application_to_response(application)


@router.post("/applications", status_code=201)
def create_application(body: ApplicationCreate, session: Session = Depends(get_session)):
    service = _service(session)
    application = service.create(body)
    return application_to_response(application)


@router.put("/applications/{application_id}")
def update_application(application_id: int, body: ApplicationUpdate, session: Session = Depends(get_session)):
    service = _service(session)
    application = service.update(application_id, body)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application_to_response(application)


@router.delete("/applications/{application_id}", status_code=204)
def delete_application(application_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.delete(application_id):
        raise HTTPException(status_code=404, detail="Application not found")
