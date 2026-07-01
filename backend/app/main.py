from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.ai import router as ai_router
from app.api.document import router as document_router
from app.api.health import router as health_router
from app.api.profile import router as profile_router
from app.api.resume import router as resume_router
from app.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    docs_url="/docs",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(profile_router)
app.include_router(resume_router)
app.include_router(document_router)
app.include_router(ai_router)
