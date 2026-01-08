from pathlib import Path

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

    # Scoring Configuration
    SHORTLIST_THRESHOLD: float = 70.0

    # Report Files
    REPORT_JSON: str = "shortlist_report.json"
    REPORT_SUMMARY: str = "shortlist_summary.txt"
    JOB_DESCRIPTION_FILE: str = "job_description.txt"

    GMAIL_APP_PASSWORD: str

    class Config:
        env_file = ".env"
        case_sensitive = True

    # Shortlist agent directories - relative to the shortlist module
    @property
    def BASE_DIR(self) -> Path:
        """Points to app/services/agents/shortlist/"""
        # Get the backend directory (parent of app/)
        backend_dir = Path(__file__).parent.parent.parent
        return backend_dir / "app" / "services" / "agents" / "shortlist"

    @property
    def RESUMES_DIR(self) -> Path:
        """app/services/agents/shortlist/resumes/"""
        path = self.BASE_DIR / "resumes"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def JD_DIR(self) -> Path:
        """app/services/agents/shortlist/job_descriptions/"""
        path = self.BASE_DIR / "job_descriptions"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def OUTPUT_DIR(self) -> Path:
        """app/services/agents/shortlist/output/"""
        path = self.BASE_DIR / "output"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def SCORE_WEIGHTS(self) -> dict[str, float]:
        return {
            "skills": 0.20,
            "experience_years": 0.20,
            "work_alignment": 0.30,
            "projects": 0.20,
            "qualification": 0.10,
        }

    @property
    def DEGREE_WEIGHTS(self) -> dict[str, int]:
        return {
            "Computer Engineering": 10,
            "CSIT": 9,
            "BIT": 8,
            "STEM": 6,
            "Management": 3,
            "Others": 1,
        }

    @property
    def DEGREE_CATEGORIES(self) -> list[str]:
        return [
            "Computer Engineering",
            "CSIT",
            "BIT",
            "STEM",
            "Management",
            "Others",
        ]

    @property
    def SUPPORTED_RESUME_FORMATS(self) -> list[str]:
        return [".pdf", ".docx"]


settings = Settings()
