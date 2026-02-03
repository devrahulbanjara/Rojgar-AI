import uuid

from app.db.models.resume import (
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeSkills,
    ResumeSocialLink,
    ResumeWorkExperience,
)
from app.db.models.user import User
from app.db.repositories.candidate_repo import CandidateProfileRepository
from app.db.repositories.resume_repo import (
    ResumeCertificationRepository,
    ResumeEducationRepository,
    ResumeRepository,
    ResumeSkillRepository,
    ResumeSocialLinkRepository,
    ResumeWorkExperienceRepository,
)
from app.schemas import (
    CertificationBase,
    EducationBase,
    ResumeCertificationUpdate,
    ResumeCreate,
    ResumeEducationUpdate,
    ResumeSkillUpdate,
    ResumeUpdate,
    ResumeWorkExperienceUpdate,
    SkillBase,
    WorkExperienceBase,
)


class ResumeService:
    def __init__(
        self,
        resume_repo: ResumeRepository,
        candidate_profile_repo: CandidateProfileRepository,
        resume_work_experience_repo: ResumeWorkExperienceRepository,
        resume_education_repo: ResumeEducationRepository,
        resume_skill_repo: ResumeSkillRepository,
        resume_certification_repo: ResumeCertificationRepository,
        resume_social_link_repo: ResumeSocialLinkRepository,
    ):
        self.resume_repo = resume_repo
        self.candidate_profile_repo = candidate_profile_repo
        self.resume_work_experience_repo = resume_work_experience_repo
        self.resume_education_repo = resume_education_repo
        self.resume_skill_repo = resume_skill_repo
        self.resume_certification_repo = resume_certification_repo
        self.resume_social_link_repo = resume_social_link_repo

    async def create_resume_fork(self, user: User, data: ResumeCreate) -> Resume | None:
        """Create a new resume by forking from profile"""
        profile = await self.candidate_profile_repo.get_full_profile(user.user_id)
        if not profile:
            return None

        new_resume_id = uuid.uuid4()
        new_resume = Resume(
            resume_id=new_resume_id,
            profile_id=profile.profile_id,
            target_job_title=data.target_job_title,
            custom_summary=data.custom_summary or profile.professional_summary,
        )
        await self.resume_repo.create(new_resume)

        # Copy work experiences
        source_experiences = (
            data.work_experiences
            if data.work_experiences is not None
            else (profile.work_experiences or [])
        )
        for exp in source_experiences:
            experience = ResumeWorkExperience(
                resume_work_experience_id=uuid.uuid4(),
                resume_id=new_resume_id,
                job_title=exp.job_title,
                company=exp.company,
                location=exp.location,
                start_date=exp.start_date,
                end_date=exp.end_date,
                is_current=exp.is_current,
                description=getattr(exp, "description", None),
            )
            await self.resume_work_experience_repo.create(experience)

        # Copy educations
        source_educations = (
            data.educations if data.educations is not None else (profile.educations or [])
        )
        for edu in source_educations:
            education = ResumeEducation(
                resume_education_id=uuid.uuid4(),
                resume_id=new_resume_id,
                college_name=edu.college_name,
                degree=edu.degree,
                location=edu.location,
                start_date=edu.start_date,
                end_date=edu.end_date,
                is_current=edu.is_current,
            )
            await self.resume_education_repo.create(education)

        # Copy skills
        source_skills = data.skills if data.skills is not None else (profile.skills or [])
        for skill in source_skills:
            resume_skill = ResumeSkills(
                resume_skill_id=uuid.uuid4(),
                resume_id=new_resume_id,
                skill_name=skill.skill_name,
            )
            await self.resume_skill_repo.create(resume_skill)

        # Copy certifications
        source_certifications = (
            data.certifications
            if data.certifications is not None
            else (profile.certifications or [])
        )
        for cert in source_certifications:
            certification = ResumeCertification(
                resume_certification_id=uuid.uuid4(),
                resume_id=new_resume_id,
                certification_name=cert.certification_name,
                issuing_body=cert.issuing_body,
                credential_url=cert.credential_url,
                issue_date=cert.issue_date,
                expiration_date=cert.expiration_date,
                does_not_expire=cert.does_not_expire,
            )
            await self.resume_certification_repo.create(certification)

        # Copy social links
        source_links = (
            data.social_links if data.social_links is not None else (profile.social_links or [])
        )
        for link in source_links:
            social_link = ResumeSocialLink(
                resume_social_link_id=uuid.uuid4(),
                resume_id=new_resume_id,
                type=link.type,
                url=link.url,
            )
            await self.resume_social_link_repo.create(social_link)

        return await self.get_resume(user, new_resume_id)

    async def get_resume(self, user: User, resume_id: uuid.UUID) -> Resume | None:
        """Get resume by ID for a user"""
        resume = await self.resume_repo.get_with_details(resume_id)
        if not resume:
            return None
        # Verify ownership
        profile = await self.candidate_profile_repo.get_by_user_id(user.user_id)
        if profile and resume.profile_id == profile.profile_id:
            return resume
        return None

    async def list_resumes(self, user: User) -> list[Resume]:
        """List all resumes for a user"""
        resumes = await self.resume_repo.get_by_user_id(user.user_id)
        return list(resumes)

    async def update_resume(
        self, user: User, resume_id: uuid.UUID, data: ResumeUpdate
    ) -> Resume | None:
        """Update resume"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        update_data = data.model_dump(exclude_unset=True)
        await self.resume_repo.update(resume_id, **update_data)
        return await self.get_resume(user, resume_id)

    async def delete_resume(self, user: User, resume_id: uuid.UUID) -> Resume | None:
        """Delete resume"""
        resume = await self.get_resume(user, resume_id)
        if resume:
            await self.resume_repo.delete(resume_id)
        return resume

    async def add_experience(
        self, user: User, resume_id: uuid.UUID, data: WorkExperienceBase
    ) -> ResumeWorkExperience | None:
        """Add work experience to resume"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        experience = ResumeWorkExperience(
            resume_work_experience_id=uuid.uuid4(),
            resume_id=resume_id,
            **data.model_dump(),
        )
        return await self.resume_work_experience_repo.create(experience)

    async def delete_experience(
        self, user: User, resume_id: uuid.UUID, item_id: uuid.UUID
    ) -> ResumeWorkExperience | None:
        """Delete work experience"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        experience = await self.resume_work_experience_repo.get(item_id)
        if experience and experience.resume_id == resume_id:
            await self.resume_work_experience_repo.delete(item_id)
            return experience
        return None

    async def update_experience(
        self,
        user: User,
        resume_id: uuid.UUID,
        item_id: uuid.UUID,
        data: ResumeWorkExperienceUpdate,
    ) -> ResumeWorkExperience | None:
        """Update work experience"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        experience = await self.resume_work_experience_repo.get(item_id)
        if not experience or experience.resume_id != resume_id:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return await self.resume_work_experience_repo.update(item_id, **update_data)

    async def add_education(
        self, user: User, resume_id: uuid.UUID, data: EducationBase
    ) -> ResumeEducation | None:
        """Add education to resume"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        education = ResumeEducation(
            resume_education_id=uuid.uuid4(), resume_id=resume_id, **data.model_dump()
        )
        return await self.resume_education_repo.create(education)

    async def delete_education(
        self, user: User, resume_id: uuid.UUID, item_id: uuid.UUID
    ) -> ResumeEducation | None:
        """Delete education"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        education = await self.resume_education_repo.get(item_id)
        if education and education.resume_id == resume_id:
            await self.resume_education_repo.delete(item_id)
            return education
        return None

    async def update_education(
        self,
        user: User,
        resume_id: uuid.UUID,
        item_id: uuid.UUID,
        data: ResumeEducationUpdate,
    ) -> ResumeEducation | None:
        """Update education"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        education = await self.resume_education_repo.get(item_id)
        if not education or education.resume_id != resume_id:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return await self.resume_education_repo.update(item_id, **update_data)

    async def add_skill(
        self, user: User, resume_id: uuid.UUID, data: SkillBase
    ) -> ResumeSkills | None:
        """Add skill to resume"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        skill = ResumeSkills(
            resume_skill_id=uuid.uuid4(), resume_id=resume_id, **data.model_dump()
        )
        return await self.resume_skill_repo.create(skill)

    async def delete_skill(
        self, user: User, resume_id: uuid.UUID, item_id: uuid.UUID
    ) -> ResumeSkills | None:
        """Delete skill"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        skill = await self.resume_skill_repo.get(item_id)
        if skill and skill.resume_id == resume_id:
            await self.resume_skill_repo.delete(item_id)
            return skill
        return None

    async def update_skill(
        self,
        user: User,
        resume_id: uuid.UUID,
        item_id: uuid.UUID,
        data: ResumeSkillUpdate,
    ) -> ResumeSkills | None:
        """Update skill"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        skill = await self.resume_skill_repo.get(item_id)
        if not skill or skill.resume_id != resume_id:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return await self.resume_skill_repo.update(item_id, **update_data)

    async def add_certification(
        self, user: User, resume_id: uuid.UUID, data: CertificationBase
    ) -> ResumeCertification | None:
        """Add certification to resume"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        cert_data = data.model_dump(exclude={"credential_id"})
        certification = ResumeCertification(
            resume_certification_id=uuid.uuid4(), resume_id=resume_id, **cert_data
        )
        return await self.resume_certification_repo.create(certification)

    async def delete_certification(
        self, user: User, resume_id: uuid.UUID, item_id: uuid.UUID
    ) -> ResumeCertification | None:
        """Delete certification"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        certification = await self.resume_certification_repo.get(item_id)
        if certification and certification.resume_id == resume_id:
            await self.resume_certification_repo.delete(item_id)
            return certification
        return None

    async def update_certification(
        self,
        user: User,
        resume_id: uuid.UUID,
        item_id: uuid.UUID,
        data: ResumeCertificationUpdate,
    ) -> ResumeCertification | None:
        """Update certification"""
        resume = await self.get_resume(user, resume_id)
        if not resume:
            return None
        certification = await self.resume_certification_repo.get(item_id)
        if not certification or certification.resume_id != resume_id:
            return None
        update_data = data.model_dump(exclude_unset=True)
        return await self.resume_certification_repo.update(item_id, **update_data)
