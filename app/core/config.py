from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Application Environment
    APP_ENV: str = Field("development", validation_alias="APP_ENV")

    # PostgreSQL Connection URL
    DATABASE_URL: str = Field(..., validation_alias="DATABASE_URL")
    
    # Security Configuration
    JWT_SECRET: str = Field("super-secret-jwt-key-for-local-dev-please-change-in-prod", validation_alias="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Allow settings to load values from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
