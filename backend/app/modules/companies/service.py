import json

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import (
    get_company_applicant_user_ids,
    invalidate_candidate_read_caches_for_users,
    invalidate_company_dashboard_caches,
    invalidate_company_detail_caches,
    invalidate_job_detail_caches,
)
from app.infrastructures.redis.service import redis_service

from app.core.security import create_pending_signup_token, decode_pending_signup_token
from app.infrastructures.email.service import EmailService
from app.modules.activity.service import create_activity_event
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.jobs.models import Job
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


def _company_recruiters_cache_key(company_id: str) -> str:
    return f"company:recruiters:{company_id}"


async def _get_company_job_ids(db: AsyncSession, company_id: str) -> list[str]:
    result = await db.execute(select(Job.id).where(Job.company_id == company_id))
    return [str(job_id) for job_id in result.scalars().all()]


async def invalidate_company_content_caches(db: AsyncSession, company_id: str) -> None:
    await invalidate_company_detail_caches(db, company_id)
    await invalidate_company_dashboard_caches(db, company_id)
    await redis_service.delete_many(
        f"jobs:company:{company_id}",
        _company_recruiters_cache_key(company_id),
    )

    job_ids = await _get_company_job_ids(db, company_id)
    for job_id in job_ids:
        await invalidate_job_detail_caches(job_id)

    applicant_user_ids = await get_company_applicant_user_ids(db, company_id)
    await invalidate_candidate_read_caches_for_users(applicant_user_ids)


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

    await invalidate_company_content_caches(db, str(company.id))

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
    cache_key = _company_recruiters_cache_key(str(company.id))
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        data = json.loads(cached_data)
        return [RecruiterMemberResponse.model_validate(item) for item in data]

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
    response = [
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
    await redis_service.set(
        cache_key,
        json.dumps([item.model_dump(mode="json") for item in response]),
        ttl_seconds=300,
        ttl_jitter_seconds=60,
    )
    return response


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
    await create_activity_event(
        db,
        event_type=(
            "join_request_approved"
            if payload.status == MembershipStatus.active
            else "join_request_rejected"
        ),
        audience="admin",
        title=f"{recruiter_user.full_name} request {payload.status.value}",
        description=f"{recruiter_user.full_name}'s recruiter request was marked {payload.status.value}.",
        href="/recruiter/recruiters",
        user_id=recruiter_user.id,
        company_id=company.id,
        actor_user_id=user.id,
        metadata={"membership_id": str(membership.id)},
    )
    await create_activity_event(
        db,
        event_type=(
            "membership_activated"
            if payload.status == MembershipStatus.active
            else "membership_rejected"
        ),
        audience="recruiter",
        title=(
            f"Access approved for {company.name}"
            if payload.status == MembershipStatus.active
            else f"Access request declined for {company.name}"
        ),
        description=(
            f"Your recruiter access to {company.name} is now active."
            if payload.status == MembershipStatus.active
            else f"Your recruiter access request to {company.name} was declined."
        ),
        href="/recruiter",
        user_id=recruiter_user.id,
        company_id=company.id,
        actor_user_id=user.id,
        metadata={"membership_id": str(membership.id)},
    )
    await db.commit()
    await db.refresh(membership)
    await redis_service.delete_many(
        f"company:detail:{recruiter_user.id}",
        f"dashboard:recruiter:{recruiter_user.id}",
        f"dashboard:recruiter-admin:{recruiter_user.id}",
        _company_recruiters_cache_key(str(company.id)),
    )
    await redis_service.invalidate_patterns(
        f"dashboard:recruiter:{recruiter_user.id}:analytics:*",
        f"dashboard:recruiter-admin:{recruiter_user.id}:analytics:*",
    )
    await invalidate_company_dashboard_caches(db, str(company.id))

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

    await create_activity_event(
        db,
        event_type="membership_removed",
        audience="recruiter",
        title=f"Access removed from {company.name}",
        description=f"Your recruiter access to {company.name} was removed.",
        href="/recruiter",
        user_id=membership.user_id,
        company_id=company.id,
        actor_user_id=user.id,
        metadata={"membership_id": membership_id},
    )
    await db.delete(membership)
    await db.commit()
    await redis_service.delete_many(
        f"company:detail:{membership.user_id}",
        f"dashboard:recruiter:{membership.user_id}",
        f"dashboard:recruiter-admin:{membership.user_id}",
        _company_recruiters_cache_key(str(company.id)),
    )
    await redis_service.invalidate_patterns(
        f"dashboard:recruiter:{membership.user_id}:analytics:*",
        f"dashboard:recruiter-admin:{membership.user_id}:analytics:*",
    )
    await invalidate_company_dashboard_caches(db, str(company.id))
    logger.info(f"Company {company.name}: recruiter membership {membership_id} removed")
