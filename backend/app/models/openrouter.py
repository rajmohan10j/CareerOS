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


class OpenRouterProvider(ModelProvider):
    def __init__(self) -> None:
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        self.default_model = settings.openrouter_default_model
        self._client: httpx.AsyncClient | None = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=60.0,
            )
        return self._client

    async def generate(
        self,
        task_type: str,
        prompt: str,
        options: GenerationOptions | None = None,
    ) -> str:
        opts = options or GenerationOptions()
        payload = {
            "model": self.default_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": opts.temperature,
            "max_tokens": opts.max_tokens,
            "top_p": opts.top_p,
        }
        if opts.stop:
            payload["stop"] = opts.stop

        response = await self.client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def embed(
        self,
        texts: list[str],
        options: EmbeddingOptions | None = None,
    ) -> list[list[float]]:
        model = (options or EmbeddingOptions()).model or "text-embedding-ada-002"
        payload = {"model": model, "input": texts}
        response = await self.client.post("/embeddings", json=payload)
        response.raise_for_status()
        data = response.json()
        return [item["embedding"] for item in data["data"]]

    async def rerank(
        self,
        query: str,
        documents: list[str],
        options: RerankOptions | None = None,
    ) -> list[tuple[int, float]]:
        opts = options or RerankOptions()
        payload = {
            "model": "microsoft/deberta-v3-base",
            "query": query,
            "documents": documents,
            "top_k": opts.top_k,
        }
        response = await self.client.post("/rerank", json=payload)
        response.raise_for_status()
        data = response.json()
        return [(r["index"], r["relevance_score"]) for r in data["results"]]

    async def vision(
        self,
        image: bytes,
        prompt: str,
        options: VisionOptions | None = None,
    ) -> str:
        import base64

        opts = options or VisionOptions()
        b64 = base64.b64encode(image).decode("utf-8")
        payload = {
            "model": "qwen/qwen-vl-plus",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{b64}"},
                        },
                    ],
                }
            ],
            "max_tokens": opts.max_tokens,
        }
        response = await self.client.post("/chat/completions", json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def transcribe(
        self,
        audio: bytes,
        options: VisionOptions | None = None,
    ) -> str:
        msg = "Transcription is not supported by OpenRouter provider."
        raise NotImplementedError(msg)

    async def health_check(self) -> bool:
        try:
            response = await self.client.get("/models")
            return response.status_code == 200
        except Exception:
            return False

    @property
    def name(self) -> str:
        return "openrouter"

    async def list_models(self) -> list[dict[str, Any]]:
        try:
            response = await self.client.get("/models")
            response.raise_for_status()
            data = response.json()
            return [
                {"name": m["id"], "provider": self.name}
                for m in data.get("data", [])
            ]
        except Exception:
            return []

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None
