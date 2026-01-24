from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import get_datetime

from . import Base

if TYPE_CHECKING:
    from .candidate import CandidateProfile
    from .organization import Organization


class UserRole(str, Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class User(Base):
    __tablename__ = "user"

    user_id: Mapped[str] = mapped_column(Uuid, primary_key=True)
    organization_id: Mapped[str | None] = mapped_column(
        Uuid, ForeignKey("organization.organization_id"), nullable=True
    )
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    picture: Mapped[str | None] = mapped_column(String, nullable=True)

    password: Mapped[str | None] = mapped_column(String, nullable=True)

    role: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    organization: Mapped[Optional["Organization"]] = relationship(
        "Organization", back_populates="recruiters"
    )

    # Relationships
    google_account: Mapped[Optional["UserGoogle"]] = relationship(
        "UserGoogle", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    candidate_profile: Mapped[Optional["CandidateProfile"]] = relationship(
        "CandidateProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @property
    def id(self):
        return self.user_id

    @property
    def google_id(self):
        return self.google_account.user_google_id if self.google_account else None


class UserGoogle(Base):
    __tablename__ = "user_google"

    user_google_id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        Uuid, ForeignKey("user.user_id"), unique=True, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="google_account")
