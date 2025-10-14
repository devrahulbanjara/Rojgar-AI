"""
Application models - unified SQLModel approach (single source of truth)
"""

from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import Field, SQLModel


# Enums
class ApplicationStage(str, Enum):
    """Application stage enumeration"""
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    DECISION = "decision"


class ApplicationStatus(str, Enum):
    """Application status enumeration"""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    OFFER_EXTENDED = "offer_extended"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


# Application Models
class ApplicationBase(SQLModel):
    """Base application model with common fields"""
    job_title: str
    company_name: str
    description: Optional[str] = None


class Application(ApplicationBase, table=True):
    """Application table model"""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    applied_date: datetime = Field(default_factory=datetime.utcnow)
    stage: ApplicationStage = Field(default=ApplicationStage.APPLIED, index=True)
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDING, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ApplicationRead(ApplicationBase):
    """Schema for reading application data (API responses)"""
    id: int
    user_id: str
    applied_date: datetime
    stage: ApplicationStage
    status: ApplicationStatus
    updated_at: datetime


class ApplicationCreate(ApplicationBase):
    """Schema for creating an application"""
    pass


class ApplicationUpdate(SQLModel):
    """Schema for updating an application"""
    stage: Optional[ApplicationStage] = None
    status: Optional[ApplicationStatus] = None
    description: Optional[str] = None
