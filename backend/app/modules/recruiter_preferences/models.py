from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RecruiterPreference(Base):
    __tablename__ = "recruiter_preferences"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    timezone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notification_email_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    notification_in_app_enabled: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    default_interview_duration_minutes: Mapped[int] = mapped_column(
        Integer, default=45, server_default="45", nullable=False
    )
    default_interview_buffer_minutes: Mapped[int] = mapped_column(
        Integer, default=15, server_default="15", nullable=False
    )
    outreach_signature: Mapped[str | None] = mapped_column(Text, nullable=True)
    chat_default_scope: Mapped[str] = mapped_column(
        String(30), default="company", server_default="company", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
