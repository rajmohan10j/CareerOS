from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.profile import ProfileRepository
from app.repositories.resume import ResumeRepository
from app.schemas.resume import ResumeCreate, ResumeGenerateRequest, ResumeUpdate
from app.services.ai_service import AIService
from app.services.resume_service import ResumeService, resume_to_response

router = APIRouter()


def _service(session: Session) -> ResumeService:
    return ResumeService(
        ResumeRepository(session),
        profile_repository=ProfileRepository(session),
        ai_service=AIService(),
    )


@router.get("/resumes")
def list_resumes(session: Session = Depends(get_session)):
    service = _service(session)
    resumes = service.list()
    return [resume_to_response(r) for r in resumes]


@router.get("/resumes/{resume_id}")
def get_resume(resume_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    resume = service.get_by_id(resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume_to_response(resume)


@router.post("/resumes", status_code=201)
def create_resume(body: ResumeCreate, session: Session = Depends(get_session)):
    service = _service(session)
    resume = service.create(body)
    return resume_to_response(resume)


@router.post("/resumes/upload", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    target_role: str | None = Form(None),
    session: Session = Depends(get_session),
):
    service = _service(session)
    filename = file.filename or "resume.txt"
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    from app.services.resume_service import parse_resume_file
    content = parse_resume_file(filename, file_bytes)
    if not content or not content.strip():
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract text from '{filename}'. Please ensure the document is not corrupted or password-protected.",
        )

    resume_title = title.strip() if title and title.strip() else filename.rsplit(".", 1)[0]
    resume = service.create(
        ResumeCreate(
            title=resume_title,
            content=content,
            target_role=target_role,
        )
    )
    return resume_to_response(resume)


@router.post("/resumes/generate")
async def generate_resume(body: ResumeGenerateRequest, session: Session = Depends(get_session)):
    service = _service(session)
    try:
        resume = await service.generate(body)
        return resume_to_response(resume)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/resumes/{resume_id}")
def update_resume(resume_id: int, body: ResumeUpdate, session: Session = Depends(get_session)):
    service = _service(session)
    resume = service.update(resume_id, body)
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume_to_response(resume)


@router.delete("/resumes/{resume_id}", status_code=204)
def delete_resume(resume_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.delete(resume_id):
        raise HTTPException(status_code=404, detail="Resume not found")
