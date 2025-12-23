from typing import Optional, List
from datetime import datetime, UTC
from sqlalchemy import String, ForeignKey, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


def utc_now():
    """Returns a timezone-naive UTC datetime (replacement for deprecated datetime.utcnow())."""
    return datetime.now(UTC).replace(tzinfo=None)


class CompanyProfile(Base):
    __tablename__ = "company_profile"
    
    company_id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.user_id"), unique=True, nullable=False)
    
    location_city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location_country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    founded_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    user: Mapped["User"] = relationship("User", back_populates="company_profile")
    
    activities: Mapped[List["CompanyActivity"]] = relationship("CompanyActivity", back_populates="company", cascade="all, delete-orphan")
    job_postings: Mapped[List["JobPosting"]] = relationship("JobPosting", back_populates="company", cascade="all, delete-orphan")

    @property
    def company_name(self) -> str:
        return self.user.name if self.user else "Unknown Company"


class CompanyActivity(Base):
    __tablename__ = "company_activity"
    
    activity_id: Mapped[str] = mapped_column(String, primary_key=True)
    company_id: Mapped[str] = mapped_column(String, ForeignKey("company_profile.company_id"), nullable=False)
    activity_type: Mapped[str] = mapped_column(String, nullable=False)
    
    related_job_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("job_posting.job_id"), nullable=True)
    related_candidate_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("candidate_profile.profile_id"), nullable=True)
    related_resume_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("resume.resume_id"), nullable=True)
    
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    
    company: Mapped["CompanyProfile"] = relationship("CompanyProfile", back_populates="activities")
