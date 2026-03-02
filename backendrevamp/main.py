from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.core.exception_handlers import register_exception_handlers
from app.modules.auth.router import router as auth_router
from app.core.database import get_db
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import logfire

# from app.modules.users.router import router as users_router
# from app.modules.companies.router import router as companies_router
from app.core.logging_config import setup_logging

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    yield
    # shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="AI-Powered Recruitment Platform",
    debug=settings.debug,
    lifespan=lifespan,
    version=f"📦 {settings.app_version}",
    docs_url="/docs" if settings.environment == "dev" else None,  # hide docs in prod
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logfire.configure()
logfire.instrument_fastapi(app)
register_exception_handlers(app)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
# app.include_router(users_router,     prefix="/users",     tags=["Users"])
# app.include_router(companies_router, prefix="/companies", tags=["Companies"])


@app.get("/", tags=["System"], response_model=UnifiedResponse[dict])
async def root():
    data = {
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }
    return ResponseBuilder.success(data=data, message="API is online")


@app.get("/health", tags=["System"], response_model=UnifiedResponse[dict])
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        data = {"status": "healthy", "database": "connected"}
        return ResponseBuilder.success(data=data)
    except Exception:
        raise HTTPException(status_code=503, detail="Database connection failed")
