from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class GapItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    area: str
    severity: str
    suggestion: str
    evidence_span: str = ""
    evidence_source: Literal["resume", "jd", ""] = ""


class GapAnalysisResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    missing_skills: list[GapItem]
    experience_gaps: list[GapItem]
    things_to_add_to_summary: list[str]
    things_to_remove_or_deemphasize: list[str]
    things_already_strong: list[str]
    overall_score_estimate: int = Field(ge=0, le=100)
    overall_verdict: str


class GapAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    resume_id: UUID
    job_id: UUID


class AutoPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    resume_id: UUID
    job_id: UUID
    gap_result: GapAnalysisResult


class ExperiencePatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    index: int = Field(ge=0)
    description: list[str]


class AutoPatchResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    headline: str
    summary: str
    skills: list[str]
    experience_patches: list[ExperiencePatch]


class PatchedFieldDiff(BaseModel):
    field: str
    label: str
    old_value: str | None
    new_value: str | None


class AutoPatchResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    updated_fields: list[str]
    message: str
    diffs: list[PatchedFieldDiff]
