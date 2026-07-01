from pydantic import BaseModel


class GenerateRequest(BaseModel):
    prompt: str
    task_type: str = "general"
    temperature: float | None = None
    max_tokens: int | None = None


class GenerateResponse(BaseModel):
    text: str


class EmbedRequest(BaseModel):
    texts: list[str]
    model: str | None = None


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]


class ProviderInfo(BaseModel):
    name: str
    models: list[str]


class ModelInfo(BaseModel):
    name: str
    provider: str
    task_types: list[str]
