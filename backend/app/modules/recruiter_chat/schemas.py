from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema
from app.shared.enums import ApplicationStatus, JobStatus, LocationType
from app.shared.schemas import EducationResponse, ExperienceResponse, SkillResponse


UIType = Literal[
    "text",
    "candidate_list",
    "job_list",
    "salary_info",
    "candidate_detail",
    "job_edit_preview",
    "job_clarification",
    "candidate_clarification",
]

JobEditableField = Literal[
    "title",
    "location",
    "location_type",
    "salary_min",
    "salary_max",
    "currency",
    "status",
    "expires_at",
    "overview",
    "responsibilities",
    "requirements",
    "preferred_qualifications",
    "benefits",
    "auto_shortlist",
]

JobEditOperation = Literal["set", "clear", "append", "remove", "replace"]


class AgentResponse(BaseSchema):
    text: str
    ui_type: UIType
    data: dict | None = None


class ToolResultEnvelope(BaseSchema):
    tool: str
    ok: bool = True
    text: str
    ui_type_hint: UIType | None = None
    data: dict | None = None


class CandidateCardData(BaseSchema):
    user_id: UUID
    application_id: UUID
    full_name: str
    avatar_url: str | None = None
    headline: str | None = None
    skills: list[str] = []
    applied_for_job: str
    application_status: ApplicationStatus
    score: int | None = None
    feedback: str | None = None
    match_score: float


class CandidateSearchResult(BaseSchema):
    total: int
    candidates: list[CandidateCardData] = []


class SalarySource(BaseSchema):
    source_name: str
    url: str
    country: str
    currency: str | None = None
    quoted_min: float | None = None
    quoted_max: float | None = None
    notes: str | None = None


class SalaryResearchResult(BaseSchema):
    role: str
    country: str
    currency: str | None = None
    recommended_min: float | None = None
    recommended_max: float | None = None
    confidence: Literal["low", "medium", "high"]
    rationale: str
    insufficient_evidence: bool
    year_context: str
    sources: list[SalarySource] = []


class JobSearchMatch(BaseSchema):
    job_id: UUID
    title: str
    status: JobStatus
    location: str | None = None
    location_type: LocationType
    updated_at: datetime


class CompanyJobData(BaseSchema):
    job_id: UUID
    title: str
    location: str | None = None
    location_type: LocationType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str
    status: JobStatus
    auto_shortlist: bool = False
    expires_at: datetime | None = None
    overview: str | None = None
    responsibilities: list[str] = []
    requirements: list[str] = []
    preferred_qualifications: list[str] = []
    benefits: list[str] = []
    updated_at: datetime


class CompanyJobListResult(BaseSchema):
    total: int
    jobs: list[CompanyJobData] = []


class JobEditInstruction(BaseSchema):
    field: JobEditableField
    operation: JobEditOperation = "set"
    value: str | int | bool | list[str] | None = None


class JobEditDiff(BaseSchema):
    field: JobEditableField
    before: str | int | bool | list[str] | None = None
    after: str | int | bool | list[str] | None = None


class JobEditProposal(BaseSchema):
    job_id: UUID
    job_title: str
    summary: str
    patch: dict
    diffs: list[JobEditDiff]


class CandidateDetailData(BaseSchema):
    user_id: UUID
    application_id: UUID
    job_id: UUID
    job_title: str
    full_name: str
    email: str
    avatar_url: str | None = None
    headline: str | None = None
    summary: str | None = None
    resume_name: str
    application_status: ApplicationStatus
    score: int | None = None
    feedback: str | None = None
    applied_at: datetime
    updated_at: datetime
    skills: list[SkillResponse] = []
    experiences: list[ExperienceResponse] = []
    educations: list[EducationResponse] = []


class JobClarificationPayload(BaseSchema):
    """
    Sent to the frontend when the LLM has identified a likely job match
    but the recruiter's query was ambiguous and needs confirmation.
    The frontend renders a 'Did you mean X?' card with Yes / No buttons.
    """

    job_id: UUID
    job_title: str
    status: JobStatus | None = None
    location: str | None = None
    question: str  # e.g. "Did you mean Machine Learning Engineer?"


class CandidateClarificationPayload(BaseSchema):
    """
    Same pattern for candidate disambiguation.
    Shown when the LLM found multiple candidates matching the name/job query.
    """

    application_id: UUID
    candidate_name: str
    job_title: str
    application_status: ApplicationStatus
    question: str  # e.g. "Did you mean Asha Sharma for Machine Learning Engineer?"


class ChatSessionResponse(BaseSchema):
    id: UUID
    recruiter_id: UUID
    company_id: UUID
    thread_id: str
    title: str | None = None
    last_interaction_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ChatHistoryMessage(BaseSchema):
    role: Literal["user", "assistant", "tool"]
    content: str
    name: str | None = None
    created_at: datetime | None = None


class ChatMessageRequest(BaseSchema):
    message: str = Field(min_length=1)


class RespondToInterruptRequest(BaseSchema):
    """
    Unified response to any interrupt type.

    - job_edit_preview:   action = "confirm" | "cancel",  patch_override optionally set
    - job_clarification:  action = "confirm" | "reject"
    - candidate_clarification: action = "confirm" | "reject"
    """

    action: Literal["confirm", "cancel", "reject"]
    patch_override: dict | None = None


class InterruptPayload(BaseSchema):
    """
    Unified interrupt envelope sent to the frontend.
    Only one of `proposal`, `job_clarification`, or `candidate_clarification` will be set,
    depending on `type`.
    """

    type: Literal["job_edit_preview", "job_clarification", "candidate_clarification"]
    proposal: JobEditProposal | None = None
    job_clarification: JobClarificationPayload | None = None
    candidate_clarification: CandidateClarificationPayload | None = None


class ChatExchangeResponse(BaseSchema):
    history: list[ChatHistoryMessage]
    interrupt: InterruptPayload | None = None
