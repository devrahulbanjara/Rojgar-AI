from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    TIMEZONE: str

    # Authentication
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    SECURE: bool

    # URLs
    FRONTEND_URL: str
    BACKEND_URL: str

    # Environment
    ENVIRONMENT: str
    APP_VERSION: str

    # Database
    DATABASE_URL: str

    # Vector Database
    QDRANT_URL: str
    QDRANT_API_KEY: str
    QDRANT_COLLECTION_NAME: str
    EMBEDDING_MODEL: str
    EMBEDDING_DIM: int = 384

    # LLM Settings
    FAST_LLM: str = "llama-3.1-8b-instant"
    THINK_LLM: str = "openai/gpt-oss-120b"
    LLM_TEMPERATURE: int = 0
    LLM_MAX_RETRIES: int = 3
    GROQ_API_KEY: str

    LANGCHAIN_TRACING_V2: bool
    LANGCHAIN_ENDPOINT: str
    LANGCHAIN_API_KEY: str
    LANGCHAIN_PROJECT: str

    # Report Files
    REPORT_JSON: str = "shortlist_report.json"
    REPORT_SUMMARY: str = "shortlist_summary.txt"

    GMAIL_APP_PASSWORD: str

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()  # type: ignore[call-arg]
