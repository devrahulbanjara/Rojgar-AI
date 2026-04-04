from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from loguru import logger
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
    invalidate_interview_list_caches,
)
from app.core.database import get_db
from app.modules.applications.models import Application
from app.modules.applications.sync import enqueue_application_sync_event
from app.modules.companies.models import Company
from app.modules.auth.models import User
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.shared.enums import ApplicationStatus

router = APIRouter()


class CalWebhookBody(BaseModel):
    triggerEvent: str
    createdAt: str | None = None
    type: str | None = None
    title: str | None = None
    startTime: str
    endTime: str
    location: str | None = None
    uid: str
    organizer_name: str | None = Field(default=None, alias="organizer.name")
    organizer_email: EmailStr = Field(alias="organizer.email")
    organizer_timezone: str | None = Field(default=None, alias="organizer.timezone")
    attendee_name: str | None = Field(default=None, alias="attendees.0.name")
    attendee_email: EmailStr = Field(alias="attendees.0.email")
    attendee_timezone: str | None = Field(default=None, alias="attendees.0.timeZone")

    model_config = ConfigDict(extra="ignore", populate_by_name=True)


@router.post("/webhook/cal/interview-booking")
async def cal_webhook_handler(
    body: CalWebhookBody,
    db: AsyncSession = Depends(get_db),
):
    if body.triggerEvent != "BOOKING_CREATED":
        return {"status": "ignored"}

    organizer_email = str(body.organizer_email).lower().strip()
    attendee_email = str(body.attendee_email).lower().strip()

    company = await db.scalar(
        select(Company).where(
            func.lower(Company.cal_organizer_email) == organizer_email
        )
    )
    if company is None:
        logger.warning(
            "Cal webhook: no company configured for organizer email {}",
            organizer_email,
        )
        return {"status": "no matching company"}

    result = await db.execute(
        select(Application)
        .join(Job, Job.id == Application.job_id)
        .join(User, User.id == Application.user_id)
        .where(
            func.lower(User.email) == attendee_email,
            Job.company_id == company.id,
            Application.status == ApplicationStatus.shortlisted,
        )
        .order_by(Application.created_at.desc())
    )
    application = result.scalars().first()

    if application is None:
        logger.warning(
            "Cal webhook: no shortlisted application for email {}",
            attendee_email,
        )
        return {"status": "no matching application"}

    existing = await db.scalar(
        select(Interview).where(Interview.cal_booking_uid == body.uid)
    )
    if existing is not None:
        return {"status": "already recorded"}

    start_dt = datetime.fromisoformat(body.startTime.replace("Z", "+00:00"))
    end_dt = datetime.fromisoformat(body.endTime.replace("Z", "+00:00"))

    interview = Interview(
        application_id=application.id,
        cal_booking_uid=body.uid,
        candidate_name=body.attendee_name or application.user.full_name,
        candidate_email=attendee_email,
        start_time=start_dt,
        end_time=end_dt,
        timezone=body.attendee_timezone,
        location=body.location,
        title=body.title,
    )
    db.add(interview)

    application.status = ApplicationStatus.interview_booked
    enqueue_application_sync_event(db, application.id)

    await db.commit()
    await invalidate_candidate_read_caches(str(application.user_id))
    await invalidate_company_dashboard_caches(db, str(company.id))
    await invalidate_company_application_caches(str(company.id), str(application.id))
    await invalidate_interview_list_caches(str(company.id))

    logger.info(
        "Interview booked: {} ({}) at {}",
        body.attendee_name or application.user.full_name,
        attendee_email,
        start_dt,
    )
    return {"status": "success"}
