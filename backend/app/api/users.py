from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core import get_current_active_user, get_db
from app.core.limiter import limiter
from app.models.user import User
from app.schemas import ProfileUpdateRequest, UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
@limiter.limit("50/minute")
def get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return current_user


@router.put("/profile", response_model=UserResponse)
@limiter.limit("50/minute")
def update_profile(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    profile_data: ProfileUpdateRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    current_user.name = profile_data.name
    db.commit()
    db.refresh(current_user)

    return current_user
