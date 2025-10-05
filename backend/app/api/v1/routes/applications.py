from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.security import verify_token


# Helper function to get current user from token
async def get_current_user(token: str = Depends(verify_token)):
    return token


from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    ApplicationTrackingBoardResponse,
)
from app.services.application_service import ApplicationService

router = APIRouter()


@router.get("/", response_model=List[ApplicationResponse])
async def get_applications(current_user=Depends(get_current_user)):
    """Get all applications for the current user"""
    applications = ApplicationService.get_user_applications(current_user["id"])
    return [app.to_dict() for app in applications]


@router.get("/tracking-board", response_model=dict)
async def get_application_tracking_board(current_user=Depends(get_current_user)):
    """Get applications organized by stage for the application tracking board"""
    return ApplicationService.get_application_tracking_board(current_user["id"])


@router.get("/tracking-board/test", response_model=dict)
async def get_application_tracking_board_test():
    """Get applications organized by stage for the application tracking board (test endpoint without auth)"""
    return ApplicationService.get_application_tracking_board("08e24b25-dc8f-4e38-98e7-723b3c721162")  # Use the correct user ID for testing


@router.post(
    "/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED
)
async def create_application(
    application: ApplicationCreate, current_user=Depends(get_current_user)
):
    """Create a new application for the current user"""
    new_application = ApplicationService.create_application(
        user_id=current_user["id"], application_data=application
    )
    return new_application.to_dict()


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(application_id: int, current_user=Depends(get_current_user)):
    """Get a specific application by ID"""
    application = ApplicationService.get_application(application_id)

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    # Check if the application belongs to the current user
    if application.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this application",
        )

    return application.to_dict()


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: int,
    application_update: ApplicationUpdate,
    current_user=Depends(get_current_user),
):
    """Update an application by ID"""
    # First check if the application exists and belongs to the user
    existing_application = ApplicationService.get_application(application_id)

    if not existing_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    if existing_application.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this application",
        )

    updated_application = ApplicationService.update_application(
        application_id, application_update
    )

    if not updated_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    return updated_application.to_dict()


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int, current_user=Depends(get_current_user)
):
    """Delete an application by ID"""
    # First check if the application exists and belongs to the user
    existing_application = ApplicationService.get_application(application_id)

    if not existing_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    if existing_application.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this application",
        )

    success = ApplicationService.delete_application(application_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete application",
        )

    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content={})
