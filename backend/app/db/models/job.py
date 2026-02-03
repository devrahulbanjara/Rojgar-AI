import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Uuid
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import get_datetime

from . import Base

if TYPE_CHECKING:
    from .organization import Organization
    from .user import User


class JobDescription(Base):
    __tablename__ = "job_description"
    job_description_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    job_summary: Mapped[str] = mapped_column(String, nullable=False)
    job_responsibilities: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False
    )
    required_qualifications: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True
    )
    preferred: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    compensation_and_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True
    )
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
    job_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organization.organization_id"), nullable=False
    )
    job_description_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("job_description.job_description_id"), nullable=False
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("user.user_id"), nullable=True
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
    auto_shortlist: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
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

    @property
    def id(self) -> uuid.UUID:
        return self.job_id

    @property
    def job_summary(self) -> str:
        return self.job_description.job_summary if self.job_description else ""

    @property
    def job_responsibilities(self) -> list[str]:
        return self.job_description.job_responsibilities if self.job_description else []

    @property
    def required_qualifications(self) -> list[str]:
        return (
            self.job_description.required_qualifications if self.job_description else []
        )

    @property
    def preferred(self) -> list[str]:
        return self.job_description.preferred if self.job_description else []

    @property
    def compensation_and_benefits(self) -> list[str]:
        return (
            self.job_description.compensation_and_benefits
            if self.job_description
            else []
        )


class ReferenceJD(Base):
    __tablename__ = "reference_job_description"
    referncejd_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    department: Mapped[str] = mapped_column(String, nullable=False)
    job_summary: Mapped[str] = mapped_column(String, nullable=False)
    job_responsibilities: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False
    )
    required_qualifications: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True
    )
    preferred: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    compensation_and_benefits: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )
