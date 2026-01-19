from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import get_datetime

from . import Base

if TYPE_CHECKING:
    from .organization import Organization
    from .user import User


class JobDescription(Base):
    __tablename__ = "job_description"

    job_description_id: Mapped[str] = mapped_column(String, primary_key=True)
    role_overview: Mapped[str] = mapped_column(String, nullable=False)
    required_skills_experience: Mapped[dict] = mapped_column(JSON, nullable=False)
    nice_to_have: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    offers: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    job_posting: Mapped[Optional["JobPosting"]] = relationship(
        "JobPosting", back_populates="job_description", uselist=False
    )


class JobPosting(Base):
    __tablename__ = "job_posting"

    job_id: Mapped[str] = mapped_column(String, primary_key=True)

    organization_id: Mapped[str] = mapped_column(
        String, ForeignKey("organization.organization_id"), nullable=False
    )

    job_description_id: Mapped[str] = mapped_column(
        String, ForeignKey("job_description.job_description_id"), nullable=False
    )

    # Audit trail: which recruiter created this job (optional)
    created_by_user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("user.user_id"), nullable=True
    )

    title: Mapped[str] = mapped_column(String, nullable=False)
    department: Mapped[str | None] = mapped_column(String, nullable=True)
    level: Mapped[str | None] = mapped_column(String, nullable=True)

    location_city: Mapped[str | None] = mapped_column(String, nullable=True)
    location_country: Mapped[str | None] = mapped_column(String, nullable=True)
    location_type: Mapped[str] = mapped_column(
        String, default="On-site", nullable=False
    )

    employment_type: Mapped[str | None] = mapped_column(String, nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str | None] = mapped_column(String, nullable=True)

    status: Mapped[str] = mapped_column(String, default="active", nullable=False)

    is_indexed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    posted_date: Mapped[date] = mapped_column(Date, nullable=False)
    application_deadline: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="jobs"
    )

    job_description: Mapped["JobDescription"] = relationship(
        "JobDescription", back_populates="job_posting"
    )

    created_by: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[created_by_user_id]
    )
    stats: Mapped[Optional["JobPostingStats"]] = relationship(
        "JobPostingStats",
        back_populates="job_posting",
        uselist=False,
        cascade="all, delete-orphan",
    )


class JobPostingStats(Base):
    __tablename__ = "job_posting_stats"

    job_stats_id: Mapped[str] = mapped_column(String, primary_key=True)
    job_id: Mapped[str] = mapped_column(
        String, ForeignKey("job_posting.job_id"), unique=True, nullable=False
    )

    applicant_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    job_posting: Mapped["JobPosting"] = relationship(
        "JobPosting", back_populates="stats"
    )


class ReferenceJobDescriptions(Base):
    __tablename__ = "reference_job_description"
    referncejd_id: Mapped[str] = mapped_column(String, primary_key=True)
    organization_id: Mapped[str] = mapped_column(String, nullable=False)
    department: Mapped[str] = mapped_column(String, nullable=False)
    role_overview: Mapped[str] = mapped_column(String, nullable=False)
    required_skills_experience: Mapped[list] = mapped_column(JSON, nullable=False)
    nice_to_have: Mapped[list | None] = mapped_column(JSON, nullable=True)
    offers: Mapped[list | None] = mapped_column(JSON, nullable=True)
