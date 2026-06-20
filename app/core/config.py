from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # PostgreSQL Connection URL
    DATABASE_URL: str = Field(..., validation_alias="DATABASE_URL")
    
    # Allow settings to load values from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
