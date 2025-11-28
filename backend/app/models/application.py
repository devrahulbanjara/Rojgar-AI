from datetime import datetime
from typing import Optional
from enum import Enum
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from . import Base


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


class Application(Base):
    __tablename__ = "application"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), index=True)
    
    job_title: Mapped[str] = mapped_column(String)
    company_name: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    applied_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    stage: Mapped[str] = mapped_column(String, default=ApplicationStage.APPLIED.value, index=True)
    status: Mapped[str] = mapped_column(String, default=ApplicationStatus.PENDING.value, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


