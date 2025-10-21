"""
Skill Service - Business logic for skills management
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.skill import Skill, SkillCreateRequest, SkillResponse, SkillsListResponse
# No security imports needed for skill service
import uuid


class SkillService:
    """Service for managing candidate skills"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_skill(self, user_id: str, skill_data: SkillCreateRequest) -> SkillResponse:
        """Create a new skill for a candidate"""
        skill = Skill(
            id=str(uuid.uuid4()),
            user_id=user_id,
            skill=skill_data.skill
        )
        
        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)
        
        return SkillResponse.model_validate(skill)
    
    def get_user_skills(self, user_id: str) -> SkillsListResponse:
        """Get all skills for a specific user"""
        skills = self.db.query(Skill).filter(Skill.user_id == user_id).all()
        
        skill_responses = [SkillResponse.model_validate(skill) for skill in skills]
        
        return SkillsListResponse(
            skills=skill_responses,
            total=len(skill_responses)
        )
    
    def get_skill_by_id(self, skill_id: str, user_id: str) -> Optional[SkillResponse]:
        """Get a specific skill by ID for a user"""
        skill = self.db.query(Skill).filter(
            and_(Skill.id == skill_id, Skill.user_id == user_id)
        ).first()
        
        if not skill:
            return None
            
        return SkillResponse.model_validate(skill)
    
    def delete_skill(self, skill_id: str, user_id: str) -> bool:
        """Delete a skill for a user"""
        skill = self.db.query(Skill).filter(
            and_(Skill.id == skill_id, Skill.user_id == user_id)
        ).first()
        
        if not skill:
            return False
        
        self.db.delete(skill)
        self.db.commit()
        
        return True
    
    def delete_all_user_skills(self, user_id: str) -> int:
        """Delete all skills for a user"""
        deleted_count = self.db.query(Skill).filter(Skill.user_id == user_id).delete()
        self.db.commit()
        
        return deleted_count
