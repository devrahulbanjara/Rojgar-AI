import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import NotFoundError
from app.models.candidate import CandidateProfile
from app.models.resume import (
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeSkills,
    ResumeSocialLink,
    ResumeWorkExperience,
)
from app.models.user import User
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
from app.services.candidate import CandidateService


class ResumeService:
    @staticmethod
    async def create_resume_fork(db: AsyncSession, user: User, data: ResumeCreate):
        profile = await CandidateService.get_full_profile(db, user)
        new_resume_id = uuid.uuid4()
        new_resume = Resume(
            resume_id=new_resume_id,
            profile_id=profile.profile_id,
            resume_name=data.resume_name,
            target_job_title=data.target_job_title,
            custom_summary=data.custom_summary or profile.professional_summary,
        )
        db.add(new_resume)
        source_experiences = (
            data.work_experiences
            if data.work_experiences is not None
            else profile.work_experiences
        )
        for exp in source_experiences:
            db.add(
                ResumeWorkExperience(
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
            )
        source_educations = (
            data.educations if data.educations is not None else profile.educations
        )
        for edu in source_educations:
            db.add(
                ResumeEducation(
                    resume_education_id=uuid.uuid4(),
                    resume_id=new_resume_id,
                    college_name=edu.college_name,
                    degree=edu.degree,
                    location=edu.location,
                    start_date=edu.start_date,
                    end_date=edu.end_date,
                    is_current=edu.is_current,
                )
            )
        source_skills = data.skills if data.skills is not None else profile.skills
        for skill in source_skills:
            db.add(
                ResumeSkills(
                    resume_skill_id=uuid.uuid4(),
                    resume_id=new_resume_id,
                    skill_name=skill.skill_name,
                )
            )
        source_certifications = (
            data.certifications
            if data.certifications is not None
            else profile.certifications
        )
        for cert in source_certifications:
            db.add(
                ResumeCertification(
                    resume_certification_id=uuid.uuid4(),
                    resume_id=new_resume_id,
                    certification_name=cert.certification_name,
                    issuing_body=cert.issuing_body,
                    credential_url=cert.credential_url,
                    issue_date=cert.issue_date,
                    expiration_date=cert.expiration_date,
                    does_not_expire=cert.does_not_expire,
                )
            )
        source_links = (
            data.social_links if data.social_links is not None else profile.social_links
        )
        for link in source_links:
            db.add(
                ResumeSocialLink(
                    resume_social_link_id=uuid.uuid4(),
                    resume_id=new_resume_id,
                    type=link.type,
                    url=link.url,
                )
            )
        await db.commit()
        await db.refresh(new_resume)
        return await ResumeService.get_resume(db, user, new_resume_id)

    @staticmethod
    async def get_resume(db: AsyncSession, user: User, resume_id: uuid.UUID):
        stmt = (
            select(Resume)
            .join(CandidateProfile)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user.user_id)
            .options(
                selectinload(Resume.work_experiences),
                selectinload(Resume.educations),
                selectinload(Resume.certifications),
                selectinload(Resume.social_links),
                selectinload(Resume.skills),
            )
        )
        result = await db.execute(stmt)
        resume = result.scalar_one_or_none()
        if not resume:
            raise NotFoundError(
                message="Resume not found",
                details={
                    "resume_id": str(resume_id),
                    "user_id": str(user.user_id),
                },
                user_id=user.user_id,
            )
        return resume

    @staticmethod
    async def list_resumes(db: AsyncSession, user: User):
        stmt = (
            select(Resume)
            .join(CandidateProfile)
            .where(CandidateProfile.user_id == user.user_id)
            .order_by(Resume.updated_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def update_resume(
        db: AsyncSession, user: User, resume_id: uuid.UUID, data: ResumeUpdate
    ):
        resume = await ResumeService.get_resume(db, user, resume_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(resume, key, value)
        await db.commit()
        await db.refresh(resume)
        return resume

    @staticmethod
    async def delete_resume(db: AsyncSession, user: User, resume_id: uuid.UUID):
        resume = await ResumeService.get_resume(db, user, resume_id)
        db.delete(resume)
        await db.commit()

    @staticmethod
    async def add_experience(
        db: AsyncSession, user: User, resume_id: uuid.UUID, data: WorkExperienceBase
    ):
        await ResumeService.get_resume(db, user, resume_id)
        new_item = ResumeWorkExperience(
            resume_work_experience_id=uuid.uuid4(),
            resume_id=resume_id,
            **data.model_dump(),
        )
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        return new_item

    @staticmethod
    async def delete_experience(
        db: AsyncSession, user: User, resume_id: uuid.UUID, item_id: uuid.UUID
    ):
        stmt = (
            select(ResumeWorkExperience)
            .join(Resume)
            .join(CandidateProfile)
            .where(ResumeWorkExperience.resume_work_experience_id == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user.user_id)
        )
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundError(
                message="Experience item not found",
                details={
                    "item_id": str(item_id),
                    "resume_id": str(resume_id),
                    "user_id": str(user.user_id),
                },
                user_id=user.user_id,
            )
        db.delete(item)
        await db.commit()

    @staticmethod
    async def add_education(
        db: AsyncSession, user: User, resume_id: uuid.UUID, data: EducationBase
    ):
        await ResumeService.get_resume(db, user, resume_id)
        new_item = ResumeEducation(
            resume_education_id=uuid.uuid4(), resume_id=resume_id, **data.model_dump()
        )
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        return new_item

    @staticmethod
    async def delete_education(
        db: AsyncSession, user: User, resume_id: uuid.UUID, item_id: uuid.UUID
    ):
        stmt = (
            select(ResumeEducation)
            .join(Resume)
            .join(CandidateProfile)
            .where(ResumeEducation.resume_education_id == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user.user_id)
        )
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundError(
                message="Education item not found",
                details={
                    "item_id": str(item_id),
                    "resume_id": str(resume_id),
                    "user_id": str(user.user_id),
                },
                user_id=user.user_id,
            )
        db.delete(item)
        await db.commit()

    @staticmethod
    async def add_skill(
        db: AsyncSession, user: User, resume_id: uuid.UUID, data: SkillBase
    ):
        await ResumeService.get_resume(db, user, resume_id)
        new_item = ResumeSkills(
            resume_skill_id=uuid.uuid4(), resume_id=resume_id, **data.model_dump()
        )
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        return new_item

    @staticmethod
    async def delete_skill(
        db: AsyncSession, user: User, resume_id: uuid.UUID, item_id: uuid.UUID
    ):
        stmt = (
            select(ResumeSkills)
            .join(Resume)
            .join(CandidateProfile)
            .where(ResumeSkills.resume_skill_id == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user.user_id)
        )
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundError(
                message="Skill item not found",
                details={
                    "item_id": str(item_id),
                    "resume_id": str(resume_id),
                    "user_id": str(user.user_id),
                },
                user_id=user.user_id,
            )
        db.delete(item)
        await db.commit()

    @staticmethod
    async def add_certification(
        db: AsyncSession, user: User, resume_id: uuid.UUID, data: CertificationBase
    ):
        await ResumeService.get_resume(db, user, resume_id)
        cert_data = data.model_dump(exclude={"credential_id"})
        new_item = ResumeCertification(
            resume_certification_id=uuid.uuid4(), resume_id=resume_id, **cert_data
        )
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        return new_item

    @staticmethod
    async def delete_certification(
        db: AsyncSession, user: User, resume_id: uuid.UUID, item_id: uuid.UUID
    ):
        stmt = (
            select(ResumeCertification)
            .join(Resume)
            .join(CandidateProfile)
            .where(ResumeCertification.resume_certification_id == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user.user_id)
        )
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundError(
                message="Certification item not found",
                details={
                    "item_id": str(item_id),
                    "resume_id": str(resume_id),
                    "user_id": str(user.user_id),
                },
                user_id=user.user_id,
            )
        db.delete(item)
        await db.commit()

    @staticmethod
    async def _update_sub_item(
        db: AsyncSession,
        user: User,
        resume_id: uuid.UUID,
        item_id: uuid.UUID,
        ModelClass,
        id_field,
        data_obj,
    ):
        stmt = (
            select(ModelClass)
            .join(Resume)
            .join(CandidateProfile)
            .where(getattr(ModelClass, id_field) == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user.user_id)
        )
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundError(
                message="Item not found",
                details={
                    "item_id": str(item_id),
                    "resume_id": str(resume_id),
                    "user_id": str(user.user_id),
                    "item_type": ModelClass.__name__,
                },
                user_id=user.user_id,
            )
        update_data = data_obj.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        await db.commit()
        await db.refresh(item)
        return item

    @staticmethod
    async def update_experience(
        db: AsyncSession,
        user: User,
        resume_id: uuid.UUID,
        item_id: uuid.UUID,
        data: ResumeWorkExperienceUpdate,
    ):
        return ResumeService._update_sub_item(
            db,
            user,
            resume_id,
            item_id,
            ResumeWorkExperience,
            "resume_work_experience_id",
            data,
        )

    @staticmethod
    async def update_education(
        db: AsyncSession,
        user: User,
        resume_id: uuid.UUID,
        item_id: uuid.UUID,
        data: ResumeEducationUpdate,
    ):
        return ResumeService._update_sub_item(
            db, user, resume_id, item_id, ResumeEducation, "resume_education_id", data
        )

    @staticmethod
    async def update_skill(
        db: AsyncSession,
        user: User,
        resume_id: uuid.UUID,
        item_id: uuid.UUID,
        data: ResumeSkillUpdate,
    ):
        return ResumeService._update_sub_item(
            db, user, resume_id, item_id, ResumeSkills, "resume_skill_id", data
        )

    @staticmethod
    async def update_certification(
        db: AsyncSession,
        user: User,
        resume_id: uuid.UUID,
        item_id: uuid.UUID,
        data: ResumeCertificationUpdate,
    ):
        return ResumeService._update_sub_item(
            db,
            user,
            resume_id,
            item_id,
            ResumeCertification,
            "resume_certification_id",
            data,
        )
