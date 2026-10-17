from __future__ import annotations


from sqlalchemy import select
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


async def invalidate_interview_list_caches(company_id: str) -> None:
    """Invalidate interview list caches for a company."""
    await redis_service.invalidate_pattern(f"interviews:company:{company_id}:*")


async def invalidate_job_detail_caches(job_id: str) -> None:
    """Delete the shared job detail cache entry."""
    await redis_service.delete(f"job:detail:{job_id}")
