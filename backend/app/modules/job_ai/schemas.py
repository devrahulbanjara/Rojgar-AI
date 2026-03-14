from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.shared.enums import JobStatus, LocationType


class SalaryEvidence(BaseModel):
    source_name: str = Field(...)
    url: str = Field(...)
    country: str = Field(...)
    currency: str | None = Field(...)
    quoted_min: float | None = Field(...)
    quoted_max: float | None = Field(...)
    notes: str | None = Field(...)

    model_config = {"extra": "forbid"}


class SalaryResearch(BaseModel):
    role: str = Field(...)
    country: str = Field(...)
    currency: str | None = Field(...)
    recommended_min: float | None = Field(...)
    recommended_max: float | None = Field(...)
    confidence: Literal["low", "medium", "high"] = Field(...)
    rationale: str = Field(...)
    sources: list[SalaryEvidence] = Field(...)
    insufficient_evidence: bool = Field(...)

    model_config = {"extra": "forbid"}


class JobDraft(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    location: str | None = Field(...)
    location_type: LocationType = Field(...)
    salary_min: int | None = Field(...)
    salary_max: int | None = Field(...)
    currency: str | None = Field(..., max_length=10)
    status: JobStatus = Field(...)

    overview: str = Field(..., min_length=1)
    responsibilities: list[str] = Field(...)
    requirements: list[str] = Field(...)
    preferred_qualifications: list[str] = Field(...)
    benefits: list[str] = Field(...)

    assumptions: list[str] = Field(...)
    missing_fields: list[str] = Field(...)
    warnings: list[str] = Field(...)

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
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        raise ValueError("Expected a list of strings")

    @model_validator(mode="after")
    def check_salary_range(self) -> "JobDraft":
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("salary_min cannot be greater than salary_max")
        return self


class GenerateJobDraftRequest(BaseModel):
    prompt: str | None = None
    source_text: str | None = None
    source_job_id: UUID | None = None
    mode: Literal["create", "improve", "clone"] = "create"
    research_salary: bool = False
    locked_fields: list[str] = []

    @model_validator(mode="after")
    def validate_input(self) -> "GenerateJobDraftRequest":
        if not self.prompt and not self.source_text and not self.source_job_id:
            raise ValueError("Provide prompt, source_text, or source_job_id")
        return self


class HumanDecision(BaseModel):
    action: Literal["approve", "edit", "regenerate", "reject", "save_draft"]
    edited_fields: dict[str, Any] | None = None
    regenerate_fields: list[str] | None = None
    feedback: str | None = None


class RespondToDraftRequest(BaseModel):
    decision: HumanDecision


class CommitDraftRequest(BaseModel):
    status_override: JobStatus | None = None


class JobAIDraftResponse(BaseModel):
    id: UUID
    thread_id: str
    status: str
    mode: str
    source_prompt: str | None
    source_text: str | None
    locked_fields: list[str]
    latest_draft: JobDraft | None
    salary_research: SalaryResearch | None
    assumptions: list[str]
    warnings: list[str]
    missing_fields: list[str]
    last_interrupt: dict | None
    committed_job_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
