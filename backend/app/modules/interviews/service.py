"""Native interview scheduling.

Recruiter sets weekly availability -> invites a shortlisted candidate (signed
scheduling link) -> candidate books / reschedules / cancels with that link ->
both sides get a calendar invite -> reminders -> a person fills a scorecard.

Double booking is impossible: bookings for one interviewer are serialized by
locking their availability row, overlaps are re-checked under that lock, and
partial unique indexes back it up (one live interview per application, one per
interviewer start time).
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, time, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.entitlements.plans import SMS
from app.modules.entitlements.service import job_features
from app.modules.interviews import notify, stage
from app.modules.interviews.models import (
    AUTO_MEETING_LINK,
    DEFAULT_TIMEZONE,
    DEFAULT_WEEKLY_HOURS,
    Interview,
    InterviewerAvailability,
    InterviewInvite,
    InterviewStatus,
    Scorecard,
)
from app.modules.interviews.scheduling import (
    jitsi_link,
    make_token,
    open_slots,
    read_token,
    scheduling_url,
)
from app.modules.interviews.schemas import (
    AgendaItem,
    Availability,
    BookedInterview,
    CandidateInterviewView,
    InviteResponse,
    PublicSchedule,
    Rating,
    ScorecardForm,
    ScorecardRequest,
    ScorecardView,
    SlotView,
)
from app.modules.jobs.models import Job

Actor = Literal["candidate", "recruiter"]


def _now() -> datetime:
    return datetime.now(UTC)


async def _member_company_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
    company_id = await db.scalar(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    if company_id is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="Active company membership required."
        )
    return company_id


# --- availability ------------------------------------------------------------


def _availability_view(row: InterviewerAvailability | None) -> Availability:
    if row is None:
        return Availability(weekly_hours=DEFAULT_WEEKLY_HOURS)
    return Availability(
        timezone=row.timezone,
        weekly_hours=row.weekly_hours,
        interview_minutes=row.interview_minutes,
        buffer_minutes=row.buffer_minutes,
        meeting_link=row.meeting_link,
    )


async def get_availability(db: AsyncSession, user: User) -> Availability:
    await _member_company_id(db, user.id)
    return _availability_view(await db.get(InterviewerAvailability, user.id))


async def put_availability(
    db: AsyncSession, user: User, payload: Availability
) -> Availability:
    await _member_company_id(db, user.id)
    values = payload.model_dump()
    table = InterviewerAvailability.__table__
    await db.execute(
        pg_insert(table)
        .values(user_id=user.id, **values)
        .on_conflict_do_update(index_elements=[table.c.user_id], set_=values)
    )
    await db.commit()
    return payload


async def _ensure_availability(db: AsyncSession, user_id: uuid.UUID) -> None:
    table = InterviewerAvailability.__table__
    await db.execute(
        pg_insert(table)
        .values(
            user_id=user_id,
            timezone=DEFAULT_TIMEZONE,
            weekly_hours=DEFAULT_WEEKLY_HOURS,
            interview_minutes=45,
            buffer_minutes=15,
            meeting_link=AUTO_MEETING_LINK,
        )
        .on_conflict_do_nothing(index_elements=[table.c.user_id])
    )


async def _busy(
    db: AsyncSession, interviewer_id: uuid.UUID, exclude: uuid.UUID | None = None
) -> list[tuple[datetime, datetime]]:
    stmt = select(Interview.start_time, Interview.end_time).where(
        Interview.interviewer_user_id == interviewer_id,
        Interview.status == InterviewStatus.booked,
        Interview.end_time > _now() - timedelta(hours=3),
    )
    if exclude is not None:
        stmt = stmt.where(Interview.id != exclude)
    return [(row.start_time, row.end_time) for row in (await db.execute(stmt)).all()]


def _slots(
    availability: Availability, busy: list[tuple[datetime, datetime]]
) -> list[SlotView]:
    return [
        SlotView(start=s.start, end=s.end)
        for s in open_slots(
            weekly_hours=availability.weekly_hours,
            tz=availability.timezone,
            interview_minutes=availability.interview_minutes,
            buffer_minutes=availability.buffer_minutes,
            busy=busy,
            now=_now(),
        )
    ]


# --- invite ------------------------------------------------------------------


async def build_message(
    db: AsyncSession,
    application: Application,
    job: Job,
    company: Company,
    invite: InterviewInvite,
    interview: Interview | None = None,
) -> notify.InterviewMessage:
    """Snapshot everything the post-commit emails/SMS need."""
    interviewer = (
        await db.get(User, invite.interviewer_user_id)
        if invite.interviewer_user_id
        else None
    )
    candidate_email = application.shared_email_value or application.user.email
    snapshot = dict(
        company_name=company.name,
        job_title=job.title,
        candidate_name=application.shared_full_name or application.user.full_name,
        candidate_email=candidate_email,
        candidate_phone=stage.candidate_phone(application),
        interviewer_name=interviewer.full_name if interviewer else company.name,
        interviewer_email=interviewer.email if interviewer else None,
        scheduling_url=scheduling_url(make_token(invite.id)),
        sms_enabled=SMS in await job_features(db, job.id),
    )
    if interview is not None:
        snapshot |= dict(
            uid=interview.ics_uid,
            sequence=interview.sequence,
            start=interview.start_time,
            end=interview.end_time,
            timezone=interview.timezone,
            meeting_link=interview.location,
        )
    return notify.InterviewMessage(**snapshot)


async def _company_application(
    db: AsyncSession, company_id: uuid.UUID, application_id: uuid.UUID
) -> tuple[Application, Job, Company]:
    row = (
        await db.execute(
            select(Application, Job, Company)
            .join(Job, Job.id == Application.job_id)
            .join(Company, Company.id == Job.company_id)
            .where(Application.id == application_id, Job.company_id == company_id)
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return row


async def invite(
    db: AsyncSession,
    user: User,
    application_id: uuid.UUID,
    notify_candidate: bool,
    bg: BackgroundTasks,
) -> InviteResponse:
    """Create (or reuse) the candidate's scheduling link with ``user`` as interviewer."""
    company_id = await _member_company_id(db, user.id)
    application, job, company = await _company_application(
        db, company_id, application_id
    )
    if not stage.can_schedule(application):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Shortlist the candidate before inviting them to interview.",
        )
    table = InterviewInvite.__table__
    invite_id = await db.scalar(
        pg_insert(table)
        .values(
            id=uuid.uuid4(),
            application_id=application.id,
            interviewer_user_id=user.id,
            created_by_user_id=user.id,
        )
        .on_conflict_do_update(
            index_elements=[table.c.application_id],
            set_={"interviewer_user_id": user.id, "updated_at": _now()},
        )
        .returning(table.c.id)
    )
    await _ensure_availability(db, user.id)
    await stage.on_invited(db, application, job, user.id)
    invite_row = await db.get(InterviewInvite, invite_id)
    message = await build_message(db, application, job, company, invite_row)
    await db.commit()
    await stage.refresh_caches(db, application, company_id)
    if notify_candidate:
        bg.add_task(notify.send_invite, message)
    return InviteResponse(scheduling_url=message.scheduling_url)


