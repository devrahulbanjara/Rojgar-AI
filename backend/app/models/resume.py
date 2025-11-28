from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base

if TYPE_CHECKING:
    from app.models.profile import Profile, WorkExperience, EducationRecord, Certification, ProfileSkill

class Resume(Base):
    __tablename__ = "resume"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    name: Mapped[str] = mapped_column(String)
    target_job_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    contact_full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contact_location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    custom_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    linkedin_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    profile: Mapped["Profile"] = relationship("Profile", back_populates="resumes")
    experiences: Mapped[List["ResumeExperience"]] = relationship("ResumeExperience", back_populates="resume", cascade="all, delete-orphan")
    educations: Mapped[List["ResumeEducation"]] = relationship("ResumeEducation", back_populates="resume", cascade="all, delete-orphan")
    certifications: Mapped[List["ResumeCertification"]] = relationship("ResumeCertification", back_populates="resume", cascade="all, delete-orphan")
    skills: Mapped[List["ResumeSkill"]] = relationship("ResumeSkill", back_populates="resume", cascade="all, delete-orphan")


class ResumeExperience(Base):
    __tablename__ = "resume_experience"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    work_experience_id: Mapped[str] = mapped_column(String, ForeignKey("work_experience.id"), index=True)
    
    custom_description: Mapped[str] = mapped_column(Text)
    
    job_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_current: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    master_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    resume: Mapped["Resume"] = relationship("Resume", back_populates="experiences")
    work_experience: Mapped["WorkExperience"] = relationship("WorkExperience", back_populates="resume_experiences")


class ResumeEducation(Base):
    __tablename__ = "resume_education"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    education_record_id: Mapped[str] = mapped_column(String, ForeignKey("education_record.id"), index=True)
    
    school_university: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    degree: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    field_of_study: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_current: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    gpa: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    honors: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    resume: Mapped["Resume"] = relationship("Resume", back_populates="educations")
    education_record: Mapped["EducationRecord"] = relationship("EducationRecord", back_populates="resume_educations")


class ResumeCertification(Base):
    __tablename__ = "resume_certification"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    certification_id: Mapped[str] = mapped_column(String, ForeignKey("certification.id"), index=True)
    
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    issuing_body: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credential_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credential_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    issue_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    does_not_expire: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    resume: Mapped["Resume"] = relationship("Resume", back_populates="certifications")
    certification: Mapped["Certification"] = relationship("Certification", back_populates="resume_certifications")


class ResumeSkill(Base):
    __tablename__ = "resume_skill"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    profile_skill_id: Mapped[str] = mapped_column(String, ForeignKey("profile_skill.id"), index=True)
    
    skill_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    proficiency_level: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    years_of_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    resume: Mapped["Resume"] = relationship("Resume", back_populates="skills")
    profile_skill: Mapped["ProfileSkill"] = relationship("ProfileSkill", back_populates="resume_skills")


