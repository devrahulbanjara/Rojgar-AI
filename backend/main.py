from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import init_db, engine
from app.api.v1 import api_router
from app.core.logging_config import logger
from app.services.candidate.vector_job_service import JobVectorService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager - runs when app starts and shuts down
    """
    logger.info("Starting ConvexHire API...")
    
    # 1. Initialize DB Tables
    logger.info("Initializing database schema...")
    init_db()
    
    # 2. Index Pending Jobs
    try:
        with Session(engine) as db:
            vector_service = JobVectorService()
            vector_service.index_all_pending_jobs(db)
    except Exception as e:
        logger.error(f"⚠️ Startup indexing warning: {e}")

    logger.info("System Ready!")
    
    yield
    
    logger.info("Shutting down ConvexHire API...")


app = FastAPI(
    title="ConvexHire API",
    description="Backend API for ConvexHire",
    version="📦 " + settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "message": "ConvexHire API is running!",
        "version": "📦 " + settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }
