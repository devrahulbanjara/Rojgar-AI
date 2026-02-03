import uuid

from app.db.models.candidate import (
    CandidateCertification,
    CandidateEducation,
    CandidateProfile,
    CandidateSkills,
    CandidateSocialLink,
    CandidateWorkExperience,
)
from app.db.models.user import User
from app.db.repositories.candidate_repo import (
    CandidateCertificationRepository,
    CandidateEducationRepository,
    CandidateProfileRepository,
    CandidateSkillsRepository,
    CandidateSocialLinkRepository,
    CandidateWorkExperienceRepository,
)
from app.db.repositories.user_repo import UserRepository
from app.schemas import CandidateProfileUpdate


class ProfileService:
    def __init__(
        self,
        candidate_profile_repo: CandidateProfileRepository,
        candidate_skills_repo: CandidateSkillsRepository,
        candidate_work_experience_repo: CandidateWorkExperienceRepository,
        candidate_education_repo: CandidateEducationRepository,
        candidate_certification_repo: CandidateCertificationRepository,
        candidate_social_link_repo: CandidateSocialLinkRepository,
        user_repo: UserRepository,
    ):
        self.candidate_profile_repo = candidate_profile_repo
        self.candidate_skills_repo = candidate_skills_repo
        self.candidate_work_experience_repo = candidate_work_experience_repo
        self.candidate_education_repo = candidate_education_repo
        self.candidate_certification_repo = candidate_certification_repo
        self.candidate_social_link_repo = candidate_social_link_repo
        self.user_repo = user_repo

    async def get_full_profile(self, user: User) -> CandidateProfile | None:
        """Get full candidate profile with all related data"""
        return await self.candidate_profile_repo.get_full_profile(user.user_id)

    async def update_basic_info(
        self, user: User, data: CandidateProfileUpdate
    ) -> CandidateProfile | None:
        """Update basic profile information"""
        profile = await self.get_full_profile(user)
        if not profile:
            return None

        update_data = data.model_dump(exclude_unset=True)
        if "full_name" in update_data:
            new_name = update_data.pop("full_name")
            await self.user_repo.update(user.user_id, name=new_name)

        if update_data:
            await self.candidate_profile_repo.update(profile.profile_id, **update_data)
        return await self.get_full_profile(user)

    async def add_experience(self, user: User, data) -> CandidateWorkExperience | None:
        """Add work experience"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        experience = CandidateWorkExperience(
            candidate_work_experience_id=uuid.uuid4(),
            profile_id=profile.profile_id,
            **data.model_dump(),
        )
        return await self.candidate_work_experience_repo.create(experience)

    async def delete_experience(self, user: User, item_id: uuid.UUID) -> bool:
        """Delete work experience"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return False
        experience = await self.candidate_work_experience_repo.get(item_id)
        if experience and experience.profile_id == profile.profile_id:
            await self.candidate_work_experience_repo.delete(item_id)
            return True
        return False

    async def update_experience(
        self, user: User, item_id: uuid.UUID, data
    ) -> CandidateWorkExperience | None:
        """Update work experience"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        experience = await self.candidate_work_experience_repo.get(item_id)
        if not experience or experience.profile_id != profile.profile_id:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return await self.candidate_work_experience_repo.update(item_id, **update_data)

    async def add_education(self, user: User, data) -> CandidateEducation | None:
        """Add education"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        education = CandidateEducation(
            candidate_education_id=uuid.uuid4(),
            profile_id=profile.profile_id,
            **data.model_dump(),
        )
        return await self.candidate_education_repo.create(education)

    async def delete_education(self, user: User, item_id: uuid.UUID) -> bool:
        """Delete education"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return False
        education = await self.candidate_education_repo.get(item_id)
        if education and education.profile_id == profile.profile_id:
            await self.candidate_education_repo.delete(item_id)
            return True
        return False

    async def update_education(
        self, user: User, item_id: uuid.UUID, data
    ) -> CandidateEducation | None:
        """Update education"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        education = await self.candidate_education_repo.get(item_id)
        if not education or education.profile_id != profile.profile_id:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return await self.candidate_education_repo.update(item_id, **update_data)

    async def add_skill(self, user: User, data) -> CandidateSkills | None:
        """Add skill"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        skill = CandidateSkills(
            candidate_skill_id=uuid.uuid4(),
            profile_id=profile.profile_id,
            **data.model_dump(),
        )
        return await self.candidate_skills_repo.create(skill)

    async def delete_skill(self, user: User, item_id: uuid.UUID) -> bool:
        """Delete skill"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return False
        skill = await self.candidate_skills_repo.get(item_id)
        if skill and skill.profile_id == profile.profile_id:
            await self.candidate_skills_repo.delete(item_id)
            return True
        return False

    async def update_skill(
        self, user: User, item_id: uuid.UUID, data
    ) -> CandidateSkills | None:
        """Update skill"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        skill = await self.candidate_skills_repo.get(item_id)
        if not skill or skill.profile_id != profile.profile_id:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return await self.candidate_skills_repo.update(item_id, **update_data)

    async def add_certification(
        self, user: User, data
    ) -> CandidateCertification | None:
        """Add certification"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        certification = CandidateCertification(
            candidate_certification_id=uuid.uuid4(),
            profile_id=profile.profile_id,
            **data.model_dump(),
        )
        return await self.candidate_certification_repo.create(certification)

    async def delete_certification(self, user: User, item_id: uuid.UUID) -> bool:
        """Delete certification"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return False
        certification = await self.candidate_certification_repo.get(item_id)
        if certification and certification.profile_id == profile.profile_id:
            await self.candidate_certification_repo.delete(item_id)
            return True
        return False

    async def update_certification(
        self, user: User, item_id: uuid.UUID, data
    ) -> CandidateCertification | None:
        """Update certification"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        certification = await self.candidate_certification_repo.get(item_id)
        if not certification or certification.profile_id != profile.profile_id:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return await self.candidate_certification_repo.update(item_id, **update_data)

    async def add_social_link(self, user: User, data) -> CandidateSocialLink | None:
        """Add social link"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        social_link = CandidateSocialLink(
            social_link_id=uuid.uuid4(),
            profile_id=profile.profile_id,
            **data.model_dump(),
        )
        return await self.candidate_social_link_repo.create(social_link)

    async def delete_social_link(self, user: User, item_id: uuid.UUID) -> bool:
        """Delete social link"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return False
        social_link = await self.candidate_social_link_repo.get(item_id)
        if social_link and social_link.profile_id == profile.profile_id:
            await self.candidate_social_link_repo.delete(item_id)
            return True
        return False

    async def update_social_link(
        self, user: User, item_id: uuid.UUID, data
    ) -> CandidateSocialLink | None:
        """Update social link"""
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if not profile:
            return None
        social_link = await self.candidate_social_link_repo.get(item_id)
        if not social_link or social_link.profile_id != profile.profile_id:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return await self.candidate_social_link_repo.update(item_id, **update_data)
