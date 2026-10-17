from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
    Uuid,
    event,
    func,
    select,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.auth.models import User
from app.core.database import Base
from app.modules.auth.enums import MembershipRole, MembershipStatus
from app.shared.slugs import company_slug_base


class Company(Base):
    __tablename__ = "companies"
    __table_args__ = (
        Index("ix_companies_name_lower", text("lower(name)"), unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Public careers page id (/c/{slug}).
    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    logo_url: Mapped[str | None] = mapped_column(String(255))
    website_url: Mapped[str | None] = mapped_column(String(255))
    domain: Mapped[str | None] = mapped_column(String(255), unique=True)
    industry: Mapped[str | None] = mapped_column(String(100))
    company_size: Mapped[str | None] = mapped_column(String(50))
    location: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None]
    # Billing plan id (entitlements/plans.py): free | team | business.
    plan: Mapped[str] = mapped_column(
        String(20), nullable=False, default="free", server_default="free"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    memberships: Mapped[list[CompanyMembership]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )


class CompanyMembership(Base):
    __tablename__ = "company_memberships"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[MembershipRole] = mapped_column(nullable=False)
    status: Mapped[MembershipStatus] = mapped_column(
        nullable=False, server_default="pending"
    )
    job_title: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="memberships")
    company: Mapped[Company] = relationship(back_populates="memberships")


@event.listens_for(Company, "before_insert")
def _assign_company_slug(_mapper, connection, target: Company) -> None:
    """Derive a unique careers-page slug from the company name."""
    if target.slug:
        return
    base = company_slug_base(target.name or "company") or "company"
    candidate, n = base, 2
    while connection.execute(
        select(Company.id).where(Company.slug == candidate)
    ).first():
        candidate, n = f"{base}-{n}", n + 1
    target.slug = candidate
