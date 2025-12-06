from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class ApplicationStage(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    DECISION = "decision"


class ApplicationStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    OFFER_EXTENDED = "offer_extended"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class CreateApplicationRequest(BaseModel):
    job_title: str
    company_name: str
    description: str | None = None


class UpdateApplicationRequest(BaseModel):
    stage: ApplicationStage | None = None
    status: ApplicationStatus | None = None
    description: str | None = None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    job_title: str
    company_name: str
    description: str | None = None
    applied_date: datetime
    stage: ApplicationStage
    status: ApplicationStatus
    updated_at: datetime
