from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.core.schemas import BaseSchema
from app.shared.enums import ApplicationStatus


class EmailDraftResponse(BaseSchema):
    draft_id: UUID
    application_id: UUID
    candidate_name: str
    candidate_email: str
    candidate_avatar_url: str | None = None
    application_status: ApplicationStatus
    score: int | None = None
    subject: str | None = None
    body: str | None = None
    is_approved: bool
    is_sent: bool
    is_discarded: bool
    created_at: datetime
    updated_at: datetime


class UpdateDraftRequest(BaseSchema):
    subject: str | None = Field(default=None, max_length=255)
    body: str | None = None


class ApproveDraftRequest(BaseSchema):
    approved: bool


class PrepareDraftsRequest(BaseSchema):
    direct_send: bool = False


class PrepareDraftsResponse(BaseSchema):
    job_id: UUID
    drafts_count: int
    new_drafts: int
    message: str


class SendAllResponse(BaseSchema):
    job_id: UUID
    queued: int
    message: str
