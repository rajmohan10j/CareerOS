from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.experience import ExperienceRepository
from app.repositories.job import JobRepository
from app.repositories.profile import ProfileRepository
from app.repositories.resume import ResumeRepository
from app.repositories.skill import SkillRepository
from app.schemas.ats import (
    AtsAnalyzeRequest,
    AtsAnalyzeResponse,
    AtsOptimizeRequest,
    AtsOptimizeResponse,
    AtsScoreRequest,
    AtsScoreResponse,
)
from app.services.ai_service import AIService
from app.services.ats_service import AtsService

router = APIRouter()


def _service(session: Session) -> AtsService:
    return AtsService(
        resume_repository=ResumeRepository(session),
        job_repository=JobRepository(session),
        profile_repository=ProfileRepository(session),
        skill_repository=SkillRepository(session),
        experience_repository=ExperienceRepository(session),
        ai_service=AIService(),
    )


@router.post("/ats/score", response_model=AtsScoreResponse)
async def score_resume(body: AtsScoreRequest, session: Session = Depends(get_session)):
    service = _service(session)
    try:
        return await service.score(body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/ats/analyze", response_model=AtsAnalyzeResponse)
async def analyze_resume(body: AtsAnalyzeRequest, session: Session = Depends(get_session)):
    service = _service(session)
    try:
        return await service.analyze(body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/ats/optimize", response_model=AtsOptimizeResponse)
async def optimize_resume(body: AtsOptimizeRequest, session: Session = Depends(get_session)):
    service = _service(session)
    try:
        return await service.optimize(body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
