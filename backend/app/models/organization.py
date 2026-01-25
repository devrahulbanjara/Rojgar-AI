import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import get_datetime

from . import Base

if TYPE_CHECKING:
    from .job import JobPosting
    from .user import User


class Organization(Base):
    __tablename__ = "organization"

    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)

    location_city: Mapped[str | None] = mapped_column(String, nullable=True)
    location_country: Mapped[str | None] = mapped_column(String, nullable=True)
    website: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    industry: Mapped[str | None] = mapped_column(String, nullable=True)
    founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    recruiters: Mapped[list["User"]] = relationship(
        "User", back_populates="organization", cascade="all, delete-orphan"
    )
    jobs: Mapped[list["JobPosting"]] = relationship(
        "JobPosting", back_populates="organization", cascade="all, delete-orphan"
    )

    @property
    def id(self):
        return self.organization_id
