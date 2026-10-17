from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field, field_validator, model_validator

from app.core.schemas import BaseSchema
from app.modules.activity.schemas import ActivityEventResponse
from app.modules.resumes.schemas import ResumeResponse
from app.shared.enums import (
    ApplicationSource,
    ApplicationStage,
    EmploymentType,
    JobCategory,
    JobStatus,
    LocationType,
    RejectedReason,
)


class ApplyRequest(BaseSchema):
    """Signed-in candidate applies to a job with one of their resumes."""

    job_id: UUID
    resume_id: UUID
    share_profile_all: bool = True
    share_avatar: bool = True
    share_email: bool = True
    share_phone: bool = True
    share_location: bool = True
    share_links: bool = True
    share_headline_summary: bool = True


class CandidateShareSettings(BaseSchema):
    share_profile_all: bool
    share_avatar: bool
    share_email: bool
    share_phone: bool
    share_location: bool
    share_links: bool
    share_headline_summary: bool


class ApplicationResponse(BaseSchema):
    """One application as its candidate sees it. No AI review fields."""

    id: UUID
    job_id: UUID
    user_id: UUID
    resume_id: UUID | None = None
    stage: ApplicationStage
    created_at: datetime
    updated_at: datetime
    resume: ResumeResponse | None = None
    job_title: str | None = None
    company_name: str | None = None
    company_logo_url: str | None = None
    location: str | None = None
    location_type: LocationType | None = None
    timeline: list[ActivityEventResponse] = Field(default_factory=list)
    next_step_hint: str | None = None


class CandidateApplicationView(BaseSchema):
    """Candidate-facing application row."""

    id: UUID
    stage: ApplicationStage
    created_at: datetime
    updated_at: datetime
    job_id: UUID
    job_title: str
    company_name: str
    company_logo_url: str | None = None
    location: str | None = None
    location_type: LocationType


# ---------------------------------------------------------------- recruiter


class ReferrerRef(BaseSchema):
    id: UUID
    name: str


class RecruiterCandidateApplicationSummary(BaseSchema):
    application_id: UUID
    job_id: UUID
    job_title: str
    stage: ApplicationStage
    fit: str | None = None
    summary: str | None = None
    flagged: bool = False
    source: str | None = None
    created_at: datetime
    updated_at: datetime



class RecruiterCandidateListItem(BaseSchema):
    """Candidates across jobs: one row per person."""

    candidate_id: UUID
    applicant_name: str
    applicant_email: str | None = None
    applicant_phone: str | None = None
    applicant_avatar_url: str | None = None
    latest_application_id: UUID
    latest_stage: ApplicationStage
    latest_fit: str | None = None
    latest_applied_at: datetime
    last_activity_at: datetime
    primary_job_title: str
    primary_job_id: UUID
    application_count: int
    applications: list[RecruiterCandidateApplicationSummary]


class SemanticCandidateSearchResult(BaseSchema):
    application_id: UUID
    candidate_id: UUID
    applicant_name: str
    applicant_email: str | None = None
    applicant_avatar_url: str | None = None
    job_title: str
    job_id: UUID
    stage: ApplicationStage
    fit: str | None = None
    summary: str | None = None
    match_score: float = Field(description="Semantic similarity score from Qdrant")
    applied_at: datetime
    updated_at: datetime


class SemanticCandidateSearchResponse(BaseSchema):
    query: str
    total: int
    candidates: list[SemanticCandidateSearchResult] = Field(default_factory=list)


class SimilarCandidateResult(BaseSchema):
    application_id: UUID
    candidate_id: UUID
    applicant_name: str
    applicant_email: str | None = None
    applicant_avatar_url: str | None = None
    job_title: str
    job_id: UUID
    stage: ApplicationStage
    fit: str | None = None
    similarity_score: float
    applied_at: datetime
    updated_at: datetime


class SimilarCandidatesResponse(BaseSchema):
    reference_application_id: UUID
    reference_candidate_name: str
    total: int
    candidates: list[SimilarCandidateResult] = Field(default_factory=list)


# ---------------------------------------------------------------- /recruiter/v2


class StageCounts(BaseSchema):
    new: int = 0
    shortlisted: int = 0
    interview: int = 0
    offer: int = 0
    hired: int = 0
    rejected: int = 0
    withdrawn: int = 0


class PipelineJob(BaseSchema):
    id: UUID
    title: str
    slug: str
    status: JobStatus
    closed_reason: str | None = None
    closes_at: datetime | None = None
    category: JobCategory
    employment_type: EmploymentType
    location: str | None = None
    location_type: LocationType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str


class PipelineItem(BaseSchema):
    application_id: UUID
    person_id: UUID
    name: str
    email: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    # One line from the review; null while reviewing or flagged.
    summary: str | None = None
    # strong | possible | weak; null while reviewing, flagged, or no criteria.
    fit: str | None = None
    # pending | done | failed | needs_person
    review_state: str
    flagged: bool = False
    stage: ApplicationStage
    source: str
    referred_by: ReferrerRef | None = None
    applied_at: datetime
    updated_at: datetime


