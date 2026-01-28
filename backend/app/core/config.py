from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    TIMEZONE: str
    LLAMA_CLOUD_API_KEY: str

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
    QDRANT_COLLECTION_NAME: str
    EMBEDDING_MODEL: str
    EMBEDDING_DIM: int = 3072

    # LLM Settings
    FAST_LLM: str = "llama-3.1-8b-instant"
    THINK_LLM: str = "openai/gpt-oss-120b"
    LLM_TEMPERATURE: int = 0
    LLM_MAX_RETRIES: int = 3
    GROQ_API_KEY: str

    GMAIL_APP_PASSWORD: str

    GOOGLE_API_KEY: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()  # type: ignore
