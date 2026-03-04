from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_recruiter_admin
from app.modules.auth.models import User
from app.modules.companies import service
from app.modules.companies.schemas import (
    JoinCompanyRequest,
    RecruiterMemberResponse,
    RegisterCompanyRequest,
    UpdateRecruiterStatusRequest,
)

router = APIRouter()

db = Depends(get_db)


@router.post(
    "/register",
    response_model=UnifiedResponse[None],
    status_code=status.HTTP_201_CREATED,
    summary="Stage 2 of company signup: bundles details and resends verification email",
)
async def register_company(
    payload: RegisterCompanyRequest,
    bg_tasks: BackgroundTasks,
    db: AsyncSession = db,
):
    await service.register_company(db, payload, bg_tasks)
    return ResponseBuilder.success(
        data=None,
        message="Almost there! Please check your email to verify your account and activate your company.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post(
    "/join-request",
    response_model=UnifiedResponse[None],
    status_code=status.HTTP_201_CREATED,
    summary="Stage 2 of recruiter signup: bundles join details and resends verification email",
)
async def request_join_company(
    payload: JoinCompanyRequest,
    bg_tasks: BackgroundTasks,
    db: AsyncSession = db,
):
    await service.request_join_company(db, payload, bg_tasks)
    return ResponseBuilder.success(
        message="Almost there! Please check your email to verify your account and submit your join request.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/me/recruiters",
    response_model=UnifiedResponse[list[RecruiterMemberResponse]],
    summary="List all recruiter members of the authenticated company admin's company",
)
async def get_company_recruiters(
    user: User = Depends(require_recruiter_admin),
    db: AsyncSession = db,
):
    data = await service.list_company_recruiters(db, user)
    return ResponseBuilder.success(data=data, message="Recruiters fetched.")


@router.patch(
    "/me/recruiters/{membership_id}/status",
    response_model=UnifiedResponse[RecruiterMemberResponse],
    summary="Approve or reject a recruiter membership request",
)
async def update_recruiter_status(
    membership_id: str,
    payload: UpdateRecruiterStatusRequest,
    user: User = Depends(require_recruiter_admin),
    db: AsyncSession = db,
):
    data = await service.update_recruiter_status(db, user, membership_id, payload)
    return ResponseBuilder.success(data=data, message="Recruiter status updated.")


@router.delete(
    "/me/recruiters/{membership_id}",
    response_model=UnifiedResponse[None],
    summary="Remove a recruiter from the company",
)
async def remove_recruiter(
    membership_id: str,
    user: User = Depends(require_recruiter_admin),
    db: AsyncSession = db,
):
    await service.remove_recruiter(db, user, membership_id)
    return ResponseBuilder.success(data=None, message="Recruiter removed.")
