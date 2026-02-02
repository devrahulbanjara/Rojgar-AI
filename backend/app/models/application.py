import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import get_datetime
from app.core.database import Base

from .job import JobPosting
from .organization import Organization
from .resume import Resume


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    OUTCOME = "outcome"


class JobApplication(Base):
    __tablename__ = "job_application"
    application_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    candidate_profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("candidate_profile.profile_id"), nullable=False
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("job_posting.job_id"), nullable=False
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organization.organization_id"), nullable=False
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("resume.resume_id"), nullable=False
    )
    current_status: Mapped[str] = mapped_column(
        String, default=ApplicationStatus.APPLIED, nullable=False
    )
    applied_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )
    job: Mapped["JobPosting"] = relationship("JobPosting")
    organization: Mapped["Organization"] = relationship("Organization")
    resume: Mapped["Resume"] = relationship("Resume")
    candidate_profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", foreign_keys=[candidate_profile_id]
    )
    history: Mapped[list["JobApplicationStatusHistory"]] = relationship(
        "JobApplicationStatusHistory", back_populates="application"
    )


class JobApplicationStatusHistory(Base):
    __tablename__ = "job_application_status_history"
    status_history_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("job_application.application_id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String, nullable=False)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    application: Mapped["JobApplication"] = relationship(
        "JobApplication", back_populates="history"
    )
