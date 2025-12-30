import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.candidate import CandidateProfile
from app.models.resume import (
    Resume,
    ResumeCertification,
    ResumeEducation,
    ResumeSkills,
    ResumeSocialLink,
    ResumeWorkExperience,
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
from app.services.candidate import CandidateService


class ResumeService:
    @staticmethod
    def create_resume_fork(db: Session, user_id: str, data: ResumeCreate):
        profile = CandidateService.get_full_profile(db, user_id)

        new_resume_id = str(uuid.uuid4())
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
                    resume_work_experience_id=str(uuid.uuid4()),
                    resume_id=new_resume_id,
                    job_title=exp.job_title,
                    company=exp.company,
                    location=exp.location,
                    start_date=exp.start_date,
                    end_date=exp.end_date,
                    is_current=exp.is_current,
                    description=getattr(
                        exp, "description", None
                    ),  # Handle schema vs model diff if any
                )
            )

        # Education
        source_educations = (
            data.educations if data.educations is not None else profile.educations
        )
        for edu in source_educations:
            db.add(
                ResumeEducation(
                    resume_education_id=str(uuid.uuid4()),
                    resume_id=new_resume_id,
                    college_name=edu.college_name,
                    degree=edu.degree,
                    location=edu.location,
                    start_date=edu.start_date,
                    end_date=edu.end_date,
                    is_current=edu.is_current,
                )
            )

        # Skills
        source_skills = data.skills if data.skills is not None else profile.skills
        for skill in source_skills:
            db.add(
                ResumeSkills(
                    resume_skill_id=str(uuid.uuid4()),
                    resume_id=new_resume_id,
                    skill_name=skill.skill_name,
                )
            )

        # Certifications
        source_certifications = (
            data.certifications
            if data.certifications is not None
            else profile.certifications
        )
        for cert in source_certifications:
            db.add(
                ResumeCertification(
                    resume_certification_id=str(uuid.uuid4()),
                    resume_id=new_resume_id,
                    certification_name=cert.certification_name,
                    issuing_body=cert.issuing_body,
                    credential_url=cert.credential_url,
                    issue_date=cert.issue_date,
                    expiration_date=cert.expiration_date,
                    does_not_expire=cert.does_not_expire,
                )
            )

        # Social Links
        source_links = (
            data.social_links if data.social_links is not None else profile.social_links
        )
        for link in source_links:
            db.add(
                ResumeSocialLink(
                    resume_social_link_id=str(uuid.uuid4()),
                    resume_id=new_resume_id,
                    type=link.type,
                    url=link.url,
                )
            )

        db.commit()
        db.refresh(new_resume)

        return ResumeService.get_resume(db, user_id, new_resume_id)

    @staticmethod
    def get_resume(db: Session, user_id: str, resume_id: str):
        # Strictly check ownership via Profile join
        stmt = (
            select(Resume)
            .join(CandidateProfile)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user_id)
            .options(
                selectinload(Resume.work_experiences),
                selectinload(Resume.educations),
                selectinload(Resume.certifications),
                selectinload(Resume.social_links),
                selectinload(Resume.skills),
            )
        )
        resume = db.execute(stmt).scalar_one_or_none()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        return resume

    @staticmethod
    def list_resumes(db: Session, user_id: str):
        stmt = (
            select(Resume)
            .join(CandidateProfile)
            .where(CandidateProfile.user_id == user_id)
            .order_by(Resume.updated_at.desc())
        )
        return db.execute(stmt).scalars().all()

    @staticmethod
    def update_resume(db: Session, user_id: str, resume_id: str, data: ResumeUpdate):
        resume = ResumeService.get_resume(db, user_id, resume_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(resume, key, value)
        db.commit()
        db.refresh(resume)
        return resume

    @staticmethod
    def delete_resume(db: Session, user_id: str, resume_id: str):
        resume = ResumeService.get_resume(db, user_id, resume_id)
        db.delete(resume)
        db.commit()

    @staticmethod
    def add_experience(
        db: Session, user_id: str, resume_id: str, data: WorkExperienceBase
    ):
        # Verify ownership
        ResumeService.get_resume(db, user_id, resume_id)

        new_item = ResumeWorkExperience(
            resume_work_experience_id=str(uuid.uuid4()),
            resume_id=resume_id,
            **data.model_dump(),
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

    @staticmethod
    def delete_experience(db: Session, user_id: str, resume_id: str, item_id: str):
        # Check ownership and item existence in one query
        stmt = (
            select(ResumeWorkExperience)
            .join(Resume)
            .join(CandidateProfile)
            .where(ResumeWorkExperience.resume_work_experience_id == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user_id)
        )
        item = db.execute(stmt).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Experience item not found")

        db.delete(item)
        db.commit()

    @staticmethod
    def add_education(db: Session, user_id: str, resume_id: str, data: EducationBase):
        ResumeService.get_resume(db, user_id, resume_id)
        new_item = ResumeEducation(
            resume_education_id=str(uuid.uuid4()),
            resume_id=resume_id,
            **data.model_dump(),
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

    @staticmethod
    def delete_education(db: Session, user_id: str, resume_id: str, item_id: str):
        stmt = (
            select(ResumeEducation)
            .join(Resume)
            .join(CandidateProfile)
            .where(ResumeEducation.resume_education_id == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user_id)
        )
        item = db.execute(stmt).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Education item not found")
        db.delete(item)
        db.commit()

    # --- Skills ---

    @staticmethod
    def add_skill(db: Session, user_id: str, resume_id: str, data: SkillBase):
        ResumeService.get_resume(db, user_id, resume_id)
        new_item = ResumeSkills(
            resume_skill_id=str(uuid.uuid4()), resume_id=resume_id, **data.model_dump()
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

    @staticmethod
    def delete_skill(db: Session, user_id: str, resume_id: str, item_id: str):
        stmt = (
            select(ResumeSkills)
            .join(Resume)
            .join(CandidateProfile)
            .where(ResumeSkills.resume_skill_id == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user_id)
        )
        item = db.execute(stmt).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Skill item not found")
        db.delete(item)
        db.commit()

    # --- Certifications ---

    @staticmethod
    def add_certification(
        db: Session, user_id: str, resume_id: str, data: CertificationBase
    ):
        ResumeService.get_resume(db, user_id, resume_id)
        # Exclude credential_id explicitly as it is not in the ResumeCertification model
        cert_data = data.model_dump(exclude={"credential_id"})
        new_item = ResumeCertification(
            resume_certification_id=str(uuid.uuid4()), resume_id=resume_id, **cert_data
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

    @staticmethod
    def delete_certification(db: Session, user_id: str, resume_id: str, item_id: str):
        stmt = (
            select(ResumeCertification)
            .join(Resume)
            .join(CandidateProfile)
            .where(ResumeCertification.resume_certification_id == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user_id)
        )
        item = db.execute(stmt).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Certification item not found")
        db.delete(item)
        db.commit()

    @staticmethod
    def _update_sub_item(
        db: Session,
        user_id: str,
        resume_id: str,
        item_id: str,
        ModelClass,
        id_field,
        data_obj,
    ):
        # 1. Strict Ownership Check
        stmt = (
            select(ModelClass)
            .join(Resume)
            .join(CandidateProfile)
            .where(getattr(ModelClass, id_field) == item_id)
            .where(Resume.resume_id == resume_id)
            .where(CandidateProfile.user_id == user_id)
        )
        item = db.execute(stmt).scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # 2. Partial Update
        update_data = data_obj.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_experience(
        db: Session,
        user_id: str,
        resume_id: str,
        item_id: str,
        data: ResumeWorkExperienceUpdate,
    ):
        return ResumeService._update_sub_item(
            db,
            user_id,
            resume_id,
            item_id,
            ResumeWorkExperience,
            "resume_work_experience_id",
            data,
        )

    @staticmethod
    def update_education(
        db: Session,
        user_id: str,
        resume_id: str,
        item_id: str,
        data: ResumeEducationUpdate,
    ):
        return ResumeService._update_sub_item(
            db,
            user_id,
            resume_id,
            item_id,
            ResumeEducation,
            "resume_education_id",
            data,
        )

    @staticmethod
    def update_skill(
        db: Session, user_id: str, resume_id: str, item_id: str, data: ResumeSkillUpdate
    ):
        return ResumeService._update_sub_item(
            db, user_id, resume_id, item_id, ResumeSkills, "resume_skill_id", data
        )

    @staticmethod
    def update_certification(
        db: Session,
        user_id: str,
        resume_id: str,
        item_id: str,
        data: ResumeCertificationUpdate,
    ):
        return ResumeService._update_sub_item(
            db,
            user_id,
            resume_id,
            item_id,
            ResumeCertification,
            "resume_certification_id",
            data,
        )
