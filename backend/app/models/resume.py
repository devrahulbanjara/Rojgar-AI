"""
Resume model - Tailored views of Profile data
Resumes are curated, customized compilations of Profile information
"""

from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict

from app.models import Base

if TYPE_CHECKING:
    from app.models.profile import Profile, WorkExperience, EducationRecord, Certification, ProfileSkill

# Import response models directly for use in type annotations
from app.models.profile import WorkExperienceResponse, EducationRecordResponse, CertificationResponse, ProfileSkillResponse


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
    
    # Ordering within this resume
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="skills")
    profile_skill: Mapped["ProfileSkill"] = relationship("ProfileSkill", back_populates="resume_skills")


# ============= Request/Response Schemas =============

class ResumeResponse(BaseModel):
    """Complete resume response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    name: str
    target_job_title: Optional[str] = None
    contact_full_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_location: Optional[str] = None
    custom_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested data
    experiences: List["ResumeExperienceResponse"] = []
    educations: List["ResumeEducationResponse"] = []
    certifications: List["ResumeCertificationResponse"] = []
    skills: List["ResumeSkillResponse"] = []


class ResumeExperienceResponse(BaseModel):
    """Resume experience response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    work_experience_id: str
    custom_description: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    # Include the original work experience data
    work_experience: Optional[WorkExperienceResponse] = None


class ResumeEducationResponse(BaseModel):
    """Resume education response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    education_record_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    # Include the original education record data
    education_record: Optional[EducationRecordResponse] = None


class ResumeCertificationResponse(BaseModel):
    """Resume certification response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    certification_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    # Include the original certification data
    certification: Optional[CertificationResponse] = None


class ResumeSkillResponse(BaseModel):
    """Resume skill response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    resume_id: str
    profile_skill_id: str
    display_order: int
    created_at: datetime
    updated_at: datetime
    
    # Include the original profile skill data
    profile_skill: Optional[ProfileSkillResponse] = None


# Update forward references - these will be rebuilt when all models are loaded
def rebuild_models():
    """Rebuild all models to resolve forward references"""
    ResumeResponse.model_rebuild()
    ResumeExperienceResponse.model_rebuild()
    ResumeEducationResponse.model_rebuild()
    ResumeCertificationResponse.model_rebuild()
    ResumeSkillResponse.model_rebuild()
