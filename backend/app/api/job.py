from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.job import JobRepository
from app.repositories.profile import ProfileRepository
from app.schemas.job import JobCreate, JobEvaluateTextRequest, JobUpdate
from app.services.ai_service import AIService
from app.services.job_service import JobService, job_to_response

router = APIRouter()


def _service(session: Session) -> JobService:
    return JobService(
        JobRepository(session),
        profile_repository=ProfileRepository(session),
        ai_service=AIService(),
    )


@router.get("/jobs")
def list_jobs(session: Session = Depends(get_session)):
    service = _service(session)
    jobs = service.list_all()
    return [job_to_response(j) for j in jobs]


@router.get("/jobs/search")
def search_jobs(q: str = Query(""), session: Session = Depends(get_session)):
    service = _service(session)
    jobs = service.search(q)
    return [job_to_response(j) for j in jobs]


@router.get("/jobs/{job_id}")
def get_job(job_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    job = service.get_by_id(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_to_response(job)


@router.post("/jobs", status_code=201)
def create_job(body: JobCreate, session: Session = Depends(get_session)):
    service = _service(session)
    job = service.create(body)
    return job_to_response(job)


@router.post("/jobs/evaluate-text")
async def evaluate_job_text(body: JobEvaluateTextRequest, session: Session = Depends(get_session)):
    service = _service(session)
    try:
        result = await service.evaluate_text(body)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/jobs/{job_id}/analyze")
async def analyze_job(job_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    job = await service.analyze(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_to_response(job)


@router.post("/jobs/{job_id}/evaluate")
async def evaluate_job(job_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    job = await service.evaluate(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_to_response(job)


@router.put("/jobs/{job_id}")
def update_job(job_id: int, body: JobUpdate, session: Session = Depends(get_session)):
    service = _service(session)
    job = service.update(job_id, body)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_to_response(job)


@router.delete("/jobs/{job_id}", status_code=204)
def delete_job(job_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.delete(job_id):
        raise HTTPException(status_code=404, detail="Job not found")
