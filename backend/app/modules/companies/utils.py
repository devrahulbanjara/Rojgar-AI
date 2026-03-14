from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.enums import MembershipRole, MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership


async def get_admin_company(db: AsyncSession, user: User) -> Company:
    """Get the company for an admin user, raise 404 if not found."""
    result = await db.execute(
        select(CompanyMembership).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.role == MembershipRole.admin,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active company found for this account.",
        )
    company_result = await db.execute(
        select(Company).where(Company.id == membership.company_id)
    )
    company = company_result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found.",
        )
    return company


async def get_member_company(db: AsyncSession, user: User) -> Company:
    """Get the company for any active recruiter-side membership."""
    result = await db.execute(
        select(CompanyMembership).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active company found for this account.",
        )

    company_result = await db.execute(
        select(Company).where(Company.id == membership.company_id)
    )
    company = company_result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found.",
        )
    return company
