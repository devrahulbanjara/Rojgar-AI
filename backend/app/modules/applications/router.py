import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import (
    get_current_user,
    require_active_membership,
    require_candidate,
)
from app.modules.auth.models import User
from app.modules.applications import service
from app.modules.applications.schemas import (
    ApplicationResponse,
    ApplyRequest,
    CandidateApplicationView,
    RecruiterCandidateDetailView,
    RecruiterCandidateListItem,
    RecruiterApplicationView,
    UpdateApplicationReviewRequest,
    UpdateApplicationStatusRequest,
)
from app.modules.activity.schemas import ActivityEventResponse
from app.shared.enums import ApplicationStatus

router = APIRouter()

db = Depends(get_db)


@router.post(
    "/",
    response_model=UnifiedResponse[ApplicationResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Apply to a job (auto-forks profile to resume if none provided)",
)
async def apply_to_job(
    payload: ApplyRequest,
    bg_tasks: BackgroundTasks,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    data = await service.apply_to_job(db, user, payload, bg_tasks)
    return ResponseBuilder.success(
        data=data,
        message="Application submitted.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/me",
    response_model=UnifiedResponse[list[CandidateApplicationView]],
    summary="List all applications submitted by the authenticated candidate",
)
async def list_my_applications(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    data = await service.list_user_applications(db, user, page, size)
    return ResponseBuilder.success(data=data, message="Applications fetched.")


@router.get(
    "/company/me",
    response_model=UnifiedResponse[list[RecruiterApplicationView]],
    summary="List all applications for the authenticated recruiter's company, optionally filtered by job",
)
async def list_my_company_applications(
    job_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_active_membership),
    db: AsyncSession = db,
):
    data = await service.list_my_company_applications(db, user, job_id, page, size)
    return ResponseBuilder.success(data=data, message="Applications fetched.")


@router.get(
    "/company/me/candidates",
    response_model=UnifiedResponse[list[RecruiterCandidateListItem]],
    summary="List candidate applications for the authenticated recruiter's company",
)
async def list_my_company_candidates(
    job_id: str | None = Query(default=None),
    status_filter: ApplicationStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=200),
    user: User = Depends(require_active_membership),
    db: AsyncSession = db,
):
    data = await service.list_company_candidates(
        db,
        user,
        job_id,
        status_filter,
        page,
        size,
    )
    return ResponseBuilder.success(data=data, message="Candidates fetched.")


@router.get(
    "/company/me/candidates/{application_id}",
    response_model=UnifiedResponse[RecruiterCandidateDetailView],
    summary="Get recruiter-safe candidate details for one application",
)
async def get_company_candidate_detail(
    application_id: str,
    user: User = Depends(require_active_membership),
    db: AsyncSession = db,
):
    data = await service.get_company_candidate_detail(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Candidate fetched.")


@router.get(
    "/job/{job_id}",
    response_model=UnifiedResponse[list[RecruiterApplicationView]],
    summary="List all applications for a specific job (company/recruiter only)",
)
async def list_job_applications(
    job_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.list_job_applications(db, user, job_id, page, size)
    return ResponseBuilder.success(data=data, message="Applications fetched.")


@router.get(
    "/{application_id}",
    response_model=UnifiedResponse[ApplicationResponse],
    summary="Get full details of a specific application",
)
async def get_application(
    application_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.get_application(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Application fetched.")


@router.get(
    "/{application_id}/timeline",
    response_model=UnifiedResponse[list[ActivityEventResponse]],
    summary="Get the event timeline for a specific application",
)
async def get_application_timeline(
    application_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.get_application_timeline(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Application timeline fetched.")


@router.get(
    "/company/me/candidates/{application_id}/timeline",
    response_model=UnifiedResponse[list[ActivityEventResponse]],
    summary="Get the recruiter timeline for a specific candidate application",
)
async def get_company_candidate_timeline(
    application_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.get_company_candidate_timeline(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Candidate timeline fetched.")


@router.patch(
    "/{application_id}/review",
    response_model=UnifiedResponse[ApplicationResponse],
    summary="Update application score and feedback (company/recruiter only)",
)
async def update_application_review(
    application_id: str,
    payload: UpdateApplicationReviewRequest,
    bg_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.update_application_review(
        db, user, application_id, payload, bg_tasks
    )
    return ResponseBuilder.success(data=data, message="Application review updated.")


@router.patch(
    "/{application_id}/status",
    response_model=UnifiedResponse[ApplicationResponse],
    summary="Update application status (company/recruiter only)",
)
async def update_application_status(
    application_id: str,
    payload: UpdateApplicationStatusRequest,
    bg_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = db,
):
    data = await service.update_application_status(
        db, user, application_id, payload, bg_tasks
    )
    return ResponseBuilder.success(data=data, message="Application status updated.")


class OfferResponsePayload(BaseModel):
    accepted: bool


@router.post(
    "/{application_id}/offer/respond",
    response_model=UnifiedResponse[None],
    summary="Candidate accepts or declines a recorded offer",
)
async def respond_to_offer(
    application_id: uuid.UUID,
    payload: OfferResponsePayload,
    user: User = Depends(require_candidate),
    db: AsyncSession = db,
):
    await service.respond_to_offer(db, application_id, payload.accepted, user)
    return ResponseBuilder.success(
        message="Offer accepted" if payload.accepted else "Offer declined"
    )
