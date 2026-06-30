from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "CareerOS"
    version: str = "0.1.0"
    mode: str = "local"
    debug: bool = False
    database_url: str = "sqlite:///./careeros.db"


settings = Settings()
