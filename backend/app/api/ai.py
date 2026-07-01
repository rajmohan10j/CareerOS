from fastapi import APIRouter, HTTPException

from app.ai.exceptions import AIProviderError
from app.ai.schemas import (
    EmbedRequest,
    EmbedResponse,
    GenerateRequest,
    GenerateResponse,
)
from app.services.ai_service import AIService

router = APIRouter()


@router.get("/ai/providers")
def list_providers():
    service = AIService()
    return service.list_providers()


@router.get("/ai/models")
async def list_models():
    service = AIService()
    models = await service.list_models()
    return {"models": models}


@router.get("/ai/health")
async def ai_health():
    service = AIService()
    return await service.health_check()


@router.post("/ai/generate")
async def generate(body: GenerateRequest):
    service = AIService()
    try:
        text = await service.generate(
            body.prompt,
            task_type=body.task_type,
        )
        return GenerateResponse(text=text)
    except AIProviderError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/ai/embed")
async def embed(body: EmbedRequest):
    service = AIService()
    try:
        embeddings = await service.embed(body.texts, model=body.model)
        return EmbedResponse(embeddings=embeddings)
    except AIProviderError as e:
        raise HTTPException(status_code=503, detail=str(e))
