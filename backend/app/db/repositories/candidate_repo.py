import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.candidate import (
    CandidateCertification,
    CandidateEducation,
    CandidateProfile,
    CandidateSkills,
    CandidateSocialLink,
    CandidateWorkExperience,
)
from app.db.repositories.base import BaseRepository


class CandidateProfileRepository(BaseRepository[CandidateProfile]):
    def __init__(self, db: AsyncSession):
        super().__init__(CandidateProfile, db)

    async def get_by_user_id(self, user_id: uuid.UUID) -> CandidateProfile | None:
        """Get candidate profile by user ID"""
        query = select(CandidateProfile).where(CandidateProfile.user_id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_full_profile(self, user_id: uuid.UUID) -> CandidateProfile | None:
        """Get complete candidate profile with all related data"""
        query = (
            select(CandidateProfile)
            .options(
                selectinload(CandidateProfile.user),
                selectinload(CandidateProfile.social_links),
                selectinload(CandidateProfile.work_experiences),
                selectinload(CandidateProfile.educations),
                selectinload(CandidateProfile.certifications),
                selectinload(CandidateProfile.skills),
                selectinload(CandidateProfile.resumes),
            )
            .where(CandidateProfile.user_id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_with_skills(self, user_id: uuid.UUID) -> CandidateProfile | None:
        """Get candidate profile with skills"""
        query = (
            select(CandidateProfile)
            .options(selectinload(CandidateProfile.skills))
            .where(CandidateProfile.user_id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()


class CandidateSkillsRepository(BaseRepository[CandidateSkills]):
    def __init__(self, db: AsyncSession):
        super().__init__(CandidateSkills, db)

    async def get_by_profile(self, profile_id: uuid.UUID) -> Sequence[CandidateSkills]:
        """Get skills by profile ID"""
        query = (
            select(CandidateSkills)
            .where(CandidateSkills.profile_id == profile_id)
            .order_by(CandidateSkills.skill_name)
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class CandidateWorkExperienceRepository(BaseRepository[CandidateWorkExperience]):
    def __init__(self, db: AsyncSession):
        super().__init__(CandidateWorkExperience, db)

    async def get_by_profile(
        self, profile_id: uuid.UUID
    ) -> Sequence[CandidateWorkExperience]:
        """Get work experiences by profile ID"""
        query = (
            select(CandidateWorkExperience)
            .where(CandidateWorkExperience.profile_id == profile_id)
            .order_by(CandidateWorkExperience.start_date.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class CandidateEducationRepository(BaseRepository[CandidateEducation]):
    def __init__(self, db: AsyncSession):
        super().__init__(CandidateEducation, db)

    async def get_by_profile(
        self, profile_id: uuid.UUID
    ) -> Sequence[CandidateEducation]:
        """Get education by profile ID"""
        query = (
            select(CandidateEducation)
            .where(CandidateEducation.profile_id == profile_id)
            .order_by(CandidateEducation.start_date.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class CandidateCertificationRepository(BaseRepository[CandidateCertification]):
    def __init__(self, db: AsyncSession):
        super().__init__(CandidateCertification, db)

    async def get_by_profile(
        self, profile_id: uuid.UUID
    ) -> Sequence[CandidateCertification]:
        """Get certifications by profile ID"""
        query = (
            select(CandidateCertification)
            .where(CandidateCertification.profile_id == profile_id)
            .order_by(CandidateCertification.issue_date.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()


class CandidateSocialLinkRepository(BaseRepository[CandidateSocialLink]):
    def __init__(self, db: AsyncSession):
        super().__init__(CandidateSocialLink, db)

    async def get_by_profile(
        self, profile_id: uuid.UUID
    ) -> Sequence[CandidateSocialLink]:
        """Get social links by profile ID"""
        query = select(CandidateSocialLink).where(
            CandidateSocialLink.profile_id == profile_id
        )
        result = await self.db.execute(query)
        return result.scalars().all()
