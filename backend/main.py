import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.core.dependencies import DbSession
from app.core.exception_handlers import register_exception_handlers
from app.core.job_expiry_scheduler import (
    create_job_expiry_scheduler,
    run_job_expiry_startup_check,
)
from app.core.logging_config import setup_logging
from app.core.request_middleware import RequestContextMiddleware
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.core.tasks import sync_daemon_loop
from app.infrastructures.qdrant.service import qdrant_service
from app.infrastructures.redis.service import redis_service
from app.modules.activity.router import router as activity_router
from app.modules.applications.router import router as applications_router
from app.modules.audit.router import router as audit_router
from app.modules.auth.router import router as auth_router
from app.modules.companies.router import router as companies_router
from app.modules.dashboards.router import router as dash_router
from app.modules.interviews.evaluation_router import router as evaluation_router
from app.modules.interviews.recording_router import router as recording_router
from app.modules.interviews.router import router as interviews_router
from app.modules.interviews.webhook import router as cal_webhook_router
from app.modules.job_ai.router import router as job_ai_router
from app.modules.job_ai.runtime import job_ai_runtime
from app.modules.jobs.router import router as jobs_router
from app.modules.notifications.router import router as notifications_router
from app.modules.outreach.router import router as outreach_router
from app.modules.profiles.router import router as profiles_router
from app.modules.recruiter_chat.router import router as recruiter_chat_router
from app.modules.recruiter_preferences.router import (
    router as recruiter_preferences_router,
)
from app.modules.resume_gap.router import router as resume_gap_router
from app.modules.resumes.router import router as resumes_router
from app.modules.shortlisting.router import router as shortlisting_router
from app.modules.shortlisting.service import recover_unfinished_shortlisting

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup and shutdown tasks for the FastAPI application lifecycle."""
    # vector store — job/candidate search and recruiter chat
    await qdrant_service.initialize()
    # LangGraph runner — job drafting AI
    await job_ai_runtime.start()
    # cache layer — jobs, applications, companies
    await redis_service.connect()
    # marks any overdue active jobs as expired on boot
    await run_job_expiry_startup_check()
    # resumes two-stage shortlisting for expired jobs left unfinished by a prior crash
    await recover_unfinished_shortlisting()

    # background loop — retries failed qdrant sync events every 60s
    daemon_task = asyncio.create_task(sync_daemon_loop())
    # daily cron — marks overdue active jobs as expired
    job_expiry_scheduler = create_job_expiry_scheduler()
    job_expiry_scheduler.start()

    yield

    job_expiry_scheduler.shutdown(wait=False)
    daemon_task.cancel()
    try:
        await daemon_task
    except asyncio.CancelledError:
        pass

    await redis_service.disconnect()
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
app.add_middleware(
    RequestContextMiddleware
)  # attaches request context to every request

register_exception_handlers(app)  # registers global exception handlers

# mounts all route modules
app.include_router(auth_router)
app.include_router(audit_router)
app.include_router(activity_router)
app.include_router(dash_router)
app.include_router(companies_router)
app.include_router(profiles_router)
app.include_router(resumes_router)
app.include_router(job_ai_router)
app.include_router(recruiter_chat_router)
app.include_router(notifications_router)
app.include_router(recruiter_preferences_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(resume_gap_router)
app.include_router(shortlisting_router)
app.include_router(interviews_router)
app.include_router(evaluation_router)
app.include_router(recording_router)
app.include_router(outreach_router)
app.include_router(cal_webhook_router)


@app.get("/", tags=["System"])
async def root() -> UnifiedResponse[dict]:
    """Return basic API metadata for liveness checks and discovery."""
    data = {
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
    }
    return ResponseBuilder.success(data=data, message="API is online")


@app.get("/health", tags=["System"])
async def health_check(db: DbSession) -> UnifiedResponse[dict]:
    """Verify database connectivity and report overall service health."""
    try:
        await db.execute(text("SELECT 1"))
        data = {"status": "healthy", "database": "connected"}
        return ResponseBuilder.success(data=data)
    except Exception:
        raise HTTPException(status_code=503, detail="Database connection failed")
