from sqlmodel import Field
from app.models.database import BaseTable


class Portal(BaseTable, table=True):
    __tablename__ = "portals"

    name: str = Field(nullable=False)
    slug: str = Field(nullable=False)
    domain: str = Field(nullable=False)
    search_url_template: str = Field(nullable=False)
    color: str | None = Field(default="#0284c7")
    icon: str | None = Field(default="🌐")
    is_active: bool = Field(default=True)
    is_default: bool = Field(default=False)
