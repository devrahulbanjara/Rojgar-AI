from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict, computed_field, field_validator
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
    location_type: str = Field(
        ..., description="Location type (On-site, Remote, Hybrid)"
    )
    is_remote: bool = Field(default=False, description="Is this a remote position")
    employment_type: str = Field(
        ..., description="Employment type (Full-time, Part-time, Contract)"
    )
    salary_min: int = Field(..., ge=0, description="Minimum salary")
    salary_max: int = Field(..., ge=0, description="Maximum salary")
    salary_currency: str = Field(
        default="USD", max_length=3, description="Salary currency"
    )
    requirements: List[str] = Field(
        default_factory=list, description="Job requirements"
    )
    skills: List[str] = Field(default_factory=list, description="Required skills")
    benefits: List[str] = Field(default_factory=list, description="Job benefits")
    application_deadline: Optional[date] = Field(
        None, description="Application deadline"
    )
    is_featured: bool = Field(default=False, description="Is this a featured job")
    company_id: int = Field(..., description="Company ID")


class JobUpdateRequest(BaseModel):

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    level: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, min_length=10)
    location: Optional[str] = Field(None, min_length=1, max_length=200)
    location_type: Optional[str] = Field(None)
    is_remote: Optional[bool] = Field(None)
    employment_type: Optional[str] = Field(None)
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    salary_currency: Optional[str] = Field(None, max_length=3)
    requirements: Optional[List[str]] = Field(None)
    skills: Optional[List[str]] = Field(None)
    benefits: Optional[List[str]] = Field(None)
    application_deadline: Optional[date] = Field(None)
    is_featured: Optional[bool] = Field(None)
    status: Optional[str] = Field(None, description="Job status")


class JobSearchRequest(BaseModel):

    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    search: Optional[str] = None
    sort_by: str = Field(
        default="posted_date", description="Sort by: posted_date or salary"
    )
    sort_order: str = Field(default="desc", description="Sort order: asc or desc")


class JobRecommendationRequest(BaseModel):

    limit: int = Field(default=5, ge=1, le=20, description="Number of recommendations")


class CompanyCreateRequest(BaseModel):

    name: str = Field(..., min_length=1, max_length=200, description="Company name")
    logo: Optional[str] = Field(None, description="Company logo URL")
    website: Optional[str] = Field(None, description="Company website")
    description: Optional[str] = Field(None, description="Company description")
    location: Optional[str] = Field(
        None, max_length=200, description="Company location"
    )
    size: Optional[str] = Field(None, description="Company size")
    industry: Optional[str] = Field(None, description="Industry")
    brand_color: Optional[str] = Field(None, description="Brand color")
    founded_year: Optional[int] = Field(
        None, ge=1800, le=2025, description="Founded year"
    )


class CompanyUpdateRequest(BaseModel):

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    logo: Optional[str] = Field(None)
    website: Optional[str] = Field(None)
    description: Optional[str] = Field(None)
    location: Optional[str] = Field(None, max_length=200)
    size: Optional[str] = Field(None)
    industry: Optional[str] = Field(None)
    brand_color: Optional[str] = Field(None)
    founded_year: Optional[int] = Field(None, ge=1800, le=2025)


class JobViewRequest(BaseModel):

    job_id: int = Field(..., description="Job ID to view")


class JobApplicationRequest(BaseModel):

    job_id: int = Field(..., description="Job ID to apply to")


class JobStatsRequest(BaseModel):

    pass  # No specific parameters needed for stats


class SalaryRange(BaseModel):

    min: int
    max: int
    currency: str


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

    @field_validator(
        "level", "location_type", "employment_type", "status", mode="before"
    )
    @classmethod
    def normalize_enum(cls, v, info):
        if v is None:
            return v
        if not isinstance(v, str):
            return v

        mappings = {
            "level": {
                "JUNIOR": "Junior",
                "junior": "Junior",
                "MID": "Mid",
                "mid": "Mid",
                "SENIOR": "Senior",
                "senior": "Senior",
                "LEAD": "Lead",
                "lead": "Lead",
                "PRINCIPAL": "Principal",
                "principal": "Principal",
            },
            "location_type": {
                "REMOTE": "Remote",
                "remote": "Remote",
                "ONSITE": "On-site",
                "onsite": "On-site",
                "ON-SITE": "On-site",
                "on-site": "On-site",
                "HYBRID": "Hybrid",
                "hybrid": "Hybrid",
            },
            "employment_type": {
                "FULL_TIME": "Full-time",
                "full_time": "Full-time",
                "FULL-TIME": "Full-time",
                "full-time": "Full-time",
                "PART_TIME": "Part-time",
                "part_time": "Part-time",
                "PART-TIME": "Part-time",
                "part-time": "Part-time",
                "CONTRACT": "Contract",
                "contract": "Contract",
                "INTERNSHIP": "Internship",
                "internship": "Internship",
            },
            "status": {
                "ACTIVE": "Active",
                "active": "Active",
                "INACTIVE": "Inactive",
                "inactive": "Inactive",
                "CLOSED": "Closed",
                "closed": "Closed",
                "DRAFT": "Draft",
                "draft": "Draft",
            },
        }

        field_name = info.field_name
        if field_name in mappings and v in mappings[field_name]:
            return mappings[field_name][v]

        return v

    @computed_field
    @property
    def salary_range(self) -> dict:
        return {
            "min": self.salary_min,
            "max": self.salary_max,
            "currency": self.salary_currency,
        }


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
