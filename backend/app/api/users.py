from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.limiter import limiter
from app.schemas import ProfileUpdateRequest, UserResponse
from app.services import UserService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
@limiter.limit("5/minute")
def get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_id: str = Depends(get_current_user_id),
):
    user = UserService.get_user_by_id(user_id, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserService.to_user_response(user)


@router.put("/profile", response_model=UserResponse)
@limiter.limit("5/minute")
def update_profile(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    profile_data: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    user = UserService.get_user_by_id(user_id, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.name = profile_data.name
    db.commit()
    db.refresh(user)

    return UserService.to_user_response(user)
