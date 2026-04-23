from datetime import datetime, timezone
from uuid import UUID

from app.core.schemas import BaseSchema
from app.shared.enums import JobStatus, LocationType
from pydantic import Field, model_validator


class JobBase(BaseSchema):
    title: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    location_type: LocationType | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str | None = Field(default=None, max_length=10)
    status: JobStatus | None = None
    expires_at: datetime | None = None
    overview: str | None = None
    responsibilities: list[str] | None = None
    requirements: list[str] | None = None
    preferred_qualifications: list[str] | None = None
    benefits: list[str] | None = None
    auto_shortlist: bool = False
    shortlist_threshold: int = Field(default=70, ge=0, le=100)

    @model_validator(mode="after")
    def validate_job_fields(self) -> "JobBase":
        """Validate salary ordering and date constraints for a job payload."""
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("salary_min cannot be greater than salary_max")

        if self.expires_at is not None:
            if self.expires_at.tzinfo is None:
                raise ValueError("expires_at must be timezone-aware")

            if self.status == JobStatus.active and self.expires_at <= datetime.now(
                timezone.utc
            ):
                raise ValueError("expires_at must be in the future for active jobs")

        return self


class JobCreate(JobBase):
    """All required fields must be provided on creation."""

    title: str = Field(min_length=1, max_length=255)
    location_type: LocationType = LocationType.onsite
    currency: str = Field(default="NPR", max_length=10)
    status: JobStatus = JobStatus.draft


class JobUpdate(JobBase):
    """All fields are optional — only provided fields are applied."""

    pass


class CompanySnippet(BaseSchema):
    """Minimal company info embedded in job responses."""

    id: UUID
    name: str
    logo_url: str | None = None
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
    location: str | None = None
    location_type: LocationType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str = "NPR"
    status: JobStatus
    auto_shortlist: bool = False
    shortlist_threshold: int = 70
    expires_at: datetime | None = None
    applications_count: int = 0
    final_shortlist_completed: bool = False
    hiring_completed: bool = False
    has_applied: bool = False
    created_at: datetime

    match_score: float | None = Field(
        default=None, description="Semantic similarity score (0–1)"
    )
    is_fallback: bool = Field(
        default=False,
        description="True when job is shown outside the user's applied filters",
    )


class JobDetailResponse(BaseSchema):
    """Full job including all description text fields."""

    id: UUID
    company_id: UUID
    company: CompanySnippet
    posted_by: UUID | None = None
    title: str
    location: str | None = None
    location_type: LocationType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str
    status: JobStatus
    auto_shortlist: bool = False
    shortlist_threshold: int = 70
    expires_at: datetime | None = None
    overview: str | None = None
    responsibilities: list[str] = []
    requirements: list[str] = []
    preferred_qualifications: list[str] = []
    benefits: list[str] = []
    applications_count: int = 0
    hiring_completed: bool = False
    has_applied: bool = False
    created_at: datetime
    updated_at: datetime
