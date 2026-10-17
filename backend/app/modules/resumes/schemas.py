from datetime import datetime
from uuid import UUID


from app.shared.schemas import (
    DocumentResponseBase,
)

# ---------------------------------------------------------------------------
# Resume schemas
# ---------------------------------------------------------------------------


class ResumeResponse(DocumentResponseBase):
    id: UUID
    user_id: UUID
    resume_name: str
    created_at: datetime
    updated_at: datetime
