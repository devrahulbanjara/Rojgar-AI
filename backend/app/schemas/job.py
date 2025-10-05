"""
Job Pydantic schemas for request/response validation
Clean, production-ready schemas with proper validation
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum


class JobLevel(str, Enum):
    """Job level enumeration"""
    JUNIOR = "Junior"
    MID = "Mid"
    SENIOR = "Senior"
    LEAD = "Lead"
    PRINCIPAL = "Principal"


class LocationType(str, Enum):
    """Location type enumeration"""
    REMOTE = "Remote"
    ONSITE = "On-site"
    HYBRID = "Hybrid"


class EmploymentType(str, Enum):
    """Employment type enumeration"""
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    INTERNSHIP = "Internship"


class JobStatus(str, Enum):
    """Job status enumeration"""
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    CLOSED = "Closed"
    DRAFT = "Draft"


class SalaryRangeSchema(BaseModel):
    """Salary range schema"""
    min: int = Field(..., ge=0, description="Minimum salary")
    max: int = Field(..., ge=0, description="Maximum salary")
    currency: str = Field(..., min_length=3, max_length=3, description="Currency code (e.g., NPR, USD)")

    @validator('max')
    def max_must_be_greater_than_min(cls, v, values):
        """Validate that max salary is greater than min salary"""
        if 'min' in values and v <= values['min']:
            raise ValueError('Maximum salary must be greater than minimum salary')
        return v

    class Config:
        from_attributes = True


class CompanySchema(BaseModel):
    """Company schema"""
    id: int = Field(..., description="Company ID")
    name: str = Field(..., min_length=1, max_length=255, description="Company name")
    logo: Optional[str] = Field(None, description="Company logo URL")
    website: Optional[str] = Field(None, description="Company website URL")
    description: Optional[str] = Field(None, description="Company description")
    location: Optional[str] = Field(None, description="Company location")
    size: Optional[str] = Field(None, description="Company size")
    industry: Optional[str] = Field(None, description="Company industry")
    brand_color: Optional[str] = Field(None, description="Company brand color")
    founded_year: Optional[int] = Field(None, ge=1800, le=2024, description="Company founded year")

    class Config:
        from_attributes = True


class JobBase(BaseModel):
    """Base job schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Job title")
    company_id: int = Field(..., description="Company ID")
    department: str = Field(..., min_length=1, max_length=100, description="Department")
    level: JobLevel = Field(..., description="Job level")
    location: str = Field(..., min_length=1, max_length=255, description="Job location")
    location_type: LocationType = Field(..., description="Location type")
    employment_type: EmploymentType = Field(..., description="Employment type")
    salary_range: SalaryRangeSchema = Field(..., description="Salary range")
    description: str = Field(..., min_length=10, description="Job description")
    requirements: List[str] = Field(..., min_items=1, description="Job requirements")
    skills: List[str] = Field(..., min_items=1, description="Required skills")
    benefits: List[str] = Field(default_factory=list, description="Job benefits")
    application_deadline: str = Field(..., description="Application deadline")
    is_remote: bool = Field(default=False, description="Is remote work allowed")
    is_featured: bool = Field(default=False, description="Is featured job")


class JobCreate(JobBase):
    """Schema for creating a new job"""
    pass


class JobUpdate(BaseModel):
    """Schema for updating a job"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    company_id: Optional[int] = None
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    level: Optional[JobLevel] = None
    location: Optional[str] = Field(None, min_length=1, max_length=255)
    location_type: Optional[LocationType] = None
    employment_type: Optional[EmploymentType] = None
    salary_range: Optional[SalaryRangeSchema] = None
    description: Optional[str] = Field(None, min_length=10)
    requirements: Optional[List[str]] = Field(None, min_items=1)
    skills: Optional[List[str]] = Field(None, min_items=1)
    benefits: Optional[List[str]] = None
    application_deadline: Optional[str] = None
    status: Optional[JobStatus] = None
    is_remote: Optional[bool] = None
    is_featured: Optional[bool] = None


class JobResponse(JobBase):
    """Schema for job response"""
    id: int = Field(..., description="Job ID")
    posted_date: str = Field(..., description="Posted date")
    status: JobStatus = Field(..., description="Job status")
    applicant_count: int = Field(..., ge=0, description="Number of applicants")
    views_count: int = Field(..., ge=0, description="Number of views")
    created_by: str = Field(..., description="Created by user ID")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    company: Optional[CompanySchema] = Field(None, description="Company information")

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    """Schema for job list response"""
    jobs: List[JobResponse] = Field(..., description="List of jobs")
    total: int = Field(..., ge=0, description="Total number of jobs")
    page: int = Field(..., ge=1, description="Current page number")
    total_pages: int = Field(..., ge=1, description="Total number of pages")
    has_next: bool = Field(..., description="Has next page")
    has_prev: bool = Field(..., description="Has previous page")

    class Config:
        from_attributes = True


class JobSearchParams(BaseModel):
    """Schema for job search parameters"""
    search: Optional[str] = Field(None, description="Search query")
    location: Optional[str] = Field(None, description="Location filter")
    department: Optional[str] = Field(None, description="Department filter")
    level: Optional[List[JobLevel]] = Field(None, description="Job level filter")
    location_type: Optional[List[LocationType]] = Field(None, description="Location type filter")
    employment_type: Optional[List[EmploymentType]] = Field(None, description="Employment type filter")
    salary_min: Optional[int] = Field(None, ge=0, description="Minimum salary filter")
    salary_max: Optional[int] = Field(None, ge=0, description="Maximum salary filter")
    is_remote: Optional[bool] = Field(None, description="Remote work filter")
    is_featured: Optional[bool] = Field(None, description="Featured jobs filter")
    company_id: Optional[int] = Field(None, description="Company filter")
    sort_by: Optional[str] = Field("posted_date", description="Sort field")
    sort_order: Optional[str] = Field("desc", description="Sort order (asc/desc)")
    page: Optional[int] = Field(1, ge=1, description="Page number")
    limit: Optional[int] = Field(20, ge=1, le=100, description="Items per page")

    @validator('salary_max')
    def salary_max_validation(cls, v, values):
        """Validate salary max is greater than min"""
        if v is not None and 'salary_min' in values and values['salary_min'] is not None:
            if v <= values['salary_min']:
                raise ValueError('Maximum salary must be greater than minimum salary')
        return v

    @validator('sort_by')
    def validate_sort_by(cls, v):
        """Validate sort field"""
        allowed_fields = ['posted_date', 'title', 'salary', 'company', 'views_count', 'applicant_count']
        if v not in allowed_fields:
            raise ValueError(f'Sort field must be one of: {", ".join(allowed_fields)}')
        return v

    @validator('sort_order')
    def validate_sort_order(cls, v):
        """Validate sort order"""
        if v not in ['asc', 'desc']:
            raise ValueError('Sort order must be "asc" or "desc"')
        return v

    class Config:
        from_attributes = True


class JobStatsResponse(BaseModel):
    """Schema for job statistics response"""
    total_jobs: int = Field(..., ge=0, description="Total number of jobs")
    active_jobs: int = Field(..., ge=0, description="Number of active jobs")
    featured_jobs: int = Field(..., ge=0, description="Number of featured jobs")
    remote_jobs: int = Field(..., ge=0, description="Number of remote jobs")
    avg_salary: Optional[float] = Field(None, ge=0, description="Average salary")
    top_skills: List[str] = Field(..., description="Most common skills")
    top_locations: List[str] = Field(..., description="Most common locations")
    top_companies: List[str] = Field(..., description="Most active companies")

    class Config:
        from_attributes = True
