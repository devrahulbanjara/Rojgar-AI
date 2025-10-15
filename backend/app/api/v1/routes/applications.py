"""
Application routes - Manage job applications
Simple CRUD operations for applications
"""

from typing import List, Dict
from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.application import (
    CreateApplicationRequest,
    UpdateApplicationRequest,
    ApplicationResponse,
)
from app.services.application_service import ApplicationService

router = APIRouter()


# ============= Routes =============

@router.get("/", response_model=List[ApplicationResponse])
def get_my_applications(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all applications for the logged in user"""
    user_id = get_current_user_id(request)
    
    # Get all applications for this user
    applications = ApplicationService.get_user_applications(user_id, db)
    
    return [ApplicationService.to_response(app) for app in applications]


@router.get("/tracking-board")
def get_tracking_board(
    request: Request,
    db: Session = Depends(get_db)
) -> Dict[str, List[dict]]:
    """
    Get applications organized by stage for the tracking board
    Organizes into 3 columns: applied, interviewing, outcome
    """
    user_id = get_current_user_id(request)
    
    return ApplicationService.get_tracking_board(user_id, db)


@router.get("/stats")
def get_application_stats(
    request: Request,
    db: Session = Depends(get_db)
) -> Dict[str, int]:
    """Get statistics about user's applications"""
    user_id = get_current_user_id(request)
    
    return ApplicationService.get_application_stats(user_id, db)


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    app_data: CreateApplicationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new job application"""
    user_id = get_current_user_id(request)
    
    # Create application
    new_app = ApplicationService.create_application(
        user_id=user_id,
        job_title=app_data.job_title,
        company_name=app_data.company_name,
        description=app_data.description,
        db=db
    )
    
    return ApplicationService.to_response(new_app)


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get a specific application"""
    user_id = get_current_user_id(request)
    
    # Get application
    app = ApplicationService.get_application_by_id(application_id, db)
    
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    
    # Check ownership
    if not ApplicationService.verify_ownership(app, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this application",
        )
    
    return ApplicationService.to_response(app)


@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    update_data: UpdateApplicationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update an application"""
    user_id = get_current_user_id(request)
    
    # Get application
    app = ApplicationService.get_application_by_id(application_id, db)
    
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    
    # Check ownership
    if not ApplicationService.verify_ownership(app, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this application",
        )
    
    # Update application
    updated_app = ApplicationService.update_application(
        application=app,
        stage=update_data.stage,
        status=update_data.status,
        description=update_data.description,
        db=db
    )
    
    return ApplicationService.to_response(updated_app)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete an application"""
    user_id = get_current_user_id(request)
    
    # Get application
    app = ApplicationService.get_application_by_id(application_id, db)
    
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    
    # Check ownership
    if not ApplicationService.verify_ownership(app, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this application",
        )
    
    ApplicationService.delete_application(app, db)
    
    return None
