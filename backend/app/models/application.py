"""
Application model - Simple, easy to understand
Everything related to job applications in one place
"""

from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import Field, SQLModel


class ApplicationStage(str, Enum):
    """Where the application is in the process"""
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    DECISION = "decision"


class ApplicationStatus(str, Enum):
    """Current status of the application"""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    OFFER_EXTENDED = "offer_extended"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Application(SQLModel, table=True):
    """
    Application table in database
    Tracks job applications made by candidates
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    
    # Job info (stored as text, not linked to actual job)
    job_title: str
    company_name: str
    description: Optional[str] = None
    
    # Status tracking
    applied_date: datetime = Field(default_factory=datetime.utcnow)
    stage: ApplicationStage = Field(default=ApplicationStage.APPLIED, index=True)
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDING, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============= Request/Response Schemas =============

class CreateApplicationRequest(SQLModel):
    """What we need to create a new application"""
    job_title: str
    company_name: str
    description: Optional[str] = None


class UpdateApplicationRequest(SQLModel):
    """What can be updated in an application"""
    stage: Optional[ApplicationStage] = None
    status: Optional[ApplicationStatus] = None
    description: Optional[str] = None


class ApplicationResponse(SQLModel):
    """What we send back about an application"""
    id: int
    user_id: str
    job_title: str
    company_name: str
    description: Optional[str] = None
    applied_date: datetime
    stage: ApplicationStage
    status: ApplicationStatus
    updated_at: datetime
