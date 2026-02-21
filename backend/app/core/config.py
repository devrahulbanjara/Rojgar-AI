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

    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    ENVIRONMENT: str
    APP_VERSION: str
    DATABASE_URL: str

    QDRANT_URL: str
    QDRANT_COLLECTION_NAME: str = "ConvexHireJobs"
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    EMBEDDING_DIM: int = 3072
    SKILL_EXTRACTION_MODEL: str = "amjad-awad/skill-extractor"
    FAST_LLM: str = "llama-3.1-8b-instant"
    THINK_LLM: str = "openai/gpt-oss-120b"
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"
    AWS_REGION: str = "us-east-1"
    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_RETRIES: int = 3

    GROQ_API_KEY: str
    GMAIL_USER: str
    GMAIL_APP_PASSWORD: str
    GOOGLE_API_KEY: str
    TAVILY_API_KEY: str
    BOOKING_LINK: str = "https://cal.com/convexhire/interview"
    LOGO_URL: str = "https://heraldcollege.edu.np/images/homepage/about-herald.svg"

    RATE_LIMIT_AUTH: str = "50/minute"
    RATE_LIMIT_API: str = "100/minute"
    RATE_LIMIT_WEBSOCKET: str = "30/minute"
    RATE_LIMIT_SHORTLIST_TRIGGER: str = "10/minute"
    RATE_LIMIT_SHORTLIST_SUMMARY: str = "100/minute"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()  # type: ignore
