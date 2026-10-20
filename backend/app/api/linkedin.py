"""
CareerOS LinkedIn Router
Exposes LinkedIn search, status, job details, saved jobs, and one-click import endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.experience import ExperienceRepository
from app.repositories.job import JobRepository
from app.repositories.profile import ProfileRepository
from app.repositories.skill import SkillRepository
from app.schemas.linkedin import (
    LinkedInImportRequest,
    LinkedInJobDetailResponse,
    LinkedInSearchRequest,
    LinkedInSearchResponse,
    LinkedInStatusResponse,
)
from app.services.ai_service import AIService
from app.services.linkedin_service import LinkedInService

router = APIRouter(prefix="/linkedin", tags=["linkedin"])


def _service(session: Session) -> LinkedInService:
    return LinkedInService(
        job_repository=JobRepository(session),
        profile_repository=ProfileRepository(session),
        skill_repository=SkillRepository(session),
        experience_repository=ExperienceRepository(session),
        ai_service=AIService(),
    )


@router.get("/status", response_model=LinkedInStatusResponse)
async def get_linkedin_status(session: Session = Depends(get_session)):
    service = _service(session)
    return await service.get_status()


@router.post("/search", response_model=LinkedInSearchResponse)
async def search_linkedin_jobs(
    body: LinkedInSearchRequest,
    session: Session = Depends(get_session),
):
    if not body.keywords or not body.keywords.strip():
        raise HTTPException(status_code=400, detail="Keywords cannot be empty")
    service = _service(session)
    return await service.search_jobs(body)


@router.get("/jobs/{job_id}", response_model=LinkedInJobDetailResponse)
async def get_linkedin_job_details(
    job_id: str,
    session: Session = Depends(get_session),
):
    if not job_id:
        raise HTTPException(status_code=400, detail="Job ID required")
    service = _service(session)
    return await service.get_job_details(job_id)


@router.post("/import")
async def import_linkedin_job(
    body: LinkedInImportRequest,
    session: Session = Depends(get_session),
):
    service = _service(session)
    try:
        return await service.import_job(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/saved")
async def get_linkedin_saved_jobs(
    stage: str = Query("saved", description="saved, in_progress, applied, archived"),
    max_pages: int = Query(1, ge=1, le=5),
    session: Session = Depends(get_session),
):
    service = _service(session)
    return await service.get_saved_jobs(stage=stage, max_pages=max_pages)
