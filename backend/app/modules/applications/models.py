from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.shared.enums import ApplicationStage, SyncAction, SyncStatus

if TYPE_CHECKING:
    from app.modules.auth.models import User
    from app.modules.jobs.models import Job, JobReferrer
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
    # NULL when the candidate applied without a CV (answers only).
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("resumes.id", ondelete="RESTRICT"), nullable=True, index=True
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
    shared_full_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_email_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_phone_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_location_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_headline_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_summary_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_linkedin_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_github_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_portfolio_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    # linkedin | facebook | merojob | viber | qr | walk_in | phone | referral |
    # direct | other (see ApplicationSource).
    source: Mapped[str] = mapped_column(
        String(20), nullable=False, default="direct", server_default="direct"
    )
    # The person who referred them (source = referral).
    referrer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("job_referrers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    consented_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # [{"question": str, "answer": str}] for the job's screening questions.
    screening_answers: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    stage: Mapped[ApplicationStage] = mapped_column(
        SAEnum(ApplicationStage, name="applicationstage"),
        nullable=False,
        default=ApplicationStage.new,
        server_default=ApplicationStage.new.value,
        index=True,
    )
    # Who moved the application last, and when.
    decided_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # not_a_fit | position_filled | no_response | other. Never shown to the candidate.
    rejected_reason: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("job_id", "user_id", name="uq_application_job_user"),
    )

    user: Mapped[User] = relationship(lazy="joined", foreign_keys=[user_id])
    resume: Mapped[Resume | None] = relationship(lazy="joined")
    job: Mapped[Job] = relationship(lazy="raise")
    referrer: Mapped[JobReferrer | None] = relationship(lazy="raise")
    review: Mapped[Review | None] = relationship(
        lazy="raise",
        uselist=False,
        back_populates="application",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Review(Base):
    """The AI review of one application. Recruiter-facing only."""

    __tablename__ = "application_reviews"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    # pending | done | failed | needs_person
    state: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending"
    )
    # strong | possible | weak; derived from `checks` in code, never by the model.
    fit: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    summary: Mapped[str | None] = mapped_column(String(140), nullable=True)
    # [{"criterion", "kind": must|nice, "result": met|partly|missing, "evidence"}]
    checks: Mapped[list[dict]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    flag_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Internal sort key within a fit bucket. Never shown.
    rank_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    # knockout | extract | full: how far the cost-controlled triage went.
    triage: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tokens_in: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    tokens_out: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    cost_npr: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0"
    )
    model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    prompt_version: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    application: Mapped[Application] = relationship(
        lazy="raise", back_populates="review"
    )


class ApplicationEvent(Base):
    """Timeline of one application: stage changes, emails, notes, interviews."""

    __tablename__ = "application_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # applied | stage_changed | email_scheduled | email_sent | interview_booked |
    # interview_done | note | review_done
    type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    # NULL actor = the system.
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    payload: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


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
