from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.applications.models import Application
from app.modules.applications.schemas import (
    ApplicantSummary,
    ApplicationListItem,
    ApplicationResponse,
    ApplyRequest,
    UpdateApplicationStatusRequest,
)
from app.modules.companies.models import CompanyMembership
from app.shared.enums import ApplicationStatus, JobStatus
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume


def _application_response_options():
    """SQLAlchemy loader options for building a full ApplicationResponse."""
    return [
        joinedload(Application.resume).selectinload(Resume.experiences),
        joinedload(Application.resume).selectinload(Resume.educations),
        joinedload(Application.resume).selectinload(Resume.skills),
    ]


async def apply_to_job(
    db: AsyncSession, user: User, payload: ApplyRequest
) -> ApplicationResponse:
    """Submit an application. A resume_id belonging to the user is required."""
    # 1. Verify the job exists and is open
    result = await db.execute(select(Job).where(Job.id == payload.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )
    if job.status != JobStatus.open:
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

    # Re-fetch with resume + children eagerly loaded
    result = await db.execute(
        select(Application)
        .where(Application.id == application.id)
        .options(*_application_response_options())
    )
    application = result.scalar_one()

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


async def list_user_applications(
    db: AsyncSession, user: User, page: int, size: int
) -> list[ApplicationListItem]:
    """List all applications by the authenticated candidate (paginated)."""
    stmt = (
        select(Application)
        .where(Application.user_id == user.id)
        .options(joinedload(Application.user))
        .order_by(Application.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(stmt)
    apps = result.scalars().unique().all()
    return [_app_to_list_item(a) for a in apps]


async def list_job_applications(
    db: AsyncSession, user: User, job_id: str, page: int, size: int
) -> list[ApplicationListItem]:
    """List all applications for a job (company/recruiter access check, paginated)."""
    # Verify user holds an active company membership (covers recruiter + recruiter_admin)
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
            detail="Only active company members can view job applications.",
        )

    # Verify job belongs to the user's company
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or does not belong to your company.",
        )

    stmt = (
        select(Application)
        .where(Application.job_id == job_id)
        .options(joinedload(Application.user))
        .order_by(Application.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(stmt)
    apps = result.scalars().unique().all()
    return [_app_to_list_item(a) for a in apps]


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
    result = await db.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company_id = result.scalar_one_or_none()
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
            detail="Only active company members can update application status.",
        )

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

    logger.info(
        "Application {app_id} status updated to {new_status} by user {user_id}",
        app_id=application_id,
        new_status=payload.status,
        user_id=user.id,
    )
    return ApplicationResponse.model_validate(application)
