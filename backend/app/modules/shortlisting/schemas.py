from uuid import UUID

from app.core.schemas import BaseSchema
from app.shared.enums import ShortlistStatus


class ShortlistSummaryResponse(BaseSchema):
    job_id: UUID
    total_applications: int
    scored: int
    pending_review: int
    shortlist_status: ShortlistStatus
    final_shortlist_completed: bool


class TriggerShortlistResponse(BaseSchema):
    job_id: UUID
    shortlist_status: ShortlistStatus
    message: str


class FinalizeShortlistRequest(BaseSchema):
    use_ai_recommendations: bool = False
    threshold: int = 70


class FinalizeShortlistResponse(BaseSchema):
    job_id: UUID
    updated_applications: int
    success: bool
