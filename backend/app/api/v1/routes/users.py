"""
User routes
"""

from fastapi import APIRouter, Depends
from app.core.security import get_current_user_id
from app.schemas.user import UserResponse
from app.services.user_service import user_service

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user_id: str = Depends(get_current_user_id)):
    """Get current user information"""
    return user_service.get_current_user(current_user_id)
