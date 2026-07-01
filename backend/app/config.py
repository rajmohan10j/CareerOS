from typing import Literal

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "CareerOS"
    version: str = "0.1.0"
    mode: str = "local"
    debug: bool = False
    database_url: str = "sqlite:///./careeros.db"

    # Provider selection
    provider: Literal["ollama", "openrouter"] = "ollama"

    # Ollama configuration
    ollama_base_url: str = "http://localhost:11434"
    ollama_reasoning_model: str = "llama3.2"
    ollama_coding_model: str = "qwen2.5-coder:3b"
    ollama_embedding_model: str = "nomic-embed-text"

    # OpenRouter configuration
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_default_model: str = "qwen/qwen2.5-coder-32b-instruct"

    # AI service settings
    ai_generate_timeout: int = 120
    ai_health_timeout: int = 10
    ai_max_retries: int = 2


settings = Settings()
