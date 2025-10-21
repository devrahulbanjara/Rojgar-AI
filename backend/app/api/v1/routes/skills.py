"""
Skills API endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas.skill import SkillCreateRequest, SkillResponse, SkillsListResponse
from app.services.skill_service import SkillService

router = APIRouter()


@router.post("/", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill_data: SkillCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new skill for the current user"""
    skill_service = SkillService(db)
    return skill_service.create_skill(user_id, skill_data)


@router.get("/", response_model=SkillsListResponse)
async def get_user_skills(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all skills for the current user"""
    skill_service = SkillService(db)
    return skill_service.get_user_skills(user_id)


@router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill(
    skill_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific skill by ID"""
    skill_service = SkillService(db)
    skill = skill_service.get_skill_by_id(skill_id, user_id)
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a skill"""
    skill_service = SkillService(db)
    success = skill_service.delete_skill(skill_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_skills(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete all skills for the current user"""
    skill_service = SkillService(db)
    skill_service.delete_all_user_skills(user_id)
