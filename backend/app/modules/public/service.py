"""Public, no-account candidate flows: job page, careers page, apply, status,
withdraw, and passwordless sign-in."""

import io
import json
import uuid
from datetime import datetime, timedelta, timezone
from html import escape

import httpx
from fastapi import BackgroundTasks, HTTPException, Response, UploadFile, status
from loguru import logger
from pydantic import ValidationError
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import (
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
    invalidate_job_detail_caches,
)
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import create_tokens
from app.infrastructures.email.service import EmailService
from app.infrastructures.storage.service import storage_service
from app.modules.applications.models import Application
from app.modules.applications.schemas import ApplyRequest
from app.modules.applications.service import apply_to_job
from app.modules.applications.sync import enqueue_application_sync_event
from app.modules.auth.enums import UserRole
from app.modules.auth.models import OAuthAccount, RefreshToken, User
from app.modules.companies.models import Company
from app.modules.jobs.models import Job
from app.modules.profiles.models import Profile
from app.modules.public import cv_text
from app.modules.public.models import MagicLinkToken
from app.modules.public.schemas import (
    ApplicationStatusView,
    CareersPage,
    CvPrefill,
    GuestApplicationCreated,
    MyApplication,
    PublicCompany,
    PublicJob,
    PublicJobSummary,
    ScreeningAnswer,
    WithdrawResult,
)
from app.modules.public.tokens import (
    create_status_token,
    decode_status_token,
    hash_magic_token,
    new_magic_token,
    status_url,
)
from app.modules.resumes.models import Resume
from app.shared.enums import ApplicationStatus, JobStatus, SyncAction

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

# Plain-English status for candidates; AI review state is never shown.
_STATUS_COPY: dict[ApplicationStatus, tuple[str, str | None]] = {
    ApplicationStatus.applied: ("Applied", "The team is reviewing applications."),
    ApplicationStatus.shortlisted: (
        "Shortlisted",
        "Watch your email for an interview invite.",
    ),
    ApplicationStatus.interview_booked: (
        "Interview booked",
        "Check your email for the time and link.",
    ),
    ApplicationStatus.interview_completed: (
        "Interview done",
        "The team will get back to you.",
    ),
    ApplicationStatus.offer: ("Offer received", "Check your email to respond."),
    ApplicationStatus.offer_accepted: ("Offer accepted", None),
    ApplicationStatus.offer_declined: ("Offer declined", None),
    ApplicationStatus.rejected: ("Not selected", None),
}

_WITHDRAWABLE = {
    ApplicationStatus.applied,
    ApplicationStatus.shortlisted,
    ApplicationStatus.interview_booked,
    ApplicationStatus.interview_completed,
    ApplicationStatus.rejected,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _status_copy(app_status: ApplicationStatus) -> tuple[str, str | None]:
    return _STATUS_COPY.get(app_status, (app_status.value.replace("_", " "), None))


def _is_open(job: Job) -> bool:
    return (
        job.status == JobStatus.active
        and not job.hiring_completed
        and (job.expires_at is None or job.expires_at > _now())
    )


def _public_company(company: Company) -> PublicCompany:
    return PublicCompany.model_validate(company)


def _job_summary(job: Job) -> PublicJobSummary:
    return PublicJobSummary(
        slug=job.slug,
        title=job.title,
        location=job.location,
        location_type=job.location_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        currency=job.currency,
        posted_at=job.created_at,
        expires_at=job.expires_at,
    )


async def _load_open_job(db: AsyncSession, slug: str) -> Job:
    job = await db.scalar(
        select(Job).options(selectinload(Job.company)).where(Job.slug == slug)
    )
    if job is None or not _is_open(job):
        # Drafts, closed and filled roles look the same as missing ones.
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="This job is no longer open."
        )
    return job


# ---------------------------------------------------------------- pages


async def get_public_job(db: AsyncSession, slug: str) -> PublicJob:
    job = await _load_open_job(db, slug)
    return PublicJob(
        **_job_summary(job).model_dump(),
        company=_public_company(job.company),
        overview=job.overview,
        responsibilities=job.responsibilities or [],
        requirements=job.requirements or [],
        preferred_qualifications=job.preferred_qualifications or [],
        benefits=job.benefits or [],
        screening_questions=job.screening_questions or [],
    )


