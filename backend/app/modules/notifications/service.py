from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import NotificationResponse
from app.modules.recruiter_preferences.models import RecruiterPreference


def _utcnow() -> datetime:
    """Return the current UTC datetime."""
    return datetime.now(timezone.utc)


async def _user_allows_in_app_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> bool:
    """Return whether the user allows in-app notifications."""
    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None:
        return False

    preference = await db.scalar(
        select(RecruiterPreference).where(RecruiterPreference.user_id == user_id)
    )
    if preference is None:
        return True
    return preference.notification_in_app_enabled


async def create_notification(
    db: AsyncSession,
    *,
    kind: str,
    title: str,
    body: str | None,
    href: str | None,
    user_id: uuid.UUID | None = None,
    company_id: uuid.UUID | None = None,
    activity_event=None,
) -> Notification:
    """Create in-app notifications for one user or all active company members."""
    if user_id is None and company_id is not None:
        result = await db.execute(
            select(CompanyMembership.user_id).where(
                CompanyMembership.company_id == company_id,
                CompanyMembership.status == MembershipStatus.active,
            )
        )
        member_ids = result.scalars().all()
        created: Notification | None = None
        for member_id in member_ids:
            if not await _user_allows_in_app_notifications(db, member_id):
                continue
            created = Notification(
                kind=kind,
                title=title,
                body=body,
                href=href,
                user_id=member_id,
                company_id=company_id,
                activity_event_id=getattr(activity_event, "id", None),
            )
            db.add(created)
        await db.flush()
        if created is None:
            return Notification(
                kind=kind,
                title=title,
                body=body,
                href=href,
                company_id=company_id,
                activity_event_id=getattr(activity_event, "id", None),
            )
        return created

    notification = Notification(
        kind=kind,
        title=title,
        body=body,
        href=href,
        user_id=user_id,
        company_id=company_id,
        activity_event_id=getattr(activity_event, "id", None),
    )
    if user_id is not None and not await _user_allows_in_app_notifications(db, user_id):
        return notification
    db.add(notification)
    await db.flush()
    return notification


async def list_notifications(
    db: AsyncSession,
    user: User,
    *,
    limit: int = 50,
) -> list[NotificationResponse]:
    """List notifications for a user, newest first."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return [
        NotificationResponse.model_validate(item) for item in result.scalars().all()
    ]


async def mark_notification_read(
    db: AsyncSession,
    user: User,
    notification_id: str,
) -> NotificationResponse:
    """Mark a single notification as read for a user."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    notification.is_read = True
    notification.read_at = _utcnow()
    await db.commit()
    await db.refresh(notification)
    return NotificationResponse.model_validate(notification)


async def mark_all_notifications_read(db: AsyncSession, user: User) -> int:
    """Mark all unread notifications as read for a user."""
    result: CursorResult = await db.execute(  # type: ignore[assignment]
        update(Notification)
        .where(Notification.is_read.is_(False), Notification.user_id == user.id)
        .values(is_read=True, read_at=_utcnow())
    )
    await db.commit()
    return int(result.rowcount or 0)
