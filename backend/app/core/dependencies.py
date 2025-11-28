from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from .security import get_current_user_id
from app.services import ApplicationService
from app.models import Application


def get_application_by_id(
    application_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> Application:
    app = ApplicationService.get_application_by_id(application_id, db)
    
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application not found with ID: {application_id}"
        )
    
    if not ApplicationService.verify_ownership(app, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this application"
        )
    
    return app


def get_application_for_update(
    application_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> Application:
    return get_application_by_id(application_id, user_id, db)


def get_application_for_delete(
    application_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> Application:
    return get_application_by_id(application_id, user_id, db)
