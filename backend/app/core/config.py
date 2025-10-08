"""
Application configuration settings with validation and type hints
"""

from typing import List, Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with validation and type hints"""

    # Application
    APP_NAME: str = "ConvexHire"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(
        default="development",
        description="Environment: development, staging, production",
    )
    DEBUG: bool = Field(default=True, description="Debug mode")

    # Google OAuth
    GOOGLE_CLIENT_ID: str = Field(..., description="Google OAuth Client ID")
    GOOGLE_CLIENT_SECRET: str = Field(..., description="Google OAuth Client Secret")

    # JWT Configuration
    SECRET_KEY: str = Field(..., min_length=32, description="JWT Secret Key")
    ALGORITHM: str = Field(default="HS256", description="JWT Algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, ge=1, le=1440, description="Access token expiration in minutes"
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=30, ge=1, le=365, description="Refresh token expiration in days"
    )

    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins",
    )

    # URLs
    FRONTEND_URL: str = Field(
        default="http://localhost:3000", description="Frontend URL"
    )
    BACKEND_URL: str = Field(default="http://localhost:8000", description="Backend URL")

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./convexhire.db", description="Database URL"
    )

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(default="json", description="Log format: json or text")

    # Security
    PASSWORD_MIN_LENGTH: int = Field(
        default=8, ge=6, le=128, description="Minimum password length"
    )
    MAX_LOGIN_ATTEMPTS: int = Field(
        default=5, ge=3, le=10, description="Maximum login attempts"
    )
    LOCKOUT_DURATION_MINUTES: int = Field(
        default=15, ge=5, le=60, description="Account lockout duration"
    )

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(
        default=100, ge=10, le=1000, description="Rate limit requests per minute"
    )
    RATE_LIMIT_WINDOW: int = Field(
        default=60, ge=1, le=3600, description="Rate limit window in seconds"
    )

    @validator("ENVIRONMENT")
    def validate_environment(cls, v: str) -> str:
        """Validate environment setting"""
        allowed_envs = ["development", "staging", "production"]
        if v not in allowed_envs:
            raise ValueError(f"Environment must be one of: {', '.join(allowed_envs)}")
        return v

    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.ENVIRONMENT == "production"

    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as list"""
        return self.CORS_ORIGINS

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()
