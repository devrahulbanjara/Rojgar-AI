from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema
from app.shared.enums import LocationType


class ChatResponseType(str, Enum):
    text = "text"
    clarification = "clarification"
    salary_answer = "salary_answer"
    job_list = "job_list"
    job_edit_preview = "job_edit_preview"
    out_of_scope = "out_of_scope"


class PendingActionType(str, Enum):
    job_selection = "job_selection"
    job_edit = "job_edit"


class ChatMessageRequest(BaseSchema):
    message: str = Field(min_length=1, max_length=5000)


class ConfirmJobSelectionRequest(BaseSchema):
    job_id: UUID


class ConfirmJobEditRequest(BaseSchema):
    approve: bool


class ChatSessionArtifactKind(str, Enum):
    salary_research = "salary_research"
    job_edit = "job_edit"
    job_query = "job_query"


class ChatSessionArtifact(BaseSchema):
    kind: ChatSessionArtifactKind
    title: str
    summary: str
    created_at: datetime


class ChatSessionResponse(BaseSchema):
    id: UUID
    recruiter_id: UUID
    company_id: UUID
    thread_id: str
    title: str | None = None
    last_interaction_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    artifacts: list[ChatSessionArtifact] = Field(default_factory=list)


class SourceItem(BaseSchema):
    title: str
    url: str


class ChatHistoryMessage(BaseSchema):
    role: str
    content: str
    created_at: datetime
    response_type: ChatResponseType | None = None
    data: dict | None = None


class JobOption(BaseSchema):
    job_id: UUID
    title: str
    location: str | None = None
    location_type: LocationType | None = None
    status: str
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str | None = None
    expires_at: datetime | None = None


class CompanyJobData(BaseSchema):
    job_id: UUID
    title: str
    location: str | None = None
    location_type: LocationType | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    currency: str | None = None
    status: str
    expires_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CompanyJobListResult(BaseSchema):
    total: int
    jobs: list[CompanyJobData] = Field(default_factory=list)
    counts: dict[str, int] = Field(default_factory=dict)


class JobEditDiff(BaseSchema):
    field: str
    before: str | int | bool | list[str] | None = None
    after: str | int | bool | list[str] | None = None


class JobEditPreviewData(BaseSchema):
    job_id: UUID
    job_title: str
    summary: str
    patch: dict = Field(default_factory=dict)
    diffs: list[JobEditDiff] = Field(default_factory=list)


class RecruiterChatResponse(BaseSchema):
    response_type: ChatResponseType
    message: str
    data: dict | None = None


class PendingActionPayload(BaseSchema):
    type: PendingActionType
    data: dict


class ChatHistoryResponse(BaseSchema):
    history: list[ChatHistoryMessage] = Field(default_factory=list)
    pending_action: PendingActionPayload | None = None


class ChatExchangeResponse(BaseSchema):
    reply: RecruiterChatResponse
    history: list[ChatHistoryMessage] = Field(default_factory=list)
    pending_action: PendingActionPayload | None = None
