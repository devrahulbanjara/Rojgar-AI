"""
Application API Routes
Clean, production-ready endpoints for application management
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse

from app.core.security import get_current_user_id
from app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationUpdate,
)
from app.services.application_service import ApplicationService

router = APIRouter()


@router.get("/", response_model=List[ApplicationRead])
async def get_applications(request: Request):
    """Get all applications for the current authenticated user"""
    user_id = get_current_user_id(request)
    return ApplicationService.get_user_applications(user_id)


@router.get("/tracking-board")
async def get_application_tracking_board(request: Request):
    """Get applications organized by stage for the application tracking board"""
    user_id = get_current_user_id(request)
    return ApplicationService.get_application_tracking_board(user_id)


@router.post(
    "/", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED
)
async def create_application(application: ApplicationCreate, request: Request):
    """Create a new application for the current authenticated user"""
    user_id = get_current_user_id(request)
    return ApplicationService.create_application(
        user_id=user_id, application_data=application
    )


@router.get("/{application_id}", response_model=ApplicationRead)
async def get_application(application_id: int, request: Request):
    """Get a specific application by ID for the current authenticated user"""
    user_id = get_current_user_id(request)
    application = ApplicationService.get_application(application_id)

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    # Check if the application belongs to the current user
    if application.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this application",
        )

    return application


@router.put("/{application_id}", response_model=ApplicationRead)
async def update_application(
    application_id: int,
    application_update: ApplicationUpdate,
    request: Request,
):
    """Update an application by ID for the current authenticated user"""
    user_id = get_current_user_id(request)
    
    # First check if the application exists and belongs to the user
    existing_application = ApplicationService.get_application(application_id)

    if not existing_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    if existing_application.user_id != user_id:
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

    return updated_application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(application_id: int, request: Request):
    """Delete an application by ID for the current authenticated user"""
    user_id = get_current_user_id(request)
    
    # First check if the application exists and belongs to the user
    existing_application = ApplicationService.get_application(application_id)

    if not existing_application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    if existing_application.user_id != user_id:
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
