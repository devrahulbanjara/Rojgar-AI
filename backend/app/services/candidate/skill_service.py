import uuid

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models import Skill
from app.schemas import SkillCreateRequest, SkillResponse, SkillsListResponse


class SkillService:
    """
    Service for managing user skills.
    Handles CRUD operations for user skills.
    """

    def __init__(self, db: Session):
        """
        Initialize the SkillService.

        Args:
            db: Database session
        """
        self.db = db

    def create_skill(
        self, user_id: str, skill_data: SkillCreateRequest
    ) -> SkillResponse:
        """
        Add a new skill for a user.

        Args:
            user_id: The ID of the user
            skill_data: The skill data (name, etc.)

        Returns:
            The created Skill object formatted as a response
        """
        skill = Skill(id=str(uuid.uuid4()), user_id=user_id, skill=skill_data.skill)

        self.db.add(skill)
        self.db.flush()
        self.db.refresh(skill)

        return SkillResponse.model_validate(skill)

    def get_user_skills(self, user_id: str) -> SkillsListResponse:
        """
        Get all skills for a specific user.

        Args:
            user_id: The ID of the user

        Returns:
            List of skills and the total count
        """
        skills = self.db.query(Skill).filter(Skill.user_id == user_id).all()

        skill_responses = [SkillResponse.model_validate(skill) for skill in skills]

        return SkillsListResponse(skills=skill_responses, total=len(skill_responses))

    def get_skill_by_id(self, skill_id: str, user_id: str) -> SkillResponse | None:
        """
        Get a specific skill by its ID.

        Args:
            skill_id: The ID of the skill
            user_id: The ID of the user (for ownership verification)

        Returns:
            Skill response object if found, None otherwise
        """
        skill = (
            self.db.query(Skill)
            .filter(and_(Skill.id == skill_id, Skill.user_id == user_id))
            .first()
        )

        if not skill:
            return None

        return SkillResponse.model_validate(skill)

    def delete_skill(self, skill_id: str, user_id: str) -> bool:
        """
        Delete a specific skill.

        Args:
            skill_id: The ID of the skill to delete
            user_id: The ID of the user (for ownership verification)

        Returns:
            True if deleted successfully, False otherwise
        """
        skill = (
            self.db.query(Skill)
            .filter(and_(Skill.id == skill_id, Skill.user_id == user_id))
            .first()
        )

        if not skill:
            return False

        self.db.delete(skill)
        self.db.flush()

        return True

    def delete_all_user_skills(self, user_id: str) -> int:
        """
        Delete all skills for a specific user.

        Args:
            user_id: The ID of the user

        Returns:
            Number of deleted skills
        """
        deleted_count = self.db.query(Skill).filter(Skill.user_id == user_id).delete()
        self.db.flush()

        return deleted_count
