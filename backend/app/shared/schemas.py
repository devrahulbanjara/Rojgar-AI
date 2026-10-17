from datetime import date
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema

__all__ = [
    "BaseSchema",
    "DocumentResponseBase",
    "EducationBase",
    "EducationResponse",
    "ExperienceBase",
    "ExperienceResponse",
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
# Resume response fields
# Defined after the item classes so direct (non-string) references work.
# ---------------------------------------------------------------------------


class DocumentResponseBase(BaseSchema):
    """Read-only fields of a parsed CV (resume) response."""

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
