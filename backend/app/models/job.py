"""
Job and Company models - Simple, easy to understand
Everything related to jobs and companies in one place
"""

from datetime import datetime, date
from typing import Optional, List
from enum import Enum
from sqlmodel import Field, SQLModel, Column, JSON, Relationship


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


class Company(SQLModel, table=True):
    """
    Company table in database
    Stores information about companies posting jobs
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    size: Optional[str] = None
    industry: Optional[str] = None
    brand_color: Optional[str] = None
    founded_year: Optional[int] = None
    
    # Relationship to jobs
    jobs: List["Job"] = Relationship(back_populates="company")


class Job(SQLModel, table=True):
    """
    Job table in database
    Stores job postings
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Basic job info
    title: str
    department: str
    level: JobLevel
    description: str
    
    # Location details
    location: str
    location_type: LocationType
    is_remote: bool = False
    
    # Employment details
    employment_type: EmploymentType
    
    # Salary info
    salary_min: int
    salary_max: int
    salary_currency: str = "USD"
    
    # Lists stored as JSON
    requirements: List[str] = Field(sa_column=Column(JSON))
    skills: List[str] = Field(sa_column=Column(JSON))
    benefits: List[str] = Field(sa_column=Column(JSON))
    
    # Important dates
    posted_date: date = Field(default_factory=date.today)
    application_deadline: date
    
    # Status and stats
    status: JobStatus = Field(default=JobStatus.ACTIVE, index=True)
    is_featured: bool = False
    applicant_count: int = Field(default=0)
    views_count: int = Field(default=0)
    
    # Relations
    company_id: int = Field(foreign_key="company.id")
    company: Optional["Company"] = Relationship(back_populates="jobs")
    created_by: str = Field(foreign_key="user.id")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ============= Request/Response Schemas =============

class CompanyResponse(SQLModel):
    """What we send back about a company"""
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


class JobResponse(SQLModel):
    """What we send back about a job"""
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
    
    # Add a computed salary_range for backwards compatibility
    @property
    def salary_range(self) -> dict:
        """Returns salary range as a dict"""
        return {
            "min": self.salary_min,
            "max": self.salary_max,
            "currency": self.salary_currency
        }
