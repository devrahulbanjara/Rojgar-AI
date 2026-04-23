from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field, field_validator, model_validator

from app.core.schemas import BaseSchema


class EvaluationCriterion(BaseSchema):
    key: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=120)
    max_score: int = Field(ge=1, le=1000)
    weight: float = Field(default=1.0, gt=0)

    @field_validator("key")
    @classmethod
    def normalize_key(cls, value: str) -> str:
        """Normalize criterion keys into stable snake_case values."""
        normalized = value.strip().lower().replace(" ", "_")
        if not normalized:
            raise ValueError("Criterion key is required.")
        return normalized

    @field_validator("label")
    @classmethod
    def normalize_label(cls, value: str) -> str:
        """Trim and validate criterion labels."""
        normalized = value.strip()
        if not normalized:
            raise ValueError("Criterion label is required.")
        return normalized


class UpsertJobEvaluationSchemaRequest(BaseSchema):
    criteria: list[EvaluationCriterion]
    human_weight: float = Field(default=0.5, ge=0, le=1)
    llm_weight: float = Field(default=0.5, ge=0, le=1)

    @model_validator(mode="after")
    def validate_schema(self):
        """Validate schema completeness, uniqueness, and weight totals."""
        if not self.criteria:
            raise ValueError("At least one criterion is required.")

        keys = [criterion.key for criterion in self.criteria]
        if len(keys) != len(set(keys)):
            raise ValueError("Criterion keys must be unique within a schema.")

        if round(self.human_weight + self.llm_weight, 6) != 1.0:
            raise ValueError("human_weight + llm_weight must equal 1.0")
        return self


class JobEvaluationSchemaResponse(BaseSchema):
    id: UUID
    job_id: UUID
    version: int
    criteria: list[EvaluationCriterion]
    human_weight: float
    llm_weight: float
    created_at: datetime
    updated_at: datetime


class SubmitHumanEvaluationRequest(BaseSchema):
    scores: dict[str, float]
    notes: str | None = None


class EvaluationScoreResponse(BaseSchema):
    id: UUID
    application_id: UUID
    job_id: UUID
    schema_id: UUID | None = None
    schema_version: int
    evaluator_type: Literal["human", "llm"]
    scores: dict[str, float]
    criteria_snapshot: list[EvaluationCriterion]
    notes: str | None = None
    weighted_total: float | None = None
    submitted_by_user_id: UUID | None = None
    created_at: datetime
    updated_at: datetime


class CombinedEvaluationResponse(BaseSchema):
    application_id: UUID
    job_id: UUID
    evaluation_schema: JobEvaluationSchemaResponse | None = Field(
        default=None,
        alias="schema",
        serialization_alias="schema",
    )
    human: EvaluationScoreResponse | None = None
    llm: EvaluationScoreResponse | None = None
    final_score: float | None = None


class BatchTranscribeCandidateResponse(BaseSchema):
    application_id: UUID
    job_id: UUID
    candidate_name: str
    candidate_email: str
    latest_recording_id: UUID | None = None
    latest_recording_duration_seconds: int | None = None
    latest_recording_status: str | None = None
    transcript_available: bool = False
    can_batch_transcribe: bool = False
