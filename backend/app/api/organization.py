import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core import NotFoundError, get_db
from app.core.authorization import verify_recruiter_belongs_to_organization
from app.core.limiter import limiter
from app.core.security import get_current_organization_id
from app.schemas.organization import (
    CreateRecruiterRequest,
    OrganizationResponse,
    OrganizationUpdateRequest,
    RecruiterResponse,
    UpdateRecruiterRequest,
)
from app.services.auth.organization_auth_service import OrganizationAuthService
from app.services.organization import OrganizationService, RecruiterCRUD

router = APIRouter()


@router.get("/me", response_model=OrganizationResponse)
@limiter.limit("50/minute")
def get_organization_profile(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    organization_id: uuid.UUID = Depends(get_current_organization_id),
):
    organization = OrganizationService.get_organization_by_id(organization_id, db)
    if not organization:
        raise NotFoundError("Organization not found")
    return organization


@router.put("/me", response_model=OrganizationResponse)
@limiter.limit("50/minute")
def update_organization_profile(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    update_data: OrganizationUpdateRequest,
    organization_id: uuid.UUID = Depends(get_current_organization_id),
):
    organization = OrganizationService.update_organization(
        organization_id, update_data, db
    )
    return OrganizationAuthService.create_organization_response(organization)


@router.get("/recruiters", response_model=list[RecruiterResponse])
@limiter.limit("50/minute")
def get_organization_recruiters(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    organization_id: uuid.UUID = Depends(get_current_organization_id),
):
    return RecruiterCRUD.get_recruiters_by_organization(organization_id, db)


@router.post(
    "/recruiters", response_model=RecruiterResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("50/minute")
def create_recruiter(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    recruiter_data: CreateRecruiterRequest,
    organization_id: uuid.UUID = Depends(get_current_organization_id),
):
    return RecruiterCRUD.create_recruiter(
        organization_id=organization_id,
        email=recruiter_data.email,
        name=recruiter_data.name,
        password=recruiter_data.password,
        db=db,
    )


@router.get("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
@limiter.limit("50/minute")
def get_recruiter(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    recruiter_id: uuid.UUID,
    organization_id: uuid.UUID = Depends(get_current_organization_id),
):
    recruiter = RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
    if not recruiter:
        raise NotFoundError("Recruiter not found")
    verify_recruiter_belongs_to_organization(recruiter, organization_id)
    return recruiter


@router.put("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
@limiter.limit("50/minute")
def update_recruiter(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    recruiter_id: uuid.UUID,
    update_data: UpdateRecruiterRequest,
    organization_id: uuid.UUID = Depends(get_current_organization_id),
):
    recruiter = RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
    if not recruiter:
        raise NotFoundError("Recruiter not found")
    verify_recruiter_belongs_to_organization(recruiter, organization_id)
    return RecruiterCRUD.update_recruiter(recruiter_id, update_data, db)


@router.delete("/recruiters/{recruiter_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("50/minute")
def remove_recruiter(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    recruiter_id: uuid.UUID,
    organization_id: uuid.UUID = Depends(get_current_organization_id),
):
    recruiter = RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
    if not recruiter:
        raise NotFoundError("Recruiter not found")
    verify_recruiter_belongs_to_organization(recruiter, organization_id)
    RecruiterCRUD.delete_recruiter(recruiter_id, db)
    return {"message": "Recruiter removed successfully"}
