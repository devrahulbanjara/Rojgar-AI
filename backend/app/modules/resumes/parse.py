"""Structured CV parsing for applicants who sent a PDF.

The extraction service reads the PDF into `ParsedCv`; `apply_parsed_cv` copies
it onto the applicant's Resume row (experiences, educations, skills) so the
review and the applicant panel see structured data instead of raw text.
"""

from __future__ import annotations

import uuid
from copy import deepcopy
from datetime import date

from pydantic import Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.schemas import BaseSchema
from app.modules.applications.models import Application
from app.modules.applications.sync import enqueue_application_sync_events
from app.modules.resumes.models import (
    Resume,
    ResumeEducation,
    ResumeExperience,
    ResumeSkill,
)
from app.shared.enums import SyncAction

_DATE_HINT = "ISO date YYYY-MM-DD if confidently known, otherwise null."


class ParsedSkill(BaseSchema):
    skill_name: str = Field(min_length=1, max_length=100)


class ParsedEducation(BaseSchema):
    institution: str = Field(
        min_length=1,
        max_length=255,
        description="Institution name exactly as found in the CV.",
    )
    degree: str | None = Field(default=None, max_length=255)
    field_of_study: str | None = Field(default=None, max_length=255)
    start_date: date | None = Field(default=None, description=_DATE_HINT)
    end_date: date | None = Field(default=None, description=_DATE_HINT)


class ParsedExperience(BaseSchema):
    company_name: str = Field(
        min_length=1,
        max_length=255,
        description="Company name exactly as found in the CV.",
    )
    title: str = Field(
        min_length=1,
        max_length=255,
        description="Role title exactly as found in the CV.",
    )
    start_date: date | None = Field(default=None, description=_DATE_HINT)
    end_date: date | None = Field(default=None, description=_DATE_HINT)
    description: list[str] = Field(
        default_factory=list,
        description="Bullet points exactly from the CV where possible.",
        max_length=30,  # cap bullets per role against token-bombing
    )


class ParsedCv(BaseSchema):
    headline: str | None = Field(default=None, max_length=255)
    summary: str | None = Field(default=None, max_length=2000)
    phone: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)
    linkedin_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    portfolio_url: str | None = Field(default=None, max_length=500)
    years_of_experience: int | None = None
    experiences: list[ParsedExperience] = Field(default_factory=list, max_length=30)
    educations: list[ParsedEducation] = Field(default_factory=list, max_length=20)
    skills: list[ParsedSkill] = Field(default_factory=list, max_length=100)


def extraction_schema() -> dict:
    """`ParsedCv` as a flat JSON schema (local $refs inlined) for the extractor."""
    schema = deepcopy(ParsedCv.model_json_schema())
    defs = schema.pop("$defs", {})

    def resolve(node):
        if isinstance(node, dict):
            ref = node.get("$ref", "")
            if ref.startswith("#/$defs/") and ref.split("/")[-1] in defs:
                merged = deepcopy(defs[ref.split("/")[-1]])
                merged.update({k: v for k, v in node.items() if k != "$ref"})
                return resolve(merged)
            return {k: resolve(v) for k, v in node.items()}
        if isinstance(node, list):
            return [resolve(item) for item in node]
        return node

    flat = resolve(schema)
    flat["additionalProperties"] = False
    return flat


async def apply_parsed_cv(
    db: AsyncSession, resume_id: uuid.UUID, parsed: ParsedCv
) -> None:
    """Replace the resume's fields with the parsed CV. Caller commits."""
    resume = await db.scalar(
        select(Resume)
        .where(Resume.id == resume_id)
        .options(
            selectinload(Resume.experiences),
            selectinload(Resume.educations),
            selectinload(Resume.skills),
        )
    )
    if resume is None:
        return
    for field in (
        "headline",
        "summary",
        "phone",
        "location",
        "linkedin_url",
        "github_url",
        "portfolio_url",
        "years_of_experience",
    ):
        value = getattr(parsed, field)
        if value is not None:
            setattr(resume, field, value)
    resume.experiences = [
        ResumeExperience(**e.model_dump()) for e in parsed.experiences
    ]
    resume.educations = [ResumeEducation(**e.model_dump()) for e in parsed.educations]
    resume.skills = [ResumeSkill(**s.model_dump()) for s in parsed.skills]
    application_ids = list(
        await db.scalars(
            select(Application.id).where(Application.resume_id == resume_id)
        )
    )
    enqueue_application_sync_events(db, application_ids, SyncAction.UPSERT)
