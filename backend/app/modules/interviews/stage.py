"""Every application-stage change and timeline write made by interviews.

This is the only file that touches Application.status or the activity feed,
so B1's change (status -> stage, new Event table) is a one-file merge:

| helper            | today (status / activity)        | after B1 (stage / Event)            |
|-------------------|----------------------------------|-------------------------------------|
| can_schedule      | shortlisted/interview_* statuses | stage in {shortlisted, interview}   |
| on_invited        | activity "interview_invited"     | Event email_sent                    |
| on_booked         | status interview_booked          | stage interview, Event interview_booked |
| on_rescheduled    | activity "interview_rescheduled" | Event interview_booked (payload: moved) |
| on_cancelled      | status back to shortlisted       | stage shortlisted, Event note       |
| on_done           | status interview_completed       | Event interview_done (stage stays)  |
| candidate_phone   | application.shared_phone_value   | Person.phone                        |
| job_must_haves    | job.requirements[:6]             | job.must_haves                      |
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
from app.modules.applications.models import Application
from app.modules.applications.sync import enqueue_application_sync_event
from app.modules.jobs.models import Job
from app.shared.enums import ApplicationStatus

_SCHEDULABLE = {
    ApplicationStatus.shortlisted,
    ApplicationStatus.interview_booked,
    ApplicationStatus.interview_completed,
}


def can_schedule(application: Application) -> bool:
    return application.status in _SCHEDULABLE


def candidate_phone(application: Application) -> str | None:
    return application.shared_phone_value


def job_must_haves(job: Job) -> list[str]:
    return [item for item in (job.requirements or []) if item.strip()][:6]


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


def _set_status(
    db: AsyncSession, application: Application, status: ApplicationStatus
) -> None:
    if application.status != status:
        application.status = status
        enqueue_application_sync_event(db, application.id)


async def on_invited(db, application, job, actor_user_id) -> None:
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
    _set_status(db, application, ApplicationStatus.interview_booked)
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
    _set_status(db, application, ApplicationStatus.interview_booked)
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
    _set_status(db, application, ApplicationStatus.shortlisted)
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
    if application.status == ApplicationStatus.interview_booked:
        _set_status(db, application, ApplicationStatus.interview_completed)
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
