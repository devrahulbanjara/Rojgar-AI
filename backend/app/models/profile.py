"""
Profile model - The Single Source of Truth (SSOT) for candidate data
This is the master database containing ALL candidate information
"""

from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, date
from sqlalchemy import String, DateTime, ForeignKey, Text, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict, field_validator

from app.models import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.resume import Resume


class Profile(Base):
    """
    Profile table - The master data store for candidate information
    This is the Single Source of Truth containing ALL career data
    """
    __tablename__ = "profile"
    
    # Basic info
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), unique=True, index=True)
    
    # Professional Contact Information (separate from user account)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location_city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location_country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Professional Links
    linkedin_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Professional Identity
    professional_headline: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    professional_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")
    work_experiences: Mapped[List["WorkExperience"]] = relationship("WorkExperience", back_populates="profile", cascade="all, delete-orphan")
    education_records: Mapped[List["EducationRecord"]] = relationship("EducationRecord", back_populates="profile", cascade="all, delete-orphan")
    certifications: Mapped[List["Certification"]] = relationship("Certification", back_populates="profile", cascade="all, delete-orphan")
    skills: Mapped[List["ProfileSkill"]] = relationship("ProfileSkill", back_populates="profile", cascade="all, delete-orphan")
    resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="profile", cascade="all, delete-orphan")


class WorkExperience(Base):
    """
    Work Experience - Master list of ALL jobs held
    Each entry contains the complete, detailed description
    """
    __tablename__ = "work_experience"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    # Job details
    job_title: Mapped[str] = mapped_column(String)
    company: Mapped[str] = mapped_column(String)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Dates
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Master description - the complete, detailed version
    master_description: Mapped[str] = mapped_column(Text)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    profile: Mapped["Profile"] = relationship("Profile", back_populates="work_experiences")
    resume_experiences: Mapped[List["ResumeExperience"]] = relationship("ResumeExperience", back_populates="work_experience", cascade="all, delete-orphan")


class EducationRecord(Base):
    """
    Education - Master list of ALL degrees/education
    """
    __tablename__ = "education_record"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    # Education details
    school_university: Mapped[str] = mapped_column(String)
    degree: Mapped[str] = mapped_column(String)
    field_of_study: Mapped[str] = mapped_column(String)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Dates
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Additional info
    gpa: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    honors: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    profile: Mapped["Profile"] = relationship("Profile", back_populates="education_records")
    resume_educations: Mapped[List["ResumeEducation"]] = relationship("ResumeEducation", back_populates="education_record", cascade="all, delete-orphan")


class Certification(Base):
    """
    Certifications - Master list of ALL certifications
    """
    __tablename__ = "certification"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    # Certification details
    name: Mapped[str] = mapped_column(String)
    issuing_body: Mapped[str] = mapped_column(String)
    credential_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credential_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Dates
    issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiration_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    does_not_expire: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    profile: Mapped["Profile"] = relationship("Profile", back_populates="certifications")
    resume_certifications: Mapped[List["ResumeCertification"]] = relationship("ResumeCertification", back_populates="certification", cascade="all, delete-orphan")


class ProfileSkill(Base):
    """
    Profile Skills - Master list of ALL skills with proficiency levels
    """
    __tablename__ = "profile_skill"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    # Skill details
    skill_name: Mapped[str] = mapped_column(String)
    proficiency_level: Mapped[str] = mapped_column(String, default="Intermediate")  # Beginner, Intermediate, Advanced, Expert
    years_of_experience: Mapped[Optional[int]] = mapped_column(String, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    profile: Mapped["Profile"] = relationship("Profile", back_populates="skills")
    resume_skills: Mapped[List["ResumeSkill"]] = relationship("ResumeSkill", back_populates="profile_skill", cascade="all, delete-orphan")


# ============= Request/Response Schemas =============

class ProfileResponse(BaseModel):
    """Complete profile response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    phone: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    professional_headline: Optional[str] = None
    professional_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # User data (from user table)
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_picture: Optional[str] = None
    
    # Nested data
    work_experiences: List["WorkExperienceResponse"] = []
    education_records: List["EducationRecordResponse"] = []
    certifications: List["CertificationResponse"] = []
    skills: List["ProfileSkillResponse"] = []


class WorkExperienceResponse(BaseModel):
    """Work experience response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_current: bool
    master_description: str
    created_at: datetime
    updated_at: datetime


class EducationRecordResponse(BaseModel):
    """Education record response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    school_university: str
    degree: str
    field_of_study: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool
    gpa: Optional[str] = None
    honors: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CertificationResponse(BaseModel):
    """Certification response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    name: str
    issuing_body: str
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    does_not_expire: bool
    created_at: datetime
    updated_at: datetime


class ProfileSkillResponse(BaseModel):
    """Profile skill response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    profile_id: str
    skill_name: str
    proficiency_level: str
    years_of_experience: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# Update forward references - these will be rebuilt when all models are loaded
def rebuild_profile_models():
    """Rebuild all profile models to resolve forward references"""
    ProfileResponse.model_rebuild()
    WorkExperienceResponse.model_rebuild()
    EducationRecordResponse.model_rebuild()
    CertificationResponse.model_rebuild()
    ProfileSkillResponse.model_rebuild()
