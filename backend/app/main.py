from fastapi import FastAPI

from app.api.health import router as health_router
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    docs_url="/docs",
)

app.include_router(health_router)
