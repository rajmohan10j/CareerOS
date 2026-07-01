import asyncio
import os

os.environ["DATABASE_URL"] = "sqlite://"

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session, create_engine

from app.ai.base import (
    EmbeddingOptions,
    GenerationOptions,
    ModelProvider,
)
from app.ai.exceptions import AIProviderNotAvailable, AIRetryError, AITimeoutError
from app.ai.ollama import OllamaProvider
from app.ai.provider import ProviderRegistry, create_provider, get_registry, reset_registry
from app.ai.router import AIRouter
from app.ai.schemas import (
    EmbedRequest,
    EmbedResponse,
    GenerateRequest,
    GenerateResponse,
)
from app.api.ai import router as ai_router
from app.api.health import router as health_router
from app.api.profile import router as profile_router
from app.config import settings
from app.core.database import get_session
from app.models.profile import Profile  # noqa: F401
from app.services.ai_service import AIService

_test_app = FastAPI(title=settings.app_name, version=settings.version)
_test_app.include_router(health_router)
_test_app.include_router(profile_router)
_test_app.include_router(ai_router)


# ---------------------------------------------------------------------------
# Mock provider for testing
# ---------------------------------------------------------------------------


class MockProvider(ModelProvider):
    @property
    def name(self) -> str:
        return "mock"

    async def generate(
        self,
        task_type: str,
        prompt: str,
        options: GenerationOptions | None = None,
    ) -> str:
        return f"Mock response for: {prompt}"

    async def embed(
        self,
        texts: list[str],
        options: EmbeddingOptions | None = None,
    ) -> list[list[float]]:
        return [[0.1, 0.2, 0.3] for _ in texts]

    async def rerank(
        self,
        query: str,
        documents: list[str],
        options=None,
    ) -> list[tuple[int, float]]:
        raise NotImplementedError("Not supported")

    async def vision(
        self,
        image: bytes,
        prompt: str,
        options=None,
    ) -> str:
        return "mock vision result"

    async def transcribe(
        self,
        audio: bytes,
        options=None,
    ) -> str:
        raise NotImplementedError("Not supported")

    async def health_check(self) -> bool:
        return True

    async def list_models(self) -> list[dict]:
        return [{"name": "mock-model", "provider": "mock"}]


class FailingProvider(MockProvider):
    @property
    def name(self) -> str:
        return "failing"

    async def health_check(self) -> bool:
        return False

    async def generate(
        self,
        task_type: str,
        prompt: str,
        options: GenerationOptions | None = None,
    ) -> str:
        raise RuntimeError("Provider failure")


# ---------------------------------------------------------------------------
# Provider Registry tests
# ---------------------------------------------------------------------------


class TestProviderRegistry:
    def setup_method(self):
        reset_registry()

    def test_register_and_get(self):
        registry = ProviderRegistry()
        provider = MockProvider()
        registry.register(provider)
        assert registry.get("mock") is provider

    def test_get_returns_none_for_unknown(self):
        registry = ProviderRegistry()
        assert registry.get("unknown") is None

    def test_all_returns_copy(self):
        registry = ProviderRegistry()
        registry.register(MockProvider())
        all_providers = registry.all()
        assert "mock" in all_providers
        all_providers["extra"] = "test"
        assert "extra" not in registry.all()

    def test_names(self):
        registry = ProviderRegistry()
        registry.register(MockProvider())
        assert registry.names() == ["mock"]

    def test_get_registry_singleton(self):
        reset_registry()
        r1 = get_registry()
        r2 = get_registry()
        assert r1 is r2

    def test_reset_registry(self):
        r1 = get_registry()
        reset_registry()
        r2 = get_registry()
        assert r1 is not r2


# ---------------------------------------------------------------------------
# API tests
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _patch_registry():
    reset_registry()
    registry = get_registry()
    registry.register(MockProvider())


