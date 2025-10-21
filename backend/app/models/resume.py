"""
Resume model - Tailored views of Profile data
Resumes are curated, customized compilations of Profile information
"""

from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base

if TYPE_CHECKING:
    from app.models.profile import Profile, WorkExperience, EducationRecord, Certification, ProfileSkill



class Resume(Base):
    """
    Resume - A tailored compilation of Profile data
    Each resume is a customized view of the master Profile
    """
    __tablename__ = "resume"
    
    # Basic info
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    # Resume metadata
    name: Mapped[str] = mapped_column(String)  # Internal name like "AI Engineer Resume"
    target_job_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Customized contact info (can override Profile defaults)
    contact_full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    contact_location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Customized professional summary (can override Profile default)
    custom_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Customized professional links (can override Profile defaults)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    profile: Mapped["Profile"] = relationship("Profile", back_populates="resumes")
    experiences: Mapped[List["ResumeExperience"]] = relationship("ResumeExperience", back_populates="resume", cascade="all, delete-orphan")
    educations: Mapped[List["ResumeEducation"]] = relationship("ResumeEducation", back_populates="resume", cascade="all, delete-orphan")
    certifications: Mapped[List["ResumeCertification"]] = relationship("ResumeCertification", back_populates="resume", cascade="all, delete-orphan")
    skills: Mapped[List["ResumeSkill"]] = relationship("ResumeSkill", back_populates="resume", cascade="all, delete-orphan")


class ResumeExperience(Base):
    """
    Resume Experience - Customized version of WorkExperience for this resume
    Contains tailored description and ordering
    """
    __tablename__ = "resume_experience"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    work_experience_id: Mapped[str] = mapped_column(String, ForeignKey("work_experience.id"), index=True)
    
    # Customized description for this resume
    custom_description: Mapped[str] = mapped_column(Text)
    
    # Resume-specific overrides (don't affect original work experience)
    job_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_current: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    master_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Ordering within this resume
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="experiences")
    work_experience: Mapped["WorkExperience"] = relationship("WorkExperience", back_populates="resume_experiences")


class ResumeEducation(Base):
    """
    Resume Education - Selected education records for this resume
    """
    __tablename__ = "resume_education"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    education_record_id: Mapped[str] = mapped_column(String, ForeignKey("education_record.id"), index=True)
    
    # Resume-specific overrides (don't affect original education record)
    school_university: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    degree: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    field_of_study: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_current: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    gpa: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    honors: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Ordering within this resume
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="educations")
    education_record: Mapped["EducationRecord"] = relationship("EducationRecord", back_populates="resume_educations")


class ResumeCertification(Base):
    """
    Resume Certification - Selected certifications for this resume
    """
    __tablename__ = "resume_certification"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    certification_id: Mapped[str] = mapped_column(String, ForeignKey("certification.id"), index=True)
    
    # Resume-specific overrides (don't affect original certification)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    issuing_body: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credential_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credential_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    issue_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    does_not_expire: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    
    # Ordering within this resume
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="certifications")
    certification: Mapped["Certification"] = relationship("Certification", back_populates="resume_certifications")


class ResumeSkill(Base):
    """
    Resume Skill - Selected skills for this resume
    """
    __tablename__ = "resume_skill"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(String, ForeignKey("resume.id"), index=True)
    profile_skill_id: Mapped[str] = mapped_column(String, ForeignKey("profile_skill.id"), index=True)
    
    # Resume-specific overrides (don't affect original profile skill)
    skill_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    proficiency_level: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    years_of_experience: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Ordering within this resume
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="skills")
    profile_skill: Mapped["ProfileSkill"] = relationship("ProfileSkill", back_populates="resume_skills")


