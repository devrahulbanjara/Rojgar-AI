from typing import Optional
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
    description: Optional[str] = None


class UpdateApplicationRequest(BaseModel):
    stage: Optional[ApplicationStage] = None
    status: Optional[ApplicationStatus] = None
    description: Optional[str] = None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    job_title: str
    company_name: str
    description: Optional[str] = None
    applied_date: datetime
    stage: ApplicationStage
    status: ApplicationStatus
    updated_at: datetime