async def get_careers_page(db: AsyncSession, company_slug: str) -> CareersPage:
    company = await db.scalar(select(Company).where(Company.slug == company_slug))
    if company is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Company not found.")
    jobs = (
        await db.scalars(
            select(Job)
            .where(
                Job.company_id == company.id,
                Job.status == JobStatus.active,
                Job.hiring_completed.is_(False),
                (Job.expires_at.is_(None)) | (Job.expires_at > _now()),
            )
            .order_by(Job.created_at.desc())
        )
    ).all()
    return CareersPage(
        company=_public_company(company), jobs=[_job_summary(j) for j in jobs]
    )


# ---------------------------------------------------------------- CV prefill


async def prefill_cv(file: UploadFile) -> CvPrefill:
    data = await cv_text.read_cv_upload(file)
    text = await cv_text.extract_text(data)
    return CvPrefill(**cv_text.prefill_from_text(text))


# ---------------------------------------------------------------- apply


async def _verify_turnstile(token: str | None, ip: str) -> None:
    if not settings.turnstile_secret:
        return
    if not token:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Please complete the check."
        )
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                TURNSTILE_VERIFY_URL,
                data={
                    "secret": settings.turnstile_secret,
                    "response": token,
                    "remoteip": ip,
                },
            )
        ok = resp.status_code == 200 and resp.json().get("success") is True
    except (httpx.HTTPError, ValueError):
        ok = False
    if not ok:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Please complete the check again."
        )


def _parse_answers(raw: str | None, questions: list[str]) -> list[dict] | None:
    if not raw:
        if questions:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Please answer the job's questions.",
            )
        return None
    try:
        items = [ScreeningAnswer.model_validate(a) for a in json.loads(raw)]
    except (json.JSONDecodeError, TypeError, ValidationError) as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Answers are not valid."
        ) from exc
    answered = {a.question: a.answer.strip() for a in items}
    missing = [q for q in questions if not answered.get(q)]
    if missing:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Please answer the job's questions.",
        )
    # Only keep answers to questions the job actually asks.
    return [{"question": q, "answer": answered[q]} for q in questions] or None


async def _find_or_create_candidate(
    db: AsyncSession, email: str, full_name: str
) -> User:
    user = await db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None:
        user = User(
            full_name=full_name,
            email=email,
            password_hash=None,
            primary_role=UserRole.candidate,
            is_email_verified=False,
            # Passwordless candidates never see the old onboarding wizard.
            is_onboarded=True,
        )
        db.add(user)
        await db.flush()
        return user
    if user.is_deleted or user.primary_role != UserRole.candidate:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Please use a different email address to apply.",
        )
    return user


async def _enforce_email_rate(db: AsyncSession, user_id: uuid.UUID) -> None:
    since = _now() - timedelta(hours=1)
    recent = await db.scalar(
        select(func.count(Application.id)).where(
            Application.user_id == user_id, Application.created_at >= since
        )
    )
    if (recent or 0) >= settings.guest_applications_per_email_per_hour:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many applications from this email. Try again later.",
        )


def _email_shell(title: str, body_html: str) -> str:
    return f"""
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 520px;
                margin: 0 auto; padding: 24px; color: #1c1917;">
        <h2 style="font-size: 20px; margin: 0 0 16px;">{escape(title)}</h2>
        {body_html}
        <p style="font-size: 12px; color: #78716c; margin-top: 32px;">
            {escape(settings.product_name)}
        </p>
    </div>
    """


def _button(href: str, label: str) -> str:
    return (
        f'<a href="{escape(href)}" style="display:inline-block;background:#1d4ed8;'
        "color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;"
        f'font-weight:600;">{escape(label)}</a>'
    )


