"""Team: members with a role per business, joined only through invite links."""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidate_company_dashboard_caches
from app.core.config import settings
from app.infrastructures.redis.service import redis_service
from app.modules.audit.service import create_custom_audit_log
from app.modules.auth.enums import MembershipRole, MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import BusinessInvite, Company, CompanyMembership
from app.modules.companies.schemas import (
    InviteCreated,
    InvitePreview,
    InviteResponse,
    MemberResponse,
)
from app.modules.entitlements.service import ensure_can_add_member

INVITE_TTL = timedelta(days=7)

ROLE_LABELS = {
    MembershipRole.owner: "Owner",
    MembershipRole.manager: "Manager",
    MembershipRole.interviewer: "Interviewer",
}


def _now() -> datetime:
    return datetime.now(UTC)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def invite_url(token: str) -> str:
    return f"{settings.frontend_url}/invite/{token}"


async def forget_business_caches(user_id: uuid.UUID) -> None:
    """Per-person caches that depend on which business they work in."""
    await redis_service.delete_many(
        f"company:detail:{user_id}",
        f"dashboard:recruiter:{user_id}",
    )
    await redis_service.invalidate_patterns(
        f"dashboard:recruiter:{user_id}:analytics:*"
    )


async def activate_membership(db: AsyncSession, membership: CompanyMembership) -> None:
    """Make this the person's working business; their others become inactive."""
    await db.execute(
        update(CompanyMembership)
        .where(
            CompanyMembership.user_id == membership.user_id,
            CompanyMembership.id != membership.id,
            CompanyMembership.status == MembershipStatus.active,
        )
        .values(status=MembershipStatus.inactive)
        .execution_options(synchronize_session="fetch")
    )
    await db.flush()
    membership.status = MembershipStatus.active
    await db.flush()
    await forget_business_caches(membership.user_id)


# ---------------------------------------------------------------- members


async def list_members(
    db: AsyncSession, business_id: uuid.UUID
) -> list[MemberResponse]:
    rows = await db.execute(
        select(CompanyMembership, User)
        .join(User, User.id == CompanyMembership.user_id)
        .where(CompanyMembership.company_id == business_id)
        .order_by(CompanyMembership.created_at)
    )
    return [
        MemberResponse(
            membership_id=m.id,
            user_id=u.id,
            full_name=u.full_name,
            email=u.email,
            phone=u.phone,
            avatar_url=u.avatar_url,
            role=m.role,
            joined_at=m.created_at,
        )
        for m, u in rows.all()
    ]


async def _member(
    db: AsyncSession, business_id: uuid.UUID, membership_id: str
) -> tuple[CompanyMembership, User]:
    row = (
        await db.execute(
            select(CompanyMembership, User)
            .join(User, User.id == CompanyMembership.user_id)
            .where(
                CompanyMembership.id == membership_id,
                CompanyMembership.company_id == business_id,
            )
        )
    ).first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Team member not found.")
    return row[0], row[1]


async def _owner_count(db: AsyncSession, business_id: uuid.UUID) -> int:
    return await db.scalar(
        select(func.count(CompanyMembership.id)).where(
            CompanyMembership.company_id == business_id,
            CompanyMembership.role == MembershipRole.owner,
        )
    )


_LAST_OWNER = "A business needs at least one owner. Make someone else an owner first."


async def change_role(
    db: AsyncSession, business: Company, membership_id: str, role: MembershipRole
) -> MemberResponse:
    membership, person = await _member(db, business.id, membership_id)
    if (
        membership.role == MembershipRole.owner
        and role != MembershipRole.owner
        and await _owner_count(db, business.id) <= 1
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, detail=_LAST_OWNER)
    before = membership.role
    membership.role = role
    await create_custom_audit_log(
        db,
        entity_type="membership",
        action_type="member_role_changed",
        category="auth",
        message=f"{person.full_name or person.phone} is now {ROLE_LABELS[role]}",
        entity_id=membership.id,
        company_id=business.id,
        target_user_id=person.id,
        before_json={"role": before.value},
        after_json={"role": role.value},
    )
    await db.commit()
    await forget_business_caches(person.id)
    return next(
        m
        for m in await list_members(db, business.id)
        if m.membership_id == membership.id
    )


async def remove_member(
    db: AsyncSession, business: Company, membership_id: str
) -> None:
    membership, person = await _member(db, business.id, membership_id)
    if (
        membership.role == MembershipRole.owner
        and await _owner_count(db, business.id) <= 1
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, detail=_LAST_OWNER)
    await create_custom_audit_log(
        db,
        entity_type="membership",
        action_type="member_removed",
        category="auth",
        message=f"Removed {person.full_name or person.phone} from the team",
        entity_id=membership.id,
        company_id=business.id,
        target_user_id=person.id,
        metadata={"role": membership.role.value},
    )
    was_active = membership.status == MembershipStatus.active
    await db.delete(membership)
    await db.flush()
    if was_active:
        # Fall back to another business the person belongs to, if any.
        other = await db.scalar(
            select(CompanyMembership)
            .where(CompanyMembership.user_id == person.id)
            .order_by(CompanyMembership.created_at.desc())
            .limit(1)
        )
        if other is not None:
            await activate_membership(db, other)
    await db.commit()
    await forget_business_caches(person.id)
    await invalidate_company_dashboard_caches(db, str(business.id))


