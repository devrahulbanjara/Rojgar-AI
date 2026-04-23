from datetime import date
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field, model_validator

from app.core.schemas import BaseSchema
from app.modules.profiles.schemas import ProfileResponse
from app.modules.resumes.schemas import ResumeResponse


class ImportedSkillInput(BaseSchema):
    skill_name: str = Field(
        min_length=1,
        max_length=100,
        description="Skill name.",
    )


class ImportedEducationInput(BaseSchema):
    institution: str = Field(
        min_length=1,
        max_length=255,
        description="Institution name exactly as found in the resume.",
    )
    degree: str | None = Field(default=None, max_length=255)
    field_of_study: str | None = Field(default=None, max_length=255)
    start_date: date | None = Field(
        default=None,
        description="ISO date YYYY-MM-DD if confidently known, otherwise null.",
    )
    end_date: date | None = Field(
        default=None,
        description="ISO date YYYY-MM-DD if confidently known, otherwise null.",
    )


class ImportedExperienceInput(BaseSchema):
    company_name: str = Field(
        min_length=1,
        max_length=255,
        description="Company name exactly as found in the resume.",
    )
    title: str = Field(
        min_length=1,
        max_length=255,
        description="Role title exactly as found in the resume.",
    )
    start_date: date | None = Field(
        default=None,
        description="ISO date YYYY-MM-DD if confidently known, otherwise null.",
    )
    end_date: date | None = Field(
        default=None,
        description="ISO date YYYY-MM-DD if confidently known, otherwise null.",
    )
    description: list[str] = Field(
        default_factory=list,
        description="Bullet points exactly from the resume where possible.",
    )


class ImportedCandidateDocument(BaseSchema):
    full_name: str | None = Field(default=None, max_length=255)
    headline: str | None = Field(default=None, max_length=255)
    summary: str | None = None
    phone: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    portfolio_url: str | None = Field(default=None, max_length=500)
    years_of_experience: int | None = None
    target_roles: list[str] = Field(default_factory=list)
    experiences: list[ImportedExperienceInput] = Field(default_factory=list)
    educations: list[ImportedEducationInput] = Field(default_factory=list)
    skills: list[ImportedSkillInput] = Field(default_factory=list)
    warnings: list[str] = Field(
        default_factory=list,
        description="Non-persisted warnings about missing or uncertain extracted fields.",
    )


class ResumeTargetOption(BaseSchema):
    id: UUID
    resume_name: str


class AiImportPreviewResponse(BaseSchema):
    source_file_name: str
    extracted_profile: ImportedCandidateDocument
    available_resume_targets: list[ResumeTargetOption] = Field(default_factory=list)


class AiImportTaskStartResponse(BaseSchema):
    task_id: UUID
    status: Literal["pending", "processing"]


class AiImportTaskStatusResponse(BaseSchema):
    task_id: UUID
    status: Literal["pending", "processing", "completed", "failed"]
    source_file_name: str | None = None
    result: AiImportPreviewResponse | None = None
    error: str | None = None
    created_at: datetime
    updated_at: datetime


class AiImportCommitRequest(BaseSchema):
    action: Literal["update_profile", "create_resume", "update_resume"]
    resume_id: UUID | None = None
    resume_name: str | None = Field(default=None, min_length=1, max_length=255)
    data: ImportedCandidateDocument

    @model_validator(mode="after")
    def validate_target_requirements(self):
        """Validate resume-target requirements for the selected import action."""
        if self.action == "create_resume" and not self.resume_name:
            raise ValueError("resume_name is required when action=create_resume.")
        if self.action == "update_resume" and self.resume_id is None:
            raise ValueError("resume_id is required when action=update_resume.")
        return self


class AiImportCommitResponse(BaseSchema):
    target_type: Literal["profile", "resume"]
    target_id: UUID
    profile: ProfileResponse | None = None
    resume: ResumeResponse | None = None
