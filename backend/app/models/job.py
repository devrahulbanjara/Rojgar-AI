"""
Job and Company models - Simple, easy to understand
Everything related to jobs and companies in one place
"""

from datetime import datetime, date
from typing import Optional, List
from enum import Enum
from sqlalchemy import String, Integer, Boolean, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class JobLevel(str, Enum):
    """Job experience level"""
    JUNIOR = "Junior"
    MID = "Mid"
    SENIOR = "Senior"
    LEAD = "Lead"
    PRINCIPAL = "Principal"


class LocationType(str, Enum):
    """Where the job is located"""
    REMOTE = "Remote"
    ONSITE = "On-site"
    HYBRID = "Hybrid"


class EmploymentType(str, Enum):
    """Type of employment"""
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    INTERNSHIP = "Internship"


class JobStatus(str, Enum):
    """Job posting status"""
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    CLOSED = "Closed"
    DRAFT = "Draft"


class Company(Base):
    """
    Company table in database
    Stores information about companies posting jobs
    """
    __tablename__ = "company"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True)
    logo: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    size: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    brand_color: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    founded_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Relationship to jobs
    jobs: Mapped[List["Job"]] = relationship(back_populates="company")


class Job(Base):
    """
    Job table in database
    Stores job postings
    """
    __tablename__ = "job"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    # Basic job info
    title: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)
    level: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    
    # Location details
    location: Mapped[str] = mapped_column(String)
    location_type: Mapped[str] = mapped_column(String)
    is_remote: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Employment details
    employment_type: Mapped[str] = mapped_column(String)
    
    # Salary info
    salary_min: Mapped[int] = mapped_column(Integer)
    salary_max: Mapped[int] = mapped_column(Integer)
    salary_currency: Mapped[str] = mapped_column(String, default="USD")
    
    # Lists stored as JSON
    requirements: Mapped[List[str]] = mapped_column(JSON)
    skills: Mapped[List[str]] = mapped_column(JSON)
    benefits: Mapped[List[str]] = mapped_column(JSON)
    
    # Important dates
    posted_date: Mapped[date] = mapped_column(Date, default=date.today)
    application_deadline: Mapped[date] = mapped_column(Date)
    
    # Status and stats
    status: Mapped[str] = mapped_column(String, default=JobStatus.ACTIVE.value, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    applicant_count: Mapped[int] = mapped_column(Integer, default=0)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relations
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("company.id"))
    company: Mapped[Optional["Company"]] = relationship(back_populates="jobs")
    created_by: Mapped[str] = mapped_column(String, ForeignKey("user.id"))
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


