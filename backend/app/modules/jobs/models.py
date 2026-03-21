import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.companies.models import Company
from app.shared.enums import (
    JobStatus,
    LocationType,
    ShortlistStatus,
    SyncAction,
    SyncStatus,
)


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    posted_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255))
    location_type: Mapped[LocationType] = mapped_column(
        nullable=False, server_default="onsite"
    )
    salary_min: Mapped[int | None] = mapped_column(Integer)
    salary_max: Mapped[int | None] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(10), server_default="USD")
    status: Mapped[JobStatus] = mapped_column(nullable=False, server_default="draft")
    auto_shortlist: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    shortlist_status: Mapped[ShortlistStatus] = mapped_column(
        nullable=False, server_default="not_started"
    )
    final_shortlist_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    overview: Mapped[str | None] = mapped_column(Text)
    responsibilities: Mapped[list[str]] = mapped_column(
        ARRAY(String), server_default="{}"
    )
    requirements: Mapped[list[str]] = mapped_column(ARRAY(String), server_default="{}")
    preferred_qualifications: Mapped[list[str]] = mapped_column(
        ARRAY(String), server_default="{}"
    )
    benefits: Mapped[list[str]] = mapped_column(ARRAY(String), server_default="{}")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    company: Mapped[Company] = relationship("Company", lazy="raise")


class JobSyncEvent(Base):
    __tablename__ = "job_sync_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, index=True)
    action: Mapped[SyncAction] = mapped_column(nullable=False)
    status: Mapped[SyncStatus] = mapped_column(nullable=False, server_default="PENDING")
    error_message: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
