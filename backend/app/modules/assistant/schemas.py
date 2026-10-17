"""Request, response and LLM-output shapes for the assistant.

LLM output is coerced leniently (lists clipped, unknown enum values dropped) so a
slightly-off answer still yields a valid draft instead of an error.
"""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

WorkType = Literal["onsite", "hybrid", "remote"]
EmploymentType = Literal["full_time", "part_time", "contract", "internship"]
Category = Literal[
    "Banking & Finance",
    "Healthcare",
    "Education",
    "Hospitality & Tourism",
    "Sales & Retail",
    "Manufacturing",
    "Logistics & Driving",
    "IT & Software",
    "NGO/INGO",
    "Government & Public",
    "Office & Admin",
    "Construction & Engineering",
    "Other",
]
CATEGORIES: tuple[str, ...] = Category.__args__  # type: ignore[attr-defined]
QuoteSource = Literal["cv", "answers", "review", "scorecards", "activity"]
ActionName = Literal["shortlist", "reject", "email"]


def _clip_strings(value: Any, limit: int, max_chars: int) -> list[str]:
    """Trim, dedupe (case-insensitive) and cap a list of short strings."""
    if not isinstance(value, list):
        return []
    seen: set[str] = set()
    out: list[str] = []
    for item in value:
        text = " ".join(str(item).split())[:max_chars]
        if text and text.lower() not in seen:
            seen.add(text.lower())
            out.append(text)
    return out[:limit]


def _enum_or_none(value: Any, allowed: tuple[str, ...]) -> str | None:
    if not isinstance(value, str):
        return None
    norm = value.strip().lower().replace("-", "_").replace(" ", "_")
    return next((a for a in allowed if a.lower() == norm), None)


class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")

    label: str = Field(min_length=1, max_length=200, description="The question.")
    type: Literal["short_text", "yes_no"] = "short_text"
    required: bool = False

    @field_validator("type", mode="before")
    @classmethod
    def _type(cls, value: Any) -> str:
        return _enum_or_none(value, ("short_text", "yes_no")) or "short_text"


class JobDraft(BaseModel):
    """The fields the Post-a-job page shows as editable inputs."""

    model_config = ConfigDict(extra="ignore")

    title: str | None = Field(default=None, max_length=120)
    category: Category | None = Field(
        default=None,
        description="Any job at a hotel, restaurant, travel or trekking company "
        '(receptionist, cook, waiter, guide) is "Hospitality & Tourism"; shops '
        'and field sales are "Sales & Retail"; drivers and delivery are '
        '"Logistics & Driving".',
    )
    location: str | None = Field(default=None, max_length=120)
    work_type: WorkType | None = None
    employment_type: EmploymentType | None = None
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=10)
    description: str = Field(
        default="",
        max_length=6000,
        description="Plain text, a few short paragraphs: about the job, what "
        "they will do, what we offer.",
    )
    must_haves: list[str] = Field(
        default_factory=list,
        max_length=6,
        description="Short, checkable facts a CV or form answer can show, under 8 "
        "words each; what the recruiter asked for first, then only what the job "
        'clearly needs. Good: "Valid two-wheeler licence", "NNC registration", '
        '"2+ years as receptionist". Never soft skills ("Friendly", "Team player").',
    )
    nice_to_haves: list[str] = Field(
        default_factory=list, max_length=6, description="Same style as must_haves."
    )
    questions: list[Question] = Field(
        default_factory=list,
        max_length=3,
        description="Screening questions for the apply form, only when useful. "
        "Never ask for name, email, phone or CV (the form collects them).",
    )

    @field_validator("title", "location", "currency", mode="before")
    @classmethod
    def _short_text(cls, value: Any) -> str | None:
        if value is None:
            return None
        text = " ".join(str(value).split())
        return text[:120] or None

    @field_validator("category", mode="before")
    @classmethod
    def _category(cls, value: Any) -> str | None:
        if not isinstance(value, str):
            return None
        return next((c for c in CATEGORIES if c.lower() == value.strip().lower()), None)

    @field_validator("work_type", mode="before")
    @classmethod
    def _work_type(cls, value: Any) -> str | None:
        return _enum_or_none(value, ("onsite", "hybrid", "remote"))

    @field_validator("employment_type", mode="before")
    @classmethod
    def _employment_type(cls, value: Any) -> str | None:
        return _enum_or_none(
            value, ("full_time", "part_time", "contract", "internship")
        )

    @field_validator("salary_min", "salary_max", mode="before")
    @classmethod
    def _salary(cls, value: Any) -> int | None:
        if value in (None, ""):
            return None
        try:
            number = int(float(value))
        except (TypeError, ValueError):
            return None
        return number if number > 0 else None

    @field_validator("description", mode="before")
    @classmethod
    def _description(cls, value: Any) -> str:
        return str(value or "").strip()[:6000]

    @field_validator("must_haves", "nice_to_haves", mode="before")
    @classmethod
    def _criteria(cls, value: Any) -> list[str]:
        return _clip_strings(value, 6, 120)

    @field_validator("questions", mode="before")
    @classmethod
    def _questions(cls, value: Any) -> list[Any]:
        if not isinstance(value, list):
            return []
        valid = [
            q for q in value if isinstance(q, dict) and str(q.get("label", "")).strip()
        ]
        return valid[:3]

    @model_validator(mode="after")
    def _salary_order(self) -> "JobDraft":
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            self.salary_min, self.salary_max = self.salary_max, self.salary_min
        if self.currency:
            self.currency = self.currency.upper()
        return self


