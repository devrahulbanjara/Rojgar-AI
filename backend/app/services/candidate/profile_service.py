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
from app.db.repositories.candidate_repo import CandidateProfileRepository
from app.db.repositories.user_repo import UserRepository
from app.schemas import CandidateProfileUpdate


class ProfileService:
    def __init__(
        self,
        candidate_profile_repo: CandidateProfileRepository,
        user_repo: UserRepository,
    ):
        self.candidate_profile_repo = candidate_profile_repo
        self.user_repo = user_repo

    async def get_full_profile(self, user: User) -> CandidateProfile | None:
        """Get full candidate profile with all related data"""
        return await self.candidate_profile_repo.get_full_profile(user.user_id)

    async def sync_profile(
        self, user: User, data: CandidateProfileUpdate
    ) -> CandidateProfile | None:
        """
        Master sync endpoint: updates basic info and synchronizes all nested
        collections (experience, education, skills, certifications, social links)
        in a single ACID transaction via SQLAlchemy's Unit of Work.
        """
        profile = await self.get_full_profile(user)
        if not profile:
            return None

        update_data = data.model_dump(exclude_unset=True)

        # 1. Update User name if provided
        if "full_name" in update_data:
            new_name = update_data.pop("full_name")
            await self.user_repo.update(user.user_id, name=new_name)

        # 2. Sync helper — diffs incoming list against existing collection
        def _sync_collection(existing_collection, incoming_data, model_class, id_field):
            if incoming_data is None:
                return

            existing_map = {
                getattr(item, id_field): item for item in existing_collection
            }
            incoming_ids = {
                item[id_field] for item in incoming_data if item.get(id_field)
            }

            # A. Remove items not present in incoming payload
            items_to_remove = [
                item
                for item in existing_collection
                if getattr(item, id_field) not in incoming_ids
            ]
            for item in items_to_remove:
                existing_collection.remove(item)

            # B. Update existing or create new
            for item_data in incoming_data:
                item_id = item_data.pop(id_field, None)
                if item_id and item_id in existing_map:
                    # Update existing item
                    existing_obj = existing_map[item_id]
                    for k, v in item_data.items():
                        setattr(existing_obj, k, v)
                else:
                    # Create new item
                    item_data["profile_id"] = profile.profile_id
                    item_data[id_field] = uuid.uuid4()
                    existing_collection.append(model_class(**item_data))

        # 3. Apply sync to each nested collection
        if "work_experiences" in update_data:
            _sync_collection(
                profile.work_experiences,
                update_data.pop("work_experiences"),
                CandidateWorkExperience,
                "candidate_work_experience_id",
            )

        if "educations" in update_data:
            _sync_collection(
                profile.educations,
                update_data.pop("educations"),
                CandidateEducation,
                "candidate_education_id",
            )

        if "certifications" in update_data:
            _sync_collection(
                profile.certifications,
                update_data.pop("certifications"),
                CandidateCertification,
                "candidate_certification_id",
            )

        if "skills" in update_data:
            _sync_collection(
                profile.skills,
                update_data.pop("skills"),
                CandidateSkills,
                "candidate_skill_id",
            )

        if "social_links" in update_data:
            _sync_collection(
                profile.social_links,
                update_data.pop("social_links"),
                CandidateSocialLink,
                "social_link_id",
            )

        # 4. Update top-level scalar fields (phone, headline, etc.)
        for key, value in update_data.items():
            setattr(profile, key, value)

        # 5. Flush — SQLAlchemy emits minimal INSERT/UPDATE/DELETE in one transaction
        await self.candidate_profile_repo.db.flush()

        return profile
