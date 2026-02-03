import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import (
    get_organization_service,
    get_recruiter_crud_service,
)
from app.core import get_current_recruiter_organization_id
from app.core.authorization import verify_recruiter_belongs_to_organization
from app.core.config import settings
from app.core.limiter import limiter
from app.schemas.organization import (
    CreateRecruiterRequest,
    OrganizationResponse,
    OrganizationUpdateRequest,
    RecruiterResponse,
    UpdateRecruiterRequest,
)
from app.services.organization.organization_service import OrganizationService
from app.services.organization.recruiter_crud import RecruiterCrudService

router = APIRouter()


@router.get("/me", response_model=OrganizationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_organization_profile(
    request: Request,
    organization_service: Annotated[
        OrganizationService, Depends(get_organization_service)
    ],
    organization_id: uuid.UUID = Depends(get_current_recruiter_organization_id),
):
    organization = await organization_service.get_organization_by_id(organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )
    return organization


@router.put("/me", response_model=OrganizationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_organization_profile(
    request: Request,
    update_data: OrganizationUpdateRequest,
    organization_service: Annotated[
        OrganizationService, Depends(get_organization_service)
    ],
    organization_id: uuid.UUID = Depends(get_current_recruiter_organization_id),
):
    organization = await organization_service.update_organization(
        organization_id, update_data
    )
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found"
        )
    # Return organization directly (response model will handle serialization)
    return organization


@router.get("/recruiters", response_model=list[RecruiterResponse])
@limiter.limit(settings.RATE_LIMIT_API)
async def get_organization_recruiters(
    request: Request,
    recruiter_crud_service: Annotated[
        RecruiterCrudService, Depends(get_recruiter_crud_service)
    ],
    organization_id: uuid.UUID = Depends(get_current_recruiter_organization_id),
):
    return await recruiter_crud_service.get_recruiters_by_organization(organization_id)


@router.post(
    "/recruiters", response_model=RecruiterResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_recruiter(
    request: Request,
    recruiter_data: CreateRecruiterRequest,
    recruiter_crud_service: Annotated[
        RecruiterCrudService, Depends(get_recruiter_crud_service)
    ],
    organization_id: uuid.UUID = Depends(get_current_recruiter_organization_id),
):
    try:
        return await recruiter_crud_service.create_recruiter(
            organization_id=organization_id,
            email=recruiter_data.email,
            name=recruiter_data.name,
            password=recruiter_data.password,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_recruiter(
    request: Request,
    recruiter_id: uuid.UUID,
    recruiter_crud_service: Annotated[
        RecruiterCrudService, Depends(get_recruiter_crud_service)
    ],
    organization_id: uuid.UUID = Depends(get_current_recruiter_organization_id),
):
    recruiter = await recruiter_crud_service.get_recruiter_by_id(recruiter_id)
    if not recruiter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found"
        )
    try:
        verify_recruiter_belongs_to_organization(recruiter, organization_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return recruiter


@router.put("/recruiters/{recruiter_id}", response_model=RecruiterResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_recruiter(
    request: Request,
    recruiter_id: uuid.UUID,
    update_data: UpdateRecruiterRequest,
    recruiter_crud_service: Annotated[
        RecruiterCrudService, Depends(get_recruiter_crud_service)
    ],
    organization_id: uuid.UUID = Depends(get_current_recruiter_organization_id),
):
    recruiter = await recruiter_crud_service.get_recruiter_by_id(recruiter_id)
    if not recruiter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found"
        )
    try:
        verify_recruiter_belongs_to_organization(recruiter, organization_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    try:
        updated_recruiter = await recruiter_crud_service.update_recruiter(
            recruiter_id, update_data
        )
        if not updated_recruiter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found"
            )
        return updated_recruiter
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/recruiters/{recruiter_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_API)
async def remove_recruiter(
    request: Request,
    recruiter_id: uuid.UUID,
    recruiter_crud_service: Annotated[
        RecruiterCrudService, Depends(get_recruiter_crud_service)
    ],
    organization_id: uuid.UUID = Depends(get_current_recruiter_organization_id),
):
    recruiter = await recruiter_crud_service.get_recruiter_by_id(recruiter_id)
    if not recruiter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found"
        )
    try:
        verify_recruiter_belongs_to_organization(recruiter, organization_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    deleted_recruiter = await recruiter_crud_service.delete_recruiter(recruiter_id)
    if not deleted_recruiter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found"
        )
    return {"message": "Recruiter removed successfully"}
