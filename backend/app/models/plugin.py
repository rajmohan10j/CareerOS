from sqlmodel import Field

from app.models.database import BaseTable


class Plugin(BaseTable, table=True):
    __tablename__ = "plugins"
    source_id: str = Field(max_length=255, nullable=False)
    name: str = Field(max_length=255, nullable=False)
    version: str = Field(max_length=32, nullable=False)
    description: str | None = Field(default=None, max_length=1024)
    author: str | None = Field(default=None, max_length=255)
    category: str = Field(max_length=64, nullable=False)
    entry_point: str = Field(max_length=512, nullable=False)
    permissions_json: str = Field(default="[]", max_length=2048)
    supported_platforms_json: str = Field(default="[]", max_length=512)
    min_careeros_version: str = Field(max_length=32, nullable=False)
    config_schema_json: str | None = Field(default=None, max_length=8192)
    homepage: str | None = Field(default=None, max_length=512)
    license: str | None = Field(default=None, max_length=128)
    status: str = Field(default="registered", max_length=32, nullable=False)
