from datetime import datetime
from uuid import UUID

from pydantic import Field, model_validator

from app.core.schemas import BaseSchema
from app.shared.enums import JobStatus, LocationType


# ---------------------------------------------------------------------------
# Base class — shared fields + salary-range invariant
# ---------------------------------------------------------------------------


class JobBase(BaseSchema):
    """Shared fields for JobCreate and JobUpdate. All fields optional here;
    sub-classes tighten constraints where needed."""

    title: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    location_type: LocationType | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str | None = Field(default=None, max_length=10)
    status: JobStatus | None = None
    overview: str | None = None
    responsibilities: list[str] | None = None
    requirements: list[str] | None = None
    preferred_qualifications: list[str] | None = None
    benefits: list[str] | None = None

    @model_validator(mode="after")
    def check_salary_range(self) -> "JobBase":
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("salary_min cannot be greater than salary_max")
        return self


# ---------------------------------------------------------------------------
# Write schemas
# ---------------------------------------------------------------------------


class JobCreate(JobBase):
    """All required fields must be provided on creation."""

    title: str = Field(min_length=1, max_length=255)
    location_type: LocationType = LocationType.onsite
    currency: str = Field(default="USD", max_length=10)
    status: JobStatus = JobStatus.draft
    responsibilities: list[str] = []
    requirements: list[str] = []
    preferred_qualifications: list[str] = []
    benefits: list[str] = []


class JobUpdate(JobBase):
    """All fields are optional — only provided fields are applied."""

    pass


# ---------------------------------------------------------------------------
# Read schemas
# ---------------------------------------------------------------------------


class CompanySnippet(BaseSchema):
    """Minimal company info embedded in job responses."""

    id: UUID
    name: str
    industry: str | None = None
    company_size: str | None = None
    location: str | None = None
    website_url: str | None = None
    description: str | None = None


class JobListItem(BaseSchema):
    """Lightweight summary for job listings (no heavy text fields)."""

    id: UUID
    company_id: UUID
    company: CompanySnippet
    title: str
    category: str | None = None
    location: str | None = None
    location_type: LocationType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str = "NPR"
    status: JobStatus
    created_at: datetime


class JobDetailResponse(BaseSchema):
    """Full job including all description text fields."""

    id: UUID
    company_id: UUID
    company: CompanySnippet
    posted_by: UUID | None = None
    title: str
    category: str | None = None
    location: str | None = None
    location_type: LocationType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str
    status: JobStatus
    overview: str | None = None
    responsibilities: list[str] = []
    requirements: list[str] = []
    preferred_qualifications: list[str] = []
    benefits: list[str] = []
    created_at: datetime
    updated_at: datetime
