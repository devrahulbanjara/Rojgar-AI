from fastapi import APIRouter, BackgroundTasks, File, UploadFile, status

from app.core.dependencies import ActiveMember, DbSession, RecruiterAdmin, UUIDPath
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.infrastructures.storage.service import storage_service
from app.modules.companies import service
from app.modules.companies.schemas import (
    CompanyResponse,
    JoinCompanyRequest,
    RecruiterMemberResponse,
    RegisterCompanyRequest,
    UpdateCompanyRequest,
    UpdateRecruiterStatusRequest,
)
from app.modules.companies.utils import get_admin_company

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Stage 2 of company signup: bundles details and resends verification email",
)
async def register_company(
    payload: RegisterCompanyRequest,
    bg_tasks: BackgroundTasks,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Stage company registration details for recruiter-admin signup."""
    await service.register_company(db, payload, bg_tasks)
    return ResponseBuilder.success(
        data=None,
        message="Almost there! Please check your email to verify your account and activate your company.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post(
    "/join-request",
    status_code=status.HTTP_201_CREATED,
    summary="Stage 2 of recruiter signup: bundles join details and resends verification email",
)
async def request_join_company(
    payload: JoinCompanyRequest,
    bg_tasks: BackgroundTasks,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Stage a recruiter join request before email verification."""
    await service.request_join_company(db, payload, bg_tasks)
    return ResponseBuilder.success(
        message="Almost there! Please check your email to verify your account and submit your join request.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/me",
    summary="Get the authenticated recruiter or company admin's company profile",
)
async def get_my_company(
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[CompanyResponse]:
    """Return the active company for the authenticated recruiter."""
    data = await service.get_my_company(db, user)
    return ResponseBuilder.success(data=data, message="Company fetched.")


@router.patch(
    "/me",
    summary="Update the authenticated company admin's company profile",
)
async def update_my_company(
    payload: UpdateCompanyRequest,
    user: RecruiterAdmin,
    db: DbSession,
) -> UnifiedResponse[CompanyResponse]:
    """Update the authenticated admin's company profile."""
    data = await service.update_my_company(db, user, payload)
    return ResponseBuilder.success(data=data, message="Company updated.")


@router.get(
    "/me/recruiters",
    summary="List all recruiter members of the authenticated company admin's company",
)
async def get_company_recruiters(
    user: RecruiterAdmin,
    db: DbSession,
) -> UnifiedResponse[list[RecruiterMemberResponse]]:
    """List recruiter memberships for the admin's company."""
    data = await service.list_company_recruiters(db, user)
    return ResponseBuilder.success(data=data, message="Recruiters fetched.")


@router.patch(
    "/me/recruiters/{membership_id}/status",
    summary="Approve or reject a recruiter membership request",
)
async def update_recruiter_status(
    membership_id: UUIDPath,
    payload: UpdateRecruiterStatusRequest,
    user: RecruiterAdmin,
    db: DbSession,
) -> UnifiedResponse[RecruiterMemberResponse]:
    """Approve or reject a recruiter membership request."""
    data = await service.update_recruiter_status(db, user, membership_id, payload)
    return ResponseBuilder.success(data=data, message="Recruiter status updated.")


@router.delete(
    "/me/recruiters/{membership_id}",
    summary="Remove a recruiter from the company",
)
async def remove_recruiter(
    membership_id: UUIDPath,
    user: RecruiterAdmin,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Remove a recruiter membership from the admin's company."""
    await service.remove_recruiter(db, user, membership_id)
    return ResponseBuilder.success(data=None, message="Recruiter removed.")


@router.patch(
    "/me/logo",
    summary="Upload or replace the authenticated company admin's logo",
)
async def upload_company_logo(
    file: UploadFile = File(),
    user: RecruiterAdmin = None,
    db: DbSession = None,
) -> UnifiedResponse[CompanyResponse]:
    """Upload or replace the active company's logo."""
    company = await get_admin_company(db, user)
    previous_logo_url = company.logo_url
    new_logo_url = await storage_service.upload_image(file, folder="logos")

    company.logo_url = new_logo_url
    await db.commit()
    await db.refresh(company)

    if previous_logo_url and previous_logo_url != new_logo_url:
        await storage_service.delete_image(previous_logo_url)

    await service.invalidate_company_content_caches(db, str(company.id))

    data = CompanyResponse.model_validate(company)
    return ResponseBuilder.success(data=data, message="Company logo updated.")


@router.delete(
    "/me/logo",
    summary="Delete the authenticated company admin's logo",
)
async def delete_company_logo(
    user: RecruiterAdmin,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Delete the active company's logo."""
    company = await get_admin_company(db, user)
    previous_logo_url = company.logo_url
    company.logo_url = None
    await db.commit()
    await db.refresh(company)

    if previous_logo_url:
        await storage_service.delete_image(previous_logo_url)

    await service.invalidate_company_content_caches(db, str(company.id))

    return ResponseBuilder.success(data=None, message="Company logo removed.")
