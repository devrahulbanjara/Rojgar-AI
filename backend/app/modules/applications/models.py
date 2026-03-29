from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, Uuid, func
from sqlalchemy import Boolean, Integer, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.shared.enums import ApplicationStatus, SyncAction, SyncStatus

if TYPE_CHECKING:
    from app.modules.auth.models import User
    from app.modules.resumes.models import Resume


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("resumes.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    score: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    shortlist_notified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    share_profile_all: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    share_avatar: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    share_email: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    share_phone: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    share_location: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    share_links: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    share_headline_summary: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, name="applicationstatus"),
        nullable=False,
        server_default="applied",
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("job_id", "user_id", name="uq_application_job_user"),
    )

    user: Mapped[User] = relationship(lazy="joined")
    resume: Mapped[Resume] = relationship(lazy="joined")


class ApplicationSyncEvent(Base):
    __tablename__ = "application_sync_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    action: Mapped[SyncAction] = mapped_column(nullable=False)
    status: Mapped[SyncStatus] = mapped_column(
        nullable=False, server_default="PENDING", index=True
    )
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
