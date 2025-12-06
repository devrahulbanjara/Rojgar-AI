from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SkillCreateRequest(BaseModel):
    skill: str


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    skill: str
    created_at: datetime
    updated_at: datetime


class SkillsListResponse(BaseModel):
    skills: list[SkillResponse]
    total: int
