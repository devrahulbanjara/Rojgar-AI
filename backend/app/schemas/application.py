"""
Application schemas - Pydantic models for application API data contracts
"""

from typing import Optional
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, field_validator


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


# ============= Request Schemas =============

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


# ============= Response Schemas =============

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
