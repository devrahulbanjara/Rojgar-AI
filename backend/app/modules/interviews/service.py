from __future__ import annotations

import json
import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
    invalidate_interview_list_caches,
)
from app.modules.activity.service import create_activity_event
from app.modules.applications.models import Application
from app.modules.applications.sync import enqueue_application_sync_event
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import Company, CompanyMembership
from app.infrastructures.redis.service import redis_service
from app.modules.interviews.models import Interview
from app.modules.interviews.schemas import CandidateInterviewView, InterviewResponse
from app.modules.jobs.models import Job
from app.shared.enums import ApplicationStatus


def _interview_list_cache_key(
    company_id: str,
    job_id: uuid.UUID | None,
    start: datetime | None,
    end: datetime | None,
) -> str:
    job_scope = str(job_id) if job_id is not None else "all"
    start_scope = start.isoformat() if start is not None else "none"
    end_scope = end.isoformat() if end is not None else "none"
    return (
        f"interviews:company:{company_id}:job:{job_scope}:"
        f"start:{start_scope}:end:{end_scope}"
    )


async def list_interviews(
    db: AsyncSession,
    user_id: uuid.UUID,
    job_id: uuid.UUID | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
) -> list[InterviewResponse]:
    result = await db.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company_id = result.scalar_one_or_none()
    if not company_id:
        raise HTTPException(
            status_code=403, detail="Active company membership required."
        )
    cache_key = _interview_list_cache_key(str(company_id), job_id, start, end)
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        data = json.loads(cached_data)
        return [InterviewResponse.model_validate(item) for item in data]

    # Include interviews even when the job is marked hiring-complete, so recruiters
    # still see bookings that match candidate-facing "interview booked" status.
    filters = [Job.company_id == company_id]
    if job_id is not None:
        filters.append(Application.job_id == job_id)
    if start is not None:
        filters.append(Interview.start_time >= start)
    if end is not None:
        filters.append(Interview.start_time <= end)

    rows = await db.execute(
        select(Interview, Application, Job)
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(and_(*filters))
        .order_by(Interview.start_time.asc())
    )

    response = [
        InterviewResponse(
            id=interview.id,
            application_id=interview.application_id,
            cal_booking_uid=interview.cal_booking_uid,
            candidate_name=interview.candidate_name,
            candidate_email=interview.candidate_email,
            applicant_avatar_url=application.shared_avatar_url,
            start_time=interview.start_time,
            end_time=interview.end_time,
            timezone=interview.timezone,
            location=interview.location,
            title=interview.title,
            created_at=interview.created_at,
            application_status=application.status,
            job_id=job.id,
            job_title=job.title,
            company_id=job.company_id,
        )
        for interview, application, job in rows.all()
    ]
    await redis_service.set(
        cache_key,
        json.dumps([item.model_dump(mode="json") for item in response]),
        ttl_seconds=180,
        ttl_jitter_seconds=30,
    )
    return response


async def list_candidate_interviews(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[CandidateInterviewView]:
    """Return all interviews for the authenticated candidate, newest first."""
    rows = await db.execute(
        select(Interview, Application, Job, Company)
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .join(Company, Company.id == Job.company_id)
        .where(Application.user_id == user_id)
        .order_by(Interview.start_time.desc())
    )
    results = rows.all()
    return [
        CandidateInterviewView(
            id=interview.id,
            application_id=interview.application_id,
            start_time=interview.start_time,
            end_time=interview.end_time,
            timezone=interview.timezone,
            location=interview.location,
            title=interview.title,
            job_id=job.id,
            job_title=job.title,
            company_name=company.name,
            application_status=application.status,
        )
        for interview, application, job, company in results
    ]


async def mark_interview_complete(
    db: AsyncSession,
    user_id: uuid.UUID,
    interview_id: uuid.UUID,
) -> InterviewResponse:
    """Recruiter marks an interview as completed."""
    result = await db.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company_id = result.scalar_one_or_none()
    if not company_id:
        raise HTTPException(
            status_code=403, detail="Active company membership required."
        )

    row = await db.execute(
        select(Interview, Application, Job)
        .join(Application, Application.id == Interview.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(Interview.id == interview_id, Job.company_id == company_id)
    )
    result_row = row.one_or_none()
    if result_row is None:
        raise HTTPException(
            status_code=404,
            detail="Interview not found or does not belong to your company.",
        )

    interview, application, job = result_row

    if application.status != ApplicationStatus.interview_booked:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot mark complete: application is in status "
                f"'{application.status.value}', expected 'interview_booked'."
            ),
        )

    application.status = ApplicationStatus.interview_completed
    enqueue_application_sync_event(db, application.id)

    await create_activity_event(
        db,
        event_type="application_interview_completed",
        audience="candidate",
        title=f"Interview completed for {job.title}",
        description="Your interview has been marked complete. The recruiter is reviewing your performance.",
        href=f"/candidate/applications/{application.id}",
        user_id=application.user_id,
        company_id=company_id,
        application_id=application.id,
        job_id=application.job_id,
        actor_user_id=user_id,
    )

    await db.commit()
    await db.refresh(interview)

    await invalidate_candidate_read_caches(str(application.user_id))
    await invalidate_company_dashboard_caches(db, str(company_id))
    await invalidate_company_application_caches(str(company_id), str(application.id))
    await invalidate_interview_list_caches(str(company_id))

    return InterviewResponse(
        id=interview.id,
        application_id=interview.application_id,
        cal_booking_uid=interview.cal_booking_uid,
        candidate_name=interview.candidate_name,
        candidate_email=interview.candidate_email,
        applicant_avatar_url=application.shared_avatar_url,
        start_time=interview.start_time,
        end_time=interview.end_time,
        timezone=interview.timezone,
        location=interview.location,
        title=interview.title,
        created_at=interview.created_at,
        application_status=application.status,
        job_id=job.id,
        job_title=job.title,
        company_id=job.company_id,
    )
