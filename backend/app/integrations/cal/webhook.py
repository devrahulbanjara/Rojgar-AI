import uuid
from datetime import datetime

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select

from app.core.logging_config import logger
from app.db.models.application import JobApplication
from app.db.models.interview import Interview
from app.db.session import async_session_factory
from app.services.recruiter.activity_events import ActivityEventEmitter

app = FastAPI()


class CalWebhookPayload(BaseModel):
    trigger_event: str = Field(alias="triggerEvent")
    payload: dict = {}
    model_config = ConfigDict(populate_by_name=True, extra="ignore")


@app.get("/test")
async def test():
    return {"status": "online"}


@app.post("/webhook/cal/interview-booking")
async def cal_webhook_handler(data: CalWebhookPayload):
    """Handle Cal.com webhook events for interview bookings."""
    try:
        payload = data.payload

        organizer = payload.get("organizer", {})
        attendees = payload.get("attendees", [])
        attendee = attendees[0] if attendees else {}

        organizer_email = organizer.get("email", "")
        candidate_email = attendee.get("email", "")
        start_time_str = payload.get("startTime", "")
        end_time_str = payload.get("endTime", "")
        meeting_url = payload.get("metadata", {}).get("videoCallUrl", "")

        if data.trigger_event == "BOOKING_CREATED":
            logger.info(
                f"New Booking: {attendee.get('name', 'Unknown')} ({candidate_email}) | "
                f"{start_time_str} to {end_time_str}"
            )

            # Find the application by candidate email
            async with async_session_factory() as db:
                query = (
                    select(JobApplication)
                    .where(JobApplication.candidate_email == candidate_email)
                    .order_by(JobApplication.applied_at.desc())
                    .limit(1)
                )
                result = await db.execute(query)
                application = result.scalar_one_or_none()

                if application:
                    # Create interview record
                    interview = Interview(
                        interview_id=uuid.uuid4(),
                        application_id=application.application_id,
                        organizer_email=organizer_email,
                        candidate_email=candidate_email,
                        start_time=datetime.fromisoformat(
                            start_time_str.replace("Z", "+00:00")
                        ),
                        end_time=datetime.fromisoformat(
                            end_time_str.replace("Z", "+00:00")
                        ),
                        status="scheduled",
                        meeting_url=meeting_url or None,
                    )
                    db.add(interview)
                    await db.commit()

                    logger.info(f"Interview record created: {interview.interview_id}")

                    # Emit activity event for real-time dashboard
                    emitter = ActivityEventEmitter()
                    await emitter.emit(
                        organization_id=str(application.organization_id),
                        event_type="interview_scheduled",
                        data={
                            "candidate_email": candidate_email,
                            "start_time": start_time_str,
                            "job_id": str(application.job_id),
                        },
                    )
                else:
                    logger.warning(
                        f"No application found for candidate email: {candidate_email}"
                    )

        elif data.trigger_event == "BOOKING_CANCELLED":
            logger.info(f"Booking cancelled for: {candidate_email}")

            # Update interview status
            async with async_session_factory() as db:
                query = (
                    select(Interview)
                    .where(
                        Interview.candidate_email == candidate_email,
                        Interview.status == "scheduled",
                    )
                    .order_by(Interview.created_at.desc())
                    .limit(1)
                )
                result = await db.execute(query)
                interview = result.scalar_one_or_none()

                if interview:
                    interview.status = "canceled"
                    await db.commit()

        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error processing Cal.com webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error") from e


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