async def scheduling_url_for(
    db: AsyncSession, application_id: uuid.UUID, interviewer_id: uuid.UUID
) -> str:
    """Link for an outreach email; creates the invite if needed (no commit)."""
    invite_row = await db.scalar(
        select(InterviewInvite).where(InterviewInvite.application_id == application_id)
    )
    if invite_row is None:
        invite_row = InterviewInvite(
            application_id=application_id,
            interviewer_user_id=interviewer_id,
            created_by_user_id=interviewer_id,
        )
        db.add(invite_row)
        await db.flush()
        await _ensure_availability(db, interviewer_id)
    return scheduling_url(make_token(invite_row.id))


# --- public scheduling link --------------------------------------------------


_INVALID_LINK = "This interview link is not valid."
_CLOSED_LINK = "This interview invitation is no longer open."


async def _load_invite(
    db: AsyncSession, token: str
) -> tuple[InterviewInvite, Application, Job, Company]:
    invite_id = read_token(token)
    row = None
    if invite_id is not None:
        row = (
            await db.execute(
                select(InterviewInvite, Application, Job, Company)
                .join(Application, Application.id == InterviewInvite.application_id)
                .join(Job, Job.id == Application.job_id)
                .join(Company, Company.id == Job.company_id)
                .where(InterviewInvite.id == invite_id)
            )
        ).one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=_INVALID_LINK)
    if not stage.can_schedule(row[1]) or row[0].interviewer_user_id is None:
        raise HTTPException(status.HTTP_410_GONE, detail=_CLOSED_LINK)
    return row


