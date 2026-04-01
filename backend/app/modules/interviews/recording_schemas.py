from datetime import datetime
from uuid import UUID

from app.core.schemas import BaseSchema
from app.shared.enums import RecordingStatus


class InterviewRecordingResponse(BaseSchema):
    id: UUID
    application_id: UUID
    s3_audio_url: str
    transcript: str | None = None
    evaluation: str | None = None
    status: RecordingStatus
    duration_seconds: int | None = None
    created_at: datetime
    updated_at: datetime
