"""
User routes - Get current user info
Simple and easy to understand
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user_id, verify_password, hash_password
from app.models.user import UserResponse
from app.services.user_service import UserService

router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    name: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


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


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update user profile information
    """
    user = UserService.get_user_by_id(user_id, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Update user name
    user.name = profile_data.name
    db.commit()
    db.refresh(user)
    
    return UserService.to_user_response(user)


@router.put("/password")
def change_password(
    password_data: PasswordChangeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    user = UserService.get_user_by_id(user_id, db)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Check if user has a password (not Google OAuth only)
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password change not available for Google OAuth users",
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    # Validate new password
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match",
        )
    
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long",
        )
    
    # Update password
    user.password_hash = hash_password(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
