"""
Resume Service - Manages tailored views of Profile data
"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from fastapi import HTTPException
import uuid

from app.models.resume import (
    Resume, ResumeExperience, ResumeEducation, ResumeCertification, ResumeSkill,
    ResumeResponse, ResumeExperienceResponse, ResumeEducationResponse,
    ResumeCertificationResponse, ResumeSkillResponse
)
from app.models.profile import (
    Profile, WorkExperience, EducationRecord, Certification, ProfileSkill
)


class ResumeService:
    """Service for managing resumes - tailored views of Profile data"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_resumes_by_user_id(self, user_id: str) -> List[ResumeResponse]:
        """Get all resumes for a user"""
        # Get profile first
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
        """Get a specific resume by ID"""
        # Get profile first
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
        """Create a new resume with comprehensive autofill from profile data"""
        # Get profile with all related data for autofill
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
        
        # Autofill contact information from profile if not provided
        contact_full_name = resume_data.get("contact_full_name") or profile.user.name
        contact_email = resume_data.get("contact_email") or profile.user.email
        contact_phone = resume_data.get("contact_phone") or profile.phone
        contact_location = resume_data.get("contact_location") or self._format_location(profile.location_city, profile.location_country)
        custom_summary = resume_data.get("custom_summary") or profile.professional_summary
        
        resume = Resume(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            name=resume_data["name"],
            contact_full_name=contact_full_name,
            contact_email=contact_email,
            contact_phone=contact_phone,
            contact_location=contact_location,
            custom_summary=custom_summary
        )
        
        self.db.add(resume)
        self.db.flush()  # Flush to get the resume ID
        
        # Auto-add all work experiences from profile
        for i, work_exp in enumerate(profile.work_experiences):
            resume_experience = ResumeExperience(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                work_experience_id=work_exp.id,
                custom_description=work_exp.master_description,  # Use master description as default
                display_order=i + 1
            )
            self.db.add(resume_experience)
        
        # Auto-add all education records from profile
        for i, education in enumerate(profile.education_records):
            resume_education = ResumeEducation(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                education_record_id=education.id,
                display_order=i + 1
            )
            self.db.add(resume_education)
        
        # Auto-add all certifications from profile
        for i, certification in enumerate(profile.certifications):
            resume_certification = ResumeCertification(
                id=str(uuid.uuid4()),
                resume_id=resume.id,
                certification_id=certification.id,
                display_order=i + 1
            )
            self.db.add(resume_certification)
        
        # Auto-add all skills from profile
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
        """Format location from city and country"""
        if not city and not country:
            return None
        if city and country:
            return f"{city}, {country}"
        return city or country
    
    def update_resume(self, user_id: str, resume_id: str, resume_data: dict) -> ResumeResponse:
        """Update a resume"""
        # Get profile first
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
        
        # Update fields
        for field, value in resume_data.items():
            if hasattr(resume, field):
                setattr(resume, field, value)
        
        resume.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(resume)
        
        return ResumeResponse.model_validate(resume)
    
    def delete_resume(self, user_id: str, resume_id: str) -> bool:
        """Delete a resume"""
        # Get profile first
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
    
    # Experience Management for Resume
    def add_experience_to_resume(self, user_id: str, resume_id: str, work_experience_id: str, custom_description: str) -> ResumeExperienceResponse:
        """Add a work experience to a resume with custom description"""
        # Get profile first
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Verify resume ownership
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Verify work experience ownership
        work_experience = self.db.execute(
            select(WorkExperience)
            .where(WorkExperience.id == work_experience_id)
            .where(WorkExperience.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not work_experience:
            raise HTTPException(status_code=404, detail="Work experience not found")
        
        # Check if already added
        existing = self.db.execute(
            select(ResumeExperience)
            .where(ResumeExperience.resume_id == resume_id)
            .where(ResumeExperience.work_experience_id == work_experience_id)
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Experience already added to this resume")
        
        # Get next display order
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
    
    def update_experience_in_resume(self, user_id: str, resume_id: str, resume_experience_id: str, custom_description: str) -> ResumeExperienceResponse:
        """Update the custom description for an experience in a resume"""
        # Get profile first
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Verify resume ownership
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Get resume experience
        resume_experience = self.db.execute(
            select(ResumeExperience)
            .where(ResumeExperience.id == resume_experience_id)
            .where(ResumeExperience.resume_id == resume_id)
        ).scalar_one_or_none()
        
        if not resume_experience:
            raise HTTPException(status_code=404, detail="Resume experience not found")
        
        resume_experience.custom_description = custom_description
        resume_experience.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(resume_experience)
        
        return ResumeExperienceResponse.model_validate(resume_experience)
    
    def remove_experience_from_resume(self, user_id: str, resume_id: str, resume_experience_id: str) -> bool:
        """Remove an experience from a resume"""
        # Get profile first
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Verify resume ownership
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Get resume experience
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
    
    # Education Management for Resume
    def add_education_to_resume(self, user_id: str, resume_id: str, education_record_id: str) -> ResumeEducationResponse:
        """Add an education record to a resume"""
        # Get profile first
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Verify resume ownership
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Verify education record ownership
        education_record = self.db.execute(
            select(EducationRecord)
            .where(EducationRecord.id == education_record_id)
            .where(EducationRecord.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not education_record:
            raise HTTPException(status_code=404, detail="Education record not found")
        
        # Check if already added
        existing = self.db.execute(
            select(ResumeEducation)
            .where(ResumeEducation.resume_id == resume_id)
            .where(ResumeEducation.education_record_id == education_record_id)
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Education already added to this resume")
        
        # Get next display order
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
    
    def remove_education_from_resume(self, user_id: str, resume_id: str, resume_education_id: str) -> bool:
        """Remove an education record from a resume"""
        # Get profile first
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Verify resume ownership
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Get resume education
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
    
    # Certification Management for Resume
    def add_certification_to_resume(self, user_id: str, resume_id: str, certification_id: str) -> ResumeCertificationResponse:
        """Add a certification to a resume"""
        # Get profile first
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Verify resume ownership
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Verify certification ownership
        certification = self.db.execute(
            select(Certification)
            .where(Certification.id == certification_id)
            .where(Certification.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not certification:
            raise HTTPException(status_code=404, detail="Certification not found")
        
        # Check if already added
        existing = self.db.execute(
            select(ResumeCertification)
            .where(ResumeCertification.resume_id == resume_id)
            .where(ResumeCertification.certification_id == certification_id)
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Certification already added to this resume")
        
        # Get next display order
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
    
    def remove_certification_from_resume(self, user_id: str, resume_id: str, resume_certification_id: str) -> bool:
        """Remove a certification from a resume"""
        # Get profile first
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Verify resume ownership
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Get resume certification
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
    
    # Skills Management for Resume
    def add_skill_to_resume(self, user_id: str, resume_id: str, profile_skill_id: str) -> ResumeSkillResponse:
        """Add a skill to a resume"""
        # Get profile first
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Verify resume ownership
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Verify profile skill ownership
        profile_skill = self.db.execute(
            select(ProfileSkill)
            .where(ProfileSkill.id == profile_skill_id)
            .where(ProfileSkill.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not profile_skill:
            raise HTTPException(status_code=404, detail="Profile skill not found")
        
        # Check if already added
        existing = self.db.execute(
            select(ResumeSkill)
            .where(ResumeSkill.resume_id == resume_id)
            .where(ResumeSkill.profile_skill_id == profile_skill_id)
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Skill already added to this resume")
        
        # Get next display order
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
    
    def remove_skill_from_resume(self, user_id: str, resume_id: str, resume_skill_id: str) -> bool:
        """Remove a skill from a resume"""
        # Get profile first
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Verify resume ownership
        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Get resume skill
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
