"""
Application model - Simple, easy to understand
Everything related to job applications in one place
"""

from datetime import datetime
from typing import Optional
from enum import Enum
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, ConfigDict, field_validator

from app.models import Base


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


class Application(Base):
    """
    Application table in database
    Tracks job applications made by candidates
    """
    __tablename__ = "application"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), index=True)
    
    # Job info (stored as text, not linked to actual job)
    job_title: Mapped[str] = mapped_column(String)
    company_name: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Status tracking
    applied_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    stage: Mapped[str] = mapped_column(String, default=ApplicationStage.APPLIED.value, index=True)
    status: Mapped[str] = mapped_column(String, default=ApplicationStatus.PENDING.value, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============= Request/Response Schemas =============

class CreateApplicationRequest(BaseModel):
    """What we need to create a new application"""
    job_title: str
    company_name: str
    description: Optional[str] = None


class UpdateApplicationRequest(BaseModel):
    """What can be updated in an application"""
    stage: Optional[ApplicationStage] = None
    status: Optional[ApplicationStatus] = None
    description: Optional[str] = None


class ApplicationResponse(BaseModel):
    """What we send back about an application"""
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
    
    @field_validator('stage', 'status', mode='before')
    @classmethod
    def normalize_enum(cls, v):
        """Ensure enum values are in the correct format"""
        if v is None:
            return v
        if isinstance(v, str):
            return v.lower()
        return v
