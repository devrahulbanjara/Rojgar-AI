from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SECURE: bool = False
    
    FRONTEND_URL: str
    BACKEND_URL: str
    
    ENVIRONMENT: str = "development"
    
    DATABASE_URL: str
    
    QDRANT_URL: str
    QDRANT_API_KEY: str
    QDRANT_COLLECTION_JOBS: str
    EMBEDDING_MODEL: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
