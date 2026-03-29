from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.applications.models import Application
from app.modules.applications.sync import enqueue_application_sync_event
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import CompanyMembership
from app.infrastructures.redis.service import redis_service
from app.modules.interviews.models import Interview
from app.modules.interviews.schemas import InterviewResponse
from app.modules.jobs.models import Job
from app.shared.enums import ApplicationStatus


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

    filters = [Job.company_id == company_id, Job.hiring_completed.is_(False)]
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

    return [
        InterviewResponse(
            id=interview.id,
            application_id=interview.application_id,
            cal_booking_uid=interview.cal_booking_uid,
            candidate_name=interview.candidate_name,
            candidate_email=interview.candidate_email,
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
    await db.commit()
    await db.refresh(interview)

    await redis_service.delete(f"dashboard:candidate:{application.user_id}")
    await redis_service.invalidate_pattern(
        f"applications:candidate:{application.user_id}:*"
    )
    await redis_service.invalidate_pattern("dashboard:recruiter*")

    return InterviewResponse(
        id=interview.id,
        application_id=interview.application_id,
        cal_booking_uid=interview.cal_booking_uid,
        candidate_name=interview.candidate_name,
        candidate_email=interview.candidate_email,
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
