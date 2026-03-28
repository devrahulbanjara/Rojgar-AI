from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import CompanyMembership
from app.modules.interviews.models import Interview
from app.modules.interviews.schemas import InterviewResponse
from app.modules.jobs.models import Job


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
        select(Interview, Job)
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
            job_id=job.id,
            job_title=job.title,
            company_id=job.company_id,
        )
        for interview, job in rows.all()
    ]
