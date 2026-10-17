from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CompanyMonthlyUsage(Base):
    """Reviews counted against the company subscription, one row per month."""

    __tablename__ = "company_monthly_usage"

    company_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True
    )
    month: Mapped[date] = mapped_column(Date, primary_key=True)
    reviews_used: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    # Reviews this month paid from top-ups / volume credits.
    extra_reviews_used: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )


class CompanyReviewCredits(Base):
    """Top-up and volume reviews; they carry over until used."""

    __tablename__ = "company_review_credits"

    company_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True
    )
    remaining: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )


class JobPass(Base):
    """A pass bought for one job: its own review allowance until it expires."""

    __tablename__ = "job_passes"
    __table_args__ = (Index("ix_job_passes_job_expires", "job_id", "expires_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String(20), nullable=False)
    reviews_included: Mapped[int] = mapped_column(Integer, nullable=False)
    reviews_used: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    price_npr: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
