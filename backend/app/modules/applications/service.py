import os

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import AsyncSessionLocal
from app.infrastructures.redis.service import redis_service
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.applications.models import Application
from app.modules.applications.schemas import (
    ApplicantSummary,
    ApplicationListItem,
    ApplicationResponse,
    ApplyRequest,
    CandidateApplicationView,
    RecruiterApplicationView,
    UpdateApplicationStatusRequest,
)
from app.modules.companies.models import Company
from app.modules.companies.models import CompanyMembership
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume
from app.shared.enums import ApplicationStatus, JobStatus


def _application_response_options():
    """SQLAlchemy loader options for building a full ApplicationResponse."""
    return [
        joinedload(Application.resume).selectinload(Resume.experiences),
        joinedload(Application.resume).selectinload(Resume.educations),
        joinedload(Application.resume).selectinload(Resume.skills),
    ]


def _background_database_url(db: AsyncSession) -> str:
    bind = db.bind
    if bind is not None and hasattr(bind, "url"):
        return str(bind.url)

    fallback_bind = AsyncSessionLocal.kw.get("bind")
    if fallback_bind is not None and hasattr(fallback_bind, "url"):
        return str(fallback_bind.url)

    raise RuntimeError("Database bind is not configured for background task execution.")


async def apply_to_job(
    db: AsyncSession,
    user: User,
    payload: ApplyRequest,
    bg_tasks: BackgroundTasks | None = None,
) -> ApplicationResponse:
    """Submit an application. A resume_id belonging to the user is required."""
    # 1. Verify the job exists and is active
    result = await db.execute(select(Job).where(Job.id == payload.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )
    if job.status != JobStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job is not currently accepting applications.",
        )

    # 2. Verify the resume exists and belongs to the user (IDOR prevention)
    resume = await db.scalar(select(Resume).where(Resume.id == payload.resume_id))
    if not resume or resume.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid resume ID or access denied.",
        )

    # 3. Check for duplicate application before inserting
    existing = await db.execute(
        select(Application).where(
            Application.job_id == payload.job_id,
            Application.user_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job.",
        )

    # 4. Create and persist the application
    application = Application(
        job_id=payload.job_id,
        user_id=user.id,
        resume_id=payload.resume_id,
        status=ApplicationStatus.submitted,
    )
    db.add(application)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job.",
        )

    if (
        job.auto_shortlist
        and bg_tasks is not None
        and "PYTEST_CURRENT_TEST" not in os.environ
    ):
        from app.modules.shortlisting.service import (
            process_auto_shortlist_for_application,
        )

        bg_tasks.add_task(
            process_auto_shortlist_for_application,
            application.id,
            _background_database_url(db),
        )

    # Re-fetch with resume + children eagerly loaded
    result = await db.execute(
        select(Application)
        .where(Application.id == application.id)
        .options(*_application_response_options())
    )
    application = result.scalar_one()

    # INVALIDATE CACHES asynchronously
    # 1. Candidate's own dashboard & applications list
    await redis_service.delete(f"dashboard:candidate:{user.id}")
    await redis_service.invalidate_pattern(f"applications:candidate:{user.id}:*")
    # 2. Recruiter dashboards (easiest is to wipe all recruiter dashboards, or you could target specific ones)
    await redis_service.invalidate_pattern("dashboard:recruiter:*")
    # 3. Invalidate the job detail cache because the applicant count went up
    await redis_service.delete(f"job:detail:{payload.job_id}")

    logger.info(
        "User {user_id} applied to job {job_id}", user_id=user.id, job_id=payload.job_id
    )
    return ApplicationResponse.model_validate(application)


def _app_to_list_item(app: Application) -> ApplicationListItem:
    """Build an ApplicationListItem with nested ApplicantSummary from a loaded Application."""
    return ApplicationListItem(
        id=app.id,
        job_id=app.job_id,
        user_id=app.user_id,
        status=app.status,
        created_at=app.created_at,
        applicant=ApplicantSummary(
            id=app.user.id,
            full_name=app.user.full_name,
            email=app.user.email,
        ),
    )


async def _get_active_company_id(db: AsyncSession, user: User) -> str:
    result = await db.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company_id = result.scalar_one_or_none()
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active company members can view applications.",
        )
    return company_id


