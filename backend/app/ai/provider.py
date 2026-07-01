from app.ai.base import ModelProvider
from app.ai.ollama import OllamaProvider
from app.config import settings


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, ModelProvider] = {}

    def register(self, provider: ModelProvider) -> None:
        self._providers[provider.name] = provider

    def get(self, name: str) -> ModelProvider | None:
        return self._providers.get(name)

    def all(self) -> dict[str, ModelProvider]:
        return dict(self._providers)

    def names(self) -> list[str]:
        return list(self._providers.keys())


_registry: ProviderRegistry | None = None


def _build_registry() -> ProviderRegistry:
    registry = ProviderRegistry()
    registry.register(OllamaProvider())
    return registry


def get_registry() -> ProviderRegistry:
    global _registry
    if _registry is None:
        _registry = _build_registry()
    return _registry


def reset_registry() -> None:
    global _registry
    _registry = None


def create_provider() -> ModelProvider:
    if settings.provider == "openrouter":
        if not settings.openrouter_api_key:
            raise ValueError("OpenRouter API key is not configured")
        from app.models.openrouter import OpenRouterProvider

        return OpenRouterProvider()
    return OllamaProvider()
