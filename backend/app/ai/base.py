from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class GenerationOptions:
    temperature: float = 0.7
    max_tokens: int = 2048
    top_p: float = 0.9
    stop: list[str] | None = None


@dataclass
class EmbeddingOptions:
    model: str | None = None


@dataclass
class VisionOptions:
    max_tokens: int = 1024


@dataclass
class RerankOptions:
    top_k: int = 5


class ModelProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    async def generate(
        self,
        task_type: str,
        prompt: str,
        options: GenerationOptions | None = None,
    ) -> str: ...

    @abstractmethod
    async def embed(
        self,
        texts: list[str],
        options: EmbeddingOptions | None = None,
    ) -> list[list[float]]: ...

    @abstractmethod
    async def rerank(
        self,
        query: str,
        documents: list[str],
        options: RerankOptions | None = None,
    ) -> list[tuple[int, float]]: ...

    @abstractmethod
    async def vision(
        self,
        image: bytes,
        prompt: str,
        options: VisionOptions | None = None,
    ) -> str: ...

    @abstractmethod
    async def transcribe(
        self,
        audio: bytes,
        options: Any | None = None,
    ) -> str: ...

    @abstractmethod
    async def health_check(self) -> bool: ...

    @abstractmethod
    async def list_models(self) -> list[dict[str, Any]]: ...
