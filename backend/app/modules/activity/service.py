from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.activity.models import ActivityEvent
from app.modules.activity.schemas import ActivityEventResponse
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.notifications.service import create_notification


async def create_activity_event(
    db: AsyncSession,
    *,
    event_type: str,
    audience: str,
    title: str,
    description: str | None = None,
    href: str | None = None,
    user_id: uuid.UUID | None = None,
    company_id: uuid.UUID | None = None,
    application_id: uuid.UUID | None = None,
    job_id: uuid.UUID | None = None,
    interview_id: uuid.UUID | None = None,
    draft_id: uuid.UUID | None = None,
    actor_user_id: uuid.UUID | None = None,
    metadata: dict | None = None,
    create_in_app_notification: bool = True,
) -> ActivityEvent:
    event = ActivityEvent(
        event_type=event_type,
        audience=audience,
        title=title,
        description=description,
        href=href,
        user_id=user_id,
        company_id=company_id,
        application_id=application_id,
        job_id=job_id,
        interview_id=interview_id,
        draft_id=draft_id,
        actor_user_id=actor_user_id,
        metadata=metadata,
    )
    db.add(event)
    await db.flush()

    if create_in_app_notification:
        await create_notification(
            db,
            activity_event=event,
            kind=event_type,
            title=title,
            body=description or title,
            href=href,
            user_id=user_id,
            company_id=company_id,
        )

    return event


async def list_my_activity(
    db: AsyncSession,
    user: User,
    *,
    limit: int = 25,
) -> list[ActivityEventResponse]:
    result = await db.execute(
        select(ActivityEvent)
        .where(
            or_(
                ActivityEvent.user_id == user.id, ActivityEvent.actor_user_id == user.id
            )
        )
        .order_by(ActivityEvent.created_at.desc())
        .limit(limit)
    )
    return [
        ActivityEventResponse.model_validate(item) for item in result.scalars().all()
    ]


async def _get_active_company_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
    result = await db.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company_id = result.scalar_one_or_none()
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active company membership required.",
        )
    return company_id


async def list_company_activity(
    db: AsyncSession,
    user: User,
    *,
    limit: int = 40,
) -> list[ActivityEventResponse]:
    company_id = await _get_active_company_id(db, user.id)
    result = await db.execute(
        select(ActivityEvent)
        .where(ActivityEvent.company_id == company_id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(limit)
    )
    return [
        ActivityEventResponse.model_validate(item) for item in result.scalars().all()
    ]


async def list_application_timeline(
    db: AsyncSession,
    *,
    application_id: str,
) -> list[ActivityEventResponse]:
    result = await db.execute(
        select(ActivityEvent)
        .where(ActivityEvent.application_id == application_id)
        .order_by(ActivityEvent.created_at.asc())
    )
    return [
        ActivityEventResponse.model_validate(item) for item in result.scalars().all()
    ]
