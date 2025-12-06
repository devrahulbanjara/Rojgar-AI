import uuid
from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Certification,
    EducationRecord,
    Profile,
    ProfileSkill,
    WorkExperience,
)
from app.schemas import (
    CertificationResponse,
    EducationRecordResponse,
    ProfileResponse,
    ProfileSkillResponse,
    WorkExperienceResponse,
)


class ProfileService:
    def __init__(self, db: Session):
        self.db = db

    def get_profile_by_user_id(self, user_id: str) -> ProfileResponse | None:
        stmt = (
            select(Profile)
            .options(
                selectinload(Profile.work_experiences),
                selectinload(Profile.education_records),
                selectinload(Profile.certifications),
                selectinload(Profile.skills),
                selectinload(Profile.user),
            )
            .where(Profile.user_id == user_id)
        )

        profile = self.db.execute(stmt).scalar_one_or_none()
        if not profile:
            return None

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
            "skills": profile.skills,
        }

        return ProfileResponse.model_validate(profile_dict)

    def _update_user_and_profile_fields(
        self, user_id: str, profile_data: dict, create_profile: bool = False
    ) -> None:
        import time

        from app.models import User

        max_retries = 3
        retry_delay = 0.1

        for attempt in range(max_retries):
            try:
                user = self.db.execute(
                    select(User).where(User.id == user_id)
                ).scalar_one_or_none()

                if not user:
                    raise HTTPException(status_code=404, detail="User not found")

                profile = None
                if not create_profile:
                    profile = self.db.execute(
                        select(Profile).where(Profile.user_id == user_id)
                    ).scalar_one_or_none()

                    if not profile:
                        raise HTTPException(status_code=404, detail="Profile not found")

                user_fields = {"name", "email", "picture"}
                profile_fields = {
                    "phone",
                    "location_city",
                    "location_country",
                    "linkedin_url",
                    "github_url",
                    "portfolio_url",
                    "professional_headline",
                    "professional_summary",
                }

                for field, value in profile_data.items():
                    if (
                        field in user_fields
                        and hasattr(user, field)
                        and value is not None
                    ):
                        setattr(user, field, value)
                        user.updated_at = datetime.now(UTC)

                if create_profile:
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
                        professional_summary=profile_data.get("professional_summary"),
                    )
                    self.db.add(profile)
                else:
                    for field, value in profile_data.items():
                        if (
                            field in profile_fields
                            and hasattr(profile, field)
                            and value is not None
                        ):
                            setattr(profile, field, value)
                            profile.updated_at = datetime.now(UTC)

                self.db.commit()
                self.db.refresh(user)
                if profile:
                    self.db.refresh(profile)

                return

            except Exception as e:
                if "database is locked" in str(e).lower() and attempt < max_retries - 1:
                    time.sleep(retry_delay * (2**attempt))
                    self.db.rollback()
                    continue
                else:
                    self.db.rollback()
                    raise HTTPException(
                        status_code=500, detail=f"Database error: {str(e)}"
                    )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to {'create' if create_profile else 'update'} profile after multiple attempts",
        )

    def create_profile(self, user_id: str, profile_data: dict) -> ProfileResponse:
        existing = self.get_profile_by_user_id(user_id)
        if existing:
            raise HTTPException(
                status_code=400, detail="Profile already exists for this user"
            )

        self._update_user_and_profile_fields(user_id, profile_data, create_profile=True)

        return self.get_profile_by_user_id(user_id)

    def update_profile(self, user_id: str, profile_data: dict) -> ProfileResponse:
        self._update_user_and_profile_fields(
            user_id, profile_data, create_profile=False
        )

        return self.get_profile_by_user_id(user_id)

    def add_work_experience(
        self, user_id: str, experience_data: dict
    ) -> WorkExperienceResponse:
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()

        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        start_date = None
        if experience_data.get("start_date"):
            start_date = datetime.strptime(
                experience_data["start_date"], "%Y-%m-%d"
            ).date()

        end_date = None
        if experience_data.get("end_date"):
            end_date = datetime.strptime(experience_data["end_date"], "%Y-%m-%d").date()

        experience = WorkExperience(
            id=str(uuid.uuid4()),
            profile_id=profile.id,
            job_title=experience_data["job_title"],
            company=experience_data["company"],
            location=experience_data.get("location"),
            start_date=start_date,
            end_date=end_date,
            is_current=experience_data.get("is_current", False),
            master_description=experience_data["master_description"],
        )

        self.db.add(experience)
        self.db.commit()
        self.db.refresh(experience)

        return WorkExperienceResponse.model_validate(experience)

    def update_work_experience(
        self, user_id: str, experience_id: str, experience_data: dict
    ) -> WorkExperienceResponse:
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

        for field, value in experience_data.items():
            if hasattr(experience, field):
                if field in ["start_date", "end_date"] and value:
                    value = datetime.strptime(value, "%Y-%m-%d").date()
                setattr(experience, field, value)

        experience.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(experience)

        return WorkExperienceResponse.model_validate(experience)

    def delete_work_experience(self, user_id: str, experience_id: str) -> bool:
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

    def add_education(
        self, user_id: str, education_data: dict
    ) -> EducationRecordResponse:
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
            honors=education_data.get("honors"),
        )

        self.db.add(education)
        self.db.commit()
        self.db.refresh(education)

        return EducationRecordResponse.model_validate(education)

    def update_education(
        self, user_id: str, education_id: str, education_data: dict
    ) -> EducationRecordResponse:
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

        for field, value in education_data.items():
            if hasattr(education, field):
                setattr(education, field, value)

        education.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(education)

        return EducationRecordResponse.model_validate(education)

    def delete_education(self, user_id: str, education_id: str) -> bool:
        """Delete an education record"""
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

    def add_certification(
        self, user_id: str, certification_data: dict
    ) -> CertificationResponse:
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
            does_not_expire=certification_data.get("does_not_expire", False),
        )

        self.db.add(certification)
        self.db.commit()
        self.db.refresh(certification)

        return CertificationResponse.model_validate(certification)

    def update_certification(
        self, user_id: str, certification_id: str, certification_data: dict
    ) -> CertificationResponse:
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

        for field, value in certification_data.items():
            if hasattr(certification, field):
                setattr(certification, field, value)

        certification.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(certification)

        return CertificationResponse.model_validate(certification)

    def delete_certification(self, user_id: str, certification_id: str) -> bool:
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

    def add_skill(self, user_id: str, skill_data: dict) -> ProfileSkillResponse:
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
            years_of_experience=skill_data.get("years_of_experience"),
        )

        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)

        return ProfileSkillResponse.model_validate(skill)

    def update_skill(
        self, user_id: str, skill_id: str, skill_data: dict
    ) -> ProfileSkillResponse:
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

        for field, value in skill_data.items():
            if hasattr(skill, field):
                setattr(skill, field, value)

        skill.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(skill)

        return ProfileSkillResponse.model_validate(skill)

    def delete_skill(self, user_id: str, skill_id: str) -> bool:
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

    def get_profile_data_for_autofill(self, user_id: str) -> dict:
        profile = self.db.execute(
            select(Profile)
            .options(
                selectinload(Profile.user),
                selectinload(Profile.work_experiences),
                selectinload(Profile.education_records),
                selectinload(Profile.certifications),
                selectinload(Profile.skills),
            )
            .where(Profile.user_id == user_id)
        ).scalar_one_or_none()

        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        location = self._format_location(
            profile.location_city, profile.location_country
        )

        work_experiences = []
        for exp in profile.work_experiences:
            work_experiences.append(
                {
                    "id": exp.id,
                    "job_title": exp.job_title,
                    "company": exp.company,
                    "location": exp.location,
                    "start_date": (
                        exp.start_date.isoformat() if exp.start_date else None
                    ),
                    "end_date": exp.end_date.isoformat() if exp.end_date else None,
                    "is_current": exp.is_current,
                    "master_description": exp.master_description,
                }
            )

        education_records = []
        for edu in profile.education_records:
            education_records.append(
                {
                    "id": edu.id,
                    "school_university": edu.school_university,
                    "degree": edu.degree,
                    "field_of_study": edu.field_of_study,
                    "location": edu.location,
                    "start_date": (
                        edu.start_date.isoformat() if edu.start_date else None
                    ),
                    "end_date": edu.end_date.isoformat() if edu.end_date else None,
                    "is_current": edu.is_current,
                    "gpa": edu.gpa,
                    "honors": edu.honors,
                }
            )

        certifications = []
        for cert in profile.certifications:
            certifications.append(
                {
                    "id": cert.id,
                    "name": cert.name,
                    "issuing_body": cert.issuing_body,
                    "credential_id": cert.credential_id,
                    "credential_url": cert.credential_url,
                    "issue_date": (
                        cert.issue_date.isoformat() if cert.issue_date else None
                    ),
                    "expiration_date": (
                        cert.expiration_date.isoformat()
                        if cert.expiration_date
                        else None
                    ),
                    "does_not_expire": cert.does_not_expire,
                }
            )

        skills = []
        for skill in profile.skills:
            skills.append(
                {
                    "id": skill.id,
                    "skill_name": skill.skill_name,
                    "proficiency_level": skill.proficiency_level,
                    "years_of_experience": skill.years_of_experience,
                }
            )

        return {
            "contact_full_name": profile.user.name if profile.user else None,
            "contact_email": profile.user.email if profile.user else None,
            "contact_phone": profile.phone,
            "contact_location": location,
            "professional_summary": profile.professional_summary,
            "linkedin_url": profile.linkedin_url,
            "github_url": profile.github_url,
            "portfolio_url": profile.portfolio_url,
            "work_experiences": work_experiences,
            "education_records": education_records,
            "certifications": certifications,
            "skills": skills,
        }

    def _format_location(self, city: str | None, country: str | None) -> str | None:
        if not city and not country:
            return None
        if city and country:
            return f"{city}, {country}"
        return city or country
