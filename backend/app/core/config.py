from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_name: str = "ConvexHire API"
    debug: bool = False
    environment: Literal["dev", "prod", "test"] = "dev"
    allowed_origins: list[str] = ["http://localhost:3000"]
    app_version: str = "1.0.0"

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    mail_from: str

    # Auth
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    frontend_url: str = "http://localhost:3000"

    # Email
    send_emails: bool = True

    embedding_output_dimensionality: int = 3072
    embedding_model: str = "models/gemini-embedding-001"
    qdrant_url: str
    qdrant_api_key: str
    qdrant_collection_name: str
    google_api_key: str
    groq_api_key: str
    tavily_api_key: str
    groq_model_job_drafting: str = "openai/gpt-oss-120b"

    # Database
    db_user: str
    db_password: str
    db_host: str
    db_port: int = 5432
    db_name: str

    test_db_user: str
    test_db_password: str
    test_db_host: str
    test_db_port: int = 5432
    test_db_name: str

    # AWS S3
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_region: str = "us-east-1"
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

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def test_database_url(self) -> str:
        return f"postgresql+asyncpg://{self.test_db_user}:{self.test_db_password}@{self.test_db_host}:{self.test_db_port}/{self.test_db_name}"

    @property
    def s3_base_url(self) -> str:
        if not self.s3_bucket_name:
            return ""
        return f"https://{self.s3_bucket_name}.s3.{self.aws_region}.amazonaws.com"

    @property
    def langgraph_postgres_dsn(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )


settings = Settings()
