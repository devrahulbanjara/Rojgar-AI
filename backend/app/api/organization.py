from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core import get_db
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
@limiter.limit("10/minute")
def get_organization_profile(
    request: Request,
    organization_id: str = Depends(get_current_organization_id),
    db: Session = Depends(get_db),
):
    organization = OrganizationService.get_organization_by_id(organization_id, db)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return OrganizationAuthService.create_organization_response(organization)


@router.put("/me", response_model=OrganizationResponse)
@limiter.limit("10/minute")
def update_organization_profile(
    request: Request,
    update_data: OrganizationUpdateRequest,
    organization_id: str = Depends(get_current_organization_id),
    db: Session = Depends(get_db),
):
    organization = OrganizationService.update_organization(
        organization_id, update_data, db
    )
    return OrganizationAuthService.create_organization_response(organization)


@router.get("/recruiters", response_model=list[RecruiterResponse])
@limiter.limit("10/minute")
def get_organization_recruiters(
    request: Request,
    organization_id: str = Depends(get_current_organization_id),
    db: Session = Depends(get_db),
):
    recruiters = RecruiterCRUD.get_recruiters_by_organization(organization_id, db)
    return [
        RecruiterResponse(
            id=recruiter.user_id,
            email=recruiter.email,
            name=recruiter.name,
            organization_id=recruiter.organization_id,
            created_at=recruiter.created_at,
            updated_at=recruiter.updated_at,
        )
        for recruiter in recruiters
    ]


@router.post("/recruiters", response_model=RecruiterResponse)
@limiter.limit("5/minute")
def create_recruiter(
    request: Request,
    recruiter_data: CreateRecruiterRequest,
    organization_id: str = Depends(get_current_organization_id),
    db: Session = Depends(get_db),
):
    recruiter = RecruiterCRUD.create_recruiter(
        organization_id=organization_id,
        email=recruiter_data.email,
        name=recruiter_data.name,
        password=recruiter_data.password,
        db=db,
    )
    return RecruiterResponse(
        id=recruiter.user_id,
        email=recruiter.email,
        name=recruiter.name,
        organization_id=recruiter.organization_id,
        created_at=recruiter.created_at,
        updated_at=recruiter.updated_at,
    )


@router.get("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
@limiter.limit("10/minute")
def get_recruiter(
    request: Request,
    recruiter_id: str,
    organization_id: str = Depends(get_current_organization_id),
    db: Session = Depends(get_db),
):
    recruiter = RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
    if not recruiter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter not found",
        )
    verify_recruiter_belongs_to_organization(recruiter, organization_id)
    return RecruiterResponse(
        id=recruiter.user_id,
        email=recruiter.email,
        name=recruiter.name,
        organization_id=recruiter.organization_id,
        created_at=recruiter.created_at,
        updated_at=recruiter.updated_at,
    )


@router.put("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
@limiter.limit("10/minute")
def update_recruiter(
    request: Request,
    recruiter_id: str,
    update_data: UpdateRecruiterRequest,
    organization_id: str = Depends(get_current_organization_id),
    db: Session = Depends(get_db),
):
    recruiter = RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
    if not recruiter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter not found",
        )
    verify_recruiter_belongs_to_organization(recruiter, organization_id)
    updated_recruiter = RecruiterCRUD.update_recruiter(recruiter_id, update_data, db)
    return RecruiterResponse(
        id=updated_recruiter.user_id,
        email=updated_recruiter.email,
        name=updated_recruiter.name,
        organization_id=updated_recruiter.organization_id,
        created_at=updated_recruiter.created_at,
        updated_at=updated_recruiter.updated_at,
    )


@router.delete("/recruiters/{recruiter_id}")
@limiter.limit("10/minute")
def remove_recruiter(
    request: Request,
    recruiter_id: str,
    organization_id: str = Depends(get_current_organization_id),
    db: Session = Depends(get_db),
):
    recruiter = RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
    if not recruiter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter not found",
        )
    verify_recruiter_belongs_to_organization(recruiter, organization_id)
    RecruiterCRUD.delete_recruiter(recruiter_id, db)
    return {"message": "Recruiter removed successfully"}
