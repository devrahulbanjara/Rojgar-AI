from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership


async def get_member_company(db: AsyncSession, user: User) -> Company:
    """The business the person is working in now."""
    company = await db.scalar(
        select(Company)
        .join(CompanyMembership, CompanyMembership.company_id == Company.id)
        .where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active company found for this account.",
        )
    return company
