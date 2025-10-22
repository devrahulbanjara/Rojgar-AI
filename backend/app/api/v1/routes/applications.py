from typing import List, Dict
from fastapi import APIRouter, status, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.dependencies import get_application_by_id, get_application_for_update, get_application_for_delete
from app.models.application import Application
from app.schemas.application import (
    CreateApplicationRequest,
    UpdateApplicationRequest,
    ApplicationResponse,
)
from app.services.application_service import ApplicationService

router = APIRouter()


@router.get("/", response_model=List[ApplicationResponse])
def get_my_applications(
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(request)
    
    applications = ApplicationService.get_user_applications(user_id, db)
    
    return applications


@router.get("/tracking-board", response_model=Dict[str, List[dict]])
def get_tracking_board(
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(request)
    
    return ApplicationService.get_tracking_board(user_id, db)


@router.get("/stats", response_model=Dict[str, int])
def get_application_stats(
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(request)
    
    return ApplicationService.get_application_stats(user_id, db)


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    app_data: CreateApplicationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id(request)
    
    new_app = ApplicationService.create_application(
        user_id=user_id,
        job_title=app_data.job_title,
        company_name=app_data.company_name,
        description=app_data.description,
        db=db
    )
    
    return new_app


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    app: Application = Depends(get_application_by_id)
):
    return app


@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(
    update_data: UpdateApplicationRequest,
    app: Application = Depends(get_application_for_update),
    db: Session = Depends(get_db)
):
    updated_app = ApplicationService.update_application(
        application=app,
        stage=update_data.stage,
        status=update_data.status,
        description=update_data.description,
        db=db
    )
    
    return updated_app


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app: Application = Depends(get_application_for_delete),
    db: Session = Depends(get_db)
):
    ApplicationService.delete_application(app, db)
    
    return None