async def _send_status_email(
    email: str, job_title: str, company_name: str, token: str, *, again: bool
) -> None:
    link = status_url(token)
    intro = (
        "You've already applied to this job. Here's your status link again."
        if again
        else f"{escape(company_name)} received your application."
    )
    html = _email_shell(
        f"{job_title} at {company_name}",
        f"""<p>{intro}</p>
        <p>{_button(link, "See your application")}</p>
        <p style="font-size:13px;color:#57534e;">Didn't apply? Open the link and
        withdraw — your details will be deleted.</p>""",
    )
    if settings.environment == "dev" and not settings.send_emails:
        logger.info("Dev status link for {}: {}", email, link)
    await EmailService.send_generic_email(
        email, f"Your application: {job_title} at {company_name}", html
    )


async def submit_guest_application(
    db: AsyncSession,
    *,
    slug: str,
    full_name: str,
    email: str,
    phone: str | None,
    cv: UploadFile,
    answers_json: str | None,
    consent: bool,
    source: str,
    turnstile_token: str | None,
    client_ip: str,
    bg_tasks: BackgroundTasks,
) -> GuestApplicationCreated:
    if not consent:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Please agree to share your details with the company.",
        )
    full_name = " ".join(full_name.split())
    if not full_name:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Please enter your name."
        )
    email = email.strip().lower()

    await _verify_turnstile(turnstile_token, client_ip)
    job = await _load_open_job(db, slug)
    answers = _parse_answers(answers_json, job.screening_questions or [])
    cv_bytes = await cv_text.read_cv_upload(cv)

    user = await _find_or_create_candidate(db, email, full_name)

    existing = await db.scalar(
        select(Application.id).where(
            Application.job_id == job.id, Application.user_id == user.id
        )
    )
    if existing is not None:
        await _send_status_email(
            email,
            job.title,
            job.company.name,
            create_status_token(existing),
            again=True,
        )
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="You've already applied. We've emailed your status link again.",
        )
    await _enforce_email_rate(db, user.id)

    text = await cv_text.extract_text(cv_bytes)
    contact = cv_text.prefill_from_text(text)
    cv_key = await storage_service.upload_private_document(
        cv_bytes, "cvs", extension="pdf", content_type="application/pdf"
    )

    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))
    if profile is None:
        db.add(
            Profile(
                user_id=user.id,
                phone=phone,
                linkedin_url=contact["linkedin_url"],
                github_url=contact["github_url"],
                portfolio_url=contact["portfolio_url"],
            )
        )
    resume = Resume(
        user_id=user.id,
        resume_name=f"CV for {job.title}"[:255],
        phone=phone,
        linkedin_url=contact["linkedin_url"],
        github_url=contact["github_url"],
        portfolio_url=contact["portfolio_url"],
        # Raw CV text until background parsing fills in structured fields;
        # this is what screening and the injection rail read meanwhile.
        summary=text[:6000] or None,
        cv_file_key=cv_key,
    )
    db.add(resume)
    await db.flush()

    try:
        created = await apply_to_job(
            db,
            user,
            ApplyRequest(
                job_id=job.id,
                resume_id=resume.id,
                share_profile_all=True,
                share_phone=bool(phone),
            ),
            bg_tasks,
            extra_fields={
                "source": source,
                "consented_at": _now(),
                "screening_answers": answers,
                "shared_full_name": full_name,
                "shared_email_value": email,
                "shared_phone_value": phone,
                "shared_linkedin_url": contact["linkedin_url"],
                "shared_github_url": contact["github_url"],
                "shared_portfolio_url": contact["portfolio_url"],
            },
        )
    except Exception:
        await storage_service.delete_key(cv_key)
        raise

    if settings.llama_cloud_api_key:
        bg_tasks.add_task(enrich_guest_cv, resume.id, created.id, cv_bytes)

    await _send_status_email(
        email, job.title, job.company.name, create_status_token(created.id), again=False
    )
    return GuestApplicationCreated(
        application_id=created.id,
        job_title=job.title,
        company_name=job.company.name,
        email=email,
        status_link_sent=True,
    )


