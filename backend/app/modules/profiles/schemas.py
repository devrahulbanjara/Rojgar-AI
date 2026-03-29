from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.shared.schemas import (
    BaseSchema,
    DocumentResponseBase,
    DocumentUpdateBase,
    EducationResponse,
    ExperienceResponse,
    SkillResponse,
)

__all__ = [
    "BaseSchema",
    "ExperienceResponse",
    "EducationResponse",
    "SkillResponse",
    "ProfileUpdate",
    "ProfileResponse",
    "CandidateOnboardingRequest",
]


class CandidateOnboardingRequest(BaseSchema):
    target_roles: list[str] = Field(
        default_factory=list,
        description="Roles the candidate is targeting (e.g. 'Frontend Engineer')",
    )


class ProfileUpdate(DocumentUpdateBase):
    target_roles: list[str] | None = None
    is_open_to_work: bool | None = None


class ProfileResponse(DocumentResponseBase):
    id: UUID
    user_id: UUID
    avatar_url: str | None = None
    target_roles: list[str] = Field(default_factory=list)
    is_open_to_work: bool = False
    created_at: datetime
    updated_at: datetime
