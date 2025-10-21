"""
Profile Service - Manages the Single Source of Truth for candidate data
"""

from typing import Optional, List
from datetime import datetime, date
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from fastapi import HTTPException
import uuid

from app.models.profile import (
    Profile, WorkExperience, EducationRecord, Certification, ProfileSkill,
    ProfileResponse, WorkExperienceResponse, EducationRecordResponse, 
    CertificationResponse, ProfileSkillResponse
)


class ProfileService:
    """Service for managing candidate profiles - the master data store"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_profile_by_user_id(self, user_id: str) -> Optional[ProfileResponse]:
        """Get complete profile for a user"""
        stmt = (
            select(Profile)
            .options(
                selectinload(Profile.work_experiences),
                selectinload(Profile.education_records),
                selectinload(Profile.certifications),
                selectinload(Profile.skills),
                selectinload(Profile.user)
            )
            .where(Profile.user_id == user_id)
        )
        
        profile = self.db.execute(stmt).scalar_one_or_none()
        if not profile:
            return None
        
        # Create response with user data included
        profile_dict = {
            "id": profile.id,
            "user_id": profile.user_id,
            "phone": profile.phone,
            "location_city": profile.location_city,
            "location_country": profile.location_country,
            "linkedin_url": profile.linkedin_url,
            "github_url": profile.github_url,
            "portfolio_url": profile.portfolio_url,
            "professional_headline": profile.professional_headline,
            "professional_summary": profile.professional_summary,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at,
            "user_name": profile.user.name if profile.user else None,
            "user_email": profile.user.email if profile.user else None,
            "user_picture": profile.user.picture if profile.user else None,
            "work_experiences": profile.work_experiences,
            "education_records": profile.education_records,
            "certifications": profile.certifications,
            "skills": profile.skills
        }
        
        return ProfileResponse.model_validate(profile_dict)
    
    def create_profile(self, user_id: str, profile_data: dict) -> ProfileResponse:
        """Create a new profile for a user - handles both user and profile table updates"""
        from app.models.user import User
        import time
        
        max_retries = 3
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            try:
                # Check if profile already exists
                existing = self.get_profile_by_user_id(user_id)
                if existing:
                    raise HTTPException(status_code=400, detail="Profile already exists for this user")
                
                # Get user to update user fields if provided
                user = self.db.execute(
                    select(User).where(User.id == user_id)
                ).scalar_one_or_none()
                
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")
                
                # Update user table fields if provided
                user_fields = {'name', 'email', 'picture'}
                for field, value in profile_data.items():
                    if field in user_fields and hasattr(user, field) and value is not None:
                        setattr(user, field, value)
                        user.updated_at = datetime.utcnow()
                
                # Create profile with profile fields
                profile = Profile(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    phone=profile_data.get("phone"),
                    location_city=profile_data.get("location_city"),
                    location_country=profile_data.get("location_country"),
                    linkedin_url=profile_data.get("linkedin_url"),
                    github_url=profile_data.get("github_url"),
                    portfolio_url=profile_data.get("portfolio_url"),
                    professional_headline=profile_data.get("professional_headline"),
                    professional_summary=profile_data.get("professional_summary")
                )
                
                self.db.add(profile)
                self.db.commit()
                self.db.refresh(user)
                self.db.refresh(profile)
                
                # Return profile with user data included
                return self.get_profile_by_user_id(user_id)
                
            except Exception as e:
                if "database is locked" in str(e).lower() and attempt < max_retries - 1:
                    # Database is locked, wait and retry
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    self.db.rollback()  # Rollback the failed transaction
                    continue
                else:
                    # Re-raise the exception if it's not a lock issue or we've exhausted retries
                    self.db.rollback()  # Rollback on error
                    raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        # This should never be reached, but just in case
        raise HTTPException(status_code=500, detail="Failed to create profile after multiple attempts")
    
    def update_profile(self, user_id: str, profile_data: dict) -> ProfileResponse:
        """Update profile information - handles both user and profile table updates"""
        from app.models.user import User
        import time
        
        max_retries = 3
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            try:
                # Get both user and profile
                user = self.db.execute(
                    select(User).where(User.id == user_id)
                ).scalar_one_or_none()
                
                profile = self.db.execute(
                    select(Profile).where(Profile.user_id == user_id)
                ).scalar_one_or_none()
                
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")
                if not profile:
                    raise HTTPException(status_code=404, detail="Profile not found")
                
                # Separate user fields from profile fields
                user_fields = {'name', 'email', 'picture'}
                profile_fields = {
                    'phone', 'location_city', 'location_country', 'linkedin_url', 
                    'github_url', 'portfolio_url', 'professional_headline', 'professional_summary'
                }
                
                # Update user table fields
                for field, value in profile_data.items():
                    if field in user_fields and hasattr(user, field):
                        setattr(user, field, value)
                        user.updated_at = datetime.utcnow()
                
                # Update profile table fields
                for field, value in profile_data.items():
                    if field in profile_fields and hasattr(profile, field):
                        setattr(profile, field, value)
                        profile.updated_at = datetime.utcnow()
                
                self.db.commit()
                self.db.refresh(user)
                self.db.refresh(profile)
                
                # Return profile with updated user data included
                return self.get_profile_by_user_id(user_id)
                
            except Exception as e:
                if "database is locked" in str(e).lower() and attempt < max_retries - 1:
                    # Database is locked, wait and retry
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    self.db.rollback()  # Rollback the failed transaction
                    continue
                else:
                    # Re-raise the exception if it's not a lock issue or we've exhausted retries
                    self.db.rollback()  # Rollback on error
                    raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        # This should never be reached, but just in case
        raise HTTPException(status_code=500, detail="Failed to update profile after multiple attempts")
    
    # Work Experience Management
    def add_work_experience(self, user_id: str, experience_data: dict) -> WorkExperienceResponse:
        """Add a work experience to the profile"""
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        experience = WorkExperience(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            job_title=experience_data["job_title"],
            company=experience_data["company"],
            location=experience_data.get("location"),
            start_date=experience_data["start_date"],
            end_date=experience_data.get("end_date"),
            is_current=experience_data.get("is_current", False),
            master_description=experience_data["master_description"]
        )
        
        self.db.add(experience)
        self.db.commit()
        self.db.refresh(experience)
        
        return WorkExperienceResponse.model_validate(experience)
    
    def update_work_experience(self, user_id: str, experience_id: str, experience_data: dict) -> WorkExperienceResponse:
        """Update a work experience"""
        # Verify ownership through profile
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        experience = self.db.execute(
            select(WorkExperience)
            .where(WorkExperience.id == experience_id)
            .where(WorkExperience.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not experience:
            raise HTTPException(status_code=404, detail="Work experience not found")
        
        # Update fields
        for field, value in experience_data.items():
            if hasattr(experience, field):
                setattr(experience, field, value)
        
        experience.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(experience)
        
        return WorkExperienceResponse.model_validate(experience)
    
    def delete_work_experience(self, user_id: str, experience_id: str) -> bool:
        """Delete a work experience"""
        # Verify ownership through profile
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        experience = self.db.execute(
            select(WorkExperience)
            .where(WorkExperience.id == experience_id)
            .where(WorkExperience.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not experience:
            raise HTTPException(status_code=404, detail="Work experience not found")
        
        self.db.delete(experience)
        self.db.commit()
        return True
    
    # Education Management
    def add_education(self, user_id: str, education_data: dict) -> EducationRecordResponse:
        """Add an education record to the profile"""
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        education = EducationRecord(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            school_university=education_data["school_university"],
            degree=education_data["degree"],
            field_of_study=education_data["field_of_study"],
            location=education_data.get("location"),
            start_date=education_data.get("start_date"),
            end_date=education_data.get("end_date"),
            is_current=education_data.get("is_current", False),
            gpa=education_data.get("gpa"),
            honors=education_data.get("honors")
        )
        
        self.db.add(education)
        self.db.commit()
        self.db.refresh(education)
        
        return EducationRecordResponse.model_validate(education)
    
    def update_education(self, user_id: str, education_id: str, education_data: dict) -> EducationRecordResponse:
        """Update an education record"""
        # Verify ownership through profile
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        education = self.db.execute(
            select(EducationRecord)
            .where(EducationRecord.id == education_id)
            .where(EducationRecord.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not education:
            raise HTTPException(status_code=404, detail="Education record not found")
        
        # Update fields
        for field, value in education_data.items():
            if hasattr(education, field):
                setattr(education, field, value)
        
        education.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(education)
        
        return EducationRecordResponse.model_validate(education)
    
    def delete_education(self, user_id: str, education_id: str) -> bool:
        """Delete an education record"""
        # Verify ownership through profile
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        education = self.db.execute(
            select(EducationRecord)
            .where(EducationRecord.id == education_id)
            .where(EducationRecord.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not education:
            raise HTTPException(status_code=404, detail="Education record not found")
        
        self.db.delete(education)
        self.db.commit()
        return True
    
    # Certification Management
    def add_certification(self, user_id: str, certification_data: dict) -> CertificationResponse:
        """Add a certification to the profile"""
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        certification = Certification(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            name=certification_data["name"],
            issuing_body=certification_data["issuing_body"],
            credential_id=certification_data.get("credential_id"),
            credential_url=certification_data.get("credential_url"),
            issue_date=certification_data.get("issue_date"),
            expiration_date=certification_data.get("expiration_date"),
            does_not_expire=certification_data.get("does_not_expire", False)
        )
        
        self.db.add(certification)
        self.db.commit()
        self.db.refresh(certification)
        
        return CertificationResponse.model_validate(certification)
    
    def update_certification(self, user_id: str, certification_id: str, certification_data: dict) -> CertificationResponse:
        """Update a certification"""
        # Verify ownership through profile
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        certification = self.db.execute(
            select(Certification)
            .where(Certification.id == certification_id)
            .where(Certification.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not certification:
            raise HTTPException(status_code=404, detail="Certification not found")
        
        # Update fields
        for field, value in certification_data.items():
            if hasattr(certification, field):
                setattr(certification, field, value)
        
        certification.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(certification)
        
        return CertificationResponse.model_validate(certification)
    
    def delete_certification(self, user_id: str, certification_id: str) -> bool:
        """Delete a certification"""
        # Verify ownership through profile
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        certification = self.db.execute(
            select(Certification)
            .where(Certification.id == certification_id)
            .where(Certification.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not certification:
            raise HTTPException(status_code=404, detail="Certification not found")
        
        self.db.delete(certification)
        self.db.commit()
        return True
    
    # Skills Management
    def add_skill(self, user_id: str, skill_data: dict) -> ProfileSkillResponse:
        """Add a skill to the profile"""
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        skill = ProfileSkill(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            skill_name=skill_data["skill_name"],
            proficiency_level=skill_data.get("proficiency_level", "Intermediate"),
            years_of_experience=skill_data.get("years_of_experience")
        )
        
        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)
        
        return ProfileSkillResponse.model_validate(skill)
    
    def update_skill(self, user_id: str, skill_id: str, skill_data: dict) -> ProfileSkillResponse:
        """Update a skill"""
        # Verify ownership through profile
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        skill = self.db.execute(
            select(ProfileSkill)
            .where(ProfileSkill.id == skill_id)
            .where(ProfileSkill.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        # Update fields
        for field, value in skill_data.items():
            if hasattr(skill, field):
                setattr(skill, field, value)
        
        skill.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(skill)
        
        return ProfileSkillResponse.model_validate(skill)
    
    def delete_skill(self, user_id: str, skill_id: str) -> bool:
        """Delete a skill"""
        # Verify ownership through profile
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        skill = self.db.execute(
            select(ProfileSkill)
            .where(ProfileSkill.id == skill_id)
            .where(ProfileSkill.profile_id == profile.id)
        ).scalar_one_or_none()
        
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        
        self.db.delete(skill)
        self.db.commit()
        return True
