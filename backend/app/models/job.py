from datetime import date, datetime
from enum import Enum
from typing import Optional

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


class JobLevel(str, Enum):
    JUNIOR = "Junior"
    MID = "Mid"
    SENIOR = "Senior"
    LEAD = "Lead"
    PRINCIPAL = "Principal"


class LocationType(str, Enum):
    REMOTE = "Remote"
    ONSITE = "On-site"
    HYBRID = "Hybrid"


class EmploymentType(str, Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    INTERNSHIP = "Internship"


class JobStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    CLOSED = "Closed"
    DRAFT = "Draft"


class Company(Base):
    __tablename__ = "company"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True)
    logo: Mapped[str | None] = mapped_column(String, nullable=True)
    website: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    size: Mapped[str | None] = mapped_column(String, nullable=True)
    industry: Mapped[str | None] = mapped_column(String, nullable=True)
    brand_color: Mapped[str | None] = mapped_column(String, nullable=True)
    founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    jobs: Mapped[list["Job"]] = relationship(back_populates="company")


class Job(Base):
    __tablename__ = "job"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    title: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)
    level: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)

    location: Mapped[str] = mapped_column(String)
    location_type: Mapped[str] = mapped_column(String)
    is_remote: Mapped[bool] = mapped_column(Boolean, default=False)

    employment_type: Mapped[str] = mapped_column(String)

    salary_min: Mapped[int] = mapped_column(Integer)
    salary_max: Mapped[int] = mapped_column(Integer)
    salary_currency: Mapped[str] = mapped_column(String, default="USD")

    requirements: Mapped[list[str]] = mapped_column(JSON)
    skills: Mapped[list[str]] = mapped_column(JSON)
    benefits: Mapped[list[str]] = mapped_column(JSON)

    posted_date: Mapped[date] = mapped_column(Date, default=date.today)
    application_deadline: Mapped[date] = mapped_column(Date)

    status: Mapped[str] = mapped_column(
        String, default=JobStatus.ACTIVE.value, index=True
    )
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    applicant_count: Mapped[int] = mapped_column(Integer, default=0)
    views_count: Mapped[int] = mapped_column(Integer, default=0)

    company_id: Mapped[int] = mapped_column(Integer, ForeignKey("company.id"))
    company: Mapped[Optional["Company"]] = relationship(back_populates="jobs")
    created_by: Mapped[str] = mapped_column(String, ForeignKey("user.id"))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
