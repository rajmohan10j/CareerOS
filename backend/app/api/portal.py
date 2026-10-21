from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.core.database import get_session
from app.repositories.portal import PortalRepository
from app.schemas.portal import PortalCreate, PortalUpdate
from app.services.portal_service import PortalService, portal_to_response

router = APIRouter()


class SearchUrlsRequest(BaseModel):
    role: str
    location: str


class DetectPortalRequest(BaseModel):
    url: str


def _service(session: Session) -> PortalService:
    return PortalService(PortalRepository(session))


@router.get("/portals")
def list_portals(session: Session = Depends(get_session)):
    service = _service(session)
    portals = service.list_all()
    return [portal_to_response(p) for p in portals]


@router.post("/portals", status_code=201)
def create_portal(body: PortalCreate, session: Session = Depends(get_session)):
    service = _service(session)
    portal = service.create(body)
    return portal_to_response(portal)


@router.get("/portals/{portal_id}")
def get_portal(portal_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    portal = service.get_by_id(portal_id)
    if portal is None:
        raise HTTPException(status_code=404, detail="Portal not found")
    return portal_to_response(portal)


@router.put("/portals/{portal_id}")
def update_portal(portal_id: int, body: PortalUpdate, session: Session = Depends(get_session)):
    service = _service(session)
    portal = service.update(portal_id, body)
    if portal is None:
        raise HTTPException(status_code=404, detail="Portal not found")
    return portal_to_response(portal)


@router.delete("/portals/{portal_id}", status_code=204)
def delete_portal(portal_id: int, session: Session = Depends(get_session)):
    service = _service(session)
    if not service.delete(portal_id):
        raise HTTPException(status_code=404, detail="Portal not found")


@router.post("/portals/detect")
def detect_portal(body: DetectPortalRequest, session: Session = Depends(get_session)):
    service = _service(session)
    return service.detect_portal_from_url(body.url)


@router.post("/portals/search-urls")
def generate_search_urls(body: SearchUrlsRequest, session: Session = Depends(get_session)):
    service = _service(session)
    portals = service.list_all(active_only=True)
    results = []
    for p in portals:
        url = service.build_search_url(p.id, body.role, body.location)
        results.append({
            "portal_id": p.id,
            "name": p.name,
            "slug": p.slug,
            "icon": p.icon,
            "color": p.color,
            "url": url,
        })
    return results
