"""Application configuration using Pydantic Settings"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Database Configuration
    database_url: str = "sqlite:///./boattour.db"

    # JWT Configuration
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # Application Settings
    debug: bool = True
    app_name: str = "Boat Tour Management System"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# Global settings instance
settings = Settings()
