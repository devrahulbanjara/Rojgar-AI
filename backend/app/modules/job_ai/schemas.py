from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.shared.enums import JobStatus, LocationType


class SalaryEvidence(BaseModel):
    source_name: str
    url: str
    country: str
    currency: str | None
    quoted_min: float | None
    quoted_max: float | None
    notes: str | None

    model_config = {"extra": "forbid"}


class SalaryResearch(BaseModel):
    role: str
    country: str
    currency: str | None
    recommended_min: float | None
    recommended_max: float | None
    confidence: Literal["low", "medium", "high"]
    rationale: str
    sources: list[SalaryEvidence]
    insufficient_evidence: bool

    model_config = {"extra": "forbid"}


class JobDraft(BaseModel):
    title: str = Field(default="", max_length=255)
    location: str | None
    location_type: LocationType
    salary_min: int | None
    salary_max: int | None
    currency: str | None = Field(max_length=10)
    status: JobStatus
    shortlist_threshold: int = Field(default=70, ge=0, le=100)
    required_years_of_experience: int | None = None

    overview: str = Field(default="", max_length=5000)
    responsibilities: list[str] = Field(max_length=50)
    requirements: list[str] = Field(max_length=50)
    preferred_qualifications: list[str] = Field(max_length=30)
    benefits: list[str] = Field(max_length=30)
    auto_shortlist: bool = Field(default=False)

    assumptions: list[str]
    missing_fields: list[str]
    warnings: list[str]

    model_config = {"extra": "forbid"}

    @field_validator(
        "responsibilities",
        "requirements",
        "preferred_qualifications",
        "benefits",
        mode="before",
    )
    @classmethod
    def normalize_lists(cls, value: Any) -> list[str]:
        """Normalize list-like draft fields into trimmed string lists."""
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        raise ValueError("Expected a list of strings")

    @model_validator(mode="after")
    def check_salary_range(self) -> "JobDraft":
        """Ensure the salary range is ordered correctly."""
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("salary_min cannot be greater than salary_max")
        return self


class GenerateJobDraftRequest(BaseModel):
    title: str | None = None
    rough_description: str | None = None
    source_job_id: UUID | None = None
    mode: Literal["create", "improve", "clone"] = "create"
    research_salary: bool = False
    locked_fields: list[str] = []
    manual: bool = False

    @model_validator(mode="after")
    def validate_input(self) -> "GenerateJobDraftRequest":
        """Require at least one source of draft-generation input."""
        if self.manual:
            return self
        if not self.title and not self.rough_description and not self.source_job_id:
            raise ValueError("Provide title, rough_description, or source_job_id")
        return self


class HumanDecision(BaseModel):
    action: Literal["approve", "edit", "regenerate", "reject", "save_draft"]
    edited_fields: dict[str, Any] | None = None
    regenerate_fields: list[str] | None = None
    feedback: str | None = None
    locked_fields: list[str] | None = None


class RespondToDraftRequest(BaseModel):
    decision: HumanDecision


class CommitDraftRequest(BaseModel):
    status_override: JobStatus | None = None


class JobAIDraftResponse(BaseModel):
    id: UUID
    thread_id: str
    status: str
    mode: str
    source_title: str | None
    source_rough_description: str | None
    locked_fields: list[str]
    latest_draft: JobDraft | None
    salary_research: SalaryResearch | None
    assumptions: list[str]
    warnings: list[str]
    missing_fields: list[str]
    last_interrupt: dict | None
    committed_job_id: UUID | None
    company_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
