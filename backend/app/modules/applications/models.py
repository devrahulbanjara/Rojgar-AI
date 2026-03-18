from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, Uuid, func
from sqlalchemy import Boolean, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.shared.enums import ApplicationStatus

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
    status: Mapped[ApplicationStatus] = mapped_column(
        nullable=False, server_default="submitted"
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
