"""
Core Resume CRUD operations.
Handles creating, reading, updating, and deleting resumes.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models import (
    Profile,
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeExperience,
    ResumeSkill,
)
from app.schemas import ResumeResponse

from .base import BaseResumeService


class ResumeCRUDService(BaseResumeService):
    """
    Service for core Resume CRUD operations.
    """

    def get_resumes_by_user_id(self, user_id: str) -> list[ResumeResponse]:
        """
        Get all resumes belonging to a user.

        Args:
            user_id: The ID of the user

        Returns:
            List of ResumeResponse objects
        """
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()

        if not profile:
            return []

        stmt = (
            select(Resume)
            .options(
                selectinload(Resume.experiences).selectinload(
                    ResumeExperience.work_experience
                ),
                selectinload(Resume.educations).selectinload(
                    ResumeEducation.education_record
                ),
                selectinload(Resume.certifications).selectinload(
                    ResumeCertification.certification
                ),
                selectinload(Resume.skills).selectinload(ResumeSkill.profile_skill),
            )
            .where(Resume.profile_id == profile.id)
            .order_by(Resume.updated_at.desc())
        )

        resumes = self.db.execute(stmt).scalars().all()
        return [ResumeResponse.model_validate(resume) for resume in resumes]

    def get_resume_by_id(self, user_id: str, resume_id: str) -> ResumeResponse | None:
        """
        Get a specific resume by ID.

        Args:
            user_id: The ID of the user (for ownership verification)
            resume_id: The ID of the resume

        Returns:
            ResumeResponse object if found, None otherwise
        """
        profile = self.get_profile_or_404(user_id)

        stmt = (
            select(Resume)
            .options(
                selectinload(Resume.experiences).selectinload(
                    ResumeExperience.work_experience
                ),
                selectinload(Resume.educations).selectinload(
                    ResumeEducation.education_record
                ),
                selectinload(Resume.certifications).selectinload(
                    ResumeCertification.certification
                ),
                selectinload(Resume.skills).selectinload(ResumeSkill.profile_skill),
            )
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        )

        resume = self.db.execute(stmt).scalar_one_or_none()
        if not resume:
            return None

        return ResumeResponse.model_validate(resume)

    def create_resume(self, user_id: str, resume_data: dict) -> ResumeResponse:
        """
        Create a new resume for a user.
        Copies data from the user's profile to populate the initial resume.

        Args:
            user_id: The ID of the user
            resume_data: Dictionary containing initial resume details (name, etc.)

        Returns:
            The created Resume object formatted as a response
        """
        profile = self.db.execute(
            select(Profile)
            .options(
                selectinload(Profile.user),
                selectinload(Profile.work_experiences),
                selectinload(Profile.education_records),
                selectinload(Profile.certifications),
                selectinload(Profile.skills),
            )
            .where(Profile.user_id == user_id)
        ).scalar_one_or_none()

        if not profile:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail="Profile not found")

        # Build resume with profile data as defaults
        resume = Resume(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            name=resume_data["name"],
            contact_full_name=resume_data.get("contact_full_name") or profile.user.name,
            contact_email=resume_data.get("contact_email") or profile.user.email,
            contact_phone=resume_data.get("contact_phone") or profile.phone,
            contact_location=resume_data.get("contact_location")
            or self.format_location(profile.location_city, profile.location_country),
            custom_summary=resume_data.get("custom_summary")
            or profile.professional_summary,
            linkedin_url=resume_data.get("linkedin_url") or profile.linkedin_url,
            github_url=resume_data.get("github_url") or profile.github_url,
            portfolio_url=resume_data.get("portfolio_url") or profile.portfolio_url,
        )

        self.db.add(resume)
        self.db.flush()

        # Copy all profile sections to resume
        self._copy_experiences_to_resume(resume, profile.work_experiences)
        self._copy_educations_to_resume(resume, profile.education_records)
        self._copy_certifications_to_resume(resume, profile.certifications)
        self._copy_skills_to_resume(resume, profile.skills)

        self.db.flush()
        self.db.refresh(resume)

        return ResumeResponse.model_validate(resume)

    def _copy_experiences_to_resume(self, resume: Resume, work_experiences: list):
        """Copy work experiences from profile to resume."""
        for i, work_exp in enumerate(work_experiences):
            resume_exp = ResumeExperience(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                work_experience_id=work_exp.id,
                custom_description=work_exp.master_description,
                display_order=i + 1,
            )
            self.db.add(resume_exp)

    def _copy_educations_to_resume(self, resume: Resume, education_records: list):
        """Copy education records from profile to resume."""
        for i, education in enumerate(education_records):
            resume_edu = ResumeEducation(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                education_record_id=education.id,
                display_order=i + 1,
            )
            self.db.add(resume_edu)

    def _copy_certifications_to_resume(self, resume: Resume, certifications: list):
        """Copy certifications from profile to resume."""
        for i, cert in enumerate(certifications):
            resume_cert = ResumeCertification(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                certification_id=cert.id,
                display_order=i + 1,
            )
            self.db.add(resume_cert)

    def _copy_skills_to_resume(self, resume: Resume, skills: list):
        """Copy skills from profile to resume."""
        for i, skill in enumerate(skills):
            resume_skill = ResumeSkill(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                profile_skill_id=skill.id,
                display_order=i + 1,
            )
            self.db.add(resume_skill)

    def update_resume(
        self, user_id: str, resume_id: str, resume_data: dict
    ) -> ResumeResponse:
        """
        Update basic details of a resume.

        Args:
            user_id: The ID of the user
            resume_id: The ID of the resume
            resume_data: Dictionary of fields to update

        Returns:
            The updated ResumeResponse
        """
        _, resume = self.get_resume_or_404(user_id, resume_id)

        for field, value in resume_data.items():
            if hasattr(resume, field):
                setattr(resume, field, value)

        resume.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(resume)

        return ResumeResponse.model_validate(resume)

    def delete_resume(self, user_id: str, resume_id: str) -> bool:
        """
        Delete a resume.

        Args:
            user_id: The ID of the user
            resume_id: The ID of the resume

        Returns:
            True if deleted successfully
        """
        _, resume = self.get_resume_or_404(user_id, resume_id)

        self.db.delete(resume)
        self.db.flush()
        return True
