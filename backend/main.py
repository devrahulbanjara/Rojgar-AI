from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.core.database import init_db
from app.core.logging_config import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager - runs when app starts and shuts down
    Startup: Create database tables
    """
    logger.info("Starting ConvexHire API...")
    logger.info("Initializing database...")
    init_db()
    logger.info("Database ready!")

    yield

    logger.info("Shutting down ConvexHire API...")


app = FastAPI(
    title="ConvexHire API",
    description="Backend API for ConvexHire",
    version="1.0.0",
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
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }
