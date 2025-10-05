from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum


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


class ApplicationBase(BaseModel):
    job_title: str
    company_name: str
    description: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    stage: Optional[ApplicationStage] = None
    status: Optional[ApplicationStatus] = None
    description: Optional[str] = None


class ApplicationResponse(ApplicationBase):
    id: int
    user_id: str
    applied_date: datetime
    stage: ApplicationStage
    status: ApplicationStatus
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationTrackingBoardResponse(BaseModel):
    applied: List[ApplicationResponse] = []
    interviewing: List[ApplicationResponse] = []
    outcome: List[ApplicationResponse] = []