class TestAIAPI:
    def test_list_providers(self):
        client = TestClient(_test_app)
        with patch.object(settings, "provider", "ollama"):
            response = client.get("/ai/providers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(p["name"] == "mock" for p in data)

    def test_health_returns_ok(self):
        client = TestClient(_test_app)
        with patch.object(AIService, "health_check", new_callable=AsyncMock) as mock_health:
            mock_health.return_value = {"status": "ok", "provider": "mock"}
            response = client.get("/ai/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_generate_returns_text(self):
        client = TestClient(_test_app)
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "Mock response for: Hello"
            response = client.post("/ai/generate", json={"prompt": "Hello"})
        assert response.status_code == 200
        assert response.json()["text"] == "Mock response for: Hello"

    def test_generate_with_task_type(self):
        client = TestClient(_test_app)
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "Mock response for: Write code"
            response = client.post(
                "/ai/generate",
                json={"prompt": "Write code", "task_type": "code"},
            )
        assert response.status_code == 200
        assert "Write code" in response.json()["text"]

    def test_generate_returns_503_on_provider_error(self):
        client = TestClient(_test_app, raise_server_exceptions=False)
        with patch.object(AIService, "generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.side_effect = AIProviderNotAvailable("ollama")
            response = client.post("/ai/generate", json={"prompt": "Hello"})
        assert response.status_code == 503

    def test_generate_requires_prompt(self):
        client = TestClient(_test_app)
        response = client.post("/ai/generate", json={})
        assert response.status_code == 422

    def test_embed_returns_embeddings(self):
        client = TestClient(_test_app)
        with patch.object(AIService, "embed", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = [[0.1, 0.2, 0.3]]
            response = client.post("/ai/embed", json={"texts": ["hello"]})
        assert response.status_code == 200
        data = response.json()
        assert "embeddings" in data
        assert len(data["embeddings"]) == 1

    def test_embed_requires_texts(self):
        client = TestClient(_test_app)
        response = client.post("/ai/embed", json={})
        assert response.status_code == 422

    def test_embed_returns_503_on_error(self):
        client = TestClient(_test_app, raise_server_exceptions=False)
        with patch.object(AIService, "embed", new_callable=AsyncMock) as mock_embed:
            mock_embed.side_effect = AIProviderNotAvailable("ollama")
            response = client.post("/ai/embed", json={"texts": ["hello"]})
        assert response.status_code == 503

    def test_list_models(self):
        client = TestClient(_test_app)
        with patch.object(AIService, "list_models", new_callable=AsyncMock) as mock_list:
            mock_list.return_value = [{"name": "mock-model", "provider": "mock"}]
            response = client.get("/ai/models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) == 1

    def test_health_still_works(self):
        client = TestClient(_test_app)
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# No-regression tests
# ---------------------------------------------------------------------------


@pytest.fixture
def _session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        _test_app.dependency_overrides[get_session] = lambda: session
        yield session
        _test_app.dependency_overrides.clear()


class TestAINoRegression:
    def test_profile_still_works(self, _session):
        client = TestClient(_test_app)
        put_resp = client.put("/profile", json={"summary": "Engineer"})
        assert put_resp.status_code == 200
        get_resp = client.get("/profile")
        assert get_resp.status_code == 200
        assert get_resp.json()["summary"] == "Engineer"

    def test_profile_and_ai_both_work(self, _session):
        client = TestClient(_test_app)
        put_resp = client.put("/profile", json={"summary": "Dev"})
        assert put_resp.status_code == 200
        health_resp = client.get("/health")
        assert health_resp.status_code == 200
        ai_providers = client.get("/ai/providers")
        assert ai_providers.status_code == 200


# ---------------------------------------------------------------------------
# AIService tests
# ---------------------------------------------------------------------------


class TestAIService:
    @pytest.mark.asyncio
    async def test_list_providers(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        providers = service.list_providers()
        assert len(providers) >= 1

    @pytest.mark.asyncio
    async def test_health_check(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with patch.object(settings, "provider", "ollama"):
            result = await service.health_check()
        assert result["status"] in ("ok", "unavailable", "error")

    @pytest.mark.asyncio
    async def test_generate_returns_text(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with (
            patch.object(settings, "provider", "ollama"),
            patch("app.ai.router.AIRouter.generate", return_value="Mock response for: Hello"),
        ):
            result = await service.generate("Hello")
        assert result == "Mock response for: Hello"

    @pytest.mark.asyncio
    async def test_generate_with_task_type(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with (
            patch.object(settings, "provider", "ollama"),
            patch("app.ai.router.AIRouter.generate", return_value="Mock response for: code"),
        ):
            result = await service.generate("Write code", task_type="code")
        assert result == "Mock response for: code"

    @pytest.mark.asyncio
    async def test_generate_timeout_raises_timeout_error(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with (
            patch("app.ai.router.AIRouter.generate", side_effect=asyncio.TimeoutError),
            patch.object(settings, "ai_generate_timeout", 1),
        ):
            with pytest.raises(AITimeoutError):
                await service.generate("Hello")

    @pytest.mark.asyncio
    async def test_generate_retry_then_succeeds(self):
        call_count = 0

        async def fail_then_ok(*_args, **_kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise RuntimeError("Temporary error")
            return "Success"

        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with (
            patch("app.ai.router.AIRouter.generate", side_effect=fail_then_ok),
            patch.object(settings, "ai_max_retries", 2),
        ):
            result = await service.generate("Hello")
        assert result == "Success"
        assert call_count == 2

    @pytest.mark.asyncio
    async def test_generate_retry_exhausted_raises_error(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with (
            patch("app.ai.router.AIRouter.generate", side_effect=RuntimeError("Persistent error")),
            patch.object(settings, "ai_max_retries", 1),
        ):
            with pytest.raises(AIRetryError):
                await service.generate("Hello")

    @pytest.mark.asyncio
    async def test_embed_returns_embeddings(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with patch("app.ai.router.AIRouter.embed", return_value=[[0.1, 0.2, 0.3]]):
            result = await service.embed(["hello"])
        assert result == [[0.1, 0.2, 0.3]]

    @pytest.mark.asyncio
    async def test_embed_timeout_raises_timeout_error(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with (
            patch("app.ai.router.AIRouter.embed", side_effect=asyncio.TimeoutError),
            patch.object(settings, "ai_generate_timeout", 1),
        ):
            with pytest.raises(AITimeoutError):
                await service.embed(["hello"])

    @pytest.mark.asyncio
    async def test_list_models_returns_list(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with patch(
            "app.ai.router.AIRouter.list_models", return_value=[{"name": "m", "provider": "mock"}]
        ):
            result = await service.list_models()
        assert len(result) == 1
        assert result[0]["name"] == "m"

    @pytest.mark.asyncio
    async def test_list_models_returns_empty_on_error(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with patch("app.ai.router.AIRouter.list_models", side_effect=RuntimeError):
            result = await service.list_models()
        assert result == []

    def test_router_property(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        assert isinstance(service.router, AIRouter)

    @pytest.mark.asyncio
    async def test_generate_returns_immediately_on_ai_provider_error(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        service = AIService()
        with patch("app.ai.router.AIRouter.generate", side_effect=AIProviderNotAvailable("mock")):
            with pytest.raises(AIProviderNotAvailable):
                await service.generate("Hello")


# ---------------------------------------------------------------------------
# AIRouter tests
# ---------------------------------------------------------------------------


class TestAIRouter:
    @pytest.mark.asyncio
    async def test_router_uses_registry(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        router = AIRouter()
        with patch.object(settings, "provider", "ollama"):
            result = await router.health_check()
        assert "status" in result

    @pytest.mark.asyncio
    async def test_health_check_returns_status(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        router = AIRouter()
        with patch("app.ai.provider.create_provider", return_value=MockProvider()):
            result = await router.health_check()
        assert result["status"] == "ok"
        assert result["provider"] == "mock"

    @pytest.mark.asyncio
    async def test_list_providers(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        router = AIRouter()
        providers = router.list_providers()
        assert len(providers) >= 1

    def test_router_registry_property(self):
        reset_registry()
        registry = get_registry()
        registry.register(MockProvider())
        router = AIRouter()
        assert router.registry is registry


# ---------------------------------------------------------------------------
# Ollama provider tests (mocked httpx)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ollama_health_check_returns_true_on_200():
    provider = OllamaProvider()
    provider._client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    provider._client.get = AsyncMock(return_value=mock_resp)

    result = await provider.health_check()
    assert result is True
    provider._client.get.assert_called_once_with("/api/tags")


@pytest.mark.asyncio
async def test_ollama_health_check_returns_false_on_error():
    provider = OllamaProvider()
    provider._client = AsyncMock(spec=httpx.AsyncClient)
    provider._client.get = AsyncMock(side_effect=httpx.ConnectError("No connection"))

    result = await provider.health_check()
    assert result is False


@pytest.mark.asyncio
async def test_ollama_generate_returns_response_text():
    provider = OllamaProvider()
    provider._client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.json = MagicMock(return_value={"response": "Hello from Ollama!"})
    provider._client.post = AsyncMock(return_value=mock_resp)

    result = await provider.generate("general", "Hi")
    assert result == "Hello from Ollama!"
    provider._client.post.assert_called_once()


@pytest.mark.asyncio
async def test_ollama_generate_sends_correct_payload():
    provider = OllamaProvider()
    provider._client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.json = MagicMock(return_value={"response": "ok"})
    provider._client.post = AsyncMock(return_value=mock_resp)

    await provider.generate("general", "Test", GenerationOptions(temperature=0.3))
    call_kwargs = provider._client.post.call_args[1]
    payload = call_kwargs["json"]
    assert payload["model"] == settings.ollama_reasoning_model
    assert payload["prompt"] == "Test"
    assert payload["stream"] is False
    assert payload["options"]["temperature"] == 0.3


@pytest.mark.asyncio
async def test_ollama_generate_uses_coding_model():
    provider = OllamaProvider()
    provider._client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.json = MagicMock(return_value={"response": "ok"})
    provider._client.post = AsyncMock(return_value=mock_resp)

    await provider.generate("coding", "Write code")
    call_kwargs = provider._client.post.call_args[1]
    payload = call_kwargs["json"]
    assert payload["model"] == settings.ollama_coding_model


@pytest.mark.asyncio
async def test_ollama_generate_raises_on_http_error():
    provider = OllamaProvider()
    provider._client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        "400 Bad Request", request=MagicMock(), response=MagicMock()
    )
    provider._client.post = AsyncMock(return_value=mock_resp)

    with pytest.raises(httpx.HTTPStatusError):
        await provider.generate("general", "Hi")


@pytest.mark.asyncio
async def test_ollama_embed_returns_vectors():
    provider = OllamaProvider()
    provider._client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.json = MagicMock(return_value={"embedding": [0.1, 0.2, 0.3]})
    provider._client.post = AsyncMock(return_value=mock_resp)

    result = await provider.embed(["hello", "world"])
    assert len(result) == 2
    assert result[0] == [0.1, 0.2, 0.3]


@pytest.mark.asyncio
async def test_ollama_list_models_returns_parsed_tags():
    provider = OllamaProvider()
    provider._client = AsyncMock(spec=httpx.AsyncClient)
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.json = MagicMock(
        return_value={
            "models": [
                {"name": "llama3.2:latest", "size": 123},
                {"name": "nomic-embed-text:latest", "size": 456},
            ]
        }
    )
    provider._client.get = AsyncMock(return_value=mock_resp)

    result = await provider.list_models()
    assert len(result) == 2
    assert result[0]["name"] == "llama3.2:latest"
    assert result[0]["provider"] == "ollama"


@pytest.mark.asyncio
async def test_ollama_list_models_returns_empty_on_error():
    provider = OllamaProvider()
    provider._client = AsyncMock(spec=httpx.AsyncClient)
    provider._client.get = AsyncMock(side_effect=httpx.ConnectError("No connection"))

    result = await provider.list_models()
    assert result == []


@pytest.mark.asyncio
async def test_ollama_rerank_raises_not_implemented():
    provider = OllamaProvider()
    with pytest.raises(NotImplementedError):
        await provider.rerank("query", ["doc1"])


@pytest.mark.asyncio
async def test_ollama_transcribe_raises_not_implemented():
    provider = OllamaProvider()
    with pytest.raises(NotImplementedError):
        await provider.transcribe(b"audio data")


def test_ollama_name():
    provider = OllamaProvider()
    assert provider.name == "ollama"


# ---------------------------------------------------------------------------
# create_provider tests
# ---------------------------------------------------------------------------


class TestCreateProvider:
    def test_creates_ollama_by_default(self):
        with patch.object(settings, "provider", "ollama"):
            provider = create_provider()
            assert isinstance(provider, OllamaProvider)

    def test_raises_on_openrouter_without_key(self):
        with (
            patch.object(settings, "provider", "openrouter"),
            patch.object(settings, "openrouter_api_key", ""),
        ):
            with pytest.raises(ValueError, match="API key is not configured"):
                create_provider()


# ---------------------------------------------------------------------------
# Exceptions tests
# ---------------------------------------------------------------------------


class TestExceptions:
    def test_ai_timeout_error(self):
        err = AITimeoutError("generate", 120)
        assert "generate" in str(err)
        assert "120" in str(err)
        assert err.operation == "generate"
        assert err.timeout == 120

    def test_ai_retry_error(self):
        err = AIRetryError("generate", 2)
        assert "generate" in str(err)
        assert "2" in str(err)
        assert err.operation == "generate"
        assert err.retries == 2

    def test_ai_provider_not_available(self):
        err = AIProviderNotAvailable("ollama")
        assert "ollama" in str(err)
        assert err.provider == "ollama"


# ---------------------------------------------------------------------------
# Schemas tests
# ---------------------------------------------------------------------------


class TestSchemas:
    def test_generate_request(self):
        req = GenerateRequest(prompt="Hello")
        assert req.prompt == "Hello"
        assert req.task_type == "general"

    def test_generate_request_with_task_type(self):
        req = GenerateRequest(prompt="Write code", task_type="coding")
        assert req.task_type == "coding"

    def test_generate_response(self):
        resp = GenerateResponse(text="Hello")
        assert resp.text == "Hello"

    def test_embed_request(self):
        req = EmbedRequest(texts=["hello", "world"])
        assert len(req.texts) == 2

    def test_embed_response(self):
        resp = EmbedResponse(embeddings=[[0.1, 0.2]])
        assert len(resp.embeddings) == 1
