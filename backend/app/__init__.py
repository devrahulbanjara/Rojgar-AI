"""
Enhanced FastAPI Application Initialization
Clean architecture with proper middleware, error handling, and logging
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.middleware import (
    LoggingMiddleware,
    SecurityHeadersMiddleware,
    ErrorHandlingMiddleware,
    RateLimitMiddleware,
)
from app.api.v1.routes import auth, users

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    yield

    # Shutdown
    logger.info("Shutting down application")


def create_application() -> FastAPI:
    """Create and configure FastAPI application"""

    # Create FastAPI app
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-Powered Recruitment Platform",
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        lifespan=lifespan,
    )

    # Add middleware (order matters!)
    app.add_middleware(ErrorHandlingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(LoggingMiddleware)

    # Add rate limiting in production
    if settings.is_production:
        app.add_middleware(RateLimitMiddleware)

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Include API routers
    app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
    app.include_router(users.router, prefix="/api/v1", tags=["Users"])

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    logger.info("Application created successfully")
    return app


# Create application instance
app = create_application()
