"""Native interview scheduling: availability, invites, interviews, scorecards."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.applications.models import Application

DEFAULT_TIMEZONE = "Asia/Kathmandu"
# Nepal works Sunday to Friday.
DEFAULT_WEEKLY_HOURS: dict[str, list[list[str]]] = {
    day: [["10:00", "17:00"]] for day in ("sun", "mon", "tue", "wed", "thu", "fri")
} | {"sat": []}
AUTO_MEETING_LINK = "auto"


class InterviewStatus:
    booked = "booked"
    cancelled = "cancelled"
    done = "done"


class InterviewerAvailability(Base):
    """One row per recruiter: when they interview and how."""

    __tablename__ = "interviewer_availability"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    timezone: Mapped[str] = mapped_column(
        String(64), nullable=False, default=DEFAULT_TIMEZONE
    )
    # {"sun": [["10:00", "17:00"]], ..., "sat": []}
    weekly_hours: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=lambda: dict(DEFAULT_WEEKLY_HOURS)
    )
    interview_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=45)
    buffer_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
    # A personal Google Meet/Zoom URL, or "auto" for a new Jitsi room per interview.
    meeting_link: Mapped[str] = mapped_column(
        String(500), nullable=False, default=AUTO_MEETING_LINK
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class InterviewInvite(Base):
    """The scheduling link sent to a shortlisted candidate (one per application)."""

    __tablename__ = "interview_invites"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    interviewer_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Interview(Base):
    __tablename__ = "interviews"
    __table_args__ = (
        # No double booking: one live interview per application, and one per
        # interviewer per start time (overlaps are also checked under a lock).
        Index(
            "uq_interviews_application_booked",
            "application_id",
            unique=True,
            postgresql_where=text("status = 'booked'"),
        ),
        Index(
            "uq_interviews_interviewer_start_booked",
            "interviewer_user_id",
            "start_time",
            unique=True,
            postgresql_where=text("status = 'booked'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    interviewer_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    candidate_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # NULL for phone-only applicants (they get SMS instead).
    candidate_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    timezone: Mapped[str] = mapped_column(
        String(64), nullable=False, default=DEFAULT_TIMEZONE
    )
    # Meeting link (Jitsi, Meet, Zoom).
    location: Mapped[str] = mapped_column(String(500), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=InterviewStatus.booked
    )
    # iCalendar identity: the same UID with a higher SEQUENCE updates the event.
    ics_uid: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cancelled_by: Mapped[str | None] = mapped_column(String(20))
    reminder_24h_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    reminder_1h_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    application: Mapped[Application] = relationship(lazy="joined")


class Scorecard(Base):
    """A person's judgement after an interview (one per interviewer)."""

    __tablename__ = "scorecards"
    __table_args__ = (
        UniqueConstraint("interview_id", "author_user_id", name="uq_scorecard_author"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    interview_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # [{"criterion": "3+ years Python", "rating": 1..4}]
    ratings: Mapped[list[dict]] = mapped_column(JSONB, nullable=False, default=list)
    # strong_yes | yes | no | strong_no
    recommendation: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