async def enrich_guest_cv(
    resume_id: uuid.UUID, application_id: uuid.UUID, cv_bytes: bytes
) -> None:
    """Background: parse the CV into experience/skills, then refresh screening inputs.

    Runs after the response; failures leave the raw-text resume in place.
    """
    from starlette.datastructures import Headers

    from app.infrastructures.resume_extraction.service import (
        resume_extraction_service,
    )
    from app.modules.applications.service import _compute_resume_embedding
    from app.modules.profiles.ai_import_schemas import ImportedCandidateDocument
    from app.modules.profiles.ai_import_service import (
        _build_data_schema,
        _to_resume_update,
    )
    from app.modules.resumes.service import update_resume

    upload = UploadFile(
        file=io.BytesIO(cv_bytes),
        filename="cv.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )
    try:
        data = await resume_extraction_service.extract_structured(
            file=upload,
            data_schema=_build_data_schema(),
            output_model=ImportedCandidateDocument,
        )
    except Exception as exc:
        logger.warning("CV parsing failed for resume {}: {}", resume_id, exc)
        return

    async with AsyncSessionLocal() as db:
        resume = await db.get(Resume, resume_id)
        application = await db.get(Application, application_id)
        if resume is None or application is None:
            return
        owner = await db.get(User, resume.user_id)
        await update_resume(db, owner, str(resume_id), _to_resume_update(data))
        application = await db.get(Application, application_id)
        application.resume_embedding = await _compute_resume_embedding(db, resume_id)
        job = await db.get(Job, application.job_id)
        await db.commit()

    if job is not None and job.auto_shortlist:
        # Re-score now that experience and skills are known.
        from app.modules.shortlisting.service import score_application_ml_bouncer

        await score_application_ml_bouncer(application_id, settings.database_url)


# ---------------------------------------------------------------- status + withdraw


async def _load_application_for_token(db: AsyncSession, token: str) -> Application:
    application_id = decode_status_token(token)
    application = (
        await db.scalar(
            select(Application)
            .options(selectinload(Application.job).selectinload(Job.company))
            .where(Application.id == application_id)
        )
        if application_id
        else None
    )
    if application is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="This link has expired or the application was withdrawn.",
        )
    return application


async def get_application_status(db: AsyncSession, token: str) -> ApplicationStatusView:
    application = await _load_application_for_token(db, token)
    label, next_step = _status_copy(application.status)
    return ApplicationStatusView(
        application_id=application.id,
        job_title=application.job.title,
        job_slug=application.job.slug,
        company_name=application.job.company.name,
        company_slug=application.job.company.slug,
        status=application.status,
        status_label=label,
        next_step=next_step,
        applied_at=application.created_at,
        updated_at=application.updated_at,
        can_withdraw=application.status in _WITHDRAWABLE,
    )


async def withdraw_application(db: AsyncSession, token: str) -> WithdrawResult:
    """Withdraw and delete this application's data (CV, answers, guest account)."""
    application = await _load_application_for_token(db, token)
    if application.status not in _WITHDRAWABLE:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Offers can't be withdrawn here. Reply to the company instead.",
        )
    job = application.job
    user_id, resume_id = application.user_id, application.resume_id

    enqueue_application_sync_event(db, application.id, SyncAction.DELETE)
    await db.delete(application)
    await db.flush()

    resume = await db.get(Resume, resume_id)
    cv_key = resume.cv_file_key if resume else None
    still_used = await db.scalar(
        select(func.count(Application.id)).where(Application.resume_id == resume_id)
    )
    if resume is not None and resume.cv_file_key and not still_used:
        await db.delete(resume)
    else:
        cv_key = None

    data_deleted = False
    user = await db.get(User, user_id)
    remaining = await db.scalar(
        select(func.count(Application.id)).where(Application.user_id == user_id)
    )
    has_login = user is not None and (
        user.password_hash
        or await db.scalar(
            select(OAuthAccount.id).where(OAuthAccount.user_id == user_id).limit(1)
        )
    )
    if user is not None and not remaining and not has_login:
        await db.delete(user)
        data_deleted = True

    await db.commit()
    if cv_key:
        await storage_service.delete_key(cv_key)
    await invalidate_company_application_caches(str(job.company_id))
    await invalidate_company_dashboard_caches(db, str(job.company_id))
    await invalidate_job_detail_caches(str(job.id))
    return WithdrawResult(withdrawn=True, data_deleted=data_deleted)


