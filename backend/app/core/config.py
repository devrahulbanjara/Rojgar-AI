"""
Configuration - Simple settings loaded from environment variables
All app configuration in one place
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings
    These are loaded from environment variables or .env file
    """
    
    # ===== Google OAuth =====
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    
    # ===== JWT Settings =====
    SECRET_KEY: str  # Used to sign JWT tokens
    ALGORITHM: str = "HS256"  # JWT algorithm
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # How long tokens last
    
    # ===== URLs =====
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    # ===== Environment =====
    ENVIRONMENT: str = "development"  # development, staging, or production
    
    # ===== Database =====
    DATABASE_URL: str = "sqlite:///./convexhire.db"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create a single instance to use everywhere
settings = Settings()
