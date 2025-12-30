from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


def utc_now():
    return datetime.now(UTC).replace(tzinfo=None)


class Resume(Base):
    __tablename__ = "resume"

    resume_id: Mapped[str] = mapped_column(String, primary_key=True)
    profile_id: Mapped[str] = mapped_column(
        String, ForeignKey("candidate_profile.profile_id"), nullable=False
    )
    resume_name: Mapped[str] = mapped_column(String, nullable=False)
    target_job_title: Mapped[str | None] = mapped_column(String, nullable=True)
    custom_summary: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    profile: Mapped["CandidateProfile"] = relationship(
        "CandidateProfile", back_populates="resumes"
    )

    social_links: Mapped[list["ResumeSocialLink"]] = relationship(
        "ResumeSocialLink", back_populates="resume", cascade="all, delete-orphan"
    )
    work_experiences: Mapped[list["ResumeWorkExperience"]] = relationship(
        "ResumeWorkExperience", back_populates="resume", cascade="all, delete-orphan"
    )
    educations: Mapped[list["ResumeEducation"]] = relationship(
        "ResumeEducation", back_populates="resume", cascade="all, delete-orphan"
    )
    certifications: Mapped[list["ResumeCertification"]] = relationship(
        "ResumeCertification", back_populates="resume", cascade="all, delete-orphan"
    )
    skills: Mapped[list["ResumeSkills"]] = relationship(
        "ResumeSkills", back_populates="resume", cascade="all, delete-orphan"
    )


class ResumeSocialLink(Base):
    __tablename__ = "resume_social_links"

    resume_social_link_id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(
        String, ForeignKey("resume.resume_id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    resume: Mapped["Resume"] = relationship("Resume", back_populates="social_links")


class ResumeWorkExperience(Base):
    __tablename__ = "resume_work_experience"

    resume_work_experience_id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(
        String, ForeignKey("resume.resume_id"), nullable=False
    )
    job_title: Mapped[str] = mapped_column(String, nullable=False)
    company: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    resume: Mapped["Resume"] = relationship("Resume", back_populates="work_experiences")


class ResumeEducation(Base):
    __tablename__ = "resume_education"

    resume_education_id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(
        String, ForeignKey("resume.resume_id"), nullable=False
    )
    college_name: Mapped[str] = mapped_column(String, nullable=False)
    degree: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    resume: Mapped["Resume"] = relationship("Resume", back_populates="educations")


class ResumeCertification(Base):
    __tablename__ = "resume_certification"

    resume_certification_id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(
        String, ForeignKey("resume.resume_id"), nullable=False
    )
    certification_name: Mapped[str] = mapped_column(String, nullable=False)
    issuing_body: Mapped[str] = mapped_column(String, nullable=False)
    credential_url: Mapped[str | None] = mapped_column(String, nullable=True)
    issue_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    does_not_expire: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    resume: Mapped["Resume"] = relationship("Resume", back_populates="certifications")


class ResumeSkills(Base):
    __tablename__ = "resume_skills"

    resume_skill_id: Mapped[str] = mapped_column(String, primary_key=True)
    resume_id: Mapped[str] = mapped_column(
        String, ForeignKey("resume.resume_id"), nullable=False
    )
    skill_name: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now, nullable=False
    )

    resume: Mapped["Resume"] = relationship("Resume", back_populates="skills")
