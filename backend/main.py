"""
Main FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging_config import get_logger
from app.api.v1.routes import auth, users, applications, jobs

# Setup logging
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="ConvexHire API",
    description="Backend API for ConvexHire recruitment platform",
    version="1.0.0",
)

logger.info("Starting ConvexHire API application")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS configured for origins: {settings.cors_origins}")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(applications.router, prefix="/applications", tags=["applications"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])

logger.info("API routes configured successfully")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "ConvexHire API is running"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
