from fastapi import Depends, HTTPException, status
from app.models import Application
from app.services import ApplicationService

from .security import get_current_user_id


def get_application_by_id(
    application_id: int,
    user_id: str = Depends(get_current_user_id),
    application_service: ApplicationService = Depends(),
) -> Application:
    app = application_service.get_application_by_id(application_id)

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Application not found with ID: {application_id}",
        )

    if not application_service.verify_ownership(app, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this application",
        )

    return app


def get_application_for_update(
    application_id: int,
    user_id: str = Depends(get_current_user_id),
    application_service: ApplicationService = Depends(),
) -> Application:
    return get_application_by_id(application_id, user_id, application_service)


def get_application_for_delete(
    application_id: int,
    user_id: str = Depends(get_current_user_id),
    application_service: ApplicationService = Depends(),
) -> Application:
    return get_application_by_id(application_id, user_id, application_service)
