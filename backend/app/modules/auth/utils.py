from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.enums import MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership


async def get_membership_status(
    db: AsyncSession, user: User
) -> MembershipStatus | None:
    """Get membership status for recruiters and recruiter_admins, None for other roles."""
    if user.primary_role not in (UserRole.recruiter, UserRole.recruiter_admin):
        return None
    result = await db.execute(
        select(CompanyMembership)
        .where(CompanyMembership.user_id == user.id)
        .order_by(CompanyMembership.created_at.desc())
        .limit(1)
    )
    membership = result.scalar_one_or_none()
    return membership.status if membership else None


async def build_user_dict(db: AsyncSession, user: User) -> dict:
    """Build user dict with membership status."""
    ms = await get_membership_status(db, user)
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "primary_role": user.primary_role,
        "is_email_verified": user.is_email_verified,
        "is_onboarded": user.is_onboarded,
        "avatar_url": user.avatar_url,
        "membership_status": ms,
    }
