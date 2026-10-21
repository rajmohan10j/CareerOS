from datetime import datetime
from pydantic import BaseModel


class PortalCreate(BaseModel):
    name: str
    domain: str
    search_url_template: str
    slug: str | None = None
    color: str | None = "#0284c7"
    icon: str | None = "🌐"
    is_active: bool = True


class PortalUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None
    search_url_template: str | None = None
    slug: str | None = None
    color: str | None = None
    icon: str | None = None
    is_active: bool | None = None


class PortalResponse(BaseModel):
    id: int
    name: str
    slug: str
    domain: str
    search_url_template: str
    color: str | None = None
    icon: str | None = None
    is_active: bool = True
    is_default: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None
