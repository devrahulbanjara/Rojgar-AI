from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.exceptions import ResourceNotFoundError, UnauthorizedError
from app.services.application_service import ApplicationService
from app.models.application import Application


def get_application_by_id(
    application_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> Application:
    app = ApplicationService.get_application_by_id(application_id, db)
    
    if not app:
        raise ResourceNotFoundError("Application", str(application_id))
    
    if not ApplicationService.verify_ownership(app, user_id):
        raise UnauthorizedError("Not authorized to access this application")
    
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
