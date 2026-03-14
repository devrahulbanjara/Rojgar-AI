import uuid
from datetime import datetime, timezone

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.integrations.qdrant.service import qdrant_service
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.jobs.enums import SyncAction
from app.modules.jobs.models import Job, JobSyncEvent
from app.modules.jobs.schemas import (
    CompanySnippet,
    JobCreate,
    JobDetailResponse,
    JobListItem,
    JobUpdate,
)
from app.modules.jobs.sync import process_sync_event
from app.modules.profiles.models import Profile
from app.shared.enums import JobStatus, LocationType


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _effective_job_status(job: Job) -> JobStatus:
    if (
        job.status == JobStatus.active
        and job.expires_at is not None
        and job.expires_at <= _utcnow()
    ):
        return JobStatus.expired
    return job.status


def _validate_expires_at_for_write(expires_at: datetime | None) -> datetime | None:
    if expires_at is None:
        return None
    if expires_at.tzinfo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expires_at must be timezone-aware.",
        )
    return expires_at


def _should_be_searchable(job: Job) -> bool:
    return _effective_job_status(job) == JobStatus.active and (
        job.expires_at is None or job.expires_at > _utcnow()
    )


def _job_list_item_from_row(
    job: Job,
    applications_count: int | None = None,
    *,
    match_score: float | None = None,
    is_fallback: bool = False,
) -> JobListItem:
    company = CompanySnippet.model_validate(job.company)
    return JobListItem.model_validate(
        {
            "id": job.id,
            "company_id": job.company_id,
            "company": company,
            "title": job.title,
            "location": job.location,
            "location_type": job.location_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "currency": job.currency,
            "status": _effective_job_status(job),
            "expires_at": job.expires_at,
            "applications_count": int(applications_count or 0),
            "created_at": job.created_at,
            "match_score": match_score,
            "is_fallback": is_fallback,
        }
    )


def _job_detail_response_from_row(
    job: Job, applications_count: int | None = None
) -> JobDetailResponse:
    company = CompanySnippet.model_validate(job.company)
    return JobDetailResponse.model_validate(
        {
            "id": job.id,
            "company_id": job.company_id,
            "company": company,
            "posted_by": job.posted_by,
            "title": job.title,
            "location": job.location,
            "location_type": job.location_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "currency": job.currency,
            "status": _effective_job_status(job),
            "expires_at": job.expires_at,
            "overview": job.overview,
            "responsibilities": job.responsibilities,
            "requirements": job.requirements,
            "preferred_qualifications": job.preferred_qualifications,
            "benefits": job.benefits,
            "applications_count": int(applications_count or 0),
            "created_at": job.created_at,
            "updated_at": job.updated_at,
        }
    )


async def _get_user_company_id(db: AsyncSession, user: User):
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
    db: AsyncSession, user: User, payload: JobCreate, bg_tasks: BackgroundTasks
) -> JobDetailResponse:
    """Create a new job posting under the user's company."""
    company_id = await _get_user_company_id(db, user)

    expires_at = _validate_expires_at_for_write(payload.expires_at)

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
        expires_at=expires_at,
        overview=payload.overview,
        responsibilities=payload.responsibilities or [],
        requirements=payload.requirements or [],
        preferred_qualifications=payload.preferred_qualifications or [],
        benefits=payload.benefits or [],
    )

    # guard against active jobs already expired
    if job.status == JobStatus.active and job.expires_at and job.expires_at <= _utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active jobs must have an expires_at in the future.",
        )

    db.add(job)
    await db.flush()  # Generates job.id without committing yet

    # 1. Transactionally write the outbox event alongside the job
    event = JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT)
    db.add(event)
    await db.commit()

    # 2. Fast-path: trigger immediate Qdrant sync (non-blocking, after response)
    bg_tasks.add_task(process_sync_event, event.id)

    result = await db.execute(
        select(Job, func.count(Application.id).label("applications_count"))
        .options(selectinload(Job.company))
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.id == job.id)
        .group_by(Job.id)
    )
    job, applications_count = result.one()
    logger.info(f"Job '{job.title}' created by user {user.id}")
    return _job_detail_response_from_row(job, applications_count)


async def _build_recommendation_query(db: AsyncSession, user: User) -> str:
    """
    Build a semantically rich query string from the candidate's profile.
    Target role is repeated at the top for highest embedding weight.
    """
    result = await db.execute(
        select(Profile)
        .where(Profile.user_id == user.id)
        .options(
            selectinload(Profile.experiences),
            selectinload(Profile.skills),
        )
    )
    profile = result.scalar_one_or_none()

    if not profile:
        return "Software engineering technology jobs"

    target_roles: list[str] = profile.target_roles or []
    top_target = target_roles[0] if target_roles else "Technology Professional"
    experience_titles = (
        ", ".join(exp.title for exp in profile.experiences)
        if profile.experiences
        else ""
    )
    skill_names = (
        ", ".join(s.skill_name for s in profile.skills) if profile.skills else ""
    )

    parts = [
        f"TARGET ROLE (highest priority):\n{top_target}",
        f"PREFERRED ROLE KEYWORDS:\n{', '.join(target_roles)}",
    ]
    if profile.summary:
        parts.append(f"PROFESSIONAL SUMMARY:\n{profile.summary}")
    if experience_titles:
        parts.append(f"WORK EXPERIENCE:\n{experience_titles}")
    if skill_names:
        parts.append(f"SKILLS:\n{skill_names}")

    return "\n\n".join(parts)


