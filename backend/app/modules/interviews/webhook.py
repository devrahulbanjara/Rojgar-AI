from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from loguru import logger
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.applications.models import Application
from app.modules.auth.models import User
from app.modules.interviews.models import Interview
from app.shared.enums import ApplicationStatus

router = APIRouter()


class CalAttendee(BaseModel):
    email: str
    name: str
    timeZone: str | None = None

    model_config = ConfigDict(extra="ignore")


class CalPayload(BaseModel):
    uid: str
    title: str | None = None
    startTime: str
    endTime: str
    location: str | None = None
    attendees: list[CalAttendee] = []

    model_config = ConfigDict(extra="ignore")


class CalWebhookBody(BaseModel):
    triggerEvent: str
    payload: CalPayload

    model_config = ConfigDict(extra="ignore")


@router.post("/webhook/cal/interview-booking")
async def cal_webhook_handler(
    body: CalWebhookBody,
    db: AsyncSession = Depends(get_db),
):
    if body.triggerEvent != "BOOKING_CREATED":
        return {"status": "ignored"}

    payload = body.payload
    if not payload.attendees:
        return {"status": "no attendees"}

    attendee = payload.attendees[0]
    attendee_email = attendee.email.lower().strip()

    result = await db.execute(
        select(Application)
        .join(User, User.id == Application.user_id)
        .where(
            User.email == attendee_email,
            Application.status == ApplicationStatus.screening,
        )
        .order_by(Application.created_at.desc())
    )
    application = result.scalars().first()

    if application is None:
        logger.warning(
            "Cal webhook: no active screening application for email {}",
            attendee_email,
        )
        return {"status": "no matching application"}

    existing = await db.scalar(
        select(Interview).where(Interview.cal_booking_uid == payload.uid)
    )
    if existing is not None:
        return {"status": "already recorded"}

    start_dt = datetime.fromisoformat(payload.startTime.replace("Z", "+00:00"))
    end_dt = datetime.fromisoformat(payload.endTime.replace("Z", "+00:00"))

    interview = Interview(
        application_id=application.id,
        cal_booking_uid=payload.uid,
        candidate_name=attendee.name,
        candidate_email=attendee_email,
        start_time=start_dt,
        end_time=end_dt,
        timezone=attendee.timeZone,
        location=payload.location,
        title=payload.title,
    )
    db.add(interview)

    application.status = ApplicationStatus.interview_booked

    await db.commit()

    logger.info(
        "Interview booked: {} ({}) at {}",
        attendee.name,
        attendee_email,
        start_dt,
    )
    return {"status": "success"}
