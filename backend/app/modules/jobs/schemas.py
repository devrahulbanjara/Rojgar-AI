from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from pydantic import Field, field_validator, model_validator

from app.core.schemas import BaseSchema
from app.modules.jobs.protected_grounds import CriterionWarning
from app.shared.enums import (
    CV_REQUIRED_CATEGORIES,
    EmploymentType,
    JobCategory,
    JobStatus,
    LocationType,
    QuestionType,
)

MAX_CRITERIA = 6
# A CV says most of what a business needs; without one, a few more questions.
MAX_QUESTIONS = 3
MAX_QUESTIONS_NO_CV = 5


def max_questions(cv_required: bool) -> int:
    return MAX_QUESTIONS if cv_required else MAX_QUESTIONS_NO_CV


def check_question_count(count: int, cv_required: bool) -> None:
    limit = max_questions(cv_required)
    if count > limit:
        raise ValueError(
            f"at most {limit} questions when a CV is required"
            if cv_required
            else f"at most {limit} questions"
        )


class JobQuestion(BaseSchema):
    """A question on the apply form. A yes/no question with `knockout_answer`
    marks applicants who answer the other way as a weak fit (never rejected)."""

    label: str = Field(min_length=1, max_length=200)
    type: QuestionType = QuestionType.short_text
    required: bool = True
    knockout_answer: Literal["yes", "no"] | None = None

    @model_validator(mode="after")
    def _knockout_is_yes_no(self) -> "JobQuestion":
        self.label = " ".join(self.label.split())
        if self.type != QuestionType.yes_no:
            self.knockout_answer = None
        return self


def _clean_criteria(values: list[str] | None) -> list[str] | None:
    if values is None:
        return None
    cleaned = [" ".join(v.split()) for v in values if v and v.strip()]
    if len(cleaned) > MAX_CRITERIA:
        raise ValueError(f"at most {MAX_CRITERIA} items")
    if any(len(v) > 200 for v in cleaned):
        raise ValueError("each item must be 200 characters or less")
    return list(dict.fromkeys(cleaned))


class JobBase(BaseSchema):
    title: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    location_type: LocationType | None = None
    category: JobCategory | None = None
    employment_type: EmploymentType | None = None
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=10)
    status: JobStatus | None = None
    closes_at: datetime | None = None
    # Markdown.
    description: str | None = Field(default=None, max_length=20000)
    must_haves: list[str] | None = None
    nice_to_haves: list[str] | None = None
    questions: list[JobQuestion] | None = Field(
        default=None, max_length=MAX_QUESTIONS_NO_CV
    )
    # None on create: follows the category (CV_REQUIRED_CATEGORIES).
    cv_required: bool | None = None

    _criteria = field_validator("must_haves", "nice_to_haves")(
        lambda cls, v: _clean_criteria(v)
    )

    @model_validator(mode="after")
    def validate_job_fields(self) -> "JobBase":
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("salary_min cannot be greater than salary_max")
        if self.closes_at is not None:
            if self.closes_at.tzinfo is None:
                raise ValueError("closes_at must be timezone-aware")
            if self.status == JobStatus.open and self.closes_at <= datetime.now(UTC):
                raise ValueError("closes_at must be in the future for open jobs")
        return self


class JobCreate(JobBase):
    title: str = Field(min_length=1, max_length=255)  # type: ignore[assignment]
    location_type: LocationType = LocationType.onsite  # type: ignore[assignment]
    category: JobCategory = JobCategory.other  # type: ignore[assignment]
    employment_type: EmploymentType = EmploymentType.full_time  # type: ignore[assignment]
    currency: str = Field(default="NPR", max_length=10)  # type: ignore[assignment]
    status: Literal[JobStatus.draft, JobStatus.open] = JobStatus.draft  # type: ignore[assignment]

    @model_validator(mode="after")
    def _cv_default_and_question_count(self) -> "JobCreate":
        if self.cv_required is None:
            self.cv_required = self.category in CV_REQUIRED_CATEGORIES
        check_question_count(len(self.questions or []), self.cv_required)
        return self


class JobUpdate(JobBase):
    """Only provided fields change. Closing: status=closed + closed_reason
    hired (rejects everyone still in progress, kindly) or cancelled."""

    closed_reason: Literal["hired", "cancelled"] | None = None

    @model_validator(mode="after")
    def _closing_needs_reason(self) -> "JobUpdate":
        if self.status == JobStatus.closed and self.closed_reason is None:
            raise ValueError("closing a job needs closed_reason: hired or cancelled")
        # Only what's sent here; the service also checks against the stored job.
        if self.questions is not None and self.cv_required is not None:
            check_question_count(len(self.questions), self.cv_required)
        return self


class CompanySnippet(BaseSchema):
    id: UUID
    name: str
    logo_url: str | None = None
    industry: str | None = None
    company_size: str | None = None
    location: str | None = None
    website_url: str | None = None
    description: str | None = None


class JobListItem(BaseSchema):
    id: UUID
    company_id: UUID
    company: CompanySnippet
    slug: str | None = None
    title: str
    location: str | None = None
    location_type: LocationType
    category: JobCategory
    employment_type: EmploymentType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str = "NPR"
    status: JobStatus
    closed_reason: str | None = None
    closes_at: datetime | None = None
    closed_at: datetime | None = None
    applications_count: int = 0
    created_at: datetime


class JobDetailResponse(BaseSchema):
    id: UUID
    company_id: UUID
    company: CompanySnippet
    posted_by: UUID | None = None
    slug: str | None = None
    title: str
    location: str | None = None
    location_type: LocationType
    category: JobCategory
    employment_type: EmploymentType
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str
    status: JobStatus
    closed_reason: str | None = None
    closes_at: datetime | None = None
    closed_at: datetime | None = None
    description: str = ""
    must_haves: list[str] = Field(default_factory=list)
    nice_to_haves: list[str] = Field(default_factory=list)
    questions: list[JobQuestion] = Field(default_factory=list)
    cv_required: bool = False
    applications_count: int = 0
    # Company members only: applications per source.
    source_counts: dict[str, int] | None = None
    created_at: datetime
    updated_at: datetime
    # Criteria that look like protected grounds (Labour Act 2074 s.6). Saving is
    # allowed; the recruiter is asked to reword. Only on create/update replies.
    warnings: list[CriterionWarning] = Field(default_factory=list)


class SuggestMustHavesRequest(BaseSchema):
    title: str | None = Field(default=None, max_length=255)
    description: str = Field(min_length=10, max_length=20000)


class SuggestMustHavesResponse(BaseSchema):
    must_haves: list[str] = Field(default_factory=list)
    nice_to_haves: list[str] = Field(default_factory=list)
    questions: list[JobQuestion] = Field(default_factory=list)
    warnings: list[CriterionWarning] = Field(default_factory=list)
