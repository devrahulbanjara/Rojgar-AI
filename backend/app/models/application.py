from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utc_now():
    return datetime.now(UTC).replace(tzinfo=None)


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SHORTLISTING = "shortlisting"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    OFFER_MADE = "offer_made"
    OFFER_ACCEPTED = "offer_accepted"
    HIRED = "hired"
    REJECTED = "rejected"


class JobApplication(Base):
    __tablename__ = "job_application"

    application_id: Mapped[str] = mapped_column(String, primary_key=True)
    candidate_profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("candidate_profile.profile_id"), nullable=False
    )
    job_id: Mapped[str] = mapped_column(
        String, ForeignKey("job_posting.job_id"), nullable=False
    )
    company_id: Mapped[str] = mapped_column(
        String, ForeignKey("company_profile.company_id"), nullable=False
    )
    resume_id: Mapped[str] = mapped_column(
        String, ForeignKey("resume.resume_id"), nullable=False
    )

    current_status: Mapped[str] = mapped_column(
        String, default=ApplicationStatus.APPLIED, nullable=False
    )

    applied_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now
    )

    job: Mapped["JobPosting"] = relationship("JobPosting")
    company: Mapped["CompanyProfile"] = relationship("CompanyProfile")
    resume: Mapped["Resume"] = relationship("Resume")
    history: Mapped[list["JobApplicationStatusHistory"]] = relationship(
        "JobApplicationStatusHistory", back_populates="application"
    )


class JobApplicationStatusHistory(Base):
    __tablename__ = "job_application_status_history"

    status_history_id: Mapped[str] = mapped_column(String, primary_key=True)
    application_id: Mapped[str] = mapped_column(
        String, ForeignKey("job_application.application_id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String, nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    application: Mapped["JobApplication"] = relationship(
        "JobApplication", back_populates="history"
    )
