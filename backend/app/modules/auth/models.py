from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.auth.enums import UserRole

if TYPE_CHECKING:
    from app.modules.companies.models import CompanyMembership


class User(Base):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_email_lower", text("lower(email)"), unique=True),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # NULL for candidates who applied with a phone number only.
    email: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True, index=True
    )
    # E.164 (Nepal default); identifies phone-only candidates.
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(255))
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    is_onboarded: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", index=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    primary_role: Mapped[UserRole] = mapped_column(nullable=False)
    email_verify_token: Mapped[str | None] = mapped_column(String(255), index=True)
    password_reset_token: Mapped[str | None] = mapped_column(String(255), index=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    oauth_accounts: Mapped[list[OAuthAccount]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    memberships: Mapped[list[CompanyMembership]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="CompanyMembership.user_id",
    )
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_account_id: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="oauth_accounts")

    __table_args__ = (
        UniqueConstraint(
            "provider", "provider_account_id", name="uq_oauth_provider_account"
        ),
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    jti: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="refresh_tokens")
