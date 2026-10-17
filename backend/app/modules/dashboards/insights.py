"""Recruiter Insights: where applicants come from, weekly volume, reply speed and
hiring progress. Every number is one aggregate SQL query over the company's jobs.

SWAP POINTS for the coming schema (``Application.stage`` + an ``Event`` table):
- ``_status_rank`` reads ``Application.status``; map ``stage`` instead
  (new/rejected/withdrawn 0, shortlisted 1, interview 1-2, offer 3, hired 4).
- ``_event_ranks`` and ``_first_decisions`` read ``activity_events``; point them
  at ``Event`` rows of type ``stage_changed`` (payload stage) instead.
- ``_first_decisions`` falls back to ``applications.updated_at`` for decided
  applications without an event; drop that once ``decided_at``/Events exist.
- ``WAITING_STATUSES`` becomes ``stage == 'new'``.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, time, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy import and_, case, func, literal, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.activity.models import ActivityEvent
from app.modules.applications.models import Application
from app.modules.auth.models import User
from app.modules.dashboards.home import _resolve_tz
from app.modules.dashboards.service import _get_company_context
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.shared.enums import ApplicationStage, JobStatus

Source = Literal[
    "linkedin",
    "facebook",
    "merojob",
    "viber",
    "qr",
    "walk_in",
    "phone",
    "referral",
    "direct",
    "other",
]
SOURCES: tuple[str, ...] = Source.__args__
# Applied while signed in on our own site: nobody shared a tagged link.
SOURCE_ALIASES = {"platform": "direct"}

STAGES = ("applied", "shortlisted", "interviewed", "offered", "hired")
MIN_WEEKS = 12
MAX_RANGE_DAYS = 400
SLOWEST_JOBS = 50

WAITING_STATUSES = (ApplicationStage.new,)

# Furthest stage an application has reached: 0 applied, 1 shortlisted,
# 2 interviewed, 3 offered, 4 hired. Rejected keeps whatever it reached before.
STATUS_RANK = {
    ApplicationStage.new: 0,
    ApplicationStage.rejected: 0,
    ApplicationStage.withdrawn: 0,
    ApplicationStage.shortlisted: 1,
    ApplicationStage.interview: 2,
    ApplicationStage.offer: 3,
    ApplicationStage.hired: 4,
}
EVENT_RANK = {
    "application_shortlisted": 1,
    "application_interview_booked": 1,
    "interview_booked": 1,
    "application_interview_completed": 2,
    "application_offer": 3,
    "application_offer_declined": 3,
    "application_offer_accepted": 4,
}
# The first time a person answered the candidate: shortlist or reject.
DECISION_EVENTS = ("application_shortlisted", "application_rejected")


class InsightsJob(BaseModel):
    job_id: uuid.UUID
    title: str
    status: JobStatus


class SourceCount(BaseModel):
    source: Source
    count: int


class WeekCount(BaseModel):
    week_start: date
    count: int


class StageCount(BaseModel):
    stage: Literal["applied", "shortlisted", "interviewed", "offered", "hired"]
    count: int


class JobReply(BaseModel):
    job_id: uuid.UUID
    title: str
    status: JobStatus
    median_days: float | None
    replied: int
    waiting: int
    oldest_waiting_days: int | None


class InsightsResponse(BaseModel):
    range_from: date
    range_to: date
    job_id: uuid.UUID | None
    jobs: list[InsightsJob]
    total: int
    sources: list[SourceCount]
    weekly: list[WeekCount]
    median_reply_days: float | None
    replies: list[JobReply]
    progress: list[StageCount]


# --------------------------------------------------------------------------- #
# Swappable building blocks (see module docstring).
# --------------------------------------------------------------------------- #


def _status_rank():
    return case(
        *((Application.stage == key, rank) for key, rank in STATUS_RANK.items()),
        else_=0,
    )


def _event_ranks():
    """Highest stage each application ever reached according to its events."""
    rank = case(
        *((ActivityEvent.event_type == key, rank) for key, rank in EVENT_RANK.items()),
        else_=0,
    )
    return (
        select(ActivityEvent.application_id, func.max(rank).label("rank"))
        .where(
            ActivityEvent.application_id.is_not(None),
            ActivityEvent.event_type.in_(EVENT_RANK),
        )
        .group_by(ActivityEvent.application_id)
        .subquery("event_ranks")
    )


def _interview_ranks(now: datetime):
    """An interview row means the candidate was shortlisted; a past one means
    they were interviewed, even if they were rejected afterwards."""
    return (
        select(
            Interview.application_id,
            func.max(case((Interview.start_time < now, 2), else_=1)).label("rank"),
        )
        .group_by(Interview.application_id)
        .subquery("interview_ranks")
    )


def _first_decisions():
    return (
        select(
            ActivityEvent.application_id,
            func.min(ActivityEvent.created_at).label("decided_at"),
        )
        .where(
            ActivityEvent.application_id.is_not(None),
            ActivityEvent.event_type.in_(DECISION_EVENTS),
        )
        .group_by(ActivityEvent.application_id)
        .subquery("first_decisions")
    )


def _source_bucket(raw: str | None) -> str:
    value = SOURCE_ALIASES.get(raw or "", raw or "other")
    return value if value in SOURCES else "other"


# --------------------------------------------------------------------------- #


def _resolve_range(
    start: date | None, end: date | None, zone: ZoneInfo
) -> tuple[date, date]:
    today = datetime.now(UTC).astimezone(zone).date()
    end = min(end or today, today)
    start = start or end - timedelta(days=89)
    if start > end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The start date must be before the end date.",
        )
    if (end - start).days > MAX_RANGE_DAYS:
        start = end - timedelta(days=MAX_RANGE_DAYS)
    return start, end


def _day_start(day: date, zone: ZoneInfo) -> datetime:
    return datetime.combine(day, time.min, tzinfo=zone)


async def _company_jobs(db: AsyncSession, company_id: uuid.UUID) -> list[InsightsJob]:
    rows = await db.execute(
        select(Job.id.label("job_id"), Job.title, Job.status)
        .where(Job.company_id == company_id, Job.status != JobStatus.draft)
        .order_by(Job.created_at.desc())
    )
    return [InsightsJob.model_validate(row._mapping) for row in rows.all()]


async def _source_counts(db: AsyncSession, scope) -> tuple[int, list[SourceCount]]:
    rows = await db.execute(
        select(Application.source, func.count(Application.id))
        .join(Job, Job.id == Application.job_id)
        .where(*scope)
        .group_by(Application.source)
    )
    counts = dict.fromkeys(SOURCES, 0)
    for raw, count in rows.all():
        counts[_source_bucket(raw)] += count
    sources = [SourceCount(source=key, count=value) for key, value in counts.items()]
    return sum(counts.values()), sources


async def _weekly_counts(
    db: AsyncSession, base_scope, start: date, end: date, zone: ZoneInfo
) -> list[WeekCount]:
    last_monday = end - timedelta(days=end.weekday())
    first_monday = min(
        start - timedelta(days=start.weekday()),
        last_monday - timedelta(weeks=MIN_WEEKS - 1),
    )
    local_created = func.timezone(zone.key, Application.created_at)
    week = func.date_trunc("week", local_created)
    rows = await db.execute(
        select(func.date(week).label("week_start"), func.count(Application.id))
        .join(Job, Job.id == Application.job_id)
        .where(
            *base_scope,
            Application.created_at >= _day_start(first_monday, zone),
            Application.created_at < _day_start(end + timedelta(days=1), zone),
        )
        .group_by(week)
    )
    found = {row[0]: row[1] for row in rows.all()}
    weeks = (last_monday - first_monday).days // 7 + 1
    return [
        WeekCount(week_start=day, count=found.get(day, 0))
        for day in (first_monday + timedelta(weeks=i) for i in range(weeks))
    ]


async def _reply_times(
    db: AsyncSession, scope, now: datetime
) -> tuple[float | None, list[JobReply]]:
    decisions = _first_decisions()
    waiting = Application.stage.in_(WAITING_STATUSES)
    decided_at = func.coalesce(
        decisions.c.decided_at,
        case((~waiting, Application.updated_at), else_=None),
    )
    days = func.extract("epoch", decided_at - Application.created_at) / 86400.0
    median = func.percentile_cont(0.5).within_group(days)
    waiting_days = func.extract("epoch", now - Application.created_at) / 86400.0

    base = (
        select()
        .select_from(Application)
        .join(Job, Job.id == Application.job_id)
        .outerjoin(decisions, decisions.c.application_id == Application.id)
        .where(*scope)
    )
    overall = await db.scalar(base.add_columns(median))
    rows = await db.execute(
        base.add_columns(
            Job.id.label("job_id"),
            Job.title,
            Job.status,
            median.label("median_days"),
            func.count(decided_at).label("replied"),
            func.count(case((waiting, 1))).label("waiting"),
            func.floor(func.max(case((waiting, waiting_days)))).label(
                "oldest_waiting_days"
            ),
        )
        .group_by(Job.id)
        # Slowest first: a job where nobody has heard back for 9 days is as
        # slow as one that takes 9 days to reply.
        .order_by(
            func.greatest(
                func.coalesce(median, 0),
                func.coalesce(func.max(case((waiting, waiting_days))), 0),
            ).desc(),
            Job.title,
        )
        .limit(SLOWEST_JOBS)
    )
    replies = [
        JobReply(
            **{
                **row._mapping,
                "median_days": _round(row.median_days),
                "oldest_waiting_days": (
                    int(row.oldest_waiting_days)
                    if row.oldest_waiting_days is not None
                    else None
                ),
            }
        )
        for row in rows.all()
    ]
    return _round(overall), replies


def _round(value) -> float | None:
    return None if value is None else round(max(float(value), 0.0), 1)


async def _progress(db: AsyncSession, scope, now: datetime) -> list[StageCount]:
    events = _event_ranks()
    interviews = _interview_ranks(now)
    reached = func.greatest(
        _status_rank(),
        func.coalesce(events.c.rank, 0),
        func.coalesce(interviews.c.rank, 0),
    )

    def reached_at_least(rank: int):
        return func.count(case((reached >= rank, literal(1))))

    row = (
        await db.execute(
            select(*(reached_at_least(rank) for rank in range(len(STAGES))))
            .select_from(Application)
            .join(Job, Job.id == Application.job_id)
            .outerjoin(events, events.c.application_id == Application.id)
            .outerjoin(interviews, interviews.c.application_id == Application.id)
            .where(*scope)
        )
    ).one()
    return [StageCount(stage=stage, count=row[i]) for i, stage in enumerate(STAGES)]


async def get_recruiter_insights(
    db: AsyncSession,
    current_user: User,
    *,
    job_id: uuid.UUID | None = None,
    start: date | None = None,
    end: date | None = None,
    tz: str | None = None,
) -> InsightsResponse:
    zone = _resolve_tz(tz)
    start, end = _resolve_range(start, end, zone)
    now = datetime.now(UTC)
    company_id, _ = await _get_company_context(db, current_user.id)
    jobs = await _company_jobs(db, company_id) if company_id else []

    if job_id is not None and job_id not in {job.job_id for job in jobs}:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found."
        )

    empty = InsightsResponse(
        range_from=start,
        range_to=end,
        job_id=job_id,
        jobs=jobs,
        total=0,
        sources=[SourceCount(source=key, count=0) for key in SOURCES],
        weekly=[],
        median_reply_days=None,
        replies=[],
        progress=[StageCount(stage=stage, count=0) for stage in STAGES],
    )
    if company_id is None:
        return empty

    base_scope = [Job.company_id == company_id]
    if job_id is not None:
        base_scope.append(Job.id == job_id)
    scope = [
        *base_scope,
        and_(
            Application.created_at >= _day_start(start, zone),
            Application.created_at < _day_start(end + timedelta(days=1), zone),
        ),
    ]

    total, sources = await _source_counts(db, scope)
    median_reply_days, replies = await _reply_times(db, scope, now)
    return empty.model_copy(
        update={
            "total": total,
            "sources": sources,
            "weekly": await _weekly_counts(db, base_scope, start, end, zone),
            "median_reply_days": median_reply_days,
            "replies": replies,
            "progress": await _progress(db, scope, now),
        }
    )