# ---- LLM output ---------------------------------------------------------------


class DraftTurnOutput(BaseModel):
    """Your answer to the recruiter: a short reply and the job post draft."""

    model_config = ConfigDict(extra="ignore")

    reply: str = Field(default="", description="Short message to the recruiter.")
    follow_up: bool = Field(
        default=False, description="True only if reply is a question."
    )
    draft: JobDraft = Field(default_factory=JobDraft)
    salary_source_urls: list[str] = Field(
        default_factory=list,
        description="URLs of search_salary results you took salary numbers from.",
    )

    @field_validator("salary_source_urls", mode="before")
    @classmethod
    def _urls(cls, value: Any) -> list[str]:
        return [str(u) for u in value][:5] if isinstance(value, list) else []


class Quote(BaseModel):
    model_config = ConfigDict(extra="ignore")

    text: str = Field(
        min_length=1, max_length=400, description="Exact words copied from the data."
    )
    source: QuoteSource = Field(description="The part of the data it comes from.")


class CandidateTurnOutput(BaseModel):
    """Your answer about this applicant."""

    model_config = ConfigDict(extra="ignore")

    answer: str = Field(
        default="", description="Short and plain: at most 5 sentences or 5 bullets."
    )
    found: bool = Field(
        default=True, description="False when the data does not contain the answer."
    )
    quotes: list[Quote] = Field(default_factory=list, description="Up to 3.")
    action: ActionName | None = Field(
        default=None, description="Set only when asked to shortlist, reject or email."
    )

    @field_validator("quotes", mode="before")
    @classmethod
    def _quotes(cls, value: Any) -> list[Any]:
        if not isinstance(value, list):
            return []
        return [
            q
            for q in value
            if isinstance(q, dict)
            and str(q.get("text", "")).strip()
            and q.get("source") in QuoteSource.__args__  # type: ignore[attr-defined]
        ][:4]

    @field_validator("action", mode="before")
    @classmethod
    def _action(cls, value: Any) -> str | None:
        return _enum_or_none(value, ("shortlist", "reject", "email"))


# ---- API ----------------------------------------------------------------------


class JobDraftTurnRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    draft_id: UUID | None = None
    # The fields as the recruiter has edited them on the page; replaces the
    # stored draft before this turn so the assistant builds on their edits.
    draft: JobDraft | None = None


class CandidateTurnRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class SuggestedAction(BaseModel):
    """Rendered by the UI as a button that calls the normal decide endpoint."""

    action: ActionName
    application_ids: list[UUID]


class Source(BaseModel):
    title: str | None
    url: str


class AssistantMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime
    quotes: list[Quote] = Field(default_factory=list)
    suggested_action: SuggestedAction | None = None


class JobDraftHistory(BaseModel):
    draft_id: UUID
    draft: JobDraft | None
    messages: list[AssistantMessage]


class CandidateHistory(BaseModel):
    application_id: UUID
    messages: list[AssistantMessage]