async def _current_interview(
    db: AsyncSession, application_id: uuid.UUID
) -> Interview | None:
    return await db.scalar(
        select(Interview).where(
            Interview.application_id == application_id,
            Interview.status == InterviewStatus.booked,
        )
    )


async def _locked_availability(
    db: AsyncSession, interviewer_id: uuid.UUID
) -> Availability:
    """Lock the interviewer's row: concurrent bookings for them run one at a time."""
    await _ensure_availability(db, interviewer_id)
    row = await db.scalar(
        select(InterviewerAvailability)
        .where(InterviewerAvailability.user_id == interviewer_id)
        .with_for_update()
    )
    return _availability_view(row)


async def public_schedule(db: AsyncSession, token: str) -> PublicSchedule:
    invite_row, application, job, company = await _load_invite(db, token)
    interviewer = await db.get(User, invite_row.interviewer_user_id)
    availability = _availability_view(
        await db.get(InterviewerAvailability, invite_row.interviewer_user_id)
    )
    current = await _current_interview(db, application.id)
    busy = await _busy(db, invite_row.interviewer_user_id)
    return PublicSchedule(
        company_name=company.name,
        job_title=job.title,
        candidate_name=application.shared_full_name or application.user.full_name,
        interviewer_name=interviewer.full_name if interviewer else company.name,
        timezone=availability.timezone,
        interview_minutes=availability.interview_minutes,
        interview=_booked_view(current) if current else None,
        slots=_slots(availability, busy),
    )


async def _actor(
    db: AsyncSession, user: User | None, company_id: uuid.UUID
) -> tuple[Actor, uuid.UUID | None]:
    """Who used the link: a member of the hiring company, or the candidate."""
    if user is not None:
        member = await db.scalar(
            select(CompanyMembership.id).where(
                CompanyMembership.user_id == user.id,
                CompanyMembership.company_id == company_id,
                CompanyMembership.status == MembershipStatus.active,
            )
        )
        if member is not None:
            return "recruiter", user.id
    return "candidate", None


def _pick_slot(slots: list[SlotView], start: datetime) -> SlotView:
    for slot in slots:
        if slot.start == start:
            return slot
    raise HTTPException(
        status.HTTP_409_CONFLICT,
        detail="That time is no longer free. Please pick another.",
    )


def _local(at: datetime, tz: str) -> datetime:
    """Times go out in the interview's own zone (e.g. 10:00+05:45)."""
    return at.astimezone(ZoneInfo(tz))


def _booked_view(interview: Interview) -> BookedInterview:
    return BookedInterview(
        id=interview.id,
        start=_local(interview.start_time, interview.timezone),
        end=_local(interview.end_time, interview.timezone),
        meeting_link=interview.location,
        status=interview.status,
    )


async def book(
    db: AsyncSession,
    token: str,
    start: datetime,
    user: User | None,
    bg: BackgroundTasks,
) -> BookedInterview:
    invite_row, application, job, company = await _load_invite(db, token)
    actor, actor_id = await _actor(db, user, company.id)
    interviewer_id = invite_row.interviewer_user_id
    availability = await _locked_availability(db, interviewer_id)
    if await _current_interview(db, application.id) is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="An interview is already booked. Reschedule it instead.",
        )
    slot = _pick_slot(_slots(availability, await _busy(db, interviewer_id)), start)
    meeting = (
        jitsi_link()
        if availability.meeting_link == AUTO_MEETING_LINK
        else availability.meeting_link
    )
    interview_id = uuid.uuid4()
    interview = Interview(
        id=interview_id,
        application_id=application.id,
        company_id=company.id,
        interviewer_user_id=interviewer_id,
        candidate_name=application.shared_full_name or application.user.full_name,
        candidate_email=application.shared_email_value or application.user.email,
        start_time=slot.start,
        end_time=slot.end,
        timezone=availability.timezone,
        location=meeting,
        title=f"Interview: {job.title}",
        status=InterviewStatus.booked,
        ics_uid=f"interview-{interview_id}@rojgarai",
        sequence=0,
    )
    db.add(interview)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="That time is no longer free. Please pick another.",
        ) from exc
    await stage.on_booked(db, application, job, interview, actor_id)
    message = await build_message(db, application, job, company, invite_row, interview)
    await db.commit()
    await stage.refresh_caches(db, application, company.id)
    bg.add_task(notify.send_change, message, "booked")
    return _booked_view(interview)


