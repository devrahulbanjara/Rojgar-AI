from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import v1_router
from app.core.config import settings
from app.core.lifespan import lifespan
from app.core.limiter import limiter

app = FastAPI(
    title="ConvexHire API",
    description="AI-Powered Recruitment Platform",
    version=f"📦 {settings.APP_VERSION}",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.include_router(v1_router, prefix="/api/v1")


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "version": f"📦 {settings.APP_VERSION}"}
