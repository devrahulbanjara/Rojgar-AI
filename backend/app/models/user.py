from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


class UserRole(str, Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class User(Base):
    __tablename__ = "user"
    
    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    picture: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    password: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    role: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    google_account: Mapped[Optional["UserGoogle"]] = relationship("UserGoogle", back_populates="user", uselist=False, cascade="all, delete-orphan")
    candidate_profile: Mapped[Optional["CandidateProfile"]] = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    company_profile: Mapped[Optional["CompanyProfile"]] = relationship("CompanyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    @property
    def id(self):
        return self.user_id

    @property
    def google_id(self):
        return self.google_account.user_google_id if self.google_account else None


class UserGoogle(Base):
    __tablename__ = "user_google"
    
    user_google_id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.user_id"), unique=True, nullable=False)
    
    user: Mapped["User"] = relationship("User", back_populates="google_account")

