"""
Job and Company models - Simple, easy to understand
Everything related to jobs and companies in one place
"""

from datetime import datetime, date
from typing import Optional, List
from enum import Enum
from sqlalchemy import String, Integer, Boolean, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, computed_field, field_validator

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


# ============= Request/Response Schemas =============

class CompanyResponse(BaseModel):
    """What we send back about a company"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    size: Optional[str] = None
    industry: Optional[str] = None
    brand_color: Optional[str] = None
    founded_year: Optional[int] = None


class JobResponse(BaseModel):
    """What we send back about a job"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    title: str
    department: str
    level: JobLevel
    description: str
    location: str
    location_type: LocationType
    is_remote: bool
    employment_type: EmploymentType
    salary_min: int
    salary_max: int
    salary_currency: str
    requirements: List[str]
    skills: List[str]
    benefits: List[str]
    posted_date: date
    application_deadline: date
    status: JobStatus
    is_featured: bool
    applicant_count: int
    views_count: int
    company_id: int
    company: Optional[CompanyResponse] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    @field_validator('level', 'location_type', 'employment_type', 'status', mode='before')
    @classmethod
    def normalize_enum(cls, v, info):
        """Ensure enum values are in the correct format"""
        if v is None:
            return v
        if not isinstance(v, str):
            return v
            
        # Define mappings for each field
        mappings = {
            'level': {
                'JUNIOR': 'Junior', 'junior': 'Junior',
                'MID': 'Mid', 'mid': 'Mid',
                'SENIOR': 'Senior', 'senior': 'Senior',
                'LEAD': 'Lead', 'lead': 'Lead',
                'PRINCIPAL': 'Principal', 'principal': 'Principal'
            },
            'location_type': {
                'REMOTE': 'Remote', 'remote': 'Remote',
                'ONSITE': 'On-site', 'onsite': 'On-site', 'ON-SITE': 'On-site', 'on-site': 'On-site',
                'HYBRID': 'Hybrid', 'hybrid': 'Hybrid'
            },
            'employment_type': {
                'FULL_TIME': 'Full-time', 'full_time': 'Full-time', 'FULL-TIME': 'Full-time', 'full-time': 'Full-time',
                'PART_TIME': 'Part-time', 'part_time': 'Part-time', 'PART-TIME': 'Part-time', 'part-time': 'Part-time',
                'CONTRACT': 'Contract', 'contract': 'Contract',
                'INTERNSHIP': 'Internship', 'internship': 'Internship'
            },
            'status': {
                'ACTIVE': 'Active', 'active': 'Active',
                'INACTIVE': 'Inactive', 'inactive': 'Inactive',
                'CLOSED': 'Closed', 'closed': 'Closed',
                'DRAFT': 'Draft', 'draft': 'Draft'
            }
        }
        
        field_name = info.field_name
        if field_name in mappings and v in mappings[field_name]:
            return mappings[field_name][v]
        
        return v
    
    # Add a computed salary_range for backwards compatibility
    @computed_field
    @property
    def salary_range(self) -> dict:
        """Returns salary range as a dict"""
        return {
            "min": self.salary_min,
            "max": self.salary_max,
            "currency": self.salary_currency
        }
