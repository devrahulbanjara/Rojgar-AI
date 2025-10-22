from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class UserRole(str, Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class User(Base):
    __tablename__ = "user"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    picture: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    google_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    skills: Mapped[List["Skill"]] = relationship("Skill", back_populates="user")
    profile: Mapped[Optional["Profile"]] = relationship("Profile", back_populates="user", uselist=False)


