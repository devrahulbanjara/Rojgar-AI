from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core import get_datetime

from . import Base

if TYPE_CHECKING:
    from app.models.job import JobPosting
    from app.models.resume import Resume
    from app.models.user import User


class CandidateProfile(Base):
    __tablename__ = "candidate_profile"

    profile_id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        Uuid, ForeignKey("user.user_id"), unique=True, nullable=False
    )

    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    location_city: Mapped[str | None] = mapped_column(String, nullable=True)
    location_country: Mapped[str | None] = mapped_column(String, nullable=True)
    professional_headline: Mapped[str | None] = mapped_column(String, nullable=True)
    professional_summary: Mapped[str | None] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="candidate_profile")

    social_links: Mapped[list["CandidateSocialLink"]] = relationship(
        "CandidateSocialLink", back_populates="profile", cascade="all, delete-orphan"
    )
    work_experiences: Mapped[list["CandidateWorkExperience"]] = relationship(
        "CandidateWorkExperience",
        back_populates="profile",
        cascade="all, delete-orphan",
    )
    educations: Mapped[list["CandidateEducation"]] = relationship(
        "CandidateEducation", back_populates="profile", cascade="all, delete-orphan"
    )
    certifications: Mapped[list["CandidateCertification"]] = relationship(
        "CandidateCertification", back_populates="profile", cascade="all, delete-orphan"
    )
    skills: Mapped[list["CandidateSkills"]] = relationship(
        "CandidateSkills", back_populates="profile", cascade="all, delete-orphan"
    )
    resumes: Mapped[list["Resume"]] = relationship(
        "Resume", back_populates="profile", cascade="all, delete-orphan"
    )

    # Saved jobs relationships
    saved_jobs_associations: Mapped[list["CandidateSavedJob"]] = relationship(
        "CandidateSavedJob", back_populates="profile", cascade="all, delete-orphan"
    )

    saved_jobs: Mapped[list["JobPosting"]] = relationship(
        secondary="candidate_saved_job",
        viewonly=True,
    )

    @property
    def full_name(self) -> str:
        return self.user.name if self.user else ""


class CandidateSocialLink(Base):
    __tablename__ = "candidate_social_links"

    social_link_id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("candidate_profile.profile_id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="social_links"
    )


class CandidateWorkExperience(Base):
    __tablename__ = "candidate_work_experience"

    candidate_work_experience_id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("candidate_profile.profile_id"), nullable=False
    )
    job_title: Mapped[str] = mapped_column(String, nullable=False)
    company: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="work_experiences"
    )


class CandidateEducation(Base):
    __tablename__ = "candidate_education"

    candidate_education_id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("candidate_profile.profile_id"), nullable=False
    )
    college_name: Mapped[str] = mapped_column(String, nullable=False)
    degree: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="educations"
    )


class CandidateCertification(Base):
    __tablename__ = "candidate_certification"

    candidate_certification_id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("candidate_profile.profile_id"), nullable=False
    )
    certification_name: Mapped[str] = mapped_column(String, nullable=False)
    issuing_body: Mapped[str] = mapped_column(String, nullable=False)
    credential_id: Mapped[str | None] = mapped_column(String, nullable=True)
    credential_url: Mapped[str | None] = mapped_column(String, nullable=True)
    issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    does_not_expire: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="certifications"
    )


class CandidateSkills(Base):
    __tablename__ = "candidate_skills"

    candidate_skill_id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("candidate_profile.profile_id"), nullable=False
    )
    skill_name: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, onupdate=get_datetime, nullable=False
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="skills"
    )


class CandidateSavedJob(Base):
    __tablename__ = "candidate_saved_job"

    candidate_profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("candidate_profile.profile_id"), primary_key=True
    )
    job_id: Mapped[str] = mapped_column(
        Uuid, ForeignKey("job_posting.job_id"), primary_key=True
    )

    saved_at: Mapped[datetime] = mapped_column(
        DateTime, default=get_datetime, nullable=False
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="saved_jobs_associations"
    )
