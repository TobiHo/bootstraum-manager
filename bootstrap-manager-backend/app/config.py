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

    # Paddle (Billing) Configuration
    paddle_environment: str = "sandbox"  # sandbox | production
    paddle_api_key: str = ""
    paddle_webhook_secret: str = ""
    paddle_product_id: str = ""  # generic catalog product used for custom-price line items
    paddle_success_url: str = "http://localhost:8080/checkout/erfolg"
    paddle_cancel_url: str = "http://localhost:8080/checkout/abbruch"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


# Global settings instance
settings = Settings()
