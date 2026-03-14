from datetime import date
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema

__all__ = [
    "BaseSchema",
    "DocumentUpdateBase",
    "DocumentResponseBase",
    "ExperienceBase",
    "ExperienceResponse",
    "EducationBase",
    "EducationResponse",
    "SkillBase",
    "SkillResponse",
]


# ---------------------------------------------------------------------------
# Experience
# ---------------------------------------------------------------------------


class ExperienceBase(BaseSchema):
    company_name: str = Field(min_length=1, max_length=255)
    title: str = Field(min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    description: list[str] = []


class ExperienceResponse(ExperienceBase):
    id: UUID


# ---------------------------------------------------------------------------
# Education
# ---------------------------------------------------------------------------


class EducationBase(BaseSchema):
    institution: str = Field(min_length=1, max_length=255)
    degree: str | None = Field(default=None, max_length=255)
    field_of_study: str | None = Field(default=None, max_length=255)
    start_date: date | None = None
    end_date: date | None = None


class EducationResponse(EducationBase):
    id: UUID


# ---------------------------------------------------------------------------
# Skill
# ---------------------------------------------------------------------------


class SkillBase(BaseSchema):
    skill_name: str = Field(min_length=1, max_length=100)


class SkillResponse(SkillBase):
    id: UUID


# ---------------------------------------------------------------------------
# Shared document base (Profile & Resume share these fields)
# Defined after the item classes so direct (non-string) references work.
# ---------------------------------------------------------------------------


class DocumentUpdateBase(BaseSchema):
    """Shared optional fields for updating a Profile or Resume."""

    headline: str | None = Field(default=None, max_length=255)
    summary: str | None = None
    phone: str | None = Field(default=None, max_length=30)
    location: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    portfolio_url: str | None = Field(default=None, max_length=500)
    years_of_experience: int | None = None
    experiences: list[ExperienceBase] | None = None
    educations: list[EducationBase] | None = None
    skills: list[SkillBase] | None = None


class DocumentResponseBase(BaseSchema):
    """Shared read-only fields for a Profile or Resume response."""

    headline: str | None = None
    summary: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    years_of_experience: int | None = None
    experiences: list[ExperienceResponse] = []
    educations: list[EducationResponse] = []
    skills: list[SkillResponse] = []
