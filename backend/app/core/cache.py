from __future__ import annotations

from collections.abc import Iterable, Sequence

from sqlalchemy import distinct, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructures.redis.service import redis_service
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import CompanyMembership


async def _get_active_company_member_ids(
    db: AsyncSession, company_id: str
) -> list[str]:
    """Return user IDs of all active members for a company."""
    result = await db.execute(
        select(CompanyMembership.user_id).where(
            CompanyMembership.company_id == company_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    return [str(user_id) for user_id in result.scalars().all()]


async def invalidate_candidate_read_caches(user_id: str) -> None:
    """Delete candidate dashboard and application-list cache entries for a user."""
    await redis_service.delete(f"dashboard:candidate:{user_id}")
    await redis_service.invalidate_patterns(
        f"dashboard:candidate:{user_id}:analytics:*",
        f"applications:candidate:{user_id}:*",
    )


async def invalidate_profile_read_caches(user_id: str) -> None:
    """Delete profile detail and candidate dashboard caches for a user."""
    await redis_service.delete_many(
        f"profile:detail:{user_id}",
        f"dashboard:candidate:{user_id}",
    )
    await redis_service.invalidate_pattern(f"dashboard:candidate:{user_id}:analytics:*")


async def invalidate_candidate_read_caches_for_users(user_ids: Iterable[str]) -> None:
    """Batch invalidate candidate-facing caches for a set of user IDs."""
    seen_ids = {str(user_id) for user_id in user_ids}
    for user_id in seen_ids:
        await invalidate_candidate_read_caches(user_id)


async def invalidate_company_dashboard_caches(
    db: AsyncSession, company_id: str
) -> None:
    """Delete recruiter dashboard caches for a company."""
    member_ids = await _get_active_company_member_ids(db, company_id)
    if not member_ids:
        return

    keys: list[str] = []
    for member_id in member_ids:
        keys.append(f"dashboard:recruiter:{member_id}")

    await redis_service.delete_many(*keys)
    await redis_service.invalidate_patterns(
        *(f"dashboard:recruiter:{member_id}:analytics:*" for member_id in member_ids),
    )


async def invalidate_company_detail_caches(db: AsyncSession, company_id: str) -> None:
    """Delete cached company-detail entries for all active members."""
    member_ids = await _get_active_company_member_ids(db, company_id)
    if not member_ids:
        return

    await redis_service.delete_many(
        *(f"company:detail:{member_id}" for member_id in member_ids)
    )


async def invalidate_company_application_caches(
    company_id: str, application_id: str | None = None
) -> None:
    """Invalidate company inbox caches and optionally one candidate-detail cache."""
    await redis_service.invalidate_patterns(
        f"applications:company:{company_id}:job:*",
        f"applications:company:{company_id}:candidates:*",
    )
    if application_id is not None:
        await redis_service.delete(
            f"applications:company:{company_id}:candidate-detail:{application_id}"
        )


async def invalidate_application_candidate_detail_caches(
    application_ids: Sequence[str], company_id: str | None = None
) -> None:
    """Invalidate recruiter candidate-detail caches for one or more applications."""
    patterns = [
        (
            f"applications:company:{company_id}:candidate-detail:{application_id}"
            if company_id is not None
            else f"applications:company:*:candidate-detail:{application_id}"
        )
        for application_id in {
            str(application_id) for application_id in application_ids
        }
    ]
    if patterns:
        await redis_service.invalidate_patterns(*patterns)


async def invalidate_interview_list_caches(company_id: str) -> None:
    """Invalidate interview list caches for a company."""
    await redis_service.invalidate_pattern(f"interviews:company:{company_id}:*")


async def invalidate_job_detail_caches(job_id: str) -> None:
    """Delete shared and per-candidate job detail cache entries."""
    await redis_service.delete(f"job:detail:{job_id}")
    await redis_service.invalidate_pattern(f"job:detail:{job_id}:candidate:*")


async def invalidate_resume_caches(user_id: str, resume_id: str | None = None) -> None:
    """Delete a user's resume list cache and optionally one resume detail cache."""
    keys = [f"resumes:list:{user_id}"]
    if resume_id is not None:
        keys.append(f"resume:detail:{resume_id}:user:{user_id}")
    await redis_service.delete_many(*keys)


async def get_company_applicant_user_ids(
    db: AsyncSession, company_id: str
) -> list[str]:
    """Return distinct user IDs who have applied to any job at the company."""
    from app.modules.applications.models import Application
    from app.modules.jobs.models import Job

    result = await db.execute(
        select(distinct(Application.user_id))
        .join(Job, Job.id == Application.job_id)
        .where(Job.company_id == company_id)
    )
    return [str(user_id) for user_id in result.scalars().all()]


async def get_job_applicant_user_ids(db: AsyncSession, job_id: str) -> list[str]:
    """Return distinct user IDs who have applied to a specific job."""
    from app.modules.applications.models import Application

    result = await db.execute(
        select(distinct(Application.user_id)).where(Application.job_id == job_id)
    )
    return [str(user_id) for user_id in result.scalars().all()]


async def get_resume_application_ids(db: AsyncSession, resume_id: str) -> list[str]:
    """Return application IDs that currently reference a given resume."""
    from app.modules.applications.models import Application

    result = await db.execute(
        select(Application.id).where(Application.resume_id == resume_id)
    )
    return [str(application_id) for application_id in result.scalars().all()]