async def reschedule(
    db: AsyncSession,
    token: str,
    start: datetime,
    user: User | None,
    bg: BackgroundTasks,
) -> BookedInterview:
    invite_row, application, job, company = await _load_invite(db, token)
    _, actor_id = await _actor(db, user, company.id)
    interviewer_id = invite_row.interviewer_user_id
    availability = await _locked_availability(db, interviewer_id)
    interview = await _current_interview(db, application.id)
    if interview is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="There is no booked interview to move."
        )
    busy = await _busy(db, interviewer_id, exclude=interview.id)
    slot = _pick_slot(_slots(availability, busy), start)
    interview.start_time = slot.start
    interview.end_time = slot.end
    interview.interviewer_user_id = interviewer_id
    interview.sequence += 1
    interview.reminder_24h_sent_at = None
    interview.reminder_1h_sent_at = None
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="That time is no longer free. Please pick another.",
        ) from exc
    await stage.on_rescheduled(db, application, job, interview, actor_id)
    message = await build_message(db, application, job, company, invite_row, interview)
    await db.commit()
    await stage.refresh_caches(db, application, company.id)
    bg.add_task(notify.send_change, message, "rescheduled")
    return _booked_view(interview)


async def cancel(
    db: AsyncSession, token: str, user: User | None, bg: BackgroundTasks
) -> BookedInterview:
    invite_row, application, job, company = await _load_invite(db, token)
    actor, actor_id = await _actor(db, user, company.id)
    interview = await _current_interview(db, application.id)
    if interview is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="There is no booked interview to cancel."
        )
    interview.status = InterviewStatus.cancelled
    interview.cancelled_by = actor
    interview.sequence += 1
    await stage.on_cancelled(db, application, job, interview, actor_id)
    message = await build_message(db, application, job, company, invite_row, interview)
    await db.commit()
    await stage.refresh_caches(db, application, company.id)
    bg.add_task(notify.send_change, message, "cancelled")
    return _booked_view(interview)


# --- recruiter agenda and scorecards -----------------------------------------


AgendaRange = Literal["day", "week", "month"]
_RANGE_DAYS = {"day": 1, "week": 7, "month": 31}


def _scorecard_state(interview: Interview, has_scorecard: bool, now: datetime) -> str:
    if has_scorecard:
        return "done"
    if interview.status == InterviewStatus.booked and interview.start_time <= now:
        return "needed"
    return "not_due"


async def agenda(
    db: AsyncSession,
    user: User,
    range_: AgendaRange,
    start: date | None,
    job_id: uuid.UUID | None,
) -> list[AgendaItem]:
    """Company interviews from ``start`` (default today, Nepal time) for the range."""
    company_id = await _member_company_id(db, user.id)
    zone = ZoneInfo(DEFAULT_TIMEZONE)
    first = start or _now().astimezone(zone).date()
    window_start = datetime.combine(first, time.min, zone)
    window_end = window_start + timedelta(days=_RANGE_DAYS[range_])
    has_scorecard = (
        select(Scorecard.id).where(Scorecard.interview_id == Interview.id).exists()
    )
    stmt = (
        select(Interview, Job.id, Job.title, User.full_name, has_scorecard)
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .outerjoin(User, User.id == Interview.interviewer_user_id)
        .where(
            Interview.company_id == company_id,
            Interview.status != InterviewStatus.cancelled,
            Interview.start_time >= window_start,
            Interview.start_time < window_end,
        )
        .order_by(Interview.start_time)
    )
    if job_id is not None:
        stmt = stmt.where(Job.id == job_id)
    now = _now()
    return [
        AgendaItem(
            id=iv.id,
            application_id=iv.application_id,
            job_id=jid,
            job_title=title,
            candidate_name=iv.candidate_name,
            candidate_email=iv.candidate_email,
            interviewer_name=interviewer,
            start=_local(iv.start_time, iv.timezone),
            end=_local(iv.end_time, iv.timezone),
            timezone=iv.timezone,
            meeting_link=iv.location,
            status=iv.status,
            scorecard=_scorecard_state(iv, scored, now),
        )
        for iv, jid, title, interviewer, scored in (await db.execute(stmt)).all()
    ]


