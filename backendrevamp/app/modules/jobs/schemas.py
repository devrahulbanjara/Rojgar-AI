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


class JobListItem(BaseSchema):
    """Lightweight summary for job listings (no heavy text fields)."""

    id: UUID
    company_id: UUID
    title: str
    location: str | None = None
    location_type: LocationType
    status: JobStatus
    created_at: datetime


class JobDetailResponse(BaseSchema):
    """Full job including all description text fields."""

    id: UUID
    company_id: UUID
    posted_by: UUID | None = None
    title: str
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
