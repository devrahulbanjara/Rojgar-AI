"""
Skill schemas - Pydantic models for skill API data contracts
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


# ============= Request Schemas =============

class SkillCreateRequest(BaseModel):
    """What we need to create a new skill"""
    skill: str


# ============= Response Schemas =============

class SkillResponse(BaseModel):
    """What we send back about a skill"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    skill: str
    created_at: datetime
    updated_at: datetime


class SkillsListResponse(BaseModel):
    """Response for listing skills"""
    skills: list[SkillResponse]
    total: int
