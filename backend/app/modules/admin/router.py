"""/admin: platform staff panel. /public/jobs/{slug}/report: applicants report a job."""

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status

from app.core.dependencies import DbSession, OwnerContext, PlatformAdmin, UUIDPath
from app.core.rate_limit import RateLimit, client_ip
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.admin import (
    billing,
    guards,  # noqa: F401  (registers the job rules)
    service,
)
from app.modules.admin.schemas import (
    ApprovalItem,
    BusinessRow,
    FlaggedJob,
    MarkReceivedRequest,
    MessageRequest,
    OptionalReasonRequest,
    PaymentRow,
    PaymentsOverview,
    ReasonRequest,
    ReportCreate,
    TransferRequest,
)
from app.modules.auth.enums import BusinessStatus

router = APIRouter(tags=["Platform admin"])
admin = APIRouter(prefix="/admin")


@admin.get("/approvals", summary="Businesses waiting for approval, oldest first")
async def approvals(
    _: PlatformAdmin, db: DbSession
) -> UnifiedResponse[list[ApprovalItem]]:
    return ResponseBuilder.success(data=await service.list_approvals(db))


@admin.post("/businesses/{business_id}/approve", summary="Approve a business")
async def approve(
    business_id: UUIDPath, _: PlatformAdmin, db: DbSession, bg: BackgroundTasks
) -> UnifiedResponse[None]:
    await service.approve(db, business_id, bg)
    return ResponseBuilder.success(message="Approved.")


@admin.post(
    "/businesses/{business_id}/request-info",
    summary="Ask the owner for more information (SMS and email)",
)
async def request_info(
    business_id: UUIDPath,
    payload: MessageRequest,
    _: PlatformAdmin,
    db: DbSession,
    bg: BackgroundTasks,
) -> UnifiedResponse[None]:
    await service.request_info(db, business_id, payload.message, bg)
    return ResponseBuilder.success(message="Message sent.")


@admin.post(
    "/businesses/{business_id}/reject", summary="Reject a business with a reason"
)
async def reject(
    business_id: UUIDPath,
    payload: ReasonRequest,
    _: PlatformAdmin,
    db: DbSession,
    bg: BackgroundTasks,
) -> UnifiedResponse[None]:
    await service.reject(db, business_id, payload.reason, bg)
    return ResponseBuilder.success(message="Rejected.")


@admin.get("/businesses", summary="All businesses with plan and usage")
async def businesses(
    _: PlatformAdmin,
    db: DbSession,
    q: Annotated[str | None, Query(max_length=100)] = None,
    business_status: Annotated[BusinessStatus | None, Query(alias="status")] = None,
) -> UnifiedResponse[list[BusinessRow]]:
    return ResponseBuilder.success(
        data=await service.list_businesses(db, q, business_status)
    )


@admin.post(
    "/businesses/{business_id}/suspend",
    summary="Suspend a business; its public pages stop showing",
)
async def suspend(
    business_id: UUIDPath,
    payload: ReasonRequest,
    user: PlatformAdmin,
    db: DbSession,
    bg: BackgroundTasks,
) -> UnifiedResponse[None]:
    await service.suspend(db, business_id, user, payload.reason, bg)
    return ResponseBuilder.success(message="Suspended.")


@admin.post("/businesses/{business_id}/restore", summary="Lift a suspension")
async def restore(
    business_id: UUIDPath, _: PlatformAdmin, db: DbSession, bg: BackgroundTasks
) -> UnifiedResponse[None]:
    await service.restore(db, business_id)
    return ResponseBuilder.success(message="Restored.")


@admin.get("/reports", summary="Reported and automatically flagged jobs")
async def reports(
    _: PlatformAdmin,
    db: DbSession,
    include_resolved: bool = False,
) -> UnifiedResponse[list[FlaggedJob]]:
    return ResponseBuilder.success(
        data=await service.list_flagged_jobs(db, include_resolved)
    )


@admin.post("/jobs/{job_id}/unpublish", summary="Hide a job from the public")
async def unpublish_job(
    job_id: UUIDPath, payload: OptionalReasonRequest, user: PlatformAdmin, db: DbSession
) -> UnifiedResponse[None]:
    await service.unpublish_job(db, job_id, user, payload.reason)
    return ResponseBuilder.success(message="Unpublished.")


@admin.post("/jobs/{job_id}/restore", summary="Show an unpublished job again")
async def restore_job(
    job_id: UUIDPath, _: PlatformAdmin, db: DbSession
) -> UnifiedResponse[None]:
    await service.restore_job(db, job_id)
    return ResponseBuilder.success(message="Restored.")


@admin.post("/jobs/{job_id}/dismiss", summary="Close the reports on a job, no action")
async def dismiss(
    job_id: UUIDPath, user: PlatformAdmin, db: DbSession
) -> UnifiedResponse[None]:
    await service.dismiss_reports(db, job_id, user)
    return ResponseBuilder.success(message="Dismissed.")


@admin.get("/payments", summary="Bank transfers to confirm, and who pays for what")
async def payments(
    _: PlatformAdmin, db: DbSession
) -> UnifiedResponse[PaymentsOverview]:
    return ResponseBuilder.success(data=await service.payments_overview(db))


@admin.post("/payments/{payment_id}/received", summary="Mark a bank transfer received")
async def mark_received(
    payment_id: UUIDPath,
    payload: MarkReceivedRequest,
    user: PlatformAdmin,
    db: DbSession,
    bg: BackgroundTasks,
) -> UnifiedResponse[None]:
    await service.mark_received(db, payment_id, user, payload.reference, bg)
    return ResponseBuilder.success(message="Marked as received.")


router.include_router(admin)


@router.post(
    "/businesses/{business_id}/bank-transfers",
    status_code=status.HTTP_201_CREATED,
    summary="Owner: pay for a pass, plan or top-up by bank transfer",
)
async def request_bank_transfer(
    business_id: UUIDPath, payload: TransferRequest, ctx: OwnerContext, db: DbSession
) -> UnifiedResponse[PaymentRow]:
    del business_id
    payment = await billing.request_transfer(
        db, ctx.business, payload.kind, payload.job_id
    )
    return ResponseBuilder.success(
        data=service.payment_row(payment, ctx.business.name, None),
        message="We'll add it as soon as the transfer arrives.",
        status_code=status.HTTP_201_CREATED,
    )


@router.post(
    "/public/jobs/{slug}/report",
    status_code=status.HTTP_201_CREATED,
    summary="Report a job (fee asked, fake, unfair or other)",
    dependencies=[Depends(RateLimit("public.report", 5, 3600))],
)
async def report_job(
    slug: str, payload: ReportCreate, request: Request, db: DbSession
) -> UnifiedResponse[None]:
    await service.report_job(db, slug, payload, client_ip(request))
    return ResponseBuilder.success(
        message="Thanks. We'll look at this job.", status_code=status.HTTP_201_CREATED
    )
