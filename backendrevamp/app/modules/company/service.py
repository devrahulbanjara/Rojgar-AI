from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_pending_signup_token, decode_pending_signup_token
from app.integrations.email.service import EmailService
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.auth.models import Company, CompanyMembership, User
from app.modules.company.schemas import (
    JoinCompanyRequest,
    RecruiterMemberResponse,
    RegisterCompanyRequest,
    UpdateRecruiterStatusRequest,
)


# ---------------------------------------------------------------------------
# Stage 2 helpers (called immediately after POST /auth/signup)
# No database rows are written here.  Everything is bundled into a new
# pending-signup JWT and the verification email is (re-)sent.
# The actual User / Company / CompanyMembership rows are created in
# POST /auth/verify-email when the user clicks the link.
# ---------------------------------------------------------------------------


async def register_company(
    db: AsyncSession,
    payload: RegisterCompanyRequest,
    bg_tasks: BackgroundTasks,
) -> None:
    """
    Stage 2 of the company signup flow.

    Decodes the pending-signup token returned by POST /auth/signup, validates
    the role, bundles the company details into a new ``pending_company`` JWT,
    and resends the verification email containing the updated link.
    """
    data = decode_pending_signup_token(payload.setup_token)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired setup token. Please sign up again.",
        )

    if data.get("primary_role") != UserRole.company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with the 'company' role can register a company.",
        )

    email: str = data["email"]

    # Guard: if the user somehow already verified before finishing setup
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email has already been verified. Please log in.",
        )

    # Build a new pending token that carries the company details
    company_pending_token = create_pending_signup_token({
        "type": "pending_company",
        "full_name": data["full_name"],
        "email": email,
        "password_hash": data["password_hash"],
        "primary_role": data["primary_role"],
        "company_name": payload.company_name,
        "industry": payload.industry,
        "company_size": payload.company_size,
        "website": payload.website,
        "location": payload.location,
        "description": payload.description,
    })

    bg_tasks.add_task(EmailService.send_verification, email, company_pending_token)
    logger.info(f"Company signup verification email sent to {email}")


async def request_join_company(
    db: AsyncSession,
    payload: JoinCompanyRequest,
    bg_tasks: BackgroundTasks,
) -> None:
    """
    Stage 2 of the recruiter signup flow.

    Validates that the target company exists, then bundles the join-request
    details into a new ``pending_recruiter`` JWT and resends the verification
    email.  The pending CompanyMembership is created inside verify_email.
    """
    data = decode_pending_signup_token(payload.setup_token)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired setup token. Please sign up again.",
        )

    if data.get("primary_role") != UserRole.recruiter:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with the 'recruiter' role can request to join a company.",
        )

    email: str = data["email"]

    # Verify the company exists now so the user gets immediate feedback
    result = await db.execute(
        select(Company).where(Company.name == payload.company_name)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No company named '{payload.company_name}' was found on ConvexHire.",
        )

    # Guard: email already verified
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email has already been verified. Please log in.",
        )

    recruiter_pending_token = create_pending_signup_token({
        "type": "pending_recruiter",
        "full_name": data["full_name"],
        "email": email,
        "password_hash": data["password_hash"],
        "primary_role": data["primary_role"],
        "join_company_name": payload.company_name,
        "message": payload.message,
    })

    bg_tasks.add_task(EmailService.send_verification, email, recruiter_pending_token)
    logger.info(f"Recruiter join-request verification email sent to {email}")


# ---------------------------------------------------------------------------
# Recruiter management (company-admin only)
# ---------------------------------------------------------------------------


async def _get_admin_company(db: AsyncSession, user: User) -> Company:
    """Return the Company that this company-admin user owns; 404 if not set up."""
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


async def list_company_recruiters(
    db: AsyncSession, user: User
) -> list[RecruiterMemberResponse]:
    """Return all recruiter memberships for the company admin's company."""
    company = await _get_admin_company(db, user)
    result = await db.execute(
        select(CompanyMembership, User)
        .join(User, CompanyMembership.user_id == User.id)
        .where(
            CompanyMembership.company_id == company.id,
            CompanyMembership.role == MembershipRole.recruiter,
        )
        .order_by(CompanyMembership.created_at.desc())
    )
    rows = result.all()
    return [
        RecruiterMemberResponse(
            membership_id=m.id,
            user_id=u.id,
            full_name=u.full_name,
            email=u.email,
            avatar_url=u.avatar_url,
            status=m.status,
            joined_at=m.created_at,
        )
        for m, u in rows
    ]


async def update_recruiter_status(
    db: AsyncSession,
    user: User,
    membership_id: str,
    payload: UpdateRecruiterStatusRequest,
) -> RecruiterMemberResponse:
    """Approve or reject a recruiter's join request."""
    company = await _get_admin_company(db, user)

    if payload.status not in (MembershipStatus.active, MembershipStatus.rejected):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' (approve) or 'rejected' (reject).",
        )

    result = await db.execute(
        select(CompanyMembership, User)
        .join(User, CompanyMembership.user_id == User.id)
        .where(
            CompanyMembership.id == membership_id,
            CompanyMembership.company_id == company.id,
            CompanyMembership.role == MembershipRole.recruiter,
        )
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter membership not found.",
        )

    membership, recruiter_user = row
    membership.status = payload.status
    await db.commit()
    await db.refresh(membership)

    logger.info(
        f"Company {company.name}: recruiter {recruiter_user.email} status → {payload.status}"
    )
    return RecruiterMemberResponse(
        membership_id=membership.id,
        user_id=recruiter_user.id,
        full_name=recruiter_user.full_name,
        email=recruiter_user.email,
        avatar_url=recruiter_user.avatar_url,
        status=membership.status,
        joined_at=membership.created_at,
    )


async def remove_recruiter(
    db: AsyncSession, user: User, membership_id: str
) -> None:
    """Remove a recruiter from the company (delete their membership)."""
    company = await _get_admin_company(db, user)

    result = await db.execute(
        select(CompanyMembership).where(
            CompanyMembership.id == membership_id,
            CompanyMembership.company_id == company.id,
            CompanyMembership.role == MembershipRole.recruiter,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter membership not found.",
        )

    await db.delete(membership)
    await db.commit()
    logger.info(
        f"Company {company.name}: recruiter membership {membership_id} removed"
    )
