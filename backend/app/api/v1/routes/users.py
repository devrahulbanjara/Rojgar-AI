"""
User routes - Get current user info
Simple and easy to understand
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import UserResponse
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get information about the currently logged in user
    """
    user = UserService.get_user_by_id(user_id, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return UserService.to_user_response(user)
