import uuid
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import (
    get_job_applicant_user_ids,
    invalidate_candidate_read_caches_for_users,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
    invalidate_interview_list_caches,
    invalidate_job_detail_caches,
)
from app.core.config import settings
from app.core.swr_cache import swr_get, swr_set
from app.infrastructures.qdrant.service import qdrant_service
from app.infrastructures.redis.service import redis_service
from app.modules.applications.models import Application, ApplicationSyncEvent
from app.modules.applications.sync import (
    process_sync_event as process_application_sync_event,
)
from app.modules.audit.service import create_custom_audit_log
from app.modules.auth.enums import MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
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
from app.shared.enums import ApplicationStatus, JobStatus, LocationType, SyncAction


def _utcnow() -> datetime:
    """Return the current UTC datetime."""
    return datetime.now(timezone.utc)


def _default_expires_at() -> datetime:
    """Return the default job expiry timestamp."""
    return _utcnow() + timedelta(weeks=1)


def _effective_job_status(job: Job) -> JobStatus:
    """Return the effective job status, accounting for expiry."""
    if (
        job.status == JobStatus.active
        and job.expires_at is not None
        and job.expires_at <= _utcnow()
    ):
        return JobStatus.expired
    return job.status


def _validate_expires_at_for_write(expires_at: datetime | None) -> datetime | None:
    """Validate and normalize a job expiry timestamp before writes."""
    if expires_at is None:
        return None
    if expires_at.tzinfo is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expires_at must be timezone-aware.",
        )
    return expires_at


def _should_be_searchable(job: Job) -> bool:
    """Return True when a job should be indexed for search."""
    return (
        _effective_job_status(job) == JobStatus.active
        and not job.hiring_completed
        and (job.expires_at is None or job.expires_at > _utcnow())
    )


def _background_database_url(db: AsyncSession) -> str:
    """Return the configured async DB URL for background worker tasks."""
    return settings.database_url


async def _compute_and_store_jd_embedding(job: Job) -> None:
    """Compute Gemini embedding for job description text and store on the row."""
    from app.infrastructures.ai.service import ai_service
    from app.infrastructures.qdrant.service import qdrant_service

    text = qdrant_service._build_job_document(job)
    job.jd_embedding = await ai_service.get_embeddings(text)


async def expire_due_jobs(db: AsyncSession) -> int:
    """
    Expire all active jobs whose expires_at timestamp has passed.

    Timestamp-based on purpose: the previous date-based check expired every
    job due later "today" (UTC) whenever it ran, closing postings and
    triggering final shortlisting hours before their deadline.
    """
    from app.core.cache import invalidate_candidate_read_caches_for_users
    from app.modules.applications.models import Application
    from app.modules.shortlisting.service import auto_finalize_expired_job

    result = await db.execute(
        select(Job).where(
            Job.status == JobStatus.active,
            Job.expires_at.is_not(None),
            Job.expires_at <= _utcnow(),
        )
    )
    jobs = result.scalars().all()
    if not jobs:
        return 0

    company_ids: set[uuid.UUID] = set()
    event_ids: list[uuid.UUID] = []

    for job in jobs:
        job.status = JobStatus.expired
        company_ids.add(job.company_id)
        event = JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT)
        db.add(event)
        event_ids.append(event.id)

    await db.commit()

    for job in jobs:
        await invalidate_job_detail_caches(str(job.id))
    for company_id in company_ids:
        await redis_service.delete(f"jobs:company:{company_id}")
        await invalidate_company_dashboard_caches(db, str(company_id))

    # Two-stage pipeline for auto-shortlist jobs; simple finalize for the rest.
    from app.modules.shortlisting.service import run_two_stage_for_expired_job

    for job in jobs:
        if job.auto_shortlist and not job.final_shortlist_completed:
            await run_two_stage_for_expired_job(db, job)
        else:
            await auto_finalize_expired_job(db, job)

    # Lift the candidate-side decision mask: invalidate every applicant's cached
    # application list for jobs that just expired, so their next page-load reveals
    # the outcome immediately instead of waiting up to 5 minutes for cache TTL.
    job_ids = [job.id for job in jobs]
    applicant_rows = (
        await db.execute(
            select(Application.user_id)
            .where(Application.job_id.in_(job_ids))
            .distinct()
        )
    ).all()
    applicant_user_ids = [str(row[0]) for row in applicant_rows]
    if applicant_user_ids:
        await invalidate_candidate_read_caches_for_users(applicant_user_ids)

    for event_id in event_ids:
        await process_sync_event(event_id)

    logger.info(
        "Expired {} due job(s) for {} compan(y/ies).",
        len(jobs),
        len(company_ids),
    )
    return len(jobs)


