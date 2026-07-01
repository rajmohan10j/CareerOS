from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.experience import ExperienceRepository
from app.schemas.experience import ExperienceCreate, ExperienceUpdate
from app.services.experience_service import ExperienceService, experience_to_response

router = APIRouter()


def _service(session: Session) -> ExperienceService:
    return ExperienceService(ExperienceRepository(session))


@router.get("/experiences")
def list_experiences(session: Session = Depends(get_session)):
    service = _service(session)
    experiences = service.list_all()
    return [experience_to_response(e) for e in experiences]


@router.get("/experiences/{experience_id}")
def get_experience(experience_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    experience = service.get_by_id(experience_id)
    if experience is None:
        raise HTTPException(status_code=404, detail="Experience not found")
    return experience_to_response(experience)


@router.post("/experiences", status_code=201)
def create_experience(body: ExperienceCreate, session: Session = Depends(get_session)):
    service = _service(session)
    experience = service.create(body)
    return experience_to_response(experience)


@router.put("/experiences/{experience_id}")
def update_experience(experience_id: int, body: ExperienceUpdate, session: Session = Depends(get_session)):
    service = _service(session)
    experience = service.update(experience_id, body)
    if experience is None:
        raise HTTPException(status_code=404, detail="Experience not found")
    return experience_to_response(experience)


@router.delete("/experiences/{experience_id}", status_code=204)
def delete_experience(experience_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.delete(experience_id):
        raise HTTPException(status_code=404, detail="Experience not found")
