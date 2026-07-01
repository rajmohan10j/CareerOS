from typing import Any

import httpx

from app.ai.base import (
    EmbeddingOptions,
    GenerationOptions,
    ModelProvider,
    RerankOptions,
    VisionOptions,
)
from app.config import settings


class OllamaProvider(ModelProvider):
    def __init__(self) -> None:
        self.base_url = settings.ollama_base_url
        self._client: httpx.AsyncClient | None = None

    @property
    def name(self) -> str:
        return "ollama"

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=60.0,
            )
        return self._client

    def _model_for_task(self, task_type: str) -> str:
        mapping = {
            "reasoning": settings.ollama_reasoning_model,
            "coding": settings.ollama_coding_model,
            "code": settings.ollama_coding_model,
            "embed": settings.ollama_embedding_model,
            "embedding": settings.ollama_embedding_model,
        }
        return mapping.get(task_type, settings.ollama_reasoning_model)

    async def generate(
        self,
        task_type: str,
        prompt: str,
        options: GenerationOptions | None = None,
    ) -> str:
        opts = options or GenerationOptions()
        model = self._model_for_task(task_type)
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": opts.temperature,
                "num_predict": opts.max_tokens,
                "top_p": opts.top_p,
            },
        }
        if opts.stop:
            payload["options"]["stop"] = opts.stop

        response = await self.client.post("/api/generate", json=payload)
        response.raise_for_status()
        data = response.json()
        return data["response"]

    async def embed(
        self,
        texts: list[str],
        options: EmbeddingOptions | None = None,
    ) -> list[list[float]]:
        model = (options or EmbeddingOptions()).model or settings.ollama_embedding_model
        results: list[list[float]] = []
        for text in texts:
            payload = {"model": model, "prompt": text}
            resp = await self.client.post("/api/embeddings", json=payload)
            resp.raise_for_status()
            data = resp.json()
            results.append(data["embedding"])
        return results

    async def rerank(
        self,
        query: str,
        documents: list[str],
        options: RerankOptions | None = None,
    ) -> list[tuple[int, float]]:
        msg = "Reranking is not supported by Ollama provider."
        raise NotImplementedError(msg)

    async def vision(
        self,
        image: bytes,
        prompt: str,
        options: VisionOptions | None = None,
    ) -> str:
        opts = options or VisionOptions()
        import base64

        b64 = base64.b64encode(image).decode("utf-8")
        payload = {
            "model": "llava",
            "prompt": prompt,
            "stream": False,
            "images": [b64],
            "options": {"num_predict": opts.max_tokens},
        }
        response = await self.client.post("/api/generate", json=payload)
        response.raise_for_status()
        data = response.json()
        return data["response"]

    async def transcribe(
        self,
        audio: bytes,
        options: Any | None = None,
    ) -> str:
        msg = "Transcription is not supported by Ollama provider."
        raise NotImplementedError(msg)

    async def health_check(self) -> bool:
        try:
            response = await self.client.get("/api/tags")
            return response.status_code == 200
        except Exception:
            return False

    async def list_models(self) -> list[dict[str, Any]]:
        try:
            response = await self.client.get("/api/tags")
            response.raise_for_status()
            data = response.json()
            return [{"name": m["name"], "provider": self.name} for m in data.get("models", [])]
        except Exception:
            return []

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None
