from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.auth.schemas import MembershipSummary, UserResponse
from app.modules.companies.models import Company, CompanyMembership


async def list_memberships(db: AsyncSession, user_id) -> list[MembershipSummary]:
    """Every business the person belongs to, the active one first."""
    rows = await db.execute(
        select(CompanyMembership, Company)
        .join(Company, Company.id == CompanyMembership.company_id)
        .where(CompanyMembership.user_id == user_id)
        .order_by(
            (CompanyMembership.status == MembershipStatus.active).desc(),
            Company.name,
        )
    )
    return [
        MembershipSummary(
            membership_id=m.id,
            business_id=c.id,
            business_name=c.name,
            business_status=c.status,
            status_reason=c.status_reason,
            role=m.role,
            active=m.status == MembershipStatus.active,
        )
        for m, c in rows.all()
    ]


async def build_user_payload(db: AsyncSession, user: User) -> UserResponse:
    """The signed-in person as the frontend needs it for routing and the shell."""
    memberships = await list_memberships(db, user.id)
    has_applications = await db.scalar(
        select(exists().where(Application.user_id == user.id))
    )
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_email_verified=user.is_email_verified,
        is_onboarded=user.is_onboarded,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        is_platform_admin=user.is_platform_admin,
        memberships=memberships,
        active_business=next((m for m in memberships if m.active), None),
        has_applications=bool(has_applications),
    )
