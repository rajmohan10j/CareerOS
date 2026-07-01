from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.application import ApplicationRepository
from app.repositories.document import DocumentRepository
from app.repositories.job import JobRepository
from app.repositories.knowledge import KnowledgeRepository
from app.repositories.plugin import PluginRepository
from app.repositories.profile import ProfileRepository
from app.repositories.resume import ResumeRepository
from app.services.analytics_service import AnalyticsService

router = APIRouter()


def _service(session: Session) -> AnalyticsService:
    return AnalyticsService(
        session=session,
        profile_repo=ProfileRepository(session),
        resume_repo=ResumeRepository(session),
        job_repo=JobRepository(session),
        application_repo=ApplicationRepository(session),
        document_repo=DocumentRepository(session),
        knowledge_repo=KnowledgeRepository(session),
        plugin_repo=PluginRepository(session),
    )


@router.get("/analytics/summary")
def get_analytics_summary(session: Session = Depends(get_session)):
    service = _service(session)
    return service.get_summary().model_dump()


@router.get("/analytics/profile")
def get_analytics_profile(session: Session = Depends(get_session)):
    service = _service(session)
    return service.get_profile_analytics().model_dump()


@router.get("/analytics/resumes")
def get_analytics_resumes(session: Session = Depends(get_session)):
    service = _service(session)
    return service.get_resume_analytics().model_dump()


@router.get("/analytics/jobs")
def get_analytics_jobs(session: Session = Depends(get_session)):
    service = _service(session)
    return service.get_job_analytics().model_dump()


@router.get("/analytics/applications")
def get_analytics_applications(session: Session = Depends(get_session)):
    service = _service(session)
    return service.get_application_analytics().model_dump()


@router.get("/analytics/documents")
def get_analytics_documents(session: Session = Depends(get_session)):
    service = _service(session)
    return service.get_document_analytics().model_dump()


@router.get("/analytics/knowledge")
def get_analytics_knowledge(session: Session = Depends(get_session)):
    service = _service(session)
    return service.get_knowledge_analytics().model_dump()


@router.get("/analytics/plugins")
def get_analytics_plugins(session: Session = Depends(get_session)):
    service = _service(session)
    return service.get_plugin_analytics().model_dump()
