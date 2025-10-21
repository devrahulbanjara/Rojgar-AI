"""
ConvexHire Backend - Main application file
Simple FastAPI app for job recruitment platform
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core.exceptions import register_exception_handlers
from app.api.v1 import api_router

# Configure logging
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager - runs when app starts and shuts down
    """
    # Startup: Create database tables
    logger.info("Starting ConvexHire API...")
    logger.info("Initializing database...")
    init_db()
    logger.info("Database ready!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ConvexHire API...")


# Create the FastAPI application
app = FastAPI(
    title="ConvexHire API",
    description="Backend API for ConvexHire recruitment platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
register_exception_handlers(app)

# Register routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    """Root endpoint - check if API is running"""
    return {
        "message": "ConvexHire API is running!",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }
