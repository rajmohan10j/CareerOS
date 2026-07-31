from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.application import ApplicationRepository
from app.repositories.experience import ExperienceRepository
from app.repositories.job import JobRepository
from app.repositories.profile import ProfileRepository
from app.repositories.resume import ResumeRepository
from app.repositories.skill import SkillRepository
from app.schemas.application_campaign import ApplicationCampaignRequest, ApplicationCampaignResponse
from app.services.ai_service import AIService
from app.services.application_campaign_service import ApplicationCampaignService

router = APIRouter()


def _service(session: Session) -> ApplicationCampaignService:
    return ApplicationCampaignService(
        job_repository=JobRepository(session),
        resume_repository=ResumeRepository(session),
        application_repository=ApplicationRepository(session),
        profile_repository=ProfileRepository(session),
        skill_repository=SkillRepository(session),
        experience_repository=ExperienceRepository(session),
        ai_service=AIService(),
    )


@router.post("/application-campaigns/prepare", response_model=ApplicationCampaignResponse)
async def prepare_application_campaign(
    body: ApplicationCampaignRequest,
    session: Session = Depends(get_session),
):
    try:
        return await _service(session).prepare(body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
