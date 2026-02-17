from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import v1_router
from app.core.config import settings
from app.core.lifespan import lifespan
from app.core.limiter import limiter
from app.core.logging_config import logger

app = FastAPI(
    title="ConvexHire API",
    description="AI-Powered Recruitment Platform",
    version=f"📦 {settings.APP_VERSION}",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)

app.state.limiter = limiter


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    detail = str(exc) if settings.ENVIRONMENT == "development" else "Internal server error"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": detail},
        headers={
            "Access-Control-Allow-Origin": settings.FRONTEND_URL,
            "Access-Control-Allow-Credentials": "true",
        },
    )


app.include_router(v1_router, prefix="/api/v1")


@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "version": f"📦 {settings.APP_VERSION}"}
