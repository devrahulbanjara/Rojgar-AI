from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


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


class JobCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Job title")
    department: str = Field(..., min_length=1, max_length=100, description="Department")
    level: str = Field(..., min_length=1, max_length=50, description="Experience level")
    description: str = Field(..., min_length=10, description="Job description")
    location: str = Field(..., min_length=1, max_length=200, description="Job location")
    location_type: str = Field(..., description="Location type (On-site, Remote, Hybrid)")
    is_remote: bool = Field(default=False, description="Is this a remote position")
    employment_type: str = Field(..., description="Employment type (Full-time, Part-time, Contract)")
    salary_min: int = Field(..., ge=0, description="Minimum salary")
    salary_max: int = Field(..., ge=0, description="Maximum salary")
    salary_currency: str = Field(default="USD", max_length=3, description="Salary currency")
    requirements: List[str] = Field(default_factory=list, description="Job requirements")
    skills: List[str] = Field(default_factory=list, description="Required skills")
    benefits: List[str] = Field(default_factory=list, description="Job benefits")
    application_deadline: Optional[date] = Field(None, description="Application deadline")
    is_featured: bool = Field(default=False, description="Is this a featured job")
    company_id: int = Field(..., description="Company ID")


class JobSearchRequest(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    search: Optional[str] = None
    sort_by: str = Field(default="posted_date", description="Sort by: posted_date or salary")
    sort_order: str = Field(default="desc", description="Sort order: asc or desc")


class CompanyResponse(BaseModel):
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


class JobSearchResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class JobStatsResponse(BaseModel):
    total_jobs: int
    active_jobs: int
    featured_jobs: int
    remote_jobs: int
    avg_salary: float
    top_skills: List[str]
    top_locations: List[str]
    top_companies: List[str]
