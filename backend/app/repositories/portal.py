from sqlmodel import Session, select
from app.models.portal import Portal


class PortalRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self, active_only: bool = False) -> list[Portal]:
        stmt = select(Portal)
        if active_only:
            stmt = stmt.where(Portal.is_active == True)
        stmt = stmt.order_by(Portal.id.asc())
        return list(self.session.exec(stmt).all())

    def get_by_id(self, portal_id: int) -> Portal | None:
        return self.session.get(Portal, portal_id)

    def get_by_slug(self, slug: str) -> Portal | None:
        stmt = select(Portal).where(Portal.slug == slug)
        return self.session.exec(stmt).first()

    def get_by_domain(self, domain: str) -> Portal | None:
        clean = domain.lower().replace("https://", "").replace("http://", "").replace("www.", "").strip("/")
        stmt = select(Portal).where(Portal.domain.contains(clean))
        return self.session.exec(stmt).first()

    def create(self, portal: Portal) -> Portal:
        self.session.add(portal)
        self.session.commit()
        self.session.refresh(portal)
        return portal

    def update(self, portal: Portal) -> Portal:
        self.session.add(portal)
        self.session.commit()
        self.session.refresh(portal)
        return portal

    def delete(self, portal_id: int) -> bool:
        portal = self.session.get(Portal, portal_id)
        if portal is None:
            return False
        self.session.delete(portal)
        self.session.commit()
        return True
