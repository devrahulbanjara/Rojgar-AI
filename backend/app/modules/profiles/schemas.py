from datetime import datetime
from uuid import UUID

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
]


class ProfileUpdate(DocumentUpdateBase):
    pass


class ProfileResponse(DocumentResponseBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
