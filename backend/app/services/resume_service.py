from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from fastapi import HTTPException
import uuid

from app.models.resume import Resume, ResumeExperience, ResumeEducation, ResumeCertification, ResumeSkill
from app.models.profile import Profile, WorkExperience, EducationRecord, Certification, ProfileSkill
from app.schemas.resume import (
    ResumeResponse, ResumeExperienceResponse, ResumeEducationResponse,
    ResumeCertificationResponse, ResumeSkillResponse
)


class ResumeService:
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_resumes_by_user_id(self, user_id: str) -> List[ResumeResponse]:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            return []
        
        stmt = (
            select(Resume)
            .options(
                selectinload(Resume.experiences).selectinload(ResumeExperience.work_experience),
                selectinload(Resume.educations).selectinload(ResumeEducation.education_record),
                selectinload(Resume.certifications).selectinload(ResumeCertification.certification),
                selectinload(Resume.skills).selectinload(ResumeSkill.profile_skill)
            )
            .where(Resume.profile_id == profile.id)
            .order_by(Resume.updated_at.desc())
        )
        
        resumes = self.db.execute(stmt).scalars().all()
        return [ResumeResponse.model_validate(resume) for resume in resumes]
    
    def get_resume_by_id(self, user_id: str, resume_id: str) -> Optional[ResumeResponse]:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        stmt = (
            select(Resume)
            .options(
                selectinload(Resume.experiences).selectinload(ResumeExperience.work_experience),
                selectinload(Resume.educations).selectinload(ResumeEducation.education_record),
                selectinload(Resume.certifications).selectinload(ResumeCertification.certification),
                selectinload(Resume.skills).selectinload(ResumeSkill.profile_skill)
            )
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        )
        
        resume = self.db.execute(stmt).scalar_one_or_none()
        if not resume:
            return None
            
        return ResumeResponse.model_validate(resume)
    
    def create_resume(self, user_id: str, resume_data: dict) -> ResumeResponse:
        profile = self.db.execute(
            select(Profile)
            .options(
                selectinload(Profile.user),
                selectinload(Profile.work_experiences),
                selectinload(Profile.education_records),
                selectinload(Profile.certifications),
                selectinload(Profile.skills)
            )
            .where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        contact_full_name = resume_data.get("contact_full_name") or profile.user.name
        contact_email = resume_data.get("contact_email") or profile.user.email
        contact_phone = resume_data.get("contact_phone") or profile.phone
        contact_location = resume_data.get("contact_location") or self._format_location(profile.location_city, profile.location_country)
        custom_summary = resume_data.get("custom_summary") or profile.professional_summary
        
        linkedin_url = resume_data.get("linkedin_url") or profile.linkedin_url
        github_url = resume_data.get("github_url") or profile.github_url
        portfolio_url = resume_data.get("portfolio_url") or profile.portfolio_url
        
        resume = Resume(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            name=resume_data["name"],
            contact_full_name=contact_full_name,
            contact_email=contact_email,
            contact_phone=contact_phone,
            contact_location=contact_location,
            custom_summary=custom_summary,
            linkedin_url=linkedin_url,
            github_url=github_url,
            portfolio_url=portfolio_url
        )
        
        self.db.add(resume)
        self.db.flush()
        
        for i, work_exp in enumerate(profile.work_experiences):
            resume_experience = ResumeExperience(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                work_experience_id=work_exp.id,
                custom_description=work_exp.master_description,
                display_order=i + 1
            )
            self.db.add(resume_experience)
        
        for i, education in enumerate(profile.education_records):
            resume_education = ResumeEducation(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                education_record_id=education.id,
                display_order=i + 1
            )
            self.db.add(resume_education)
        
        for i, certification in enumerate(profile.certifications):
            resume_certification = ResumeCertification(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                certification_id=certification.id,
                display_order=i + 1
            )
            self.db.add(resume_certification)
        
        for i, skill in enumerate(profile.skills):
            resume_skill = ResumeSkill(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                profile_skill_id=skill.id,
                display_order=i + 1
            )
            self.db.add(resume_skill)
        
        self.db.commit()
        self.db.refresh(resume)
        
        return ResumeResponse.model_validate(resume)
    
    def _format_location(self, city: Optional[str], country: Optional[str]) -> Optional[str]:
        if not city and not country:
            return None
        if city and country:
            return f"{city}, {country}"
        return city or country
    
    def update_resume(self, user_id: str, resume_id: str, resume_data: dict) -> ResumeResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        for field, value in resume_data.items():
            if hasattr(resume, field):
                setattr(resume, field, value)
        
        resume.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(resume)
        
        return ResumeResponse.model_validate(resume)
    
    def delete_resume(self, user_id: str, resume_id: str) -> bool:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        self.db.delete(resume)
        self.db.commit()
        return True
    
    def add_experience_to_resume(self, user_id: str, resume_id: str, work_experience_id: str, custom_description: str) -> ResumeExperienceResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        work_experience = self.db.execute(
            select(WorkExperience)
            .where(WorkExperience.id == work_experience_id)
            .where(WorkExperience.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not work_experience:
            raise HTTPException(status_code=404, detail="Work experience not found")
        
        existing = self.db.execute(
            select(ResumeExperience)
            .where(ResumeExperience.resume_id == resume_id)
            .where(ResumeExperience.work_experience_id == work_experience_id)
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Experience already added to this resume")
        
        max_order = self.db.execute(
            select(ResumeExperience.display_order)
            .where(ResumeExperience.resume_id == resume_id)
            .order_by(ResumeExperience.display_order.desc())
        ).scalar()
        
        next_order = (max_order or 0) + 1
        
        resume_experience = ResumeExperience(
            id=str(uuid.uuid4()),
            resume_id=resume_id,
            work_experience_id=work_experience_id,
            custom_description=custom_description,
            display_order=next_order
        )
        
        self.db.add(resume_experience)
        self.db.commit()
        self.db.refresh(resume_experience)
        
        return ResumeExperienceResponse.model_validate(resume_experience)
    
    def update_experience_in_resume(self, user_id: str, resume_id: str, resume_experience_id: str, experience_data: dict) -> ResumeExperienceResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_experience = self.db.execute(
            select(ResumeExperience)
            .where(ResumeExperience.id == resume_experience_id)
            .where(ResumeExperience.resume_id == resume_id)
        ).scalar_one_or_none()
        
        if not resume_experience:
            raise HTTPException(status_code=404, detail="Resume experience not found")
        
        if experience_data.get('custom_description') is not None:
            resume_experience.custom_description = experience_data['custom_description']
        
        if experience_data.get('job_title') is not None:
            resume_experience.job_title = experience_data['job_title']
        if experience_data.get('company') is not None:
            resume_experience.company = experience_data['company']
        if experience_data.get('location') is not None:
            resume_experience.location = experience_data['location']
        if experience_data.get('is_current') is not None:
            resume_experience.is_current = experience_data['is_current']
        if experience_data.get('master_description') is not None:
            resume_experience.master_description = experience_data['master_description']
        
        if experience_data.get('start_date'):
            resume_experience.start_date = datetime.strptime(experience_data['start_date'], '%Y-%m-%d').date()
        if experience_data.get('end_date'):
            resume_experience.end_date = datetime.strptime(experience_data['end_date'], '%Y-%m-%d').date()
        
        resume_experience.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(resume_experience)
        
        return ResumeExperienceResponse.model_validate(resume_experience)
    
    def remove_experience_from_resume(self, user_id: str, resume_id: str, resume_experience_id: str) -> bool:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_experience = self.db.execute(
            select(ResumeExperience)
            .where(ResumeExperience.id == resume_experience_id)
            .where(ResumeExperience.resume_id == resume_id)
        ).scalar_one_or_none()
        
        if not resume_experience:
            raise HTTPException(status_code=404, detail="Resume experience not found")
        
        self.db.delete(resume_experience)
        self.db.commit()
        return True
    
    def add_education_to_resume(self, user_id: str, resume_id: str, education_record_id: str) -> ResumeEducationResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        education_record = self.db.execute(
            select(EducationRecord)
            .where(EducationRecord.id == education_record_id)
            .where(EducationRecord.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not education_record:
            raise HTTPException(status_code=404, detail="Education record not found")
        
        existing = self.db.execute(
            select(ResumeEducation)
            .where(ResumeEducation.resume_id == resume_id)
            .where(ResumeEducation.education_record_id == education_record_id)
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Education already added to this resume")
        
        max_order = self.db.execute(
            select(ResumeEducation.display_order)
            .where(ResumeEducation.resume_id == resume_id)
            .order_by(ResumeEducation.display_order.desc())
        ).scalar()
        
        next_order = (max_order or 0) + 1
        
        resume_education = ResumeEducation(
            id=str(uuid.uuid4()),
            resume_id=resume_id,
            education_record_id=education_record_id,
            display_order=next_order
        )
        
        self.db.add(resume_education)
        self.db.commit()
        self.db.refresh(resume_education)
        
        return ResumeEducationResponse.model_validate(resume_education)
    
    def update_education_in_resume(self, user_id: str, resume_id: str, resume_education_id: str, education_data: dict) -> ResumeEducationResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_education = self.db.execute(
            select(ResumeEducation)
            .where(ResumeEducation.id == resume_education_id)
            .where(ResumeEducation.resume_id == resume_id)
        ).scalar_one_or_none()
        
        if not resume_education:
            raise HTTPException(status_code=404, detail="Resume education not found")
        
        if education_data.get('school_university') is not None:
            resume_education.school_university = education_data['school_university']
        if education_data.get('degree') is not None:
            resume_education.degree = education_data['degree']
        if education_data.get('field_of_study') is not None:
            resume_education.field_of_study = education_data['field_of_study']
        if education_data.get('location') is not None:
            resume_education.location = education_data['location']
        if education_data.get('is_current') is not None:
            resume_education.is_current = education_data['is_current']
        if education_data.get('gpa') is not None:
            resume_education.gpa = education_data['gpa']
        if education_data.get('honors') is not None:
            resume_education.honors = education_data['honors']
        
        if education_data.get('start_date'):
            resume_education.start_date = datetime.strptime(education_data['start_date'], '%Y-%m-%d').date()
        if education_data.get('end_date'):
            resume_education.end_date = datetime.strptime(education_data['end_date'], '%Y-%m-%d').date()
        
        resume_education.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(resume_education)
        
        return ResumeEducationResponse.model_validate(resume_education)

    def remove_education_from_resume(self, user_id: str, resume_id: str, resume_education_id: str) -> bool:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_education = self.db.execute(
            select(ResumeEducation)
            .where(ResumeEducation.id == resume_education_id)
            .where(ResumeEducation.resume_id == resume_id)
        ).scalar_one_or_none()
        
        if not resume_education:
            raise HTTPException(status_code=404, detail="Resume education not found")
        
        self.db.delete(resume_education)
        self.db.commit()
        return True
    
    def add_certification_to_resume(self, user_id: str, resume_id: str, certification_id: str) -> ResumeCertificationResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        certification = self.db.execute(
            select(Certification)
            .where(Certification.id == certification_id)
            .where(Certification.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not certification:
            raise HTTPException(status_code=404, detail="Certification not found")
        
        existing = self.db.execute(
            select(ResumeCertification)
            .where(ResumeCertification.resume_id == resume_id)
            .where(ResumeCertification.certification_id == certification_id)
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Certification already added to this resume")
        
        max_order = self.db.execute(
            select(ResumeCertification.display_order)
            .where(ResumeCertification.resume_id == resume_id)
            .order_by(ResumeCertification.display_order.desc())
        ).scalar()
        
        next_order = (max_order or 0) + 1
        
        resume_certification = ResumeCertification(
            id=str(uuid.uuid4()),
            resume_id=resume_id,
            certification_id=certification_id,
            display_order=next_order
        )
        
        self.db.add(resume_certification)
        self.db.commit()
        self.db.refresh(resume_certification)
        
        return ResumeCertificationResponse.model_validate(resume_certification)
    
    def update_certification_in_resume(self, user_id: str, resume_id: str, resume_certification_id: str, certification_data: dict) -> ResumeCertificationResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_certification = self.db.execute(
            select(ResumeCertification)
            .where(ResumeCertification.id == resume_certification_id)
            .where(ResumeCertification.resume_id == resume_id)
        ).scalar_one_or_none()
        
        if not resume_certification:
            raise HTTPException(status_code=404, detail="Resume certification not found")
        
        if certification_data.get('name') is not None:
            resume_certification.name = certification_data['name']
        if certification_data.get('issuing_body') is not None:
            resume_certification.issuing_body = certification_data['issuing_body']
        if certification_data.get('credential_id') is not None:
            resume_certification.credential_id = certification_data['credential_id']
        if certification_data.get('credential_url') is not None:
            resume_certification.credential_url = certification_data['credential_url']
        if certification_data.get('does_not_expire') is not None:
            resume_certification.does_not_expire = certification_data['does_not_expire']
        
        if certification_data.get('issue_date'):
            resume_certification.issue_date = datetime.strptime(certification_data['issue_date'], '%Y-%m-%d').date()
        if certification_data.get('expiration_date'):
            resume_certification.expiration_date = datetime.strptime(certification_data['expiration_date'], '%Y-%m-%d').date()
        
        resume_certification.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(resume_certification)
        
        return ResumeCertificationResponse.model_validate(resume_certification)

    def remove_certification_from_resume(self, user_id: str, resume_id: str, resume_certification_id: str) -> bool:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_certification = self.db.execute(
            select(ResumeCertification)
            .where(ResumeCertification.id == resume_certification_id)
            .where(ResumeCertification.resume_id == resume_id)
        ).scalar_one_or_none()
        
        if not resume_certification:
            raise HTTPException(status_code=404, detail="Resume certification not found")
        
        self.db.delete(resume_certification)
        self.db.commit()
        return True
    
    def add_skill_to_resume(self, user_id: str, resume_id: str, profile_skill_id: str) -> ResumeSkillResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        profile_skill = self.db.execute(
            select(ProfileSkill)
            .where(ProfileSkill.id == profile_skill_id)
            .where(ProfileSkill.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not profile_skill:
            raise HTTPException(status_code=404, detail="Profile skill not found")
        
        existing = self.db.execute(
            select(ResumeSkill)
            .where(ResumeSkill.resume_id == resume_id)
            .where(ResumeSkill.profile_skill_id == profile_skill_id)
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Skill already added to this resume")
        
        max_order = self.db.execute(
            select(ResumeSkill.display_order)
            .where(ResumeSkill.resume_id == resume_id)
            .order_by(ResumeSkill.display_order.desc())
        ).scalar()
        
        next_order = (max_order or 0) + 1
        
        resume_skill = ResumeSkill(
            id=str(uuid.uuid4()),
            resume_id=resume_id,
            profile_skill_id=profile_skill_id,
            display_order=next_order
        )
        
        self.db.add(resume_skill)
        self.db.commit()
        self.db.refresh(resume_skill)
        
        return ResumeSkillResponse.model_validate(resume_skill)
    
    def update_skill_in_resume(self, user_id: str, resume_id: str, resume_skill_id: str, skill_data: dict) -> ResumeSkillResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_skill = self.db.execute(
            select(ResumeSkill)
            .where(ResumeSkill.id == resume_skill_id)
            .where(ResumeSkill.resume_id == resume_id)
        ).scalar_one_or_none()
        
        if not resume_skill:
            raise HTTPException(status_code=404, detail="Resume skill not found")
        
        if skill_data.get('skill_name') is not None:
            resume_skill.skill_name = skill_data['skill_name']
        if skill_data.get('proficiency_level') is not None:
            resume_skill.proficiency_level = skill_data['proficiency_level']
        if skill_data.get('years_of_experience') is not None:
            resume_skill.years_of_experience = skill_data['years_of_experience']
        
        resume_skill.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(resume_skill)
        
        return ResumeSkillResponse.model_validate(resume_skill)

    def remove_skill_from_resume(self, user_id: str, resume_id: str, resume_skill_id: str) -> bool:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_skill = self.db.execute(
            select(ResumeSkill)
            .where(ResumeSkill.id == resume_skill_id)
            .where(ResumeSkill.resume_id == resume_id)
        ).scalar_one_or_none()
        
        if not resume_skill:
            raise HTTPException(status_code=404, detail="Resume skill not found")
        
        self.db.delete(resume_skill)
        self.db.commit()
        return True

    def create_experience_for_resume(self, user_id: str, resume_id: str, experience_data: dict) -> ResumeExperienceResponse:
        resume = self._get_resume_by_id_and_user(resume_id, user_id)
        
        start_date = None
        if experience_data.get('start_date'):
            start_date = datetime.strptime(experience_data['start_date'], '%Y-%m-%d').date()
        
        end_date = None
        if experience_data.get('end_date'):
            end_date = datetime.strptime(experience_data['end_date'], '%Y-%m-%d').date()
        
        temp_experience = WorkExperience(
            id=str(uuid.uuid4()),
            profile_id=resume.profile_id,
            job_title=experience_data['job_title'],
            company=experience_data['company'],
            location=experience_data.get('location'),
            start_date=start_date,
            end_date=end_date,
            is_current=experience_data.get('is_current', False),
            master_description=experience_data['master_description'],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        resume_experience = ResumeExperience(
            id=str(uuid.uuid4()),
            resume_id=resume_id,
            work_experience_id=temp_experience.id,
            custom_description=experience_data['master_description'],
            display_order=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.db.add(temp_experience)
        self.db.add(resume_experience)
        self.db.commit()
        
        return ResumeExperienceResponse(
            id=resume_experience.id,
            resume_id=resume_experience.resume_id,
            work_experience_id=resume_experience.work_experience_id,
            custom_description=resume_experience.custom_description,
            display_order=resume_experience.display_order,
            created_at=resume_experience.created_at,
            updated_at=resume_experience.updated_at,
            work_experience=temp_experience
        )

    def create_education_for_resume(self, user_id: str, resume_id: str, education_data: dict) -> ResumeEducationResponse:
        resume = self._get_resume_by_id_and_user(resume_id, user_id)
        
        start_date = None
        if education_data.get('start_date'):
            start_date = datetime.strptime(education_data['start_date'], '%Y-%m-%d').date()
        
        end_date = None
        if education_data.get('end_date'):
            end_date = datetime.strptime(education_data['end_date'], '%Y-%m-%d').date()
        
        temp_education = EducationRecord(
            id=str(uuid.uuid4()),
            profile_id=resume.profile_id,
            school_university=education_data['school_university'],
            degree=education_data['degree'],
            field_of_study=education_data['field_of_study'],
            location=education_data.get('location'),
            start_date=start_date,
            end_date=end_date,
            is_current=education_data.get('is_current', False),
            gpa=education_data.get('gpa'),
            honors=education_data.get('honors'),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        resume_education = ResumeEducation(
            id=str(uuid.uuid4()),
            resume_id=resume_id,
            education_record_id=temp_education.id,
            display_order=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.db.add(temp_education)
        self.db.add(resume_education)
        self.db.commit()
        
        return ResumeEducationResponse(
            id=resume_education.id,
            resume_id=resume_education.resume_id,
            education_record_id=resume_education.education_record_id,
            display_order=resume_education.display_order,
            created_at=resume_education.created_at,
            updated_at=resume_education.updated_at,
            education_record=temp_education
        )

    def create_certification_for_resume(self, user_id: str, resume_id: str, certification_data: dict) -> ResumeCertificationResponse:
        resume = self._get_resume_by_id_and_user(resume_id, user_id)
        
        issue_date = None
        if certification_data.get('issue_date'):
            issue_date = datetime.strptime(certification_data['issue_date'], '%Y-%m-%d').date()
        
        expiration_date = None
        if certification_data.get('expiration_date'):
            expiration_date = datetime.strptime(certification_data['expiration_date'], '%Y-%m-%d').date()

        temp_certification = Certification(
            id=str(uuid.uuid4()),
            profile_id=resume.profile_id,
            name=certification_data['name'],
            issuing_body=certification_data['issuing_body'],
            credential_id=certification_data.get('credential_id'),
            credential_url=certification_data.get('credential_url'),
            issue_date=issue_date,
            expiration_date=expiration_date,
            does_not_expire=certification_data.get('does_not_expire', False),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        resume_certification = ResumeCertification(
            id=str(uuid.uuid4()),
            resume_id=resume_id,
            certification_id=temp_certification.id,
            display_order=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.db.add(temp_certification)
        self.db.add(resume_certification)
        self.db.commit()
        
        return ResumeCertificationResponse(
            id=resume_certification.id,
            resume_id=resume_certification.resume_id,
            certification_id=resume_certification.certification_id,
            display_order=resume_certification.display_order,
            created_at=resume_certification.created_at,
            updated_at=resume_certification.updated_at,
            certification=temp_certification
        )

    def create_skill_for_resume(self, user_id: str, resume_id: str, skill_data: dict) -> ResumeSkillResponse:
        resume = self._get_resume_by_id_and_user(resume_id, user_id)
        
        temp_skill = ProfileSkill(
            id=str(uuid.uuid4()),
            profile_id=resume.profile_id,
            skill_name=skill_data['skill_name'],
            proficiency_level=skill_data.get('proficiency_level', 'Intermediate'),
            years_of_experience=skill_data.get('years_of_experience'),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        resume_skill = ResumeSkill(
            id=str(uuid.uuid4()),
            resume_id=resume_id,
            profile_skill_id=temp_skill.id,
            display_order=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        self.db.add(temp_skill)
        self.db.add(resume_skill)
        self.db.commit()
        
        return ResumeSkillResponse(
            id=resume_skill.id,
            resume_id=resume_skill.resume_id,
            profile_skill_id=resume_skill.profile_skill_id,
            display_order=resume_skill.display_order,
            created_at=resume_skill.created_at,
            updated_at=resume_skill.updated_at,
            profile_skill=temp_skill
        )

    def _get_resume_by_id_and_user(self, resume_id: str, user_id: str) -> Resume:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        return resume