# ---------------------------------------------------------------- invites


def _invite_response(invite: BusinessInvite, inviter: User | None) -> InviteResponse:
    return InviteResponse(
        id=invite.id,
        role=invite.role,
        expires_at=invite.expires_at,
        created_at=invite.created_at,
        created_by_name=inviter.full_name if inviter else None,
    )


async def create_invite(
    db: AsyncSession, business: Company, inviter: User, role: MembershipRole
) -> InviteCreated:
    # Say so now rather than when the person opens the link.
    await ensure_can_add_member(db, business.id)
    token = secrets.token_urlsafe(24)
    invite = BusinessInvite(
        company_id=business.id,
        role=role,
        token_hash=_hash_token(token),
        created_by_user_id=inviter.id,
        expires_at=_now() + INVITE_TTL,
    )
    db.add(invite)
    await db.flush()
    await create_custom_audit_log(
        db,
        entity_type="business_invite",
        action_type="invite_created",
        category="auth",
        message=f"Invite link created for a new {ROLE_LABELS[role]}",
        entity_id=invite.id,
        company_id=business.id,
        metadata={"role": role.value},
    )
    await db.commit()
    await db.refresh(invite)
    return InviteCreated(
        **_invite_response(invite, inviter).model_dump(), url=invite_url(token)
    )


async def list_open_invites(
    db: AsyncSession, business_id: uuid.UUID
) -> list[InviteResponse]:
    rows = await db.execute(
        select(BusinessInvite, User)
        .outerjoin(User, User.id == BusinessInvite.created_by_user_id)
        .where(
            BusinessInvite.company_id == business_id,
            BusinessInvite.accepted_at.is_(None),
            BusinessInvite.revoked_at.is_(None),
            BusinessInvite.expires_at > _now(),
        )
        .order_by(BusinessInvite.created_at.desc())
    )
    return [_invite_response(invite, inviter) for invite, inviter in rows.all()]


async def revoke_invite(db: AsyncSession, business: Company, invite_id: str) -> None:
    invite = await db.scalar(
        select(BusinessInvite).where(
            BusinessInvite.id == invite_id, BusinessInvite.company_id == business.id
        )
    )
    if invite is None or invite.accepted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Invite not found.")
    invite.revoked_at = _now()
    await create_custom_audit_log(
        db,
        entity_type="business_invite",
        action_type="invite_revoked",
        category="auth",
        message="Invite link cancelled",
        entity_id=invite.id,
        company_id=business.id,
    )
    await db.commit()


async def _invite_by_token(db: AsyncSession, token: str) -> BusinessInvite:
    invite = await db.scalar(
        select(BusinessInvite).where(BusinessInvite.token_hash == _hash_token(token))
    )
    if invite is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="This invite link doesn't work."
        )
    return invite


def _invite_problem(invite: BusinessInvite) -> str | None:
    if invite.revoked_at is not None:
        return "This invite was cancelled. Ask for a new link."
    if invite.accepted_at is not None:
        return "This invite was already used. Ask for a new link."
    if invite.expires_at <= _now():
        return "This invite has expired. Ask for a new link."
    return None


async def preview_invite(db: AsyncSession, token: str) -> InvitePreview:
    invite = await _invite_by_token(db, token)
    business = await db.get(Company, invite.company_id)
    inviter = (
        await db.get(User, invite.created_by_user_id)
        if invite.created_by_user_id
        else None
    )
    return InvitePreview(
        business_name=business.name,
        role=invite.role,
        invited_by=inviter.full_name if inviter else None,
        problem=_invite_problem(invite),
    )


async def accept_invite(db: AsyncSession, token: str, user: User) -> uuid.UUID:
    """Join the business with the invite's role; it becomes the active business."""
    invite = await _invite_by_token(db, token)
    problem = _invite_problem(invite)
    if problem:
        raise HTTPException(status.HTTP_410_GONE, detail=problem)

    membership = await db.scalar(
        select(CompanyMembership).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.company_id == invite.company_id,
        )
    )
    if membership is None:
        await ensure_can_add_member(db, invite.company_id)
        membership = CompanyMembership(
            user_id=user.id,
            company_id=invite.company_id,
            role=invite.role,
            status=MembershipStatus.inactive,
        )
        db.add(membership)
        await db.flush()
    invite.accepted_at = _now()
    invite.accepted_by_user_id = user.id
    await activate_membership(db, membership)
    await create_custom_audit_log(
        db,
        entity_type="membership",
        action_type="invite_accepted",
        category="auth",
        message=f"{user.full_name or user.phone} joined as {ROLE_LABELS[membership.role]}",
        entity_id=membership.id,
        company_id=invite.company_id,
        target_user_id=user.id,
        metadata={"invite_id": str(invite.id), "role": membership.role.value},
    )
    await db.commit()
    await invalidate_company_dashboard_caches(db, str(invite.company_id))
    return invite.company_id
