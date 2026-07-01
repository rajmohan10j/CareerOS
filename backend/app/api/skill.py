from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.skill import SkillRepository
from app.schemas.skill import SkillCreate, SkillUpdate
from app.services.skill_service import SkillService, skill_to_response

router = APIRouter()


def _service(session: Session) -> SkillService:
    return SkillService(SkillRepository(session))


@router.get("/skills")
def list_skills(
    category: str = Query(None),
    session: Session = Depends(get_session),
):
    service = _service(session)
    if category:
        skills = service.list_by_category(category)
    else:
        skills = service.list_all()
    return [skill_to_response(s) for s in skills]


@router.get("/skills/{skill_id}")
def get_skill(skill_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    skill = service.get_by_id(skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill_to_response(skill)


@router.post("/skills", status_code=201)
def create_skill(body: SkillCreate, session: Session = Depends(get_session)):
    service = _service(session)
    skill = service.create(body)
    return skill_to_response(skill)


@router.put("/skills/{skill_id}")
def update_skill(skill_id: int, body: SkillUpdate, session: Session = Depends(get_session)):
    service = _service(session)
    skill = service.update(skill_id, body)
    if skill is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill_to_response(skill)


@router.delete("/skills/{skill_id}", status_code=204)
def delete_skill(skill_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.delete(skill_id):
        raise HTTPException(status_code=404, detail="Skill not found")
