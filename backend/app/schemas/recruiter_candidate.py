from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class CandidateApplicationSummary(BaseModel):
    application_id: UUID
    job_id: UUID
    job_title: str
    candidate_id: UUID
    name: str
    email: EmailStr
    phone: str | None = None
    picture: str | None = None
    professional_headline: str | None = None
    professional_summary: str | None = None
    current_status: str
    applied_at: datetime
    ai_score: int | None = None
    ai_analysis: str | None = None
    social_links: list[dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)


class RecruiterCandidateListResponse(BaseModel):
    candidates: list[CandidateApplicationSummary]
    total: int
