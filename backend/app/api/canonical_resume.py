from fastapi import APIRouter

from app.services.application_session_store import load_canonical_resume, record_field_observations

router = APIRouter()


@router.get("/canonical-resume")
def get_canonical_resume():
    return load_canonical_resume()


@router.post("/canonical-resume/field-observations")
def save_field_observations(payload: dict):
    return record_field_observations(payload)