def _job_list_item_from_row(
    job: Job,
    applications_count: int | None = None,
    *,
    match_score: float | None = None,
    is_fallback: bool = False,
    has_applied: bool = False,
) -> JobListItem:
    """Build a job-list response item from a loaded job row."""
    company = CompanySnippet.model_validate(job.company)
    return JobListItem.model_validate(
        {
            "id": job.id,
            "company_id": job.company_id,
            "company": company,
            "slug": job.slug,
            "title": job.title,
            "location": job.location,
            "location_type": job.location_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "currency": job.currency,
            "status": _effective_job_status(job),
            "auto_shortlist": job.auto_shortlist,
            "shortlist_threshold": job.shortlist_threshold,
            "required_years_of_experience": job.required_years_of_experience,
            "expires_at": job.expires_at,
            "applications_count": int(applications_count or 0),
            "final_shortlist_completed": job.final_shortlist_completed,
            "hiring_completed": job.hiring_completed,
            "hired_at": job.hired_at,
            "has_applied": has_applied,
            "created_at": job.created_at,
            "match_score": match_score,
            "is_fallback": is_fallback,
        }
    )


def _job_detail_response_from_row(
    job: Job, applications_count: int | None = None, *, has_applied: bool = False
) -> JobDetailResponse:
    """Build a job-detail response from a loaded job row."""
    company = CompanySnippet.model_validate(job.company)
    return JobDetailResponse.model_validate(
        {
            "id": job.id,
            "company_id": job.company_id,
            "company": company,
            "posted_by": job.posted_by,
            "slug": job.slug,
            "title": job.title,
            "location": job.location,
            "location_type": job.location_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "currency": job.currency,
            "status": _effective_job_status(job),
            "auto_shortlist": job.auto_shortlist,
            "shortlist_threshold": job.shortlist_threshold,
            "required_years_of_experience": job.required_years_of_experience,
            "expires_at": job.expires_at,
            "overview": job.overview,
            "responsibilities": job.responsibilities,
            "requirements": job.requirements,
            "preferred_qualifications": job.preferred_qualifications,
            "benefits": job.benefits,
            "screening_questions": job.screening_questions or [],
            "applications_count": int(applications_count or 0),
            "hiring_completed": job.hiring_completed,
            "hired_at": job.hired_at,
            "has_applied": has_applied,
            "created_at": job.created_at,
            "updated_at": job.updated_at,
        }
    )


async def _get_applied_job_ids(
    db: AsyncSession,
    user: User | None,
    job_ids: list[uuid.UUID],
) -> set[uuid.UUID]:
    """Return the set of job IDs already applied to by the user."""
    if not user or user.primary_role != UserRole.candidate or not job_ids:
        return set()

    result = await db.execute(
        select(Application.job_id).where(
            Application.user_id == user.id,
            Application.job_id.in_(job_ids),
        )
    )
    return set(result.scalars().all())


