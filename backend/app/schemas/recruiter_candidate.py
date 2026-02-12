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
    score: int | None = None
    feedback: str | None = None
    social_links: list[dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)


class RecruiterCandidateListResponse(BaseModel):
    candidates: list[CandidateApplicationSummary]
    total: int


class UpdateApplicationRequest(BaseModel):
    status: str | None = None
    score: int | None = None
    feedback: str | None = None


class UpdateApplicationResponse(BaseModel):
    application_id: UUID
    current_status: str
    score: int | None = None
    feedback: str | None = None
    message: str
