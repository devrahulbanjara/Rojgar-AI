from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import get_db, get_current_user_id

from app.services.candidate.application_service import ApplicationService
from app.schemas.application import ApplicationResponse

router = APIRouter()

@router.get("/applications", response_model=List[ApplicationResponse])
def get_my_applications(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    return ApplicationService.get_candidate_applications(db, user_id)
