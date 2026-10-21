from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.profile import ProfileRepository
from app.schemas.profile import ProfileCreate, ProfileUpdate
from app.services.profile import ProfileService, profile_to_response

router = APIRouter()


@router.get("/profiles")
def list_profiles(session: Session = Depends(get_session)):
    service = ProfileService(ProfileRepository(session))
    profiles = service.list_all()
    return [profile_to_response(p) for p in profiles]


@router.post("/profiles", status_code=201)
def create_profile(data: ProfileCreate, session: Session = Depends(get_session)):
    service = ProfileService(ProfileRepository(session))
    profile = service.create(data)
    return profile_to_response(profile)


@router.get("/profiles/{profile_id}")
def get_profile_by_id(profile_id: int, session: Session = Depends(get_session)):
    service = ProfileService(ProfileRepository(session))
    profile = service.get(profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_to_response(profile)


@router.put("/profiles/{profile_id}")
def update_profile_by_id(
    profile_id: int, data: ProfileUpdate, session: Session = Depends(get_session)
):
    service = ProfileService(ProfileRepository(session))
    profile = service.update_by_id(profile_id, data)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_to_response(profile)


@router.post("/profiles/{profile_id}/activate")
def activate_profile(profile_id: int, session: Session = Depends(get_session)):
    service = ProfileService(ProfileRepository(session))
    profile = service.set_active(profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_to_response(profile)


@router.delete("/profiles/{profile_id}", status_code=204)
def delete_profile(profile_id: int, session: Session = Depends(get_session)):
    service = ProfileService(ProfileRepository(session))
    if not service.delete(profile_id):
        raise HTTPException(status_code=404, detail="Profile not found")


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
