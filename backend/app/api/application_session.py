from fastapi import APIRouter, HTTPException

from app.schemas.application_session import (
    ApplicationSessionEnsure,
    ApplicationSessionMarkEntry,
    ApplicationSessionNextEntry,
)
from app.services.application_session_store import ensure_session, get_next_entry, list_sessions, mark_entry

router = APIRouter()


@router.get("/application-sessions")
def get_application_sessions():
    return list_sessions()


@router.post("/application-sessions/ensure")
def ensure_application_session(payload: ApplicationSessionEnsure):
    return ensure_session(payload)


@router.post("/application-sessions/next-entry")
def next_application_entry(payload: ApplicationSessionNextEntry):
    if payload.section not in {"experience", "education"}:
        raise HTTPException(status_code=400, detail="section must be experience or education")
    result = get_next_entry(payload.url, payload.section)
    if result is None:
        session = ensure_session(ApplicationSessionEnsure(url=payload.url))
        result = get_next_entry(session["url"], payload.section)
    return result


@router.post("/application-sessions/mark-entry")
def mark_application_entry(payload: ApplicationSessionMarkEntry):
    if payload.section not in {"experience", "education"}:
        raise HTTPException(status_code=400, detail="section must be experience or education")
    session = mark_entry(payload.url, payload.section, payload.index, payload.status, payload.notes)
    if session is None:
        raise HTTPException(status_code=404, detail="application session not found")
    return session
