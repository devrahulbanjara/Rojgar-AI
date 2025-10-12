from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel

# Import base model and enums from models layer
from app.models.application import (
    ApplicationBase,
    ApplicationStage,
    ApplicationStatus,
)


class ApplicationRead(ApplicationBase):
    """Schema for reading application data in API responses"""

    id: int
    user_id: str
    applied_date: datetime
    stage: ApplicationStage
    status: ApplicationStatus
    updated_at: datetime


class ApplicationCreate(ApplicationBase):
    """Schema for creating an application via API"""

    pass


class ApplicationUpdate(SQLModel):
    """Schema for updating an application via API"""

    stage: Optional[ApplicationStage] = None
    status: Optional[ApplicationStatus] = None
    description: Optional[str] = None