async def _get_user_company_id(db: AsyncSession, user: User):
    """Return the active company ID for the authenticated recruiter."""
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
    if expires_at is None:
        expires_at = _default_expires_at()

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
        auto_shortlist=payload.auto_shortlist,
        shortlist_threshold=payload.shortlist_threshold,
        required_years_of_experience=payload.required_years_of_experience,
        expires_at=expires_at,
        overview=payload.overview,
        responsibilities=payload.responsibilities or [],
        requirements=payload.requirements or [],
        preferred_qualifications=payload.preferred_qualifications or [],
        benefits=payload.benefits or [],
        screening_questions=payload.screening_questions or [],
    )

    # guard against active jobs already expired
    if (
        job.status == JobStatus.active
        and job.expires_at
        and job.expires_at <= _utcnow()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active jobs must have an expires_at in the future.",
        )

    if job.status == JobStatus.active:
        await _compute_and_store_jd_embedding(job)

    db.add(job)
    await db.flush()  # Generates job.id without committing yet

    # 1. Transactionally write the outbox event alongside the job
    event = JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT)
    db.add(event)
    await create_custom_audit_log(
        db,
        entity_type="job",
        action_type="job_created",
        category="jobs",
        message=f"Job '{job.title}' created as draft by {user.full_name}",
        entity_id=job.id,
        company_id=company_id,
        metadata={"job_title": job.title, "status": job.status.value},
    )
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

    await redis_service.delete(f"jobs:company:{company_id}")
    await invalidate_company_dashboard_caches(db, str(company_id))

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
            selectinload(Profile.educations),
            selectinload(Profile.skills),
        )
    )
    profile = result.scalar_one_or_none()

    if not profile:
        return "Jobs hiring now across all industries and roles"

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
    education_entries = (
        ", ".join(
            " ".join(
                part
                for part in [edu.degree, edu.field_of_study, edu.institution]
                if part
            )
            for edu in profile.educations
        )
        if profile.educations
        else ""
    )

    parts = [
        f"TARGET ROLE (highest priority):\n{top_target}",
        f"PREFERRED ROLE KEYWORDS:\n{', '.join(target_roles)}",
    ]
    if profile.headline:
        parts.append(f"PROFESSIONAL HEADLINE:\n{profile.headline}")
    if profile.summary:
        parts.append(f"PROFESSIONAL SUMMARY:\n{profile.summary}")
    if experience_titles:
        parts.append(f"WORK EXPERIENCE:\n{experience_titles}")
    if education_entries:
        parts.append(f"EDUCATION:\n{education_entries}")
    if skill_names:
        parts.append(f"SKILLS:\n{skill_names}")

    return "\n\n".join(parts)