# ---------------------------------------------------------------- magic link


async def request_magic_link(db: AsyncSession, email: str) -> None:
    """Email a one-time sign-in link. Same response whether or not the email exists."""
    email = email.strip().lower()
    user = await db.scalar(select(User).where(func.lower(User.email) == email))
    if user is not None and (
        user.is_deleted or user.primary_role != UserRole.candidate
    ):
        return  # recruiters use their password; never reveal that here

    since = _now() - timedelta(minutes=15)
    recent = await db.scalar(
        select(func.count(MagicLinkToken.id)).where(
            MagicLinkToken.email == email, MagicLinkToken.created_at >= since
        )
    )
    if (recent or 0) >= settings.magic_links_per_email_per_15_min:
        return

    token, token_hash = new_magic_token()
    db.add(
        MagicLinkToken(
            email=email,
            token_hash=token_hash,
            expires_at=_now() + timedelta(minutes=settings.magic_link_ttl_minutes),
        )
    )
    await db.commit()

    link = f"{settings.backend_url}/public/auth/magic?token={token}"
    html = _email_shell(
        f"Sign in to {settings.product_name}",
        f"""<p>{_button(link, "Sign in")}</p>
        <p style="font-size:13px;color:#57534e;">This link works once and expires
        in {settings.magic_link_ttl_minutes} minutes. Didn't ask for it? Ignore this email.</p>""",
    )
    if settings.environment == "dev" and not settings.send_emails:
        logger.info("Dev magic link for {}: {}", email, link)
    await EmailService.send_generic_email(
        email, f"Your {settings.product_name} sign-in link", html
    )


async def consume_magic_link(db: AsyncSession, token: str, response: Response) -> User:
    """Validate a one-time token, sign the candidate in (refresh cookie), return the user."""
    row = await db.scalar(
        select(MagicLinkToken)
        .where(MagicLinkToken.token_hash == hash_magic_token(token))
        .with_for_update()
    )
    if row is None or row.used_at is not None or row.expires_at <= _now():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="link_invalid")
    row.used_at = _now()

    user = await db.scalar(select(User).where(func.lower(User.email) == row.email))
    if user is None:
        user = User(
            full_name=row.email.split("@")[0],
            email=row.email,
            primary_role=UserRole.candidate,
            is_email_verified=True,
            is_onboarded=True,
        )
        db.add(user)
        await db.flush()
    elif user.is_deleted or user.primary_role != UserRole.candidate:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="link_invalid")
    # Opening the emailed link proves the address.
    user.is_email_verified = True

    tokens, jti, refresh_expires_at = create_tokens(str(user.id))
    db.add(RefreshToken(user_id=user.id, jti=jti, expires_at=refresh_expires_at))
    await db.execute(delete(MagicLinkToken).where(MagicLinkToken.expires_at < _now()))
    await db.commit()

    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=settings.environment.lower() == "prod",
        samesite="lax",
        path="/",
        expires=refresh_expires_at,
    )
    return user


# ---------------------------------------------------------------- signed-in candidate


async def list_my_applications(db: AsyncSession, user: User) -> list[MyApplication]:
    rows = (
        await db.scalars(
            select(Application)
            .options(selectinload(Application.job).selectinload(Job.company))
            .where(Application.user_id == user.id)
            .order_by(Application.updated_at.desc())
        )
    ).all()
    items = []
    for application in rows:
        label, next_step = _status_copy(application.status)
        items.append(
            MyApplication(
                application_id=application.id,
                job_title=application.job.title,
                job_slug=application.job.slug,
                company_name=application.job.company.name,
                company_slug=application.job.company.slug,
                company_logo_url=application.job.company.logo_url,
                status=application.status,
                status_label=label,
                next_step=next_step,
                applied_at=application.created_at,
                updated_at=application.updated_at,
            )
        )
    return items
