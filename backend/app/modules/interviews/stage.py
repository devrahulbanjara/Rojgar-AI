"""Every application-stage change and timeline write made by interviews.

Maps interview scheduling actions to ApplicationStage and Event log:
| helper            | v2 mapping                          |
|-------------------|-------------------------------------|
| can_schedule      | stage in {shortlisted, interview}   |
| on_invited        | Event email_sent                    |
| on_booked         | stage interview, Event interview_booked |
| on_rescheduled    | Event interview_booked (payload: moved) |
| on_cancelled      | stage shortlisted, Event note       |
| on_done           | Event interview_done (stage stays)  |
| candidate_phone   | application.user.phone or shared_phone |
| job_must_haves    | job.must_haves                      |
"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
)
from app.modules.activity.service import create_activity_event
from app.modules.applications.models import Application, ApplicationEvent
from app.modules.applications.sync import enqueue_application_sync_event
from app.modules.jobs.models import Job
from app.shared.enums import ApplicationStage, EventType


def can_schedule(application: Application) -> bool:
    return application.stage in {
        ApplicationStage.shortlisted,
        ApplicationStage.interview,
    }


def candidate_phone(application: Application) -> str | None:
    return (
        getattr(getattr(application, "user", None), "phone", None)
        or application.shared_phone_value
    )


def job_must_haves(job: Job) -> list[str]:
    return [item for item in (job.must_haves or []) if item.strip()][:6]


def _set_stage(
    db: AsyncSession, application: Application, stage: ApplicationStage
) -> None:
    if application.stage != stage:
        application.stage = stage
        enqueue_application_sync_event(db, application.id)


def _add_event(
    db: AsyncSession,
    application_id: uuid.UUID,
    event_type: EventType,
    actor_id: uuid.UUID | None = None,
    payload: dict | None = None,
) -> None:
    db.add(
        ApplicationEvent(
            application_id=application_id,
            type=event_type.value if hasattr(event_type, "value") else str(event_type),
            actor_user_id=actor_id,
            payload=payload or {},
        )
    )


async def _event(
    db: AsyncSession,
    application: Application,
    job: Job,
    *,
    event_type: str,
    candidate_title: str | None,
    recruiter_title: str,
    interview_id: uuid.UUID | None,
    actor_user_id: uuid.UUID | None,
    metadata: dict | None = None,
) -> None:
    if candidate_title:
        await create_activity_event(
            db,
            event_type=event_type,
            audience="candidate",
            title=candidate_title,
            href=f"/candidate/applications/{application.id}",
            user_id=application.user_id,
            company_id=job.company_id,
            application_id=application.id,
            interview_id=interview_id,
            job_id=job.id,
            actor_user_id=actor_user_id,
            metadata=metadata,
        )
    await create_activity_event(
        db,
        event_type=event_type,
        audience="recruiter",
        title=recruiter_title,
        href=f"/recruiter/candidates/{application.id}",
        company_id=job.company_id,
        application_id=application.id,
        interview_id=interview_id,
        job_id=job.id,
        actor_user_id=actor_user_id,
        metadata=metadata,
    )


async def on_invited(db, application, job, actor_user_id) -> None:
    _add_event(
        db,
        application.id,
        EventType.email_sent,
        actor_user_id,
        {"subject": f"Interview invite for {job.title}"},
    )
    await _event(
        db,
        application,
        job,
        event_type="interview_invited",
        candidate_title=f"Pick an interview time for {job.title}",
        recruiter_title=f"Interview invite sent to {application.user.full_name}",
        interview_id=None,
        actor_user_id=actor_user_id,
    )


async def on_booked(db, application, job, interview, actor_user_id) -> None:
    _set_stage(db, application, ApplicationStage.interview)
    _add_event(
        db,
        application.id,
        EventType.interview_booked,
        actor_user_id,
        {
            "interview_id": str(interview.id),
            "starts_at": interview.start_time.isoformat(),
        },
    )
    await _event(
        db,
        application,
        job,
        event_type="interview_booked",
        candidate_title=f"Interview booked for {job.title}",
        recruiter_title=f"{application.user.full_name} booked an interview",
        interview_id=interview.id,
        actor_user_id=actor_user_id,
        metadata={"start_time": interview.start_time.isoformat()},
    )


async def on_rescheduled(db, application, job, interview, actor_user_id) -> None:
    _set_stage(db, application, ApplicationStage.interview)
    _add_event(
        db,
        application.id,
        EventType.interview_booked,
        actor_user_id,
        {
            "interview_id": str(interview.id),
            "starts_at": interview.start_time.isoformat(),
            "moved": True,
        },
    )
    await _event(
        db,
        application,
        job,
        event_type="interview_rescheduled",
        candidate_title=f"Interview for {job.title} moved",
        recruiter_title=f"Interview with {application.user.full_name} moved",
        interview_id=interview.id,
        actor_user_id=actor_user_id,
        metadata={"start_time": interview.start_time.isoformat()},
    )


async def on_cancelled(db, application, job, interview, actor_user_id) -> None:
    _set_stage(db, application, ApplicationStage.shortlisted)
    _add_event(
        db,
        application.id,
        EventType.note,
        actor_user_id,
        {"text": f"Interview cancelled by {interview.cancelled_by or 'candidate'}"},
    )
    await _event(
        db,
        application,
        job,
        event_type="interview_cancelled",
        candidate_title=f"Interview for {job.title} cancelled",
        recruiter_title=f"Interview with {application.user.full_name} cancelled",
        interview_id=interview.id,
        actor_user_id=actor_user_id,
        metadata={"cancelled_by": interview.cancelled_by},
    )


async def on_done(db, application, job, interview, actor_user_id) -> None:
    _add_event(
        db,
        application.id,
        EventType.interview_done,
        actor_user_id,
        {"interview_id": str(interview.id)},
    )
    await _event(
        db,
        application,
        job,
        event_type="interview_done",
        candidate_title=None,
        recruiter_title=f"Scorecard added for {application.user.full_name}",
        interview_id=interview.id,
        actor_user_id=actor_user_id,
    )


async def refresh_caches(
    db: AsyncSession, application: Application, company_id
) -> None:
    """Call after commit."""
    await invalidate_candidate_read_caches(str(application.user_id))
    await invalidate_company_dashboard_caches(db, str(company_id))
    await invalidate_company_application_caches(str(company_id), str(application.id))
