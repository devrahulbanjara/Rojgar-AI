from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.skill import Skill
from app.schemas.skill import SkillCreateRequest, SkillResponse, SkillsListResponse
import uuid


class SkillService:

    def __init__(self, db: Session):
        self.db = db

    def create_skill(
        self, user_id: str, skill_data: SkillCreateRequest
    ) -> SkillResponse:
        skill = Skill(id=str(uuid.uuid4()), user_id=user_id, skill=skill_data.skill)

        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)

        return SkillResponse.model_validate(skill)

    def get_user_skills(self, user_id: str) -> SkillsListResponse:
        skills = self.db.query(Skill).filter(Skill.user_id == user_id).all()

        skill_responses = [SkillResponse.model_validate(skill) for skill in skills]

        return SkillsListResponse(skills=skill_responses, total=len(skill_responses))

    def get_skill_by_id(self, skill_id: str, user_id: str) -> Optional[SkillResponse]:
        skill = (
            self.db.query(Skill)
            .filter(and_(Skill.id == skill_id, Skill.user_id == user_id))
            .first()
        )

        if not skill:
            return None

        return SkillResponse.model_validate(skill)

    def delete_skill(self, skill_id: str, user_id: str) -> bool:
        skill = (
            self.db.query(Skill)
            .filter(and_(Skill.id == skill_id, Skill.user_id == user_id))
            .first()
        )

        if not skill:
            return False

        self.db.delete(skill)
        self.db.commit()

        return True

    def delete_all_user_skills(self, user_id: str) -> int:
        deleted_count = self.db.query(Skill).filter(Skill.user_id == user_id).delete()
        self.db.commit()

        return deleted_count
