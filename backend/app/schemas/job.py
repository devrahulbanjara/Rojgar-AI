from datetime import date, datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field
from pydantic import computed_field

# Import base models and enums from models layer
from app.models.job import (
    JobBase,
    CompanyBase,
    JobLevel,
    LocationType,
    EmploymentType,
    JobStatus,
    SalaryRange,
)


# Company Schemas
class CompanyRead(CompanyBase):
    """Schema for reading company data in API responses"""

    id: int


class CompanyCreate(CompanyBase):
    """Schema for creating a company via API"""

    pass


# Job Schemas
class JobRead(JobBase):
    """Schema for reading job data in API responses"""

    id: int
    posted_date: date
    status: JobStatus
    applicant_count: int
    views_count: int
    created_by: str
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyRead] = None

    # Computed field for backward compatibility with API (properly serialized)
    @computed_field
    @property
    def salary_range(self) -> SalaryRange:
        """Get salary range as nested object"""
        return SalaryRange(
            min=self.salary_min, max=self.salary_max, currency=self.salary_currency
        )


class JobCreate(JobBase):
    """Schema for creating a job via API"""

    created_by: str


class JobUpdate(SQLModel):
    """Schema for updating a job via API"""

    title: Optional[str] = None
    department: Optional[str] = None
    level: Optional[JobLevel] = None
    location: Optional[str] = None
    location_type: Optional[LocationType] = None
    employment_type: Optional[EmploymentType] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    application_deadline: Optional[date] = None
    status: Optional[JobStatus] = None
    is_remote: Optional[bool] = None
    is_featured: Optional[bool] = None


class JobSearchParams(SQLModel):
    """Schema for job search query parameters (dependency injection)"""

    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    search: Optional[str] = Field(default=None, description="Search query")
    location: Optional[str] = Field(default=None, description="Location filter")
    department: Optional[str] = Field(default=None, description="Department filter")
    level: Optional[str] = Field(default=None, description="Job level filter")
    location_type: Optional[str] = Field(
        default=None, description="Location type filter"
    )
    employment_type: Optional[str] = Field(
        default=None, description="Employment type filter"
    )
    salary_min: Optional[int] = Field(
        default=None, ge=0, description="Minimum salary filter"
    )
    salary_max: Optional[int] = Field(
        default=None, ge=0, description="Maximum salary filter"
    )
    is_remote: Optional[bool] = Field(default=None, description="Remote work filter")
    is_featured: Optional[bool] = Field(
        default=None, description="Featured jobs filter"
    )
    company_id: Optional[int] = Field(default=None, description="Company filter")
    sort_by: str = Field(default="posted_date", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order (asc/desc)")

    def to_search_dict(self) -> dict:
        """Convert to dictionary suitable for repository search, filtering out None values"""
        data = self.model_dump(exclude_unset=True)
        # Convert single level/location_type/employment_type to list for repository
        if "level" in data and data["level"] is not None:
            data["level"] = [data["level"]]
        if "location_type" in data and data["location_type"] is not None:
            data["location_type"] = [data["location_type"]]
        if "employment_type" in data and data["employment_type"] is not None:
            data["employment_type"] = [data["employment_type"]]
        return {k: v for k, v in data.items() if v is not None}
