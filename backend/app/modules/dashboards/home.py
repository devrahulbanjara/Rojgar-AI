"""Recruiter "Today" home: the work waiting on the recruiter, per role.

Unlike the analytics endpoints this is uncached on purpose — it is the screen
recruiters act from, so it must reflect their last click.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import and_, case, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipRole, MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.dashboards.schemas import (
    DraftRole,
    HomeInterview,
    RecruiterHomeResponse,
    RoleCard,
)
from app.modules.dashboards.service import _get_company_context
from app.modules.interviews.models import Interview, InterviewStatus
from app.modules.jobs.models import Job
from app.shared.enums import ApplicationStatus, JobStatus

DEFAULT_TIMEZONE = "Asia/Kathmandu"
# Closed roles stay on Today while they still have work, but not forever.
CLOSED_ROLE_WINDOW_DAYS = 30


def _resolve_tz(tz: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(tz or DEFAULT_TIMEZONE)
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo(DEFAULT_TIMEZONE)


def _first_name(full_name: str | None) -> str:
    parts = (full_name or "").split()
    return parts[0] if parts else "there"


async def _interviews_between(
    db: AsyncSession, company_id: uuid.UUID, start: datetime, end: datetime, limit: int
) -> list[HomeInterview]:
    rows = await db.execute(
        select(
            Interview.id.label("interview_id"),
            Interview.application_id,
            Application.job_id,
            Interview.candidate_name,
            Job.title.label("job_title"),
            Interview.start_time,
            Interview.end_time,
            Interview.location,
        )
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(
            Job.company_id == company_id,
            Interview.start_time >= start,
            Interview.start_time < end,
            Application.status == ApplicationStatus.interview_booked,
            Interview.status == InterviewStatus.booked,
        )
        .order_by(Interview.start_time.asc())
        .limit(limit)
    )
    return [HomeInterview.model_validate(row._mapping) for row in rows.all()]


async def _role_cards(
    db: AsyncSession, company_id: uuid.UUID, now: datetime, *, everything: bool = False
) -> list[RoleCard]:
    """Per-role counts. Today only wants roles with live work; the jobs list
    (``everything=True``) wants every role the company has."""
    past_interview = exists().where(
        Interview.application_id == Application.id, Interview.start_time < now
    )
    future_interview = exists().where(
        Interview.application_id == Application.id, Interview.start_time >= now
    )
    booked = Application.status == ApplicationStatus.interview_booked

    def count_if(condition):
        return func.coalesce(func.sum(case((condition, 1), else_=0)), 0)

    today_filter = [
        Job.hiring_completed.is_(False),
        or_(
            Job.status == JobStatus.active,
            and_(
                Job.status == JobStatus.expired,
                Job.expires_at >= now - timedelta(days=CLOSED_ROLE_WINDOW_DAYS),
            ),
        ),
    ]
    rows = await db.execute(
        select(
            Job.id.label("job_id"),
            Job.title,
            Job.status,
            Job.location,
            Job.location_type,
            Job.created_at,
            Job.expires_at,
            Job.hiring_completed,
            func.count(Application.id).label("applicants"),
            count_if(Application.status == ApplicationStatus.applied).label(
                "to_review"
            ),
            count_if(
                and_(
                    Application.status == ApplicationStatus.applied,
                    Application.score >= Job.shortlist_threshold,
                )
            ).label("strong"),
            count_if(
                and_(
                    Application.status == ApplicationStatus.shortlisted,
                    Application.shortlist_notified.is_(False),
                )
            ).label("to_contact"),
            count_if(and_(booked, future_interview)).label("upcoming_interviews"),
            count_if(
                or_(
                    Application.status == ApplicationStatus.interview_completed,
                    and_(booked, past_interview, ~future_interview),
                )
            ).label("to_decide"),
        )
        .select_from(Job)
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.company_id == company_id, *([] if everything else today_filter))
        .group_by(Job.id)
    )

    cards = [RoleCard(**row._mapping, share_slug=str(row.job_id)) for row in rows.all()]
    if everything:
        cards.sort(key=lambda card: card.created_at, reverse=True)
        return cards
    # Closed roles only matter while something is still waiting on them.
    cards = [
        card
        for card in cards
        if card.status == JobStatus.active
        or card.to_review + card.to_contact + card.to_decide > 0
    ]
    far_future = datetime.max.replace(tzinfo=UTC)
    cards.sort(
        key=lambda card: (
            -(card.to_review + card.to_contact + card.to_decide),
            card.expires_at or far_future,
        )
    )
    return cards


async def _draft_roles(db: AsyncSession, company_id: uuid.UUID) -> list[DraftRole]:
    rows = await db.execute(
        select(Job.id.label("job_id"), Job.title, Job.updated_at)
        .where(Job.company_id == company_id, Job.status == JobStatus.draft)
        .order_by(Job.updated_at.desc())
        .limit(5)
    )
    return [DraftRole.model_validate(row._mapping) for row in rows.all()]


async def _is_owner(db: AsyncSession, user_id: uuid.UUID) -> bool:
    role = await db.scalar(
        select(CompanyMembership.role).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    return role == MembershipRole.owner


async def get_recruiter_home(
    db: AsyncSession, current_user: User, tz: str | None = None
) -> RecruiterHomeResponse:
    is_admin = await _is_owner(db, current_user.id)
    company_id, company_name = await _get_company_context(db, current_user.id)
    first_name = _first_name(current_user.full_name)

    if company_id is None:
        return RecruiterHomeResponse(
            first_name=first_name,
            company_name="",
            is_admin=is_admin,
            interviews_today=[],
            roles=[],
            drafts=[],
        )

    zone = _resolve_tz(tz)
    now = datetime.now(UTC)
    local_today = now.astimezone(zone).date()
    day_start = datetime.combine(local_today, time.min, tzinfo=zone)
    day_end = day_start + timedelta(days=1)

    interviews_today = await _interviews_between(
        db, company_id, day_start, day_end, limit=20
    )
    next_interview = None
    if not interviews_today:
        upcoming = await _interviews_between(
            db, company_id, now, now + timedelta(days=14), limit=1
        )
        next_interview = upcoming[0] if upcoming else None

    return RecruiterHomeResponse(
        first_name=first_name,
        company_name=company_name,
        is_admin=is_admin,
        interviews_today=interviews_today,
        next_interview=next_interview,
        roles=await _role_cards(db, company_id, now),
        drafts=await _draft_roles(db, company_id),
    )


async def get_recruiter_jobs_overview(
    db: AsyncSession, current_user: User
) -> list[RoleCard]:
    """Every company role with its waiting-work counts, newest first."""
    company_id, _ = await _get_company_context(db, current_user.id)
    if company_id is None:
        return []
    return await _role_cards(db, company_id, datetime.now(UTC), everything=True)
