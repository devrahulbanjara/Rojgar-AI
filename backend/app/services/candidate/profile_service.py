import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.candidate import (
    CandidateCertification,
    CandidateEducation,
    CandidateProfile,
    CandidateSkills,
    CandidateWorkExperience,
)
from app.schemas.candidate import CandidateProfileUpdate


class CandidateService:
    @staticmethod
    def get_full_profile(db: Session, user_id: str):
        stmt = (
            select(CandidateProfile)
            .where(CandidateProfile.user_id == user_id)
            .options(
                selectinload(CandidateProfile.user),
                selectinload(CandidateProfile.work_experiences),
                selectinload(CandidateProfile.educations),
                selectinload(CandidateProfile.certifications),
                selectinload(CandidateProfile.social_links),
                selectinload(CandidateProfile.skills),
            )
        )
        profile = db.execute(stmt).scalar_one_or_none()

        if not profile:
            raise HTTPException(status_code=404, detail="Candidate profile not found")

        return profile

    @staticmethod
    def update_basic_info(db: Session, user_id: str, data: CandidateProfileUpdate):
        profile = CandidateService.get_full_profile(db, user_id)

        update_data = data.model_dump(exclude_unset=True)

        if "full_name" in update_data:
            new_name = update_data.pop("full_name")
            if profile.user:
                profile.user.name = new_name

        for key, value in update_data.items():
            setattr(profile, key, value)

        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def _add_item(db: Session, user_id: str, ModelClass, data_dict, id_field_name):
        stmt = select(CandidateProfile.profile_id).where(
            CandidateProfile.user_id == user_id
        )
        profile_id = db.execute(stmt).scalar_one_or_none()
        if not profile_id:
            raise HTTPException(status_code=404, detail="Profile not found")

        new_id = str(uuid.uuid4())
        item_data = {id_field_name: new_id, "profile_id": profile_id, **data_dict}
        new_item = ModelClass(**item_data)

        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

    @staticmethod
    def _delete_item(db: Session, user_id: str, ModelClass, item_id, id_field_name):
        stmt = (
            select(ModelClass)
            .join(CandidateProfile)
            .where(ModelClass.__table__.c[id_field_name] == item_id)
            .where(CandidateProfile.user_id == user_id)
        )
        item = db.execute(stmt).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        db.delete(item)
        db.commit()

    @staticmethod
    def _update_item(
        db: Session, user_id: str, ModelClass, item_id, id_field_name, data_obj
    ):
        stmt = (
            select(ModelClass)
            .join(CandidateProfile)
            .where(ModelClass.__table__.c[id_field_name] == item_id)
            .where(CandidateProfile.user_id == user_id)
        )
        item = db.execute(stmt).scalar_one_or_none()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        update_data = data_obj.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def add_experience(db: Session, user_id: str, data):
        return CandidateService._add_item(
            db,
            user_id,
            CandidateWorkExperience,
            data.model_dump(),
            "candidate_work_experience_id",
        )

    @staticmethod
    def delete_experience(db: Session, user_id: str, item_id: str):
        CandidateService._delete_item(
            db,
            user_id,
            CandidateWorkExperience,
            item_id,
            "candidate_work_experience_id",
        )

    @staticmethod
    def update_experience(db: Session, user_id: str, item_id: str, data):
        return CandidateService._update_item(
            db,
            user_id,
            CandidateWorkExperience,
            item_id,
            "candidate_work_experience_id",
            data,
        )

    @staticmethod
    def add_education(db: Session, user_id: str, data):
        return CandidateService._add_item(
            db, user_id, CandidateEducation, data.model_dump(), "candidate_education_id"
        )

    @staticmethod
    def delete_education(db: Session, user_id: str, item_id: str):
        CandidateService._delete_item(
            db, user_id, CandidateEducation, item_id, "candidate_education_id"
        )

    @staticmethod
    def update_education(db: Session, user_id: str, item_id: str, data):
        return CandidateService._update_item(
            db, user_id, CandidateEducation, item_id, "candidate_education_id", data
        )

    @staticmethod
    def add_skill(db: Session, user_id: str, data):
        return CandidateService._add_item(
            db, user_id, CandidateSkills, data.model_dump(), "candidate_skill_id"
        )

    @staticmethod
    def delete_skill(db: Session, user_id: str, item_id: str):
        CandidateService._delete_item(
            db, user_id, CandidateSkills, item_id, "candidate_skill_id"
        )

    @staticmethod
    def update_skill(db: Session, user_id: str, item_id: str, data):
        return CandidateService._update_item(
            db, user_id, CandidateSkills, item_id, "candidate_skill_id", data
        )

    @staticmethod
    def add_certification(db: Session, user_id: str, data):
        return CandidateService._add_item(
            db,
            user_id,
            CandidateCertification,
            data.model_dump(),
            "candidate_certification_id",
        )

    @staticmethod
    def delete_certification(db: Session, user_id: str, item_id: str):
        CandidateService._delete_item(
            db, user_id, CandidateCertification, item_id, "candidate_certification_id"
        )

    @staticmethod
    def update_certification(db: Session, user_id: str, item_id: str, data):
        return CandidateService._update_item(
            db,
            user_id,
            CandidateCertification,
            item_id,
            "candidate_certification_id",
            data,
        )
