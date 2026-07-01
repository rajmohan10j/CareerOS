import asyncio

from app.ai.base import GenerationOptions
from app.ai.exceptions import AIProviderError, AIRetryError, AITimeoutError
from app.ai.router import AIRouter
from app.config import settings


class AIService:
    def __init__(self) -> None:
        self._router = AIRouter()

    @property
    def router(self) -> AIRouter:
        return self._router

    def list_providers(self) -> list[dict]:
        return self._router.list_providers()

    async def list_models(self) -> list[dict]:
        try:
            return await self._router.list_models()
        except Exception:
            return []

    async def health_check(self) -> dict:
        return await self._router.health_check()

    async def generate(
        self,
        prompt: str,
        task_type: str = "general",
        options: GenerationOptions | None = None,
    ) -> str:
        last_error: Exception | None = None
        max_retries = settings.ai_max_retries

        for attempt in range(max_retries + 1):
            try:
                result = await asyncio.wait_for(
                    self._router.generate(prompt, task_type, options),
                    timeout=settings.ai_generate_timeout,
                )
                return result
            except asyncio.TimeoutError as e:
                raise AITimeoutError("generate", settings.ai_generate_timeout) from e
            except AIProviderError:
                raise
            except Exception as e:
                last_error = e
                if attempt < max_retries:
                    await asyncio.sleep(0.5 * (attempt + 1))

        raise AIRetryError("generate", max_retries) from last_error

    async def embed(
        self,
        texts: list[str],
        model: str | None = None,
    ) -> list[list[float]]:
        try:
            result = await asyncio.wait_for(
                self._router.embed(texts, model),
                timeout=settings.ai_generate_timeout,
            )
            return result
        except asyncio.TimeoutError as e:
            raise AITimeoutError("embed", settings.ai_generate_timeout) from e
