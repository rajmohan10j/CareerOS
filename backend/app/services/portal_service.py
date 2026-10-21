import re
import urllib.parse
from datetime import datetime, timezone
from app.models.portal import Portal
from app.repositories.portal import PortalRepository
from app.schemas.portal import PortalCreate, PortalUpdate


DEFAULT_PORTALS = [
    {
        "name": "LinkedIn",
        "slug": "linkedin",
        "domain": "linkedin.com",
        "search_url_template": "https://www.linkedin.com/jobs/search/?keywords={role}&location={location}",
        "color": "#0284c7",
        "icon": "🔵",
        "is_default": True,
    },
    {
        "name": "Naukri",
        "slug": "naukri",
        "domain": "naukri.com",
        "search_url_template": "https://www.naukri.com/{role_slug}-jobs-in-{loc_slug}",
        "color": "#0d9488",
        "icon": "🔷",
        "is_default": True,
    },
    {
        "name": "Indeed",
        "slug": "indeed",
        "domain": "indeed.com",
        "search_url_template": "https://in.indeed.com/jobs?q={role}&l={location}",
        "color": "#d97706",
        "icon": "🔶",
        "is_default": True,
    },
    {
        "name": "Google Jobs",
        "slug": "google",
        "domain": "google.com",
        "search_url_template": "https://www.google.com/search?q={role}+jobs+{location}&ibp=htl;jobs",
        "color": "#dc2626",
        "icon": "🔴",
        "is_default": True,
    },
    {
        "name": "IIMJobs",
        "slug": "iimjobs",
        "domain": "iimjobs.com",
        "search_url_template": "https://www.iimjobs.com/search/{role_slug}-{loc_slug}.html",
        "color": "#7c3aed",
        "icon": "🎓",
        "is_default": True,
    },
    {
        "name": "Glassdoor",
        "slug": "glassdoor",
        "domain": "glassdoor.com",
        "search_url_template": "https://www.glassdoor.com/Job/jobs.htm?sc.keyword={role}&locKeyword={location}",
        "color": "#059669",
        "icon": "🟢",
        "is_default": True,
    },
]


def portal_to_response(portal: Portal) -> dict:
    return {
        "id": portal.id,
        "name": portal.name,
        "slug": portal.slug,
        "domain": portal.domain,
        "search_url_template": portal.search_url_template,
        "color": portal.color,
        "icon": portal.icon,
        "is_active": portal.is_active,
        "is_default": portal.is_default,
        "created_at": portal.created_at.replace(tzinfo=None).isoformat() if portal.created_at else None,
        "updated_at": portal.updated_at.replace(tzinfo=None).isoformat() if portal.updated_at else None,
    }


class PortalService:
    def __init__(self, repo: PortalRepository) -> None:
        self.repo = repo

    def list_all(self, active_only: bool = False) -> list[Portal]:
        portals = self.repo.list_all(active_only=active_only)
        if not portals:
            self.seed_defaults()
            portals = self.repo.list_all(active_only=active_only)
        return portals

    def get_by_id(self, portal_id: int) -> Portal | None:
        return self.repo.get_by_id(portal_id)

    def create(self, data: PortalCreate) -> Portal:
        slug = data.slug or re.sub(r"[^a-zA-Z0-9]+", "-", data.name.strip().lower()).strip("-")
        clean_domain = data.domain.lower().replace("https://", "").replace("http://", "").replace("www.", "").strip("/")
        portal = Portal(
            name=data.name.strip(),
            slug=slug,
            domain=clean_domain,
            search_url_template=data.search_url_template.strip(),
            color=data.color or "#0284c7",
            icon=data.icon or "🌐",
            is_active=data.is_active if data.is_active is not None else True,
            is_default=False,
        )
        return self.repo.create(portal)

    def update(self, portal_id: int, data: PortalUpdate) -> Portal | None:
        portal = self.repo.get_by_id(portal_id)
        if not portal:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        for k, v in update_dict.items():
            if v is not None:
                setattr(portal, k, v)
        portal.updated_at = datetime.now(timezone.utc)
        return self.repo.update(portal)

    def delete(self, portal_id: int) -> bool:
        portal = self.repo.get_by_id(portal_id)
        if not portal:
            return False
        return self.repo.delete(portal_id)

    def seed_defaults(self) -> None:
        existing = {p.slug for p in self.repo.list_all()}
        for item in DEFAULT_PORTALS:
            if item["slug"] not in existing:
                p = Portal(**item)
                self.repo.create(p)

    def build_search_url(self, portal_id_or_slug: str | int, role: str, location: str) -> str:
        if isinstance(portal_id_or_slug, int) or (isinstance(portal_id_or_slug, str) and portal_id_or_slug.isdigit()):
            portal = self.repo.get_by_id(int(portal_id_or_slug))
        else:
            portal = self.repo.get_by_slug(str(portal_id_or_slug))
        
        if not portal:
            return f"https://www.google.com/search?q={urllib.parse.quote(role)}+jobs+{urllib.parse.quote(location)}"

        tmpl = portal.search_url_template
        role_enc = urllib.parse.quote(role.strip())
        loc_enc = urllib.parse.quote(location.strip())
        role_slug = re.sub(r"[^a-zA-Z0-9]+", "-", role.strip().lower()).strip("-")
        loc_slug = re.sub(r"[^a-zA-Z0-9]+", "-", location.strip().lower()).strip("-")

        url = tmpl.replace("{role}", role_enc).replace("{location}", loc_enc)
        url = url.replace("{role_slug}", role_slug).replace("{loc_slug}", loc_slug)
        return url

    def detect_portal_from_url(self, url: str) -> dict:
        if not url:
            return {"source": "direct", "name": "Direct", "icon": "🌐"}
        url_lower = url.lower()
        portals = self.list_all()
        for p in portals:
            if p.domain and p.domain.lower() in url_lower:
                return {
                    "source": p.slug,
                    "name": p.name,
                    "domain": p.domain,
                    "icon": p.icon,
                    "color": p.color,
                }
        return {"source": "other", "name": "Other Portal", "icon": "🌐", "color": "#64748b"}
