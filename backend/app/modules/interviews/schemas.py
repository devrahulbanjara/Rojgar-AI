from datetime import datetime
from uuid import UUID

from app.core.schemas import BaseSchema
from app.shared.enums import ApplicationStatus


class InterviewResponse(BaseSchema):
    id: UUID
    application_id: UUID
    cal_booking_uid: str
    candidate_name: str
    candidate_email: str
    applicant_avatar_url: str | None = None
    start_time: datetime
    end_time: datetime
    timezone: str | None
    location: str | None
    title: str | None
    created_at: datetime
    application_status: ApplicationStatus
    job_id: UUID
    job_title: str
    company_id: UUID
