from typing import Literal

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    # App
    app_name: str = "Rojgar AI API"
    # Name shown to candidates in emails; rename the product with one env var.
    product_name: str = "Rojgar AI"
    app_version: str = "1.0.0"
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
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

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

    # SMS (infrastructures/sms). Off unless environment=prod, provider=sparrow
    # and a token are all set (see `sms_enabled`); while off nothing is sent,
    # phone codes are refused and applicants hear back by email.
    sms_provider: Literal["console", "sparrow"] = "console"
    sparrow_sms_token: str | None = None
    sparrow_sms_from: str = "RojgarAI"
    # Candidate SMS language: "ne" (Nepali, English when Nepali runs long) or "en".
    sms_language: Literal["ne", "en"] = "ne"

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
    qdrant_collection_name: str
    qdrant_candidate_collection_name: str = "candidate_applications"

    # Qdrant (local test, docker-compose qdrant-test)
    test_qdrant_url: str = "http://localhost:6335"
    test_qdrant_api_key: str | None = None
    test_qdrant_collection_name: str = "eval_jobs_test"

    # LLM APIs
    groq_api_key: str
    tavily_api_key: str
    llama_cloud_api_key: str | None = None
    llama_cloud_base_url: str | None = None

    groq_model_structured: str = "openai/gpt-oss-120b"
    groq_model_chat: str = "openai/gpt-oss-120b"

    llama_extract_mode: str = "PREMIUM"
    llama_extract_parse_model: str = "gemini-2.5-pro"
    llama_extract_model: str = "openai-gpt-5-mini"

    # AWS
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_region: str = "us-east-1"

    # S3
    # "local" keeps uploads on disk (dev/test); "s3" uses the bucket. Empty = local
    # everywhere except prod, so a laptop can never write to the real bucket.
    storage_backend: Literal["", "local", "s3"] = ""
    local_storage_dir: str = ".local-storage"
    s3_bucket_name: str | None = None
    s3_upload_acl: str | None = "public-read"
    s3_max_upload_bytes: int = 5 * 1024 * 1024
    s3_allowed_image_extensions: tuple[str, ...] = (
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
    )

    # AI review (one per application, rolling). Provider: groq | bedrock | fake.
    review_provider: str = "groq"
    # Full evidence review and the cheap first pass (Groq model ids).
    review_model: str = "openai/gpt-oss-120b"
    review_cheap_model: str = "openai/gpt-oss-20b"
    # Bedrock alternative (credentials below).
    aws_access_key_id_shortlisting: str | None = None
    aws_secret_access_key_shortlisting: str | None = None
    review_bedrock_model_id: str = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
    # Attempts per review; waits 5, 10, 20 s between them (rate limits).
    review_max_attempts: int = 4
    review_retry_delay_seconds: float = 5.0
    # Cheap pass must-have coverage (0-1) at or above which the full review runs.
    review_full_review_min_coverage: float = 0.25
    # Concurrent reviews per process (startup backlog, bursts of applications).
    review_concurrency: int = 4
    usd_to_npr: float = 137.0

    # Resume import
    resume_import_max_upload_bytes: int = 10 * 1024 * 1024

    # Public apply (no account)
    turnstile_secret: str | None = None
    public_status_token_days: int = 180
    magic_link_ttl_minutes: int = 15
    guest_applications_per_email_per_hour: int = 10
    recommendations_per_job_per_hour: int = 30
    magic_links_per_email_per_15_min: int = 3
    resume_import_allowed_extensions: tuple[str, ...] = ("pdf",)

    # Guardrails
    guardrails_enabled: bool = True
    guardrails_groq_model: str = "openai/gpt-oss-120b"

    # Assistant: job draft + "ask about this candidate"
    assistant_model: str = "openai/gpt-oss-120b"
    assistant_temperature: float = 0.2
    assistant_max_tokens: int = 3000
    # Hard deadline for one turn, retries included.
    assistant_turn_timeout_seconds: float = 30.0
    # Longest wait for the input guardrail before falling back to a marker scan.
    assistant_guard_timeout_seconds: float = 6.0
    # Turns (question + answer) kept per thread and sent to the model.
    assistant_history_turns: int = 8

    # Public jobs hybrid search
    jobs_hybrid_search_enabled: bool = True
    jobs_hybrid_prefetch_limit: int = 50

    @property
    def sms_enabled(self) -> bool:
        """Real SMS only in prod with Sparrow and a token; costs money."""
        return (
            self.environment == "prod"
            and self.sms_provider == "sparrow"
            and bool(self.sparrow_sms_token)
        )

    # Derived URLs
    @property
    def effective_storage_backend(self) -> str:
        if self.storage_backend:
            return self.storage_backend
        return "s3" if self.environment == "prod" else "local"

    @property
    def database_url(self) -> str:
        """Async SQLAlchemy URL for the primary database."""
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def test_database_url(self) -> str:
        """Async SQLAlchemy URL for the test database."""
        return f"postgresql+asyncpg://{self.test_db_user}:{self.test_db_password}@{self.test_db_host}:{self.test_db_port}/{self.test_db_name}"

    @property
    def s3_base_url(self) -> str:
        """Public base URL for the configured S3 bucket."""
        if not self.s3_bucket_name:
            return ""
        return f"https://{self.s3_bucket_name}.s3.{self.aws_region}.amazonaws.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
