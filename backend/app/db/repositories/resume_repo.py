import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.resume import (
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeSkills,
    ResumeSocialLink,
    ResumeWorkExperience,
)
from app.db.repositories.base import BaseRepository


class ResumeRepository(BaseRepository[Resume]):
    def __init__(self, db: AsyncSession):
        super().__init__(Resume, db)

    async def get_by_candidate_profile(self, profile_id: uuid.UUID) -> Sequence[Resume]:
        """Get resumes by candidate profile ID"""
        query = (
            select(Resume)
            .where(Resume.profile_id == profile_id)
            .order_by(Resume.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_with_details(self, resume_id: uuid.UUID) -> Resume | None:
        """Get resume with all related details"""
        query = (
            select(Resume)
            .options(
                selectinload(Resume.social_links),
                selectinload(Resume.work_experiences),
                selectinload(Resume.educations),
                selectinload(Resume.certifications),
                selectinload(Resume.skills),
            )
            .where(Resume.resume_id == resume_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: uuid.UUID) -> Sequence[Resume]:
        """Get resumes by user ID through candidate profile"""
        from app.db.models.candidate import CandidateProfile

        query = (
            select(Resume)
            .join(
                CandidateProfile,
                Resume.profile_id == CandidateProfile.profile_id,
            )
            .where(CandidateProfile.user_id == user_id)
            .order_by(Resume.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class ResumeSocialLinkRepository(BaseRepository[ResumeSocialLink]):
    def __init__(self, db: AsyncSession):
        super().__init__(ResumeSocialLink, db)

    async def get_by_resume(self, resume_id: uuid.UUID) -> Sequence[ResumeSocialLink]:
        """Get social links by resume ID"""
        query = select(ResumeSocialLink).where(ResumeSocialLink.resume_id == resume_id)
        result = await self.db.execute(query)
        return result.scalars().all()


class ResumeWorkExperienceRepository(BaseRepository[ResumeWorkExperience]):
    def __init__(self, db: AsyncSession):
        super().__init__(ResumeWorkExperience, db)

    async def get_by_resume(
        self, resume_id: uuid.UUID
    ) -> Sequence[ResumeWorkExperience]:
        """Get work experiences by resume ID"""
        query = (
            select(ResumeWorkExperience)
            .where(ResumeWorkExperience.resume_id == resume_id)
            .order_by(ResumeWorkExperience.start_date.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class ResumeEducationRepository(BaseRepository[ResumeEducation]):
    def __init__(self, db: AsyncSession):
        super().__init__(ResumeEducation, db)

    async def get_by_resume(self, resume_id: uuid.UUID) -> Sequence[ResumeEducation]:
        """Get education by resume ID"""
        query = (
            select(ResumeEducation)
            .where(ResumeEducation.resume_id == resume_id)
            .order_by(ResumeEducation.start_date.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class ResumeCertificationRepository(BaseRepository[ResumeCertification]):
    def __init__(self, db: AsyncSession):
        super().__init__(ResumeCertification, db)

    async def get_by_resume(
        self, resume_id: uuid.UUID
    ) -> Sequence[ResumeCertification]:
        """Get certifications by resume ID"""
        query = (
            select(ResumeCertification)
            .where(ResumeCertification.resume_id == resume_id)
            .order_by(ResumeCertification.issue_date.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class ResumeSkillRepository(BaseRepository[ResumeSkills]):
    def __init__(self, db: AsyncSession):
        super().__init__(ResumeSkills, db)

    async def get_by_resume(self, resume_id: uuid.UUID) -> Sequence[ResumeSkills]:
        """Get skills by resume ID"""
        query = (
            select(ResumeSkills)
            .where(ResumeSkills.resume_id == resume_id)
            .order_by(ResumeSkills.skill_name)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
