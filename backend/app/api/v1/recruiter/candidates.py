import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_recruiter_candidate_service
from app.core import get_current_active_user
from app.core.authorization import require_recruiter_with_organization
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.user import User
from app.schemas.recruiter_candidate import (
    RecruiterCandidateListResponse,
    UpdateApplicationRequest,
    UpdateApplicationResponse,
)
from app.schemas.resume import ResumeResponse
from app.services.recruiter.candidate_service import RecruiterCandidateService

router = APIRouter()


@router.get(
    "",
    response_model=RecruiterCandidateListResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_all_candidates(
    request: Request,
    candidate_service: Annotated[
        RecruiterCandidateService, Depends(get_recruiter_candidate_service)
    ],
    current_user: Annotated[User, Depends(get_current_active_user)],
    page: int = 1,
    limit: int = 20,
):

    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    skip = (page - 1) * limit
    return await candidate_service.get_organization_candidates(
        organization_id=organization_id, skip=skip, limit=limit
    )


@router.get(
    "/applications/{application_id}/resume",
    response_model=ResumeResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_application_resume_detail(
    request: Request,
    application_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    candidate_service: Annotated[
        RecruiterCandidateService, Depends(get_recruiter_candidate_service)
    ],
):
    try:
        # 1. Get the organization ID from the recruiter
        organization_id = require_recruiter_with_organization(current_user)

        # 2. Call service
        resume = await candidate_service.get_application_resume(
            application_id=application_id, organization_id=organization_id
        )

        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application or Resume not found",
            )

        return resume

    except ValueError as e:
        status_code = (
            status.HTTP_403_FORBIDDEN
            if "Access denied" in str(e)
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=str(e))


@router.patch(
    "/applications/{application_id}",
    response_model=UpdateApplicationResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_application(
    request: Request,
    application_id: uuid.UUID,
    data: UpdateApplicationRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    candidate_service: Annotated[
        RecruiterCandidateService, Depends(get_recruiter_candidate_service)
    ],
):
    """Update application status, score, and/or feedback."""
    try:
        organization_id = require_recruiter_with_organization(current_user)
        return await candidate_service.update_application(
            application_id=application_id,
            organization_id=organization_id,
            data=data,
        )
    except ValueError as e:
        status_code = (
            status.HTTP_403_FORBIDDEN
            if "Access denied" in str(e)
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=str(e))