async def _company_interview(
    db: AsyncSession, company_id: uuid.UUID, interview_id: uuid.UUID
) -> tuple[Interview, Application, Job]:
    row = (
        await db.execute(
            select(Interview, Application, Job)
            .join(Application, Application.id == Interview.application_id)
            .join(Job, Job.id == Application.job_id)
            .where(Interview.id == interview_id, Interview.company_id == company_id)
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Interview not found.")
    return row


async def _scorecard_views(
    db: AsyncSession, interview_id: uuid.UUID
) -> list[ScorecardView]:
    rows = await db.execute(
        select(Scorecard, User.full_name)
        .outerjoin(User, User.id == Scorecard.author_user_id)
        .where(Scorecard.interview_id == interview_id)
        .order_by(Scorecard.created_at)
    )
    return [
        ScorecardView(
            id=card.id,
            interview_id=card.interview_id,
            author_user_id=card.author_user_id,
            author_name=name,
            ratings=[Rating(**r) for r in card.ratings],
            recommendation=card.recommendation,
            notes=card.notes,
            updated_at=card.updated_at or card.created_at or _now(),
        )
        for card, name in rows.all()
    ]


async def scorecard_form(
    db: AsyncSession, user: User, interview_id: uuid.UUID
) -> ScorecardForm:
    company_id = await _member_company_id(db, user.id)
    interview, _, job = await _company_interview(db, company_id, interview_id)
    return ScorecardForm(
        interview_id=interview.id,
        criteria=stage.job_must_haves(job),
        scorecards=await _scorecard_views(db, interview.id),
    )


async def submit_scorecard(
    db: AsyncSession, user: User, interview_id: uuid.UUID, payload: ScorecardRequest
) -> ScorecardView:
    company_id = await _member_company_id(db, user.id)
    interview, application, job = await _company_interview(db, company_id, interview_id)
    if interview.status == InterviewStatus.cancelled:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="This interview was cancelled."
        )
    if interview.start_time > _now():
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Add the scorecard once the interview has started.",
        )
    criteria = stage.job_must_haves(job)
    seen: set[str] = set()
    for rating in payload.ratings:
        if rating.criterion not in criteria or rating.criterion in seen:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail="Rate each must-have of this job once.",
            )
        seen.add(rating.criterion)

    table = Scorecard.__table__
    values = dict(
        ratings=[r.model_dump() for r in payload.ratings],
        recommendation=payload.recommendation,
        notes=(payload.notes or "").strip() or None,
    )
    await db.execute(
        pg_insert(table)
        .values(
            id=uuid.uuid4(), interview_id=interview.id, author_user_id=user.id, **values
        )
        .on_conflict_do_update(
            constraint="uq_scorecard_author", set_=values | {"updated_at": _now()}
        )
    )
    if interview.status == InterviewStatus.booked:
        interview.status = InterviewStatus.done
        await stage.on_done(db, application, job, interview, user.id)
    await db.commit()
    await stage.refresh_caches(db, application, company_id)
    mine = [
        card
        for card in await _scorecard_views(db, interview.id)
        if card.author_user_id == user.id
    ]
    return mine[0]


# --- candidate ---------------------------------------------------------------


async def list_candidate_interviews(
    db: AsyncSession, user_id: uuid.UUID
) -> list[CandidateInterviewView]:
    rows = await db.execute(
        select(Interview, Job, Company, InterviewInvite.id, Application.stage)
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .join(Company, Company.id == Job.company_id)
        .outerjoin(
            InterviewInvite, InterviewInvite.application_id == Interview.application_id
        )
        .where(Application.user_id == user_id)
        .order_by(Interview.start_time.desc())
    )
    return [
        CandidateInterviewView(
            id=iv.id,
            application_id=iv.application_id,
            start=_local(iv.start_time, iv.timezone),
            end=_local(iv.end_time, iv.timezone),
            timezone=iv.timezone,
            meeting_link=iv.location,
            status=iv.status,
            job_id=job.id,
            job_title=job.title,
            company_name=company.name,
            scheduling_url=scheduling_url(make_token(invite_id)) if invite_id else None,
            stage=stage,
        )
        for iv, job, company, invite_id, stage in rows.all()
    ]


def latest_interview_stmt(application_id: uuid.UUID):
    """The live interview if any, else the most recent one (for candidate panels)."""
    return (
        select(Interview)
        .where(Interview.application_id == application_id)
        .order_by(
            (Interview.status == InterviewStatus.booked).desc(),
            Interview.start_time.desc(),
        )
        .limit(1)
    )
