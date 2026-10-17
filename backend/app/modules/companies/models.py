from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    event,
    func,
    select,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.modules.auth.models import User
from app.core.database import Base
from app.modules.auth.enums import BusinessStatus, MembershipRole, MembershipStatus
from app.shared.slugs import company_slug_base


class Company(Base):
    __tablename__ = "companies"
    # Names are not unique: two shops in different districts can share one.
    __table_args__ = (Index("ix_companies_name_lower", text("lower(name)")),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Public careers page id (/c/{slug}).
    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    # Verification: pending until platform staff approve; only active
    # businesses can publish jobs. status_reason holds the staff message
    # (more info needed, rejection or suspension reason).
    status: Mapped[BusinessStatus] = mapped_column(
        nullable=False, default=BusinessStatus.pending, server_default="pending"
    )
    status_reason: Mapped[str | None] = mapped_column(Text)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    district: Mapped[str | None] = mapped_column(String(40))
    phone: Mapped[str | None] = mapped_column(String(20))
    pan_number: Mapped[str | None] = mapped_column(String(20))
    # Private storage key of the registration certificate (image or PDF).
    registration_doc_key: Mapped[str | None] = mapped_column(String(255))
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    logo_url: Mapped[str | None] = mapped_column(String(255))
    website_url: Mapped[str | None] = mapped_column(String(255))
    cal_booking_url: Mapped[str | None] = mapped_column(String(500))
    cal_organizer_email: Mapped[str | None] = mapped_column(String(255), unique=True)
    domain: Mapped[str | None] = mapped_column(String(255), unique=True)
    industry: Mapped[str | None] = mapped_column(String(100))
    company_size: Mapped[str | None] = mapped_column(String(50))
    location: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    memberships: Mapped[list[CompanyMembership]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )

    @property
    def verified(self) -> bool:
        """Approved by platform staff (shown as "Verified business")."""
        return self.status == BusinessStatus.active


class CompanyMembership(Base):
    __tablename__ = "company_memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_membership_user_company"),
        Index(
            "uq_membership_one_active_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[MembershipRole] = mapped_column(nullable=False)
    status: Mapped[MembershipStatus] = mapped_column(
        nullable=False, default=MembershipStatus.active, server_default="active"
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


class BusinessInvite(Base):
    """A link an owner shares to add someone to the team with a fixed role."""

    __tablename__ = "business_invites"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[MembershipRole] = mapped_column(nullable=False)
    # sha256 of the token in the link; the token itself is never stored.
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    accepted_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    company: Mapped[Company] = relationship()
