from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base

if TYPE_CHECKING:
    from app.models.resume import Resume
    from app.models.user import User


class Profile(Base):
    __tablename__ = "profile"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("user.id"), unique=True, index=True
    )

    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    location_city: Mapped[str | None] = mapped_column(String, nullable=True)
    location_country: Mapped[str | None] = mapped_column(String, nullable=True)

    linkedin_url: Mapped[str | None] = mapped_column(String, nullable=True)
    github_url: Mapped[str | None] = mapped_column(String, nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String, nullable=True)

    professional_headline: Mapped[str | None] = mapped_column(String, nullable=True)
    professional_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship("User", back_populates="profile")
    work_experiences: Mapped[list[WorkExperience]] = relationship(
        "WorkExperience", back_populates="profile", cascade="all, delete-orphan"
    )
    education_records: Mapped[list[EducationRecord]] = relationship(
        "EducationRecord", back_populates="profile", cascade="all, delete-orphan"
    )
    certifications: Mapped[list[Certification]] = relationship(
        "Certification", back_populates="profile", cascade="all, delete-orphan"
    )
    skills: Mapped[list[ProfileSkill]] = relationship(
        "ProfileSkill", back_populates="profile", cascade="all, delete-orphan"
    )
    resumes: Mapped[list[Resume]] = relationship(
        "Resume", back_populates="profile", cascade="all, delete-orphan"
    )


class WorkExperience(Base):
    __tablename__ = "work_experience"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("profile.id"), index=True
    )

    job_title: Mapped[str] = mapped_column(String)
    company: Mapped[str] = mapped_column(String)
    location: Mapped[str | None] = mapped_column(String, nullable=True)

    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)

    master_description: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped[Profile] = relationship(
        "Profile", back_populates="work_experiences"
    )
    resume_experiences: Mapped[list[ResumeExperience]] = relationship(
        "ResumeExperience",
        back_populates="work_experience",
        cascade="all, delete-orphan",
    )


class EducationRecord(Base):
    __tablename__ = "education_record"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("profile.id"), index=True
    )

    school_university: Mapped[str] = mapped_column(String)
    degree: Mapped[str] = mapped_column(String)
    field_of_study: Mapped[str] = mapped_column(String)
    location: Mapped[str | None] = mapped_column(String, nullable=True)

    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)

    gpa: Mapped[str | None] = mapped_column(String, nullable=True)
    honors: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped[Profile] = relationship(
        "Profile", back_populates="education_records"
    )
    resume_educations: Mapped[list[ResumeEducation]] = relationship(
        "ResumeEducation",
        back_populates="education_record",
        cascade="all, delete-orphan",
    )


class Certification(Base):
    __tablename__ = "certification"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("profile.id"), index=True
    )

    name: Mapped[str] = mapped_column(String)
    issuing_body: Mapped[str] = mapped_column(String)
    credential_id: Mapped[str | None] = mapped_column(String, nullable=True)
    credential_url: Mapped[str | None] = mapped_column(String, nullable=True)

    issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    does_not_expire: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped[Profile] = relationship("Profile", back_populates="certifications")
    resume_certifications: Mapped[list[ResumeCertification]] = relationship(
        "ResumeCertification",
        back_populates="certification",
        cascade="all, delete-orphan",
    )


class ProfileSkill(Base):
    __tablename__ = "profile_skill"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("profile.id"), index=True
    )

    skill_name: Mapped[str] = mapped_column(String)
    proficiency_level: Mapped[str] = mapped_column(
        String, default="Intermediate"
    )  # Beginner, Intermediate, Advanced, Expert
    years_of_experience: Mapped[int | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped[Profile] = relationship("Profile", back_populates="skills")
    resume_skills: Mapped[list[ResumeSkill]] = relationship(
        "ResumeSkill", back_populates="profile_skill", cascade="all, delete-orphan"
    )
