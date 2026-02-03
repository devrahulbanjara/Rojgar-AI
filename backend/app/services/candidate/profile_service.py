import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import NotFoundError
from app.models.candidate import (
    CandidateCertification,
    CandidateEducation,
    CandidateProfile,
    CandidateSkills,
    CandidateSocialLink,
    CandidateWorkExperience,
)
from app.models.user import User
from app.schemas import CandidateProfileUpdate


class CandidateService:
    @staticmethod
    async def get_full_profile(db: AsyncSession, user: User):
        stmt = (
            select(CandidateProfile)
            .where(CandidateProfile.user_id == user.user_id)
            .options(
                selectinload(CandidateProfile.user),
                selectinload(CandidateProfile.work_experiences),
                selectinload(CandidateProfile.educations),
                selectinload(CandidateProfile.certifications),
                selectinload(CandidateProfile.social_links),
                selectinload(CandidateProfile.skills),
            )
        )
        result = await db.execute(stmt)
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundError(
                message="Candidate profile not found",
                details={
                    "user_id": str(user.user_id),
                },
                user_id=user.user_id,
            )
        return profile

    @staticmethod
    async def update_basic_info(
        db: AsyncSession, user: User, data: CandidateProfileUpdate
    ):
        profile = await CandidateService.get_full_profile(db, user)
        update_data = data.model_dump(exclude_unset=True)
        if "full_name" in update_data:
            new_name = update_data.pop("full_name")
            if profile.user:
                profile.user.name = new_name
        for key, value in update_data.items():
            setattr(profile, key, value)
        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def _get_profile_id(db: AsyncSession, user: User):
        stmt = select(CandidateProfile.profile_id).where(
            CandidateProfile.user_id == user.user_id
        )
        result = await db.execute(stmt)
        profile_id = result.scalar_one_or_none()
        if not profile_id:
            raise NotFoundError(
                message="Profile not found",
                details={
                    "user_id": str(user.user_id),
                },
                user_id=user.user_id,
            )
        return profile_id

    @staticmethod
    async def _add_item(
        db: AsyncSession, user: User, ModelClass, data_dict, id_field_name
    ):
        profile_id = await CandidateService._get_profile_id(db, user)
        new_id = uuid.uuid4()
        item_data = {id_field_name: new_id, "profile_id": profile_id, **data_dict}
        new_item = ModelClass(**item_data)
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        return new_item

    @staticmethod
    async def _delete_item(
        db: AsyncSession, user: User, ModelClass, item_id, id_field_name
    ):
        stmt = (
            select(ModelClass)
            .join(CandidateProfile)
            .where(ModelClass.__table__.c[id_field_name] == item_id)
            .where(CandidateProfile.user_id == user.user_id)
        )
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundError(
                message="Item not found",
                details={
                    "item_id": str(item_id),
                    "user_id": str(user.user_id),
                    "item_type": ModelClass.__name__,
                },
                user_id=user.user_id,
            )
        db.delete(item)
        await db.commit()

    @staticmethod
    async def _update_item(
        db: AsyncSession, user: User, ModelClass, item_id, id_field_name, data_obj
    ):
        stmt = (
            select(ModelClass)
            .join(CandidateProfile)
            .where(ModelClass.__table__.c[id_field_name] == item_id)
            .where(CandidateProfile.user_id == user.user_id)
        )
        result = await db.execute(stmt)
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundError(
                message="Item not found",
                details={
                    "item_id": str(item_id),
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
    async def add_experience(db: AsyncSession, user: User, data):
        return CandidateService._add_item(
            db,
            user,
            CandidateWorkExperience,
            data.model_dump(),
            "candidate_work_experience_id",
        )

    @staticmethod
    async def delete_experience(db: AsyncSession, user: User, item_id: uuid.UUID):
        await CandidateService._delete_item(
            db, user, CandidateWorkExperience, item_id, "candidate_work_experience_id"
        )

    @staticmethod
    async def update_experience(db: AsyncSession, user: User, item_id: uuid.UUID, data):
        return await CandidateService._update_item(
            db,
            user,
            CandidateWorkExperience,
            item_id,
            "candidate_work_experience_id",
            data,
        )

    @staticmethod
    async def add_education(db: AsyncSession, user: User, data):
        return CandidateService._add_item(
            db, user, CandidateEducation, data.model_dump(), "candidate_education_id"
        )

    @staticmethod
    async def delete_education(db: AsyncSession, user: User, item_id: uuid.UUID):
        await CandidateService._delete_item(
            db, user, CandidateEducation, item_id, "candidate_education_id"
        )

    @staticmethod
    async def update_education(db: AsyncSession, user: User, item_id: uuid.UUID, data):
        return await CandidateService._update_item(
            db, user, CandidateEducation, item_id, "candidate_education_id", data
        )

    @staticmethod
    async def add_skill(db: AsyncSession, user: User, data):
        return CandidateService._add_item(
            db, user, CandidateSkills, data.model_dump(), "candidate_skill_id"
        )

    @staticmethod
    async def delete_skill(db: AsyncSession, user: User, item_id: uuid.UUID):
        await CandidateService._delete_item(
            db, user, CandidateSkills, item_id, "candidate_skill_id"
        )

    @staticmethod
    async def update_skill(db: AsyncSession, user: User, item_id: uuid.UUID, data):
        return await CandidateService._update_item(
            db, user, CandidateSkills, item_id, "candidate_skill_id", data
        )

    @staticmethod
    async def add_certification(db: AsyncSession, user: User, data):
        return CandidateService._add_item(
            db,
            user,
            CandidateCertification,
            data.model_dump(),
            "candidate_certification_id",
        )

    @staticmethod
    async def delete_certification(db: AsyncSession, user: User, item_id: uuid.UUID):
        await CandidateService._delete_item(
            db, user, CandidateCertification, item_id, "candidate_certification_id"
        )

    @staticmethod
    async def update_certification(
        db: AsyncSession, user: User, item_id: uuid.UUID, data
    ):
        return await CandidateService._update_item(
            db,
            user,
            CandidateCertification,
            item_id,
            "candidate_certification_id",
            data,
        )

    @staticmethod
    async def add_social_link(db: AsyncSession, user: User, data):
        return CandidateService._add_item(
            db, user, CandidateSocialLink, data.model_dump(), "social_link_id"
        )

    @staticmethod
    async def delete_social_link(db: AsyncSession, user: User, item_id: uuid.UUID):
        await CandidateService._delete_item(
            db, user, CandidateSocialLink, item_id, "social_link_id"
        )

    @staticmethod
    async def update_social_link(
        db: AsyncSession, user: User, item_id: uuid.UUID, data
    ):
        return await CandidateService._update_item(
            db, user, CandidateSocialLink, item_id, "social_link_id", data
        )
