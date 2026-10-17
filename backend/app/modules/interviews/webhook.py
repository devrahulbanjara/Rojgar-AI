from __future__ import annotations

import hashlib
import hmac
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from loguru import logger
from pydantic import BaseModel, ConfigDict, EmailStr, Field, ValidationError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
    invalidate_interview_list_caches,
)
from app.core.config import settings
from app.core.database import get_db
from app.modules.activity.service import create_activity_event
from app.modules.applications.models import Application, ApplicationEvent
from app.modules.applications.sync import enqueue_application_sync_event
from app.modules.companies.models import Company
from app.modules.auth.models import User
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.shared.enums import ApplicationStage, EventType

router = APIRouter(tags=["Webhooks"])

SIGNATURE_HEADER = "X-Cal-Signature-256"

# Every non-error outcome returns the same body so callers cannot probe which
# candidate emails are shortlisted at which company.
_RECEIVED = {"status": "received"}


def verify_cal_signature(raw_body: bytes, signature: str | None) -> None:
    """Reject requests whose HMAC-SHA256 signature does not match the secret."""
    secret = settings.cal_webhook_secret
    if not secret:
        if settings.environment == "prod":
            logger.error("Cal webhook rejected: CAL_WEBHOOK_SECRET is not configured")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Webhook not configured",
            )
        logger.warning("Cal webhook accepted without signature check (non-prod)")
        return

    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    provided = (signature or "").strip().removeprefix("sha256=")
    if not hmac.compare_digest(expected, provided):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature"
        )


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
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Record interview bookings received from the Cal webhook."""
    raw_body = await request.body()
    verify_cal_signature(raw_body, request.headers.get(SIGNATURE_HEADER))

    try:
        body = CalWebhookBody.model_validate_json(raw_body)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Invalid webhook payload",
        ) from exc

    if body.triggerEvent != "BOOKING_CREATED":
        return _RECEIVED

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
        return _RECEIVED

    result = await db.execute(
        select(Application)
        .join(Job, Job.id == Application.job_id)
        .join(User, User.id == Application.user_id)
        .where(
            func.lower(User.email) == attendee_email,
            Job.company_id == company.id,
            Application.stage.in_(
                [ApplicationStage.shortlisted, ApplicationStage.interview]
            ),
        )
        .order_by(Application.created_at.desc())
    )
    application = result.scalars().first()
    job = None

    if application is None:
        logger.warning(
            "Cal webhook: no shortlisted application for email {}",
            attendee_email,
        )
        return _RECEIVED

    job = await db.scalar(select(Job).where(Job.id == application.job_id))

    existing = await db.scalar(
        select(Interview).where(Interview.cal_booking_uid == body.uid)
    )
    if existing is not None:
        return _RECEIVED

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
    # Activity events reference interview.id; insert the interview first.
    await db.flush()

    application.stage = ApplicationStage.interview
    db.add(
        ApplicationEvent(
            application_id=application.id,
            type=EventType.interview_booked.value,
            payload={
                "interview_id": str(interview.id),
                "starts_at": start_dt.isoformat(),
            },
        )
    )
    await create_activity_event(
        db,
        event_type="interview_booked",
        audience="candidate",
        title=f"Interview booked for {job.title if job else 'your application'}",
        description="Your interview has been scheduled.",
        href=f"/candidate/applications/{application.id}",
        user_id=application.user_id,
        company_id=company.id,
        application_id=application.id,
        interview_id=interview.id,
        job_id=application.job_id,
        metadata={"start_time": start_dt.isoformat(), "booking_uid": body.uid},
    )
    await create_activity_event(
        db,
        event_type="interview_booked",
        audience="recruiter",
        title=f"Interview scheduled with {application.user.full_name}",
        description=f"{application.user.full_name} booked an interview.",
        href=f"/recruiter/candidates/{application.id}",
        company_id=company.id,
        application_id=application.id,
        interview_id=interview.id,
        job_id=application.job_id,
        metadata={"start_time": start_dt.isoformat(), "booking_uid": body.uid},
    )
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
    return _RECEIVED
