from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base

if TYPE_CHECKING:
    from app.models.profile import (
        Certification,
        EducationRecord,
        Profile,
        ProfileSkill,
        WorkExperience,
    )


class Resume(Base):
    __tablename__ = "resume"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("profile.id"), index=True
    )

    name: Mapped[str] = mapped_column(String)
    target_job_title: Mapped[str | None] = mapped_column(String, nullable=True)

    contact_full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_location: Mapped[str | None] = mapped_column(String, nullable=True)

    custom_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    linkedin_url: Mapped[str | None] = mapped_column(String, nullable=True)
    github_url: Mapped[str | None] = mapped_column(String, nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped[Profile] = relationship("Profile", back_populates="resumes")
    experiences: Mapped[list[ResumeExperience]] = relationship(
        "ResumeExperience", back_populates="resume", cascade="all, delete-orphan"
    )
    educations: Mapped[list[ResumeEducation]] = relationship(
        "ResumeEducation", back_populates="resume", cascade="all, delete-orphan"
    )
    certifications: Mapped[list[ResumeCertification]] = relationship(
        "ResumeCertification", back_populates="resume", cascade="all, delete-orphan"
    )
    skills: Mapped[list[ResumeSkill]] = relationship(
        "ResumeSkill", back_populates="resume", cascade="all, delete-orphan"
    )


class ResumeExperience(Base):
    __tablename__ = "resume_experience"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    work_experience_id: Mapped[str] = mapped_column(
        String, ForeignKey("work_experience.id"), index=True
    )

    custom_description: Mapped[str] = mapped_column(Text)

    job_title: Mapped[str | None] = mapped_column(String, nullable=True)
    company: Mapped[str | None] = mapped_column(String, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_current: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    master_description: Mapped[str | None] = mapped_column(Text, nullable=True)

    display_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    resume: Mapped[Resume] = relationship("Resume", back_populates="experiences")
    work_experience: Mapped[WorkExperience] = relationship(
        "WorkExperience", back_populates="resume_experiences"
    )


class ResumeEducation(Base):
    __tablename__ = "resume_education"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    education_record_id: Mapped[str] = mapped_column(
        String, ForeignKey("education_record.id"), index=True
    )

    school_university: Mapped[str | None] = mapped_column(String, nullable=True)
    degree: Mapped[str | None] = mapped_column(String, nullable=True)
    field_of_study: Mapped[str | None] = mapped_column(String, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_current: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    gpa: Mapped[str | None] = mapped_column(String, nullable=True)
    honors: Mapped[str | None] = mapped_column(String, nullable=True)

    display_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    resume: Mapped[Resume] = relationship("Resume", back_populates="educations")
    education_record: Mapped[EducationRecord] = relationship(
        "EducationRecord", back_populates="resume_educations"
    )


class ResumeCertification(Base):
    __tablename__ = "resume_certification"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    certification_id: Mapped[str] = mapped_column(
        String, ForeignKey("certification.id"), index=True
    )

    name: Mapped[str | None] = mapped_column(String, nullable=True)
    issuing_body: Mapped[str | None] = mapped_column(String, nullable=True)
    credential_id: Mapped[str | None] = mapped_column(String, nullable=True)
    credential_url: Mapped[str | None] = mapped_column(String, nullable=True)
    issue_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expiration_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    does_not_expire: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    display_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    resume: Mapped[Resume] = relationship("Resume", back_populates="certifications")
    certification: Mapped[Certification] = relationship(
        "Certification", back_populates="resume_certifications"
    )


class ResumeSkill(Base):
    __tablename__ = "resume_skill"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    profile_skill_id: Mapped[str] = mapped_column(
        String, ForeignKey("profile_skill.id"), index=True
    )

    skill_name: Mapped[str | None] = mapped_column(String, nullable=True)
    proficiency_level: Mapped[str | None] = mapped_column(String, nullable=True)
    years_of_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)

    display_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    resume: Mapped[Resume] = relationship("Resume", back_populates="skills")
    profile_skill: Mapped[ProfileSkill] = relationship(
        "ProfileSkill", back_populates="resume_skills"
    )
