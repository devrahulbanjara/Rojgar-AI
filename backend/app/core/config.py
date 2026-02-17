from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    TIMEZONE: str = "Asia/Kathmandu"
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    SECRET_KEY: SecretStr
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    SECURE: bool = False

    FRONTEND_URL: str
    BACKEND_URL: str
    ENVIRONMENT: str
    APP_VERSION: str
    DATABASE_URL: str

    QDRANT_URL: str
    QDRANT_COLLECTION_NAME: str = "ConvexHireJobs"
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    EMBEDDING_DIM: int = 3072
    FAST_LLM: str = "llama-3.1-8b-instant"
    THINK_LLM: str = "llama-3.3-70b-versatile"
    LLM_TEMPERATURE: int = 0
    LLM_MAX_RETRIES: int = 3

    GROQ_API_KEY: str
    GMAIL_USER: str = "convexhire@gmail.com"
    GMAIL_APP_PASSWORD: str
    GOOGLE_API_KEY: str
    TAVILY_API_KEY: str
    BOOKING_LINK: str = "https://cal.com/convexhire/interview"

    RATE_LIMIT_AUTH: str = "50/minute"
    RATE_LIMIT_API: str = "100/minute"
    RATE_LIMIT_WEBSOCKET: str = "30/minute"
    RATE_LIMIT_SHORTLIST_TRIGGER: str = "10/minute"
    RATE_LIMIT_SHORTLIST_SUMMARY: str = "100/minute"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()  # type: ignore
