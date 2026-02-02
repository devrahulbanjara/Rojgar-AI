from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from app.api import api_router
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.core.lifespan import lifespan
from app.core.limiter import limiter
from app.schemas.shared import ErrorResponse

app = FastAPI(
    title="ConvexHire API",
    description="Backend API for ConvexHire",
    version=f"📦 {settings.APP_VERSION}",
    lifespan=lifespan,
    responses={
        400: {
            "model": ErrorResponse,
            "description": "Bad Request - Business logic error",
        },
        401: {
            "model": ErrorResponse,
            "description": "Unauthorized - Authentication required",
        },
        403: {
            "model": ErrorResponse,
            "description": "Forbidden - Insufficient permissions",
        },
        404: {"model": ErrorResponse, "description": "Not Found - Resource not found"},
        409: {"model": ErrorResponse, "description": "Conflict - Resource conflict"},
        422: {
            "model": ErrorResponse,
            "description": "Validation Error - Request validation failed",
        },
        429: {
            "model": ErrorResponse,
            "description": "Too Many Requests - Rate limit exceeded",
        },
        500: {
            "model": ErrorResponse,
            "description": "Internal Server Error - Unexpected error",
        },
    },
)
setup_exception_handlers(app)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
@limiter.limit("50/minute")
def root(request: Request):
    return {
        "message": "ConvexHire API is running!",
        "version": f"📦 {settings.APP_VERSION}",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
