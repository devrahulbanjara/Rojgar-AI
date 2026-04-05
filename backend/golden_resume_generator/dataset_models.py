from __future__ import annotations

from dataclasses import dataclass

from pydantic import BaseModel, Field

from app.modules.profiles.ai_import_schemas import ImportedCandidateDocument


@dataclass(frozen=True)
class ResumeSpec:
    index: int
    style_key: str
    style_label: str
    style_bucket_index: int
    style_prompt: str
    career_level: str
    domain: str
    edge_case: str
    company_hint: str
    education_hint: str
    location_hint: str
    date_style: str
    render_variant: int


class ExperienceSectionPlan(BaseModel):
    title: str = Field(min_length=1, max_length=80)
    entry_indices: list[int] = Field(default_factory=list)


class ResumeRenderPlan(BaseModel):
    summary_title: str = Field(default="Summary", min_length=1, max_length=80)
    education_title: str = Field(default="Education", min_length=1, max_length=80)
    skills_section_title: str | None = Field(default="Technical Skills", max_length=80)
    skills_lines: list[str] = Field(default_factory=list)
    experience_sections: list[ExperienceSectionPlan] = Field(default_factory=list)


class GeneratedResumePayload(BaseModel):
    document: ImportedCandidateDocument
    render_plan: ResumeRenderPlan
