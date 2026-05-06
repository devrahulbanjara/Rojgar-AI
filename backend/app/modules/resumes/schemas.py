from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.shared.schemas import (
    BaseSchema,
    DocumentResponseBase,
    DocumentUpdateBase,
)


# ---------------------------------------------------------------------------
# Resume schemas
# ---------------------------------------------------------------------------


class ResumeCreate(BaseSchema):
    """Fork a new resume from the user's profile with an optional custom name."""

    resume_name: str = Field(default="Default", min_length=1, max_length=255)
    fork_from_profile: bool = Field(default=True)


class ResumeUpdate(DocumentUpdateBase):
    """Partial update for a resume's scalar fields and child collections."""

    resume_name: str | None = Field(default=None, min_length=1, max_length=255)


class ResumeResponse(DocumentResponseBase):
    id: UUID
    user_id: UUID
    resume_name: str
    created_at: datetime
    updated_at: datetime


class ResumeListItem(BaseSchema):
    """Lightweight summary for listing resumes."""

    id: UUID
    resume_name: str
    created_at: datetime
    updated_at: datetime
