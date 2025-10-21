"""
Skill model - Stores candidate skills
"""

from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict

from app.models import Base

if TYPE_CHECKING:
    from app.models.user import User


class Skill(Base):
    """
    Skill table in database
    Stores candidate skills
    """
    __tablename__ = "skill"
    
    # Basic info
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), index=True)
    skill: Mapped[str] = mapped_column(String)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="skills")


# ============= Request/Response Schemas =============

class SkillCreateRequest(BaseModel):
    """What we need to create a new skill"""
    skill: str


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
