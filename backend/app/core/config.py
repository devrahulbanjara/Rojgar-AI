from typing import Literal

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

# Groq model ids used as defaults below.
_GROQ_LARGE = "openai/gpt-oss-120b"
_GROQ_SMALL = "openai/gpt-oss-20b"


class Settings(BaseSettings):
    # Settings are what differs per deployment, or is secret. Fixed product
    # values are constants (core/constants.py or next to the module using them).

    # App
    debug: bool = False
    # Defaults to prod so a missing ENVIRONMENT never exposes /docs or drops the
    # Secure flag on auth cookies. Local setups set environment=dev (.env.example).
    environment: Literal["dev", "prod", "test"] = "prod"
    allowed_origins: list[str] = ["http://localhost:3000"]
    frontend_url: str = "http://localhost:3000"
    # Public base URL of this API (used in emailed sign-in links).
    backend_url: str = "http://localhost:8000"
    # Number of reverse proxies in front of the API that append to
    # X-Forwarded-For (e.g. 1 on Render). 0 = trust only the socket peer.
    trusted_proxy_hops: int = 0
    # Per-client limits on auth and public endpoints (core/rate_limit.py).
    rate_limit_enabled: bool = True

    # Auth
    secret_key: str

    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    mail_from: str
    send_emails: bool = True

    # SMS costs money, so it is off by default: nothing is sent, phone codes
    # are refused and applicants hear back by email. With SMS_ENABLED=true real
    # texts go out only in prod with SMS_PROVIDER=sparrow and a token; dev and
    # test log them instead (see infrastructures/sms `sms_available`).
    sms_enabled: bool = False
    sms_provider: Literal["console", "sparrow"] = "console"
    sparrow_sms_token: str | None = None
    sparrow_sms_from: str = "RojgarAI"

    # Database
    db_user: str
    db_password: str
    db_host: str
    db_port: int = 5432
    db_name: str
    # Connections per API worker: pool_size kept open, up to max_overflow more
    # under load. Keep workers * (size + overflow) below Postgres max_connections.
    db_pool_size: int = 10
    db_max_overflow: int = 10
    db_pool_timeout_seconds: int = 10

    # Test Database
    test_db_user: str
    test_db_password: str
    test_db_host: str
    test_db_port: int = 5432
    test_db_name: str

    # Redis
    redis_url: str | None = None
    redis_enabled: bool = True

    # Redis (local test, docker-compose redis-test)
    test_redis_url: str = "redis://localhost:6380/0"

    # Local embedding + BM25 models (fastembed, CPU). Downloaded once from
    # Hugging Face into this folder; keep it on a persistent disk.
    model_cache_dir: str = "~/.cache/fastembed"
    # CPU threads per embedding run (one run at a time per process).
    embedding_threads: int = 2

    # Qdrant
    qdrant_url: str
    qdrant_api_key: str
    qdrant_candidate_collection_name: str = "candidate_applications"

    # Qdrant (local test, docker-compose qdrant-test)
    test_qdrant_url: str = "http://localhost:6335"
    test_qdrant_api_key: str | None = None

    # LLM APIs
    groq_api_key: str
    tavily_api_key: str
    llama_cloud_api_key: str | None = None
    llama_cloud_base_url: str | None = None

    # Chat models (app/infrastructures/ai/llm.py). Groq answers first; when
    # GEMINI_API_KEY is set, Gemini answers whenever Groq fails or is rate
    # limited, so the two free tiers add up.
    groq_model: str = _GROQ_LARGE
    groq_small_model: str = _GROQ_SMALL
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"

    # File storage
    # "local" keeps uploads on disk; "cloudinary" uses CLOUDINARY_URL. Empty =
    # local everywhere except prod, so a laptop never writes to the real cloud.
    # Tests always use local.
    storage_backend: Literal["", "local", "cloudinary"] = ""
    local_storage_dir: str = ".local-storage"
    image_max_upload_bytes: int = 5 * 1024 * 1024
    image_allowed_extensions: tuple[str, ...] = ("jpg", "jpeg", "png", "webp", "gif")

    # AI review (one per application, rolling). Provider: groq | fake.
    review_provider: str = "groq"

    # Public apply (no account)
    turnstile_secret: str | None = None

    # Guardrails
    guardrails_enabled: bool = True

    # Derived URLs
    @property
    def effective_storage_backend(self) -> str:
        if self.environment == "test":
            return "local"
        if self.storage_backend:
            return self.storage_backend
        return "cloudinary" if self.environment == "prod" else "local"

    @property
    def database_url(self) -> str:
        """Async SQLAlchemy URL for the primary database."""
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def test_database_url(self) -> str:
        """Async SQLAlchemy URL for the test database."""
        return f"postgresql+asyncpg://{self.test_db_user}:{self.test_db_password}@{self.test_db_host}:{self.test_db_port}/{self.test_db_name}"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
