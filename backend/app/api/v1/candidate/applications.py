import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_application_service
from app.core import get_current_active_user
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.user import User
from app.schemas import ApplicationCreate, ApplicationResponse
from app.services.candidate.application_service import ApplicationService

router = APIRouter()


@router.get(
    "/applications",
    response_model=list[ApplicationResponse],
    status_code=status.HTTP_200_OK,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_my_applications(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    application_service: Annotated[
        ApplicationService, Depends(get_application_service)
    ],
):
    applications = await application_service.get_candidate_applications(
        current_user.user_id
    )
    if applications is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found"
        )
    return applications


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_application_detail(
    request: Request,
    application_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    application_service: Annotated[
        ApplicationService, Depends(get_application_service)
    ],
):
    application = await application_service.get_application_by_id(
        current_user.user_id, application_id
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    return application


@router.get("/applications/job/{job_id}", response_model=ApplicationResponse | None)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_application_by_job(
    request: Request,
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    application_service: Annotated[
        ApplicationService, Depends(get_application_service)
    ],
):
    return await application_service.get_application_by_job(
        current_user.user_id, job_id
    )


@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_application(
    request: Request,
    data: ApplicationCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    application_service: Annotated[
        ApplicationService, Depends(get_application_service)
    ],
):
    try:
        application = await application_service.apply_to_job(
            current_user.user_id, data.job_id, data.resume_id
        )
        if application is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate profile or Job not found",
            )
        return application
    except ValueError as e:
        error_msg = str(e)
        status_code = status.HTTP_400_BAD_REQUEST
        if "already applied" in error_msg.lower():
            status_code = status.HTTP_409_CONFLICT
        raise HTTPException(status_code=status_code, detail=error_msg)
