from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from app.api import api_router
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.core.lifespan import lifespan
from app.core.limiter import limiter

app = FastAPI(
    title="ConvexHire API",
    description="Backend API for ConvexHire",
    version=f"📦 {settings.APP_VERSION}",
    lifespan=lifespan,
)

setup_exception_handlers(app)

# 2. Setup Middleware
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Include Routers
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
