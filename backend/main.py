import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from sqlalchemy import text

from app.core.body_limit import BodySizeLimitMiddleware
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
from app.infrastructures.storage.router import router as files_router
from app.modules.activity.router import router as activity_router
from app.modules.admin.router import router as admin_router
from app.modules.applications.emails import deliver_overdue
from app.modules.applications.recruiter_router import router as recruiter_router
from app.modules.applications.router import router as applications_router
from app.modules.assistant.router import router as assistant_router
from app.modules.audit.router import router as audit_router
from app.modules.auth.router import router as auth_router
from app.modules.companies.router import businesses as businesses_router
from app.modules.companies.router import invites as invites_router
from app.modules.companies.router import router as companies_router
from app.modules.dashboards.router import router as dash_router
from app.modules.entitlements.router import router as entitlements_router
from app.modules.interviews.reminders import reminder_loop
from app.modules.interviews.router import router as interviews_router
from app.modules.jobs.router import router as jobs_router
from app.modules.jobs.templates_router import router as job_templates_router
from app.modules.notifications.router import router as notifications_router
from app.modules.profiles.router import router as profiles_router
from app.modules.public.router import router as public_router
from app.modules.recruiter_preferences.router import (
    router as recruiter_preferences_router,
)
from app.modules.resumes.router import router as resumes_router
from app.modules.review.ml_rank import assert_model_available
from app.modules.review.service import recover_pending_reviews

setup_logging()


async def _run_startup_backlog() -> None:
    """Close overdue jobs, send overdue decision emails, finish pending reviews."""
    await run_job_expiry_startup_check()
    try:
        await deliver_overdue()
    except Exception:
        logger.exception("Startup decision-email sweep failed.")
    try:
        await recover_pending_reviews()
    except Exception:
        logger.exception("Startup review recovery failed.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup and shutdown tasks for the FastAPI application lifecycle."""
    if settings.environment == "prod":
        # The ML tie-break model ships with the image; fail loudly if not.
        await asyncio.to_thread(assert_model_available)
    # vector store — job/candidate search
    await qdrant_service.initialize()
    # cache layer — jobs, applications, companies
    await redis_service.connect()
    # Pending reviews can mean many LLM calls; run them in the background so the
    # API serves immediately. Review attempts are claimed atomically.
    startup_backlog_task = asyncio.create_task(_run_startup_backlog())

    # background loop — retries failed qdrant sync events every 60s
    daemon_task = asyncio.create_task(sync_daemon_loop())
    # interview reminders 24 h / 1 h ahead (one worker sends, DB lock)
    reminder_task = asyncio.create_task(reminder_loop())
    # hourly — closes jobs past their closing time
    job_expiry_scheduler = create_job_expiry_scheduler()
    job_expiry_scheduler.start()

    yield

    job_expiry_scheduler.shutdown(wait=False)
    for task in (daemon_task, reminder_task, startup_backlog_task):
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    await redis_service.disconnect()
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
app.add_middleware(BodySizeLimitMiddleware)  # rejects oversized bodies early

register_exception_handlers(app)  # registers global exception handlers

# mounts all route modules
app.include_router(auth_router)
app.include_router(audit_router)
app.include_router(activity_router)
app.include_router(dash_router)
app.include_router(companies_router)
app.include_router(businesses_router)
app.include_router(invites_router)
app.include_router(admin_router)
app.include_router(entitlements_router)
app.include_router(profiles_router)
app.include_router(public_router)
app.include_router(files_router)
app.include_router(resumes_router)
app.include_router(assistant_router)
app.include_router(notifications_router)
app.include_router(recruiter_preferences_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(recruiter_router)
app.include_router(job_templates_router)
app.include_router(interviews_router)


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