async def search_jobs(
    db: AsyncSession,
    user: "User | None",
    q: str | None,
    location: str | None,
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
    - Metadata filters (location, location_type, salary) are applied inside
      Qdrant, with smart fallback padding for under-filled pages.
    """
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
        location=location.strip() if location else None,
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
    applied_job_ids = await _get_applied_job_ids(db, user, job_ids)
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
                has_applied=job.id in applied_job_ids,
            )
        )

    # total_count is Qdrant's match count. Only fall back to counting rows
    # when this page came back short (i.e. there is no further page).
    if len(final_jobs) < size:
        return final_jobs, (page - 1) * size + len(final_jobs)
    return final_jobs, max(total_count, page * size)


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
    response = [
        _job_list_item_from_row(job, applications_count)
        for job, applications_count in rows
    ]

    return response


async def _load_job_detail_response(
    db: AsyncSession, job_id: str, user: User | None
) -> JobDetailResponse:
    """Load a job detail response from the database for cache population."""
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
    applied_job_ids = await _get_applied_job_ids(db, user, [job.id])
    return _job_detail_response_from_row(
        job,
        applications_count,
        has_applied=job.id in applied_job_ids,
    )


async def get_job_detail(
    db: AsyncSession, job_id: str, user: User | None = None
) -> JobDetailResponse:
    """Get full job details including description (SWR-cached)."""
    cache_key = (
        f"job:detail:{job_id}:candidate:{user.id}"
        if user and user.primary_role == UserRole.candidate
        else f"job:detail:{job_id}"
    )

    async def _load() -> dict:
        response = await _load_job_detail_response(db, job_id, user)
        return response.model_dump(mode="json")

    payload = await swr_get(
        cache_key,
        loader=_load,
        soft_ttl=300,
        hard_ttl=3600,
    )
    response = JobDetailResponse.model_validate(payload)
    if response.status == JobStatus.draft and not await _is_company_member(
        db, user, response.company_id
    ):
        # Drafts are private to the company until published.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found."
        )
    # Never cached: the shared payload above is visible to the public.
    if user is not None and await _is_company_member(db, user, response.company_id):
        rows = await db.execute(
            select(Application.source, func.count(Application.id))
            .where(Application.job_id == response.id)
            .group_by(Application.source)
        )
        response.source_counts = {source: count for source, count in rows.all()}
    return response


async def _is_company_member(
    db: AsyncSession, user: User | None, company_id: uuid.UUID
) -> bool:
    if user is None:
        return False
    membership_id = await db.scalar(
        select(CompanyMembership.id).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.company_id == company_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    return membership_id is not None


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
    applicant_user_ids = await get_job_applicant_user_ids(db, job_id)

    was_auto_shortlist_enabled = job.auto_shortlist
    was_open_for_auto_shortlist = _should_be_searchable(job)
    old_status = job.status
    update_data = payload.model_dump(exclude_unset=True)

    if "expires_at" in update_data:
        update_data["expires_at"] = _validate_expires_at_for_write(
            update_data["expires_at"]
        )

    for field, value in update_data.items():
        setattr(job, field, value)

    if job.status == JobStatus.expired and (
        job.expires_at is None or job.expires_at > _utcnow()
    ):
        job.expires_at = _utcnow()

    if (
        job.status == JobStatus.active
        and job.expires_at
        and job.expires_at <= _utcnow()
    ):
        job.status = JobStatus.expired

    if job.status == JobStatus.active:
        _jd_fields = {
            "title",
            "overview",
            "responsibilities",
            "requirements",
            "preferred_qualifications",
            "benefits",
            "status",
        }
        if _jd_fields & set(update_data.keys()):
            await _compute_and_store_jd_embedding(job)

    # 1. Transactionally write the outbox event alongside the update
    event = JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT)
    db.add(event)
    published = old_status == JobStatus.draft and job.status == JobStatus.active
    if published:
        await create_custom_audit_log(
            db,
            entity_type="job",
            action_type="job_published",
            category="jobs",
            message=f"Job '{job.title}' published by {user.full_name}",
            entity_id=job.id,
            company_id=company_id,
            metadata={"job_title": job.title},
        )
    else:
        changed_fields = list(update_data.keys())
        json_safe_update = payload.model_dump(mode="json", exclude_unset=True)
        await create_custom_audit_log(
            db,
            entity_type="job",
            action_type="job_edited",
            category="jobs",
            message=f"Job '{job.title}' edited by {user.full_name}",
            entity_id=job.id,
            company_id=company_id,
            diff_json={f: {"after": json_safe_update.get(f)} for f in changed_fields},
            metadata={"job_title": job.title, "changed_fields": changed_fields},
        )
    await db.commit()

    now_open_for_auto_shortlist = job.auto_shortlist and _should_be_searchable(job)
    if now_open_for_auto_shortlist and (
        not was_auto_shortlist_enabled or not was_open_for_auto_shortlist
    ):
        from app.modules.shortlisting.service import queue_auto_shortlist_backfill

        bg_tasks.add_task(
            queue_auto_shortlist_backfill, job.id, _background_database_url(db)
        )

    if old_status != JobStatus.expired and job.status == JobStatus.expired:
        from app.modules.shortlisting.service import process_job_expiry_shortlisting

        bg_tasks.add_task(
            process_job_expiry_shortlisting, job.id, _background_database_url(db)
        )

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

    response = _job_detail_response_from_row(job, applications_count)

    await invalidate_job_detail_caches(job_id)
    await redis_service.delete(f"jobs:company:{company_id}")
    await invalidate_company_dashboard_caches(db, str(company_id))
    await invalidate_company_application_caches(str(company_id))
    await invalidate_interview_list_caches(str(company_id))
    await invalidate_candidate_read_caches_for_users(applicant_user_ids)

    if published:
        await swr_set(
            f"job:detail:{job_id}",
            response.model_dump(mode="json"),
            hard_ttl=3600,
        )

    return response


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

    application_ids = list(
        await db.scalars(select(Application.id).where(Application.job_id == job.id))
    )
    applicant_user_ids = await get_job_applicant_user_ids(db, job_id)
    job_title = job.title  # capture before deletion
    job_company_id = job.company_id
    await create_custom_audit_log(
        db,
        entity_type="job",
        action_type="job_deleted",
        category="jobs",
        message=f"Job '{job_title}' deleted by {user.full_name}",
        entity_id=job_id,
        company_id=job_company_id,
        metadata={"job_title": job_title},
    )
    await db.delete(job)

    application_sync_events = [
        ApplicationSyncEvent(application_id=application_id, action=SyncAction.DELETE)
        for application_id in application_ids
    ]
    for application_sync_event in application_sync_events:
        db.add(application_sync_event)

    # 1. Transactionally write the hard-delete outbox event
    event = JobSyncEvent(job_id=uuid.UUID(str(job_id)), action=SyncAction.DELETE)
    db.add(event)
    await db.commit()

    # 2. Fast-path: trigger immediate Qdrant sync (non-blocking, after response)
    bg_tasks.add_task(process_sync_event, event.id)
    for application_sync_event in application_sync_events:
        bg_tasks.add_task(process_application_sync_event, application_sync_event.id)

    await invalidate_job_detail_caches(job_id)
    await redis_service.delete(f"jobs:company:{company_id}")
    await invalidate_company_dashboard_caches(db, str(company_id))
    await invalidate_company_application_caches(str(company_id))
    await invalidate_interview_list_caches(str(company_id))
    await invalidate_candidate_read_caches_for_users(applicant_user_ids)

    logger.info(f"Job '{job_title}' deleted by user {user.id}")


_PENDING_APPLICATION_STATUSES = (
    ApplicationStatus.applied,
    ApplicationStatus.shortlisted,
    ApplicationStatus.interview_booked,
    ApplicationStatus.interview_completed,
)


async def complete_hiring(
    db: AsyncSession,
    user: User,
    job_id: uuid.UUID,
    bg_tasks: BackgroundTasks,
) -> dict:
    """
    Mark hiring as complete for a job (one-way action).

    Side effects:
    - Sets hiring_completed=True and hired_at=now()
    - Bulk-rejects pending applications (applied/shortlisted/interview_*)
    - Leaves offer/offer_accepted/offer_declined untouched
    - Removes the job from candidate search (via re-index)
    - Emits audit + activity events
    """
    from app.modules.activity.service import create_activity_event

    company_id = await _get_user_company_id(db, user)
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.hiring_completed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Hiring has already been completed for this job.",
        )

    pending_apps_result = await db.execute(
        select(Application).where(
            Application.job_id == job_id,
            Application.status.in_(_PENDING_APPLICATION_STATUSES),
        )
    )
    pending_apps = list(pending_apps_result.scalars().all())

    job.hiring_completed = True
    job.hired_at = _utcnow()

    application_sync_event_ids: list[uuid.UUID] = []
    rejected_user_ids: set[str] = set()
    for app in pending_apps:
        app.status = ApplicationStatus.rejected
        rejected_user_ids.add(str(app.user_id))
        sync_event = ApplicationSyncEvent(
            application_id=app.id, action=SyncAction.UPSERT
        )
        db.add(sync_event)
        application_sync_event_ids.append(sync_event.id)
        await create_activity_event(
            db,
            event_type="application_rejected",
            audience="candidate",
            title=f"Application closed for {job.title}",
            description=(
                f"Hiring is complete for {job.title}; the position has been filled."
            ),
            href=f"/candidate/applications/{app.id}",
            user_id=app.user_id,
            company_id=company_id,
            application_id=app.id,
            job_id=job.id,
            actor_user_id=user.id,
            metadata={
                "status": ApplicationStatus.rejected.value,
                "reason": "position_filled",
                "job_title": job.title,
            },
        )

    job_sync_event = JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT)
    db.add(job_sync_event)

    await create_custom_audit_log(
        db,
        entity_type="job",
        action_type="job_hiring_completed",
        category="jobs",
        message=(
            f"Hiring completed for '{job.title}' by {user.full_name}; "
            f"{len(pending_apps)} pending application(s) auto-rejected."
        ),
        entity_id=job.id,
        company_id=company_id,
        metadata={
            "job_title": job.title,
            "rejected_application_count": len(pending_apps),
        },
    )

    await db.commit()

    bg_tasks.add_task(process_sync_event, job_sync_event.id)
    for sync_event_id in application_sync_event_ids:
        bg_tasks.add_task(process_application_sync_event, sync_event_id)

    applicant_user_ids = await get_job_applicant_user_ids(db, str(job_id))
    await invalidate_job_detail_caches(str(job_id))
    await redis_service.delete(f"jobs:company:{job.company_id}")
    await invalidate_company_dashboard_caches(db, str(job.company_id))
    await invalidate_company_application_caches(str(job.company_id))
    await invalidate_interview_list_caches(str(job.company_id))
    await invalidate_candidate_read_caches_for_users(applicant_user_ids)

    return {
        "hiring_completed": True,
        "hired_at": job.hired_at.isoformat(),
        "rejected_application_count": len(pending_apps),
    }
