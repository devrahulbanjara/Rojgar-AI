import asyncio
from contextlib import asynccontextmanager

import logfire
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.tasks import sync_daemon_loop
from app.core.database import engine, get_db
from app.core.exception_handlers import register_exception_handlers
from app.infrastructures.qdrant.service import qdrant_service
from app.infrastructures.redis.service import redis_service

from app.modules.companies.router import router as companies_router
from app.modules.profiles.router import router as profiles_router
from app.modules.resumes.router import router as resumes_router
from app.modules.jobs.router import router as jobs_router
from app.modules.applications.router import router as applications_router
from app.core.logging_config import setup_logging
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.router import router as auth_router
from app.modules.dashboards.router import router as dash_router
from app.modules.job_ai.runtime import job_ai_runtime
from app.modules.job_ai.router import router as job_ai_router
from app.modules.outreach.router import router as outreach_router
from app.modules.outreach.runtime import outreach_runtime
from app.modules.shortlisting.router import router as shortlisting_router

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await qdrant_service.initialize()
    await job_ai_runtime.start()
    await outreach_runtime.start()
    await redis_service.connect()

    daemon_task = asyncio.create_task(sync_daemon_loop())

    yield

    daemon_task.cancel()
    try:
        await daemon_task
    except asyncio.CancelledError:
        pass

    await redis_service.disconnect()
    await outreach_runtime.stop()
    await job_ai_runtime.stop()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="AI-Powered Recruitment Platform",
    debug=settings.debug,
    lifespan=lifespan,
    version=f"📦 {settings.app_version}",
    docs_url="/docs" if settings.environment == "dev" else None,  # hide docs in prod
    redoc_url=None,
    contact={
        "name": "Rahul Dev Banjara",
        "email": "rdbanjara07@gmail.com",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.environment == "dev":
    logfire.configure()
    logfire.instrument_fastapi(app)

register_exception_handlers(app)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(dash_router)
app.include_router(companies_router, prefix="/companies", tags=["Companies"])
app.include_router(profiles_router, prefix="/profiles", tags=["Profiles"])
app.include_router(resumes_router, prefix="/resumes", tags=["Resumes"])
app.include_router(job_ai_router, prefix="/jobs/ai", tags=["jobs-ai"])
app.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])
app.include_router(applications_router, prefix="/applications", tags=["Applications"])
app.include_router(shortlisting_router, prefix="/shortlisting", tags=["Shortlisting"])
app.include_router(outreach_router, prefix="/outreach", tags=["Outreach"])


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
