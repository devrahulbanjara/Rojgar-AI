from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructures.redis.service import redis_service

from app.core.security import create_pending_signup_token, decode_pending_signup_token
from app.infrastructures.email.service import EmailService
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.companies.schemas import (
    CompanyResponse,
    JoinCompanyRequest,
    RecruiterMemberResponse,
    RegisterCompanyRequest,
    UpdateCompanyRequest,
    UpdateRecruiterStatusRequest,
)
from app.modules.companies.utils import get_admin_company, get_member_company


def _company_to_response(company: Company) -> CompanyResponse:
    return CompanyResponse.model_validate(company)


async def get_my_company(db: AsyncSession, user: User) -> CompanyResponse:
    cache_key = f"company:detail:{user.id}"

    # 1. Try Cache
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return CompanyResponse.model_validate_json(cached_data)

    company = await get_member_company(db, user)
    response = _company_to_response(company)

    # 3. Save to Cache (TTL 1 hour)
    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=3600)

    return response


async def update_my_company(
    db: AsyncSession, user: User, payload: UpdateCompanyRequest
) -> CompanyResponse:
    company = await get_admin_company(db, user)
    update_data = payload.model_dump(exclude_unset=True)

    organizer_email = update_data.get("cal_organizer_email")
    if organizer_email is not None:
        organizer_email = organizer_email.strip().lower() or None
        update_data["cal_organizer_email"] = organizer_email

        if organizer_email is not None:
            existing_company = await db.scalar(
                select(Company).where(
                    func.lower(Company.cal_organizer_email) == organizer_email,
                    Company.id != company.id,
                )
            )
            if existing_company is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "That Cal organizer email is already connected to another company."
                    ),
                )

    booking_url = update_data.get("cal_booking_url")
    if booking_url is not None:
        update_data["cal_booking_url"] = booking_url.strip() or None

    for field, value in update_data.items():
        setattr(company, field, value)

    await db.commit()
    await db.refresh(company)
    response = _company_to_response(company)

    # INVALIDATE CACHE
    await redis_service.invalidate_pattern("company:detail:*")

    logger.info("Company {} updated by {}", company.id, user.id)
    return response


async def register_company(
    db: AsyncSession,
    payload: RegisterCompanyRequest,
    bg_tasks: BackgroundTasks,
) -> None:
    """Decode token, validate company role, bundle company details, and resend verification email."""
    data = decode_pending_signup_token(payload.setup_token)
    if not data or data.get("type") != "setup":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session for company registration.",
        )

    if data.get("primary_role") != UserRole.recruiter_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with the 'recruiter_admin' role can register a company.",
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
    company_pending_token = create_pending_signup_token(
        {
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
        }
    )

    bg_tasks.add_task(EmailService.send_verification, email, company_pending_token)
    logger.info(f"Company signup verification email sent to {email}")


async def request_join_company(
    db: AsyncSession,
    payload: JoinCompanyRequest,
    bg_tasks: BackgroundTasks,
) -> None:
    """Validate company exists, bundle join request details, and resend verification email."""
    data = decode_pending_signup_token(payload.setup_token)
    if not data or data.get("type") != "setup":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session for join request.",
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

    recruiter_pending_token = create_pending_signup_token(
        {
            "type": "pending_recruiter",
            "full_name": data["full_name"],
            "email": email,
            "password_hash": data["password_hash"],
            "primary_role": data["primary_role"],
            "join_company_name": payload.company_name,
            "message": payload.message,
        }
    )

    bg_tasks.add_task(EmailService.send_verification, email, recruiter_pending_token)
    logger.info(f"Recruiter join-request verification email sent to {email}")


async def list_company_recruiters(
    db: AsyncSession, user: User
) -> list[RecruiterMemberResponse]:
    """List all recruiters for the admin's company."""
    company = await get_admin_company(db, user)
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
    """Update recruiter membership status (approve or reject)."""
    company = await get_admin_company(db, user)

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


async def remove_recruiter(db: AsyncSession, user: User, membership_id: str) -> None:
    """Delete recruiter membership from company."""
    company = await get_admin_company(db, user)

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
    logger.info(f"Company {company.name}: recruiter membership {membership_id} removed")
