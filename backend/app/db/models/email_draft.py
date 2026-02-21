import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core import get_datetime
from app.db.base import Base


class EmailDraft(Base):
    __tablename__ = "email_draft"

    draft_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("job_application.application_id", ondelete="CASCADE"),
        unique=True,
    )
    subject: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    is_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    is_discarded: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=get_datetime)
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime
    )