async def list_candidate_applications(
    db: AsyncSession, user_id, page: int = 1, size: int = 20
) -> list[CandidateApplicationView]:
    """Return candidate applications across all companies with job and company metadata."""
    cache_key = f"applications:candidate:{user_id}:p{page}:s{size}"

    # 1. Try Cache
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        import json

        data = json.loads(cached_data)
        return [CandidateApplicationView.model_validate(item) for item in data]

    stmt = (
        select(Application, Job, Company)
        .join(Job, Job.id == Application.job_id)
        .join(Company, Company.id == Job.company_id)
        .where(Application.user_id == user_id)
        .order_by(Application.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    rows = (await db.execute(stmt)).all()

    response = [
        CandidateApplicationView(
            id=application.id,
            status=application.status,
            created_at=application.created_at,
            updated_at=application.updated_at,
            job_id=job.id,
            job_title=job.title,
            company_name=company.name,
            company_logo_url=company.logo_url,
            location=job.location,
            location_type=job.location_type,
            score=application.score,
            feedback=application.feedback,
        )
        for application, job, company in rows
    ]

    # 3. Save to Cache (TTL 5 minutes - applications status can change)
    import json

    await redis_service.set(
        cache_key,
        json.dumps([item.model_dump(mode="json") for item in response]),
        ttl_seconds=300,
    )

    return response


async def list_company_applications(
    db: AsyncSession,
    company_id,
    job_id=None,
    page: int = 1,
    size: int = 20,
) -> list[RecruiterApplicationView]:
    """Return applications for a company inbox, optionally filtered to a single job."""
    stmt = (
        select(Application, User, Job)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .where(Job.company_id == company_id)
    )

    if job_id is not None:
        stmt = stmt.where(Application.job_id == job_id)

    stmt = (
        stmt.order_by(Application.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    rows = (await db.execute(stmt)).all()

    return [
        RecruiterApplicationView(
            id=application.id,
            status=application.status,
            created_at=application.created_at,
            updated_at=application.updated_at,
            applicant_name=applicant.full_name,
            applicant_email=applicant.email,
            applicant_avatar_url=applicant.avatar_url,
            job_title=job.title,
            job_id=job.id,
            score=application.score,
            feedback=application.feedback,
        )
        for application, applicant, job in rows
    ]


async def list_user_applications(
    db: AsyncSession, user: User, page: int, size: int
) -> list[CandidateApplicationView]:
    """List all applications by the authenticated candidate (paginated)."""
    return await list_candidate_applications(db, user.id, page, size)


async def list_job_applications(
    db: AsyncSession, user: User, job_id: str, page: int, size: int
) -> list[RecruiterApplicationView]:
    """List all applications for a job (company/recruiter access check, paginated)."""
    company_id = await _get_active_company_id(db, user)

    # Verify job belongs to the user's company
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or does not belong to your company.",
        )

    return await list_company_applications(db, company_id, job_id, page, size)


async def list_my_company_applications(
    db: AsyncSession, user: User, job_id: str | None, page: int, size: int
) -> list[RecruiterApplicationView]:
    """List applications for the authenticated recruiter's company, optionally by job."""
    company_id = await _get_active_company_id(db, user)

    if job_id is not None:
        result = await db.execute(
            select(Job).where(Job.id == job_id, Job.company_id == company_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or does not belong to your company.",
            )

    return await list_company_applications(db, company_id, job_id, page, size)


async def get_application(
    db: AsyncSession, user: User, application_id: str
) -> ApplicationResponse:
    """Get a single application (accessible by applicant or company member)."""
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(*_application_response_options())
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    # Applicant can see their own
    if application.user_id == user.id:
        return ApplicationResponse.model_validate(application)

    # Active company members (recruiter / recruiter_admin) can see applications
    # for jobs belonging to their company — but only if their membership is active.
    company_id = None
    try:
        company_id = await _get_active_company_id(db, user)
    except HTTPException:
        company_id = None
    if company_id:
        result = await db.execute(
            select(Job).where(
                Job.id == application.job_id, Job.company_id == company_id
            )
        )
        if result.scalar_one_or_none():
            return ApplicationResponse.model_validate(application)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view this application.",
    )


async def update_application_status(
    db: AsyncSession,
    user: User,
    application_id: str,
    payload: UpdateApplicationStatusRequest,
) -> ApplicationResponse:
    """Update application status (active company members only)."""
    company_id = await _get_active_company_id(db, user)

    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(*_application_response_options())
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    # Verify the job belongs to the user's company
    result = await db.execute(
        select(Job).where(Job.id == application.job_id, Job.company_id == company_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This application's job does not belong to your company.",
        )

    application.status = payload.status
    await db.commit()
    await db.refresh(application)

    # INVALIDATE CACHES
    # 1. Candidate's own dashboard & applications list
    await redis_service.delete(f"dashboard:candidate:{application.user_id}")
    await redis_service.invalidate_pattern(
        f"applications:candidate:{application.user_id}:*"
    )
    # 2. Recruiter dashboards (since counts of interviews/offers might have changed)
    await redis_service.invalidate_pattern("dashboard:recruiter:*")

    logger.info(
        "Application {app_id} status updated to {new_status} by user {user_id}",
        app_id=application_id,
        new_status=payload.status,
        user_id=user.id,
    )
    return ApplicationResponse.model_validate(application)
