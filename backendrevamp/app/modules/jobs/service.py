from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.jobs.models import Job
from app.modules.jobs.schemas import (
    JobCreate,
    JobDetailResponse,
    JobListItem,
    JobUpdate,
)
from app.shared.enums import JobStatus, LocationType


async def _get_user_company_id(db: AsyncSession, user: User):
    """Resolve the company_id for any user with an active company membership.

    The role gate is intentionally removed here — the membership query itself
    is sufficient.  Both ``recruiter`` and ``recruiter_admin`` (and any future
    company-level roles) will be authorised as long as they hold an
    ``active`` :class:`CompanyMembership`.
    """
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
            detail="Active company membership required to perform this action.",
        )
    return company_id


async def create_job(
    db: AsyncSession, user: User, payload: JobCreate
) -> JobDetailResponse:
    """Create a new job posting under the user's company."""
    company_id = await _get_user_company_id(db, user)

    job = Job(
        company_id=company_id,
        posted_by=user.id,
        title=payload.title,
        location=payload.location,
        location_type=payload.location_type,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        currency=payload.currency,
        status=payload.status,
        overview=payload.overview,
        responsibilities=payload.responsibilities,
        requirements=payload.requirements,
        preferred_qualifications=payload.preferred_qualifications,
        benefits=payload.benefits,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    logger.info(f"Job '{job.title}' created by user {user.id}")
    return JobDetailResponse.model_validate(job)


async def search_jobs(
    db: AsyncSession,
    q: str | None,
    location: str | None,
    location_type: LocationType | None,
    page: int,
    size: int,
) -> list[JobListItem]:
    """Search open jobs with optional keyword / location filters."""
    stmt = select(Job).where(Job.status == JobStatus.open)

    if q:
        stmt = stmt.where(Job.title.ilike(f"%{q}%"))
    if location:
        stmt = stmt.where(Job.location.ilike(f"%{location}%"))
    if location_type:
        stmt = stmt.where(Job.location_type == location_type)

    stmt = stmt.order_by(Job.created_at.desc())
    stmt = stmt.offset((page - 1) * size).limit(size)

    result = await db.execute(stmt)
    jobs = result.scalars().all()
    return [JobListItem.model_validate(j) for j in jobs]


async def list_company_jobs(db: AsyncSession, user: User) -> list[JobListItem]:
    """List all jobs belonging to the user's company."""
    company_id = await _get_user_company_id(db, user)
    result = await db.execute(
        select(Job).where(Job.company_id == company_id).order_by(Job.created_at.desc())
    )
    jobs = result.scalars().all()
    return [JobListItem.model_validate(j) for j in jobs]


async def get_job_detail(db: AsyncSession, job_id: str) -> JobDetailResponse:
    """Get full job details including description."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )
    return JobDetailResponse.model_validate(job)


async def update_job(
    db: AsyncSession, user: User, job_id: str, payload: JobUpdate
) -> JobDetailResponse:
    """Update a job posting (must belong to user's company)."""
    company_id = await _get_user_company_id(db, user)

    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you do not have permission.",
        )

    for field in (
        "title",
        "location",
        "location_type",
        "salary_min",
        "salary_max",
        "currency",
        "status",
        "overview",
        "responsibilities",
        "requirements",
        "preferred_qualifications",
        "benefits",
    ):
        value = getattr(payload, field, None)
        if value is not None:
            setattr(job, field, value)

    await db.commit()
    await db.refresh(job)
    logger.info(f"Job '{job.title}' updated by user {user.id}")
    return JobDetailResponse.model_validate(job)


async def delete_job(db: AsyncSession, user: User, job_id: str) -> None:
    """Delete a job posting (must belong to user's company)."""
    company_id = await _get_user_company_id(db, user)

    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you do not have permission.",
        )

    await db.delete(job)
    await db.commit()
    logger.info(f"Job '{job.title}' deleted by user {user.id}")
