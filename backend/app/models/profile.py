from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, date
from sqlalchemy import String, DateTime, ForeignKey, Text, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.resume import Resume


class Profile(Base):
    __tablename__ = "profile"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), unique=True, index=True)
    
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location_city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location_country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    linkedin_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    professional_headline: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    professional_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    user: Mapped["User"] = relationship("User", back_populates="profile")
    work_experiences: Mapped[List["WorkExperience"]] = relationship("WorkExperience", back_populates="profile", cascade="all, delete-orphan")
    education_records: Mapped[List["EducationRecord"]] = relationship("EducationRecord", back_populates="profile", cascade="all, delete-orphan")
    certifications: Mapped[List["Certification"]] = relationship("Certification", back_populates="profile", cascade="all, delete-orphan")
    skills: Mapped[List["ProfileSkill"]] = relationship("ProfileSkill", back_populates="profile", cascade="all, delete-orphan")
    resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="profile", cascade="all, delete-orphan")


class WorkExperience(Base):
    __tablename__ = "work_experience"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    job_title: Mapped[str] = mapped_column(String)
    company: Mapped[str] = mapped_column(String)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    
    master_description: Mapped[str] = mapped_column(Text)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    profile: Mapped["Profile"] = relationship("Profile", back_populates="work_experiences")
    resume_experiences: Mapped[List["ResumeExperience"]] = relationship("ResumeExperience", back_populates="work_experience", cascade="all, delete-orphan")


class EducationRecord(Base):
    __tablename__ = "education_record"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    school_university: Mapped[str] = mapped_column(String)
    degree: Mapped[str] = mapped_column(String)
    field_of_study: Mapped[str] = mapped_column(String)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    
    gpa: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    honors: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    profile: Mapped["Profile"] = relationship("Profile", back_populates="education_records")
    resume_educations: Mapped[List["ResumeEducation"]] = relationship("ResumeEducation", back_populates="education_record", cascade="all, delete-orphan")


class Certification(Base):
    __tablename__ = "certification"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    name: Mapped[str] = mapped_column(String)
    issuing_body: Mapped[str] = mapped_column(String)
    credential_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credential_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    issue_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    expiration_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    does_not_expire: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    profile: Mapped["Profile"] = relationship("Profile", back_populates="certifications")
    resume_certifications: Mapped[List["ResumeCertification"]] = relationship("ResumeCertification", back_populates="certification", cascade="all, delete-orphan")


class ProfileSkill(Base):
    __tablename__ = "profile_skill"
    
    id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(String, ForeignKey("profile.id"), index=True)
    
    skill_name: Mapped[str] = mapped_column(String)
    proficiency_level: Mapped[str] = mapped_column(String, default="Intermediate")  # Beginner, Intermediate, Advanced, Expert
    years_of_experience: Mapped[Optional[int]] = mapped_column(String, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    profile: Mapped["Profile"] = relationship("Profile", back_populates="skills")
    resume_skills: Mapped[List["ResumeSkill"]] = relationship("ResumeSkill", back_populates="profile_skill", cascade="all, delete-orphan")