class JobPipelineResponse(BaseSchema):
    job: PipelineJob
    counts: StageCounts
    # Applications whose review is still running ("2 reviewed · 1 reviewing").
    reviewing: int = 0
    reviewed: int = 0
    items: list[PipelineItem] = Field(default_factory=list)


class PersonContact(BaseSchema):
    id: UUID
    name: str
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    avatar_url: str | None = None
    headline: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None


class ReviewCheck(BaseSchema):
    criterion: str
    # must | nice | knockout
    kind: str
    # met | partly | missing
    result: str
    # Exact words from the CV or answers; null when missing.
    evidence: str | None = None


class ReviewView(BaseSchema):
    state: str
    fit: str | None = None
    summary: str | None = None
    checks: list[ReviewCheck] = Field(default_factory=list)
    flagged: bool = False
    flag_reason: str | None = None


class EventActor(BaseSchema):
    id: UUID
    name: str


class EventView(BaseSchema):
    id: UUID
    # applied | stage_changed | email_scheduled | email_sent | interview_booked |
    # interview_done | note | review_done | flag_cleared
    type: str
    actor: EventActor | None = None
    payload: dict = Field(default_factory=dict)
    created_at: datetime


class AnswerView(BaseSchema):
    question: str
    answer: str


class PanelJob(BaseSchema):
    id: UUID
    title: str


class CandidatePanelResponse(BaseSchema):
    application_id: UUID
    job: PanelJob
    stage: ApplicationStage
    source: str
    referred_by: ReferrerRef | None = None
    applied_at: datetime
    decided_at: datetime | None = None
    rejected_reason: str | None = None
    person: PersonContact
    review: ReviewView
    answers: list[AnswerView] = Field(default_factory=list)
    # Short-lived link to the CV PDF; null when the candidate sent no file.
    cv_url: str | None = None
    # Structured CV (builder resumes, or parsed from the PDF), share flags applied.
    resume: ResumeResponse | None = None
    # Other applications by this person to this company's jobs.
    other_applications: int = 0
    events: list[EventView] = Field(default_factory=list)
    # Decide actions valid for the current stage, in button order.
    actions: list[str] = Field(default_factory=list)


DecideAction = Literal[
    "shortlist",
    "reject",
    "invite_to_interview",
    "make_offer",
    "mark_hired",
    "move_back",
    "withdraw",
]


class DecideRequest(BaseSchema):
    action: DecideAction
    # One id for a single decision, many for bulk (one confirmation for N).
    application_ids: list[UUID] = Field(min_length=1, max_length=200)
    rejected_reason: RejectedReason | None = None

    @field_validator("application_ids")
    @classmethod
    def _unique(cls, value: list[UUID]) -> list[UUID]:
        return list(dict.fromkeys(value))


class DecideResult(BaseSchema):
    application_id: UUID
    ok: bool
    stage: ApplicationStage | None = None
    # stage_changed event id; pass to POST /recruiter/v2/undo.
    event_id: UUID | None = None
    email_scheduled: bool = False
    error: str | None = None


class DecideResponse(BaseSchema):
    results: list[DecideResult]
    undo_event_ids: list[UUID] = Field(default_factory=list)
    # Emails go out this many seconds after the decision unless undone.
    undo_seconds: int


class UndoRequest(BaseSchema):
    event_ids: list[UUID] = Field(min_length=1, max_length=200)


class UndoFailure(BaseSchema):
    event_id: UUID
    reason: str


class UndoResponse(BaseSchema):
    undone: list[UUID] = Field(default_factory=list)
    failed: list[UndoFailure] = Field(default_factory=list)


class NoteRequest(BaseSchema):
    text: str = Field(min_length=1, max_length=2000)

    @field_validator("text")
    @classmethod
    def _strip(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Note is empty.")
        return value


class QuickAddCreated(BaseSchema):
    application_id: UUID
    person_id: UUID


class ReferrerCreate(BaseSchema):
    name: str = Field(min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=30)


class ReferrerResponse(BaseSchema):
    id: UUID
    name: str
    phone: str | None = None
    token: str
    # Public link to share: {frontend}/jobs/{slug}?ref={token}
    link: str
    applications: int = 0
    created_at: datetime


class SourceAnswer(BaseSchema):
    question: str = Field(max_length=200)
    answer: str = Field(max_length=2000)


class QuickAddForm(BaseSchema):
    """Fields of the multipart quick-add form (validated after parsing)."""

    full_name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=6, max_length=30)
    email: str | None = Field(default=None, max_length=255)
    source: Literal["walk_in", "phone", "referral"]
    referred_by: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def _referral_name(self) -> "QuickAddForm":
        if self.source != ApplicationSource.referral.value:
            self.referred_by = None
        return self
