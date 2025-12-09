"""
Resume service package.

Provides the ResumeService class for managing resumes and their sections.
This refactored version uses a generic section handler to eliminate code duplication.

Example:
    from app.services.candidate.resume import ResumeService

    service = ResumeService(db)
    resumes = service.get_resumes_by_user_id(user_id)
"""

from sqlalchemy.orm import Session

from app.schemas import (
    ResumeCertificationResponse,
    ResumeEducationResponse,
    ResumeExperienceResponse,
    ResumeSkillResponse,
)

from .config import (
    CERTIFICATION_CONFIG,
    EDUCATION_CONFIG,
    EXPERIENCE_CONFIG,
    SKILL_CONFIG,
)
from .resume_crud import ResumeCRUDService
from .section_handler import ResumeSectionHandler


class ResumeService(ResumeCRUDService):
    """
    Service for managing Resume entities and their related components.

    Handles creation, retrieval, updates, and deletion of resumes,
    as well as adding/removing detailed sections like experience,
    education, skills, and certifications.

    This class maintains the same public API as the original ResumeService
    for backward compatibility, but uses a generic section handler internally
    to reduce code duplication.
    """

    def __init__(self, db: Session):
        """
        Initialize the ResumeService with section handlers.

        Args:
            db: Database session
        """
        super().__init__(db)

        # Initialize section handlers
        self._experience_handler = ResumeSectionHandler(db, EXPERIENCE_CONFIG)
        self._education_handler = ResumeSectionHandler(db, EDUCATION_CONFIG)
        self._certification_handler = ResumeSectionHandler(db, CERTIFICATION_CONFIG)
        self._skill_handler = ResumeSectionHandler(db, SKILL_CONFIG)

    # ==================== Experience Methods ====================

    def add_experience_to_resume(
        self,
        user_id: str,
        resume_id: str,
        work_experience_id: str,
        custom_description: str,
    ) -> ResumeExperienceResponse:
        """Add a work experience entry to a resume."""
        profile, resume = self.get_resume_or_404(user_id, resume_id)
        return self._experience_handler.add_to_resume(
            profile,
            resume,
            work_experience_id,
            extra_fields={"custom_description": custom_description},
        )

    def update_experience_in_resume(
        self,
        user_id: str,
        resume_id: str,
        resume_experience_id: str,
        experience_data: dict,
    ) -> ResumeExperienceResponse:
        """Update a resume experience entry."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._experience_handler.update_in_resume(
            resume, resume_experience_id, experience_data
        )

    def remove_experience_from_resume(
        self, user_id: str, resume_id: str, resume_experience_id: str
    ) -> bool:
        """Remove a work experience entry from a resume."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._experience_handler.remove_from_resume(resume, resume_experience_id)

    def create_experience_for_resume(
        self, user_id: str, resume_id: str, experience_data: dict
    ) -> ResumeExperienceResponse:
        """Create a new work experience entry for a resume."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._experience_handler.create_for_resume(resume, experience_data)

    # ==================== Education Methods ====================

    def add_education_to_resume(
        self, user_id: str, resume_id: str, education_record_id: str
    ) -> ResumeEducationResponse:
        """Add an education record to a resume."""
        profile, resume = self.get_resume_or_404(user_id, resume_id)
        return self._education_handler.add_to_resume(
            profile, resume, education_record_id
        )

    def update_education_in_resume(
        self,
        user_id: str,
        resume_id: str,
        resume_education_id: str,
        education_data: dict,
    ) -> ResumeEducationResponse:
        """Update a resume education entry."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._education_handler.update_in_resume(
            resume, resume_education_id, education_data
        )

    def remove_education_from_resume(
        self, user_id: str, resume_id: str, resume_education_id: str
    ) -> bool:
        """Remove an education record from a resume."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._education_handler.remove_from_resume(resume, resume_education_id)

    def create_education_for_resume(
        self, user_id: str, resume_id: str, education_data: dict
    ) -> ResumeEducationResponse:
        """Create a new education record for a resume."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._education_handler.create_for_resume(resume, education_data)

    # ==================== Certification Methods ====================

    def add_certification_to_resume(
        self, user_id: str, resume_id: str, certification_id: str
    ) -> ResumeCertificationResponse:
        """Add a certification to a resume."""
        profile, resume = self.get_resume_or_404(user_id, resume_id)
        return self._certification_handler.add_to_resume(
            profile, resume, certification_id
        )

    def update_certification_in_resume(
        self,
        user_id: str,
        resume_id: str,
        resume_certification_id: str,
        certification_data: dict,
    ) -> ResumeCertificationResponse:
        """Update a resume certification entry."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._certification_handler.update_in_resume(
            resume, resume_certification_id, certification_data
        )

    def remove_certification_from_resume(
        self, user_id: str, resume_id: str, resume_certification_id: str
    ) -> bool:
        """Remove a certification from a resume."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._certification_handler.remove_from_resume(
            resume, resume_certification_id
        )

    def create_certification_for_resume(
        self, user_id: str, resume_id: str, certification_data: dict
    ) -> ResumeCertificationResponse:
        """Create a new certification for a resume."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._certification_handler.create_for_resume(resume, certification_data)

    # ==================== Skill Methods ====================

    def add_skill_to_resume(
        self, user_id: str, resume_id: str, profile_skill_id: str
    ) -> ResumeSkillResponse:
        """Add a skill to a resume."""
        profile, resume = self.get_resume_or_404(user_id, resume_id)
        return self._skill_handler.add_to_resume(profile, resume, profile_skill_id)

    def update_skill_in_resume(
        self, user_id: str, resume_id: str, resume_skill_id: str, skill_data: dict
    ) -> ResumeSkillResponse:
        """Update a resume skill entry."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._skill_handler.update_in_resume(resume, resume_skill_id, skill_data)

    def remove_skill_from_resume(
        self, user_id: str, resume_id: str, resume_skill_id: str
    ) -> bool:
        """Remove a skill from a resume."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._skill_handler.remove_from_resume(resume, resume_skill_id)

    def create_skill_for_resume(
        self, user_id: str, resume_id: str, skill_data: dict
    ) -> ResumeSkillResponse:
        """Create a new skill for a resume."""
        _, resume = self.get_resume_or_404(user_id, resume_id)
        return self._skill_handler.create_for_resume(resume, skill_data)


__all__ = ["ResumeService"]
