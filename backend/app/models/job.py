from typing import Optional, List
from datetime import date, datetime, UTC
from sqlalchemy import String, ForeignKey, Integer, Boolean, Date, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


def utc_now():
    """Returns a timezone-naive UTC datetime (replacement for deprecated datetime.utcnow())."""
    return datetime.now(UTC).replace(tzinfo=None)


class JobDescription(Base):
    __tablename__ = "job_description"
    
    job_description_id: Mapped[str] = mapped_column(String, primary_key=True)
    role_overview: Mapped[str] = mapped_column(String, nullable=False)
    required_skills_experience: Mapped[dict] = mapped_column(JSON, nullable=False)
    nice_to_have: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    offers: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    job_posting: Mapped[Optional["JobPosting"]] = relationship("JobPosting", back_populates="job_description", uselist=False)


class JobPosting(Base):
    __tablename__ = "job_posting"
    
    job_id: Mapped[str] = mapped_column(String, primary_key=True)
    company_id: Mapped[str] = mapped_column(String, ForeignKey("company_profile.company_id"), nullable=False)
    job_description_id: Mapped[str] = mapped_column(String, ForeignKey("job_description.job_description_id"), nullable=False)
    
    title: Mapped[str] = mapped_column(String, nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    level: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    location_city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location_country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location_type: Mapped[str] = mapped_column(String, default="On-site", nullable=False)  # Remote, On-site, Hybrid
    
    employment_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    salary_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    status: Mapped[str] = mapped_column(String, default="active", nullable=False)
    
    is_indexed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    posted_date: Mapped[date] = mapped_column(Date, nullable=False)
    application_deadline: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    company: Mapped["CompanyProfile"] = relationship("CompanyProfile", back_populates="job_postings")
    job_description: Mapped["JobDescription"] = relationship("JobDescription", back_populates="job_posting")
    stats: Mapped[Optional["JobPostingStats"]] = relationship("JobPostingStats", back_populates="job_posting", uselist=False, cascade="all, delete-orphan")


class JobPostingStats(Base):
    __tablename__ = "job_posting_stats"
    
    job_stats_id: Mapped[str] = mapped_column(String, primary_key=True)
    job_id: Mapped[str] = mapped_column(String, ForeignKey("job_posting.job_id"), unique=True, nullable=False)
    
    applicant_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    views_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    
    job_posting: Mapped["JobPosting"] = relationship("JobPosting", back_populates="stats")
