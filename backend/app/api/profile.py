from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.profile import ProfileRepository
from app.schemas.profile import ProfileUpdate
from app.services.profile import ProfileService, profile_to_response

router = APIRouter()


@router.get("/profile")
def get_profile(session: Session = Depends(get_session)):
    service = ProfileService(ProfileRepository(session))
    profile = service.get()
    if profile is None:
        return {}
    return profile_to_response(profile)


@router.put("/profile")
def update_profile(data: ProfileUpdate, session: Session = Depends(get_session)):
    service = ProfileService(ProfileRepository(session))
    profile = service.update(data)
    return profile_to_response(profile)
