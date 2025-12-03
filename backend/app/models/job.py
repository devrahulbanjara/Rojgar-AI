from datetime import datetime, date
from typing import Optional, List
from enum import Enum
from sqlalchemy import String, Integer, Boolean, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


class JobLevel(str, Enum):
    JUNIOR = "Junior"
    MID = "Mid"
    SENIOR = "Senior"
    LEAD = "Lead"
    PRINCIPAL = "Principal"


class LocationType(str, Enum):
    REMOTE = "Remote"
    ONSITE = "On-site"
    HYBRID = "Hybrid"


class EmploymentType(str, Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    INTERNSHIP = "Internship"


class JobStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    CLOSED = "Closed"
    DRAFT = "Draft"


class Company(Base):
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
    
    jobs: Mapped[List["Job"]] = relationship(back_populates="company")


class Job(Base):
    __tablename__ = "job"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    
    title: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)
    level: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    
    location: Mapped[str] = mapped_column(String)
    location_type: Mapped[str] = mapped_column(String)
    is_remote: Mapped[bool] = mapped_column(Boolean, default=False)
    
    employment_type: Mapped[str] = mapped_column(String)
    
    salary_min: Mapped[int] = mapped_column(Integer)
    salary_max: Mapped[int] = mapped_column(Integer)
    salary_currency: Mapped[str] = mapped_column(String, default="USD")
    
    requirements: Mapped[List[str]] = mapped_column(JSON)
    skills: Mapped[List[str]] = mapped_column(JSON)
    benefits: Mapped[List[str]] = mapped_column(JSON)
    
    posted_date: Mapped[date] = mapped_column(Date, default=date.today)
    application_deadline: Mapped[date] = mapped_column(Date)
    
    status: Mapped[str] = mapped_column(String, default=JobStatus.ACTIVE.value, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    applicant_count: Mapped[int] = mapped_column(Integer, default=0)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    
    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("company.id"))
    company: Mapped[Optional["Company"]] = relationship(back_populates="jobs")
    created_by: Mapped[str] = mapped_column(String, ForeignKey("user.id"))
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


