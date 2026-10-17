"""Platform moderation: job reports and flags, takedowns, manual payments."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class JobReport(Base):
    """An applicant's "Report this job" or an automatic flag on a job."""

    __tablename__ = "job_reports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # applicant | auto
    source: Mapped[str] = mapped_column(String(20), nullable=False)
    # fee_requested | fake | discriminatory | other
    reason: Mapped[str] = mapped_column(String(30), nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    reporter_ip_hash: Mapped[str | None] = mapped_column(String(64))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    # dismissed | unpublished | business_suspended
    resolution: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class JobTakedown(Base):
    """A job unpublished by platform staff. Public pages treat it as gone."""

    __tablename__ = "job_takedowns"

    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True
    )
    reason: Mapped[str | None] = mapped_column(Text)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ManualPayment(Base):
    """A pass or plan paid by bank transfer, waiting for staff to confirm.

    Placeholder until entitlements and eSewa/Khalti land: staff mark the
    transfer received; nothing is unlocked automatically yet.
    """

    __tablename__ = "manual_payments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    item: Mapped[str] = mapped_column(String(60), nullable=False)
    amount_npr: Mapped[int] = mapped_column(Integer, nullable=False)
    reference: Mapped[str | None] = mapped_column(String(100))
    # awaiting | received
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="awaiting", server_default="awaiting"
    )
    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    received_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
