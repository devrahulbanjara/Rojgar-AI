from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import RedirectResponse
from pydantic import EmailStr, TypeAdapter, ValidationError

from app.core.config import settings
from app.core.dependencies import CandidateUser, DbSession
from app.core.rate_limit import RateLimit, client_ip
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.public import service
from app.modules.public.schemas import (
    ApplicationStatusView,
    ApplySource,
    CareersPage,
    CvPrefill,
    GuestApplicationCreated,
    MagicLinkRequest,
    MagicLinkSent,
    MyApplication,
    PublicJob,
    StatusTokenRequest,
    WithdrawResult,
)

router = APIRouter(tags=["Public apply"])
_EMAIL = TypeAdapter(EmailStr)


def _per_ip(scope: str, times: int, seconds: int, per_email: int | None = None):
    return Depends(RateLimit(f"public.{scope}", times, seconds, per_email=per_email))


@router.get("/public/jobs/{slug}", summary="Public job page (open jobs only)")
async def get_public_job(slug: str, db: DbSession) -> UnifiedResponse[PublicJob]:
    return ResponseBuilder.success(data=await service.get_public_job(db, slug))


@router.get("/public/companies/{slug}/jobs", summary="Company careers page: open jobs")
async def get_careers_page(slug: str, db: DbSession) -> UnifiedResponse[CareersPage]:
    return ResponseBuilder.success(data=await service.get_careers_page(db, slug))


@router.post(
    "/public/cv-prefill",
    summary="Read name/email/phone/links from a CV to fill the apply form",
    dependencies=[_per_ip("cv_prefill", 20, 60)],
)
async def cv_prefill(cv: Annotated[UploadFile, File()]) -> UnifiedResponse[CvPrefill]:
    return ResponseBuilder.success(data=await service.prefill_cv(cv))


@router.post(
    "/public/jobs/{slug}/applications",
    status_code=status.HTTP_201_CREATED,
    summary="Apply without an account",
    dependencies=[_per_ip("apply", 10, 600, per_email=3)],
)
async def apply_as_guest(
    slug: str,
    request: Request,
    bg_tasks: BackgroundTasks,
    db: DbSession,
    full_name: Annotated[str, Form(min_length=1, max_length=255)],
    email: Annotated[str, Form(min_length=3, max_length=255)],
    cv: Annotated[UploadFile, File()],
    consent: Annotated[bool, Form()],
    phone: Annotated[str | None, Form(max_length=30)] = None,
    answers: Annotated[str | None, Form(max_length=20000)] = None,
    src: Annotated[ApplySource, Form()] = "direct",
    turnstile_token: Annotated[str | None, Form(max_length=4096)] = None,
) -> UnifiedResponse[GuestApplicationCreated]:
    try:
        _EMAIL.validate_python(email)
    except ValidationError as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Please enter a valid email."
        ) from exc
    data = await service.submit_guest_application(
        db,
        slug=slug,
        full_name=full_name,
        email=email,
        phone=(phone or "").strip() or None,
        cv=cv,
        answers_json=answers,
        consent=consent,
        source=src,
        turnstile_token=turnstile_token,
        client_ip=client_ip(request),
        bg_tasks=bg_tasks,
    )
    return ResponseBuilder.success(
        data=data, message="Application sent", status_code=status.HTTP_201_CREATED
    )


@router.get(
    "/public/applications/status",
    summary="Application status from the emailed link",
    dependencies=[_per_ip("status", 60, 60)],
)
async def application_status(
    db: DbSession, token: Annotated[str, Query(min_length=10, max_length=2000)]
) -> UnifiedResponse[ApplicationStatusView]:
    return ResponseBuilder.success(data=await service.get_application_status(db, token))


@router.post(
    "/public/applications/withdraw",
    summary="Withdraw an application and delete its data",
    dependencies=[_per_ip("withdraw", 10, 600)],
)
async def withdraw(
    payload: StatusTokenRequest, db: DbSession
) -> UnifiedResponse[WithdrawResult]:
    return ResponseBuilder.success(
        data=await service.withdraw_application(db, payload.token)
    )


@router.post(
    "/public/auth/magic-link",
    summary="Email a one-time sign-in link (same response for any email)",
    dependencies=[_per_ip("magic_link", 5, 900, per_email=3)],
)
async def request_magic_link(
    payload: MagicLinkRequest, db: DbSession
) -> UnifiedResponse[MagicLinkSent]:
    await service.request_magic_link(db, payload.email)
    return ResponseBuilder.success(data=MagicLinkSent())


@router.get(
    "/public/auth/magic",
    summary="Open a sign-in link: sets the session cookie and redirects",
    dependencies=[_per_ip("magic_open", 20, 600)],
)
async def open_magic_link(
    db: DbSession, token: Annotated[str, Query(min_length=10, max_length=200)]
) -> RedirectResponse:
    response = RedirectResponse(
        f"{settings.frontend_url}/me/applications",
        status_code=status.HTTP_303_SEE_OTHER,
    )
    try:
        await service.consume_magic_link(db, token, response)
    except HTTPException:
        return RedirectResponse(
            f"{settings.frontend_url}/login?error=link_invalid",
            status_code=status.HTTP_303_SEE_OTHER,
        )
    return response


@router.get("/me/applications", summary="Signed-in candidate: all my applications")
async def my_applications(
    user: CandidateUser, db: DbSession
) -> UnifiedResponse[list[MyApplication]]:
    return ResponseBuilder.success(data=await service.list_my_applications(db, user))
