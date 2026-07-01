from app.ai.base import GenerationOptions
from app.ai.exceptions import AIProviderNotAvailable
from app.ai.provider import get_registry


class AIRouter:
    def __init__(self) -> None:
        self._registry = get_registry()

    @property
    def registry(self) -> object:
        return self._registry

    def _resolve_provider(self, provider_name: str | None = None) -> object:
        from app.ai.provider import create_provider

        if provider_name:
            provider = self._registry.get(provider_name)
            if provider is None:
                raise AIProviderNotAvailable(provider_name)
            return provider
        return create_provider()

    def list_providers(self) -> list[dict]:
        from app.config import settings

        providers = self._registry.all()
        result = []
        for name, provider in providers.items():
            result.append(
                {
                    "name": name,
                    "default_model": (
                        settings.ollama_reasoning_model
                        if name == "ollama"
                        else settings.openrouter_default_model
                    ),
                }
            )
        return result

    async def list_models(self) -> list[dict]:
        provider = self._resolve_provider()
        return await provider.list_models()

    async def health_check(self, provider_name: str | None = None) -> dict:
        provider = self._resolve_provider(provider_name)
        try:
            ok = await provider.health_check()
            return {
                "status": "ok" if ok else "unavailable",
                "provider": provider.name,
            }
        except Exception:
            return {
                "status": "error",
                "provider": provider.name,
            }

    async def generate(
        self,
        prompt: str,
        task_type: str = "general",
        options: GenerationOptions | None = None,
        provider_name: str | None = None,
    ) -> str:
        provider = self._resolve_provider(provider_name)
        return await provider.generate(task_type, prompt, options)

    async def embed(
        self,
        texts: list[str],
        model: str | None = None,
        provider_name: str | None = None,
    ) -> list[list[float]]:
        from app.ai.base import EmbeddingOptions

        provider = self._resolve_provider(provider_name)
        opts = EmbeddingOptions(model=model) if model else None
        return await provider.embed(texts, opts)