async def search_jobs(
    db: AsyncSession,
    user: "User | None",
    q: str | None,
    location_type: LocationType | None,
    salary_min: int | None,
    salary_max: int | None,
    page: int,
    size: int,
) -> tuple[list[JobListItem], int]:
    """
    Vector-powered job search with AI recommendations.

    - When ``q`` is provided: embeds the search string and queries Qdrant.
    - When no ``q`` and user is a candidate: builds a profile-based
      recommendation query so the most relevant jobs surface first.
    - Metadata filters (location_type, salary) are applied inside
      Qdrant, with smart fallback padding for under-filled pages.
    """
    from app.modules.auth.enums import UserRole  # local import avoids circular

    # 1. Determine the semantic query string
    if q and q.strip():
        search_query = q.strip()
    elif user and user.primary_role == UserRole.candidate:
        search_query = await _build_recommendation_query(db, user)
    else:
        search_query = "Software technology engineering jobs"

    # 2. Run the semantic search with simple filter parameters
    qdrant_results, total_count = await qdrant_service.search_jobs(
        query=search_query,
        location_type=location_type.value if location_type else None,
        salary_min=salary_min,
        salary_max=salary_max,
        page=page,
        size=size,
    )

    if not qdrant_results:
        return [], 0

    # 3. Batch-fetch the real job rows from Postgres (preserves no ordering)
    job_ids = [res["job_id"] for res in qdrant_results]
    stmt = (
        select(Job, func.count(Application.id).label("applications_count"))
        .options(selectinload(Job.company))
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.id.in_(job_ids))
        .group_by(Job.id)
    )
    db_result = await db.execute(stmt)
    job_map = {job.id: (job, app_count) for job, app_count in db_result.all()}

    # 4. Reconstruct the list in Qdrant's exact semantic score order
    final_jobs: list[JobListItem] = []
    for res in qdrant_results:
        row = job_map.get(res["job_id"])
        if row is None:
            continue  # ghost vector (job deleted from Postgres but not yet from Qdrant)
        job, app_count = row

        if not _should_be_searchable(job):
            continue

        final_jobs.append(
            _job_list_item_from_row(
                job,
                app_count,
                match_score=round(res["score"], 4),
                is_fallback=res["is_fallback"],
            )
        )

    return final_jobs, len(final_jobs) if page == 1 else total_count


async def list_company_jobs(db: AsyncSession, user: User) -> list[JobListItem]:
    """List all jobs belonging to the user's company."""
    company_id = await _get_user_company_id(db, user)
    result = await db.execute(
        select(Job, func.count(Application.id).label("applications_count"))
        .options(selectinload(Job.company))
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.company_id == company_id)
        .group_by(Job.id)
        .order_by(Job.created_at.desc())
    )
    rows = result.all()
    return [
        _job_list_item_from_row(job, applications_count)
        for job, applications_count in rows
    ]


async def get_job_detail(db: AsyncSession, job_id: str) -> JobDetailResponse:
    """Get full job details including description."""
    result = await db.execute(
        select(Job, func.count(Application.id).label("applications_count"))
        .options(selectinload(Job.company))
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.id == job_id)
        .group_by(Job.id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )
    job, applications_count = row
    return _job_detail_response_from_row(job, applications_count)


async def update_job(
    db: AsyncSession,
    user: User,
    job_id: str,
    payload: JobUpdate,
    bg_tasks: BackgroundTasks,
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

    update_data = payload.model_dump(exclude_unset=True)

    if "expires_at" in update_data:
        update_data["expires_at"] = _validate_expires_at_for_write(
            update_data["expires_at"]
        )

    for field, value in update_data.items():
        setattr(job, field, value)

    if job.status == JobStatus.active and job.expires_at and job.expires_at <= _utcnow():
        job.status = JobStatus.expired

    # 1. Transactionally write the outbox event alongside the update
    event = JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT)
    db.add(event)
    await db.commit()

    # 2. Fast-path: trigger immediate Qdrant sync (non-blocking, after response)
    bg_tasks.add_task(process_sync_event, event.id)

    result = await db.execute(
        select(Job, func.count(Application.id).label("applications_count"))
        .options(selectinload(Job.company))
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.id == job.id)
        .group_by(Job.id)
    )
    job, applications_count = result.one()
    logger.info(f"Job '{job.title}' updated by user {user.id}")
    return _job_detail_response_from_row(job, applications_count)


async def delete_job(
    db: AsyncSession, user: User, job_id: str, bg_tasks: BackgroundTasks
) -> None:
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

    job_title = job.title  # capture before deletion
    await db.delete(job)

    # 1. Transactionally write the hard-delete outbox event
    event = JobSyncEvent(job_id=uuid.UUID(str(job_id)), action=SyncAction.DELETE)
    db.add(event)
    await db.commit()

    # 2. Fast-path: trigger immediate Qdrant sync (non-blocking, after response)
    bg_tasks.add_task(process_sync_event, event.id)

    logger.info(f"Job '{job_title}' deleted by user {user.id}")
