"""Public, no-account candidate flows: job page, careers page, apply, status,
withdraw, and passwordless sign-in."""

import io
import json
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from html import escape

import httpx
from fastapi import BackgroundTasks, HTTPException, Response, UploadFile, status
from loguru import logger
from pydantic import ValidationError
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import (
    invalidate_company_application_caches,
    invalidate_job_detail_caches,
)
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import create_tokens
from app.infrastructures.email.service import EmailService
from app.infrastructures.storage.service import storage_service
from app.modules.admin.guards import is_publicly_visible, taken_down_job_ids
from app.modules.applications.models import Application
from app.modules.applications.pipeline import find_or_create_person, new_referrer_token
from app.modules.applications.service import (
    create_application,
    invalidate_after_new_application,
    job_is_open,
    schedule_review,
)
from app.modules.applications.sync import enqueue_application_sync_event
from app.modules.auth.enums import BusinessStatus
from app.modules.auth.models import OAuthAccount, RefreshToken, User
from app.modules.companies.models import Company
from app.modules.interviews.models import Interview, InterviewStatus
from app.modules.jobs.models import Job, JobReferrer
from app.modules.public import cv_text
from app.modules.public.models import JobSuggestion, MagicLinkToken
from app.modules.public.notify import notify_applicant
from app.modules.public.schemas import (
    ApplicationStatusView,
    CareersPage,
    CvPrefill,
    GuestApplicationCreated,
    InterviewInfo,
    MyApplication,
    PublicCategory,
    PublicCompany,
    PublicJob,
    PublicJobSummary,
    PublicQuestion,
    RecommendRequest,
    RecommendSent,
    ScreeningAnswer,
    Stage,
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
from app.shared.enums import (
    JOB_CATEGORY_LABELS,
    ApplicationSource,
    ApplicationStage,
    JobStatus,
    QuestionType,
    SyncAction,
)
from app.shared.normalize import normalize_mobile

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
SUGGESTIONS_PER_REFERRER_PER_DAY = 20

_WITHDRAWABLE = {
    ApplicationStage.new,
    ApplicationStage.shortlisted,
    ApplicationStage.interview,
    ApplicationStage.rejected,
}


def _now() -> datetime:
    return datetime.now(UTC)


_STAGE: dict[ApplicationStage, Stage] = {
    ApplicationStage.new: "new",
    ApplicationStage.shortlisted: "shortlisted",
    ApplicationStage.interview: "interview",
    ApplicationStage.offer: "offer",
    ApplicationStage.hired: "hired",
    ApplicationStage.rejected: "not_selected",
    ApplicationStage.withdrawn: "withdrawn",
}


def _stage_for(stage: ApplicationStage | None) -> Stage:
    return _STAGE.get(stage, "new") if stage else "new"


def _public_company(company: Company) -> PublicCompany:
    return PublicCompany.model_validate(company)


def _job_summary(job: Job) -> PublicJobSummary:
    return PublicJobSummary(
        slug=job.slug,
        title=job.title,
        location=job.location,
        location_type=job.location_type,
        category=PublicCategory(
            value=job.category, label=JOB_CATEGORY_LABELS[job.category]
        ),
        employment_type=job.employment_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        currency=job.currency,
        posted_at=job.created_at,
        closes_at=job.closes_at,
    )


async def _load_open_job(db: AsyncSession, slug: str) -> Job:
    job = await db.scalar(
        select(Job).options(selectinload(Job.company)).where(Job.slug == slug)
    )
    if (
        job is None
        or not job_is_open(job)
        or not await is_publicly_visible(db, job, job.company)
    ):
        # Drafts, closed, filled, suspended and unpublished roles look the
        # same as missing ones.
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail="This job is no longer available."
        )
    return job


# ---------------------------------------------------------------- pages


async def _referrer_for(
    db: AsyncSession, job: Job, token: str | None
) -> JobReferrer | None:
    if not token:
        return None
    return await db.scalar(
        select(JobReferrer).where(
            JobReferrer.job_id == job.id, JobReferrer.token == token.strip()
        )
    )


async def get_public_job(
    db: AsyncSession, slug: str, ref: str | None = None
) -> PublicJob:
    job = await _load_open_job(db, slug)
    referrer = await _referrer_for(db, job, ref)
    suggestion = None if referrer else await _suggestion_for(db, job, ref)
    shared_by = (
        referrer.name if referrer else suggestion.referrer_name if suggestion else None
    )
    return PublicJob(
        **_job_summary(job).model_dump(),
        company=_public_company(job.company),
        description=job.description or "",
        must_haves=job.must_haves or [],
        nice_to_haves=job.nice_to_haves or [],
        questions=[PublicQuestion.model_validate(q) for q in job.questions or []],
        shared_by=shared_by,
    )


async def get_careers_page(db: AsyncSession, company_slug: str) -> CareersPage:
    company = await db.scalar(select(Company).where(Company.slug == company_slug))
    if company is None or company.status == BusinessStatus.suspended:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Company not found.")
    hidden = await taken_down_job_ids(db, company.id)
    jobs = (
        await db.scalars(
            select(Job)
            .where(
                Job.company_id == company.id,
                Job.status == JobStatus.open,
                (Job.closes_at.is_(None)) | (Job.closes_at > _now()),
            )
            .order_by(Job.created_at.desc())
        )
    ).all()
    return CareersPage(
        company=_public_company(company),
        jobs=[_job_summary(j) for j in jobs if j.id not in hidden],
    )


# ---------------------------------------------------------------- CV prefill


async def prefill_cv(file: UploadFile) -> CvPrefill:
    cv = await cv_text.read_cv_upload(file)
    if cv.is_photo:
        return CvPrefill()  # photos are kept as they are; nothing to read quickly
    found = cv_text.prefill_from_text(await cv_text.extract_text(cv.data))
    return CvPrefill(
        full_name=found["full_name"],
        email=found["email"],
        phone=normalize_mobile(found["phone"]),
    )


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


_YES = {"yes", "y", "ho", "हो", "छ"}
_NO = {"no", "n", "haina", "होइन", "छैन"}


def parse_answers(raw: str | None, questions: list[dict]) -> list[dict] | None:
    """Validate answers against the job's questions; keep only those asked.

    Required questions must be answered; yes/no answers are stored as
    "yes"/"no" (English or Nepali input accepted).
    """
    items: list[ScreeningAnswer] = []
    if raw:
        try:
            items = [ScreeningAnswer.model_validate(a) for a in json.loads(raw)]
        except (json.JSONDecodeError, TypeError, ValidationError) as exc:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Answers are not valid."
            ) from exc
    given = {" ".join(a.question.split()): a.answer.strip() for a in items}
    out: list[dict] = []
    for question in questions:
        label = question["label"]
        answer = given.get(label, "")
        if question.get("type") == QuestionType.yes_no.value and answer:
            key = answer.casefold()
            if key in _YES:
                answer = "yes"
            elif key in _NO:
                answer = "no"
            else:
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"Please answer yes or no: {label}",
                )
        if not answer:
            if question.get("required", True):
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Please answer the job's questions.",
                )
            continue
        out.append({"question": label, "answer": answer})
    return out or None


async def _enforce_person_rate(db: AsyncSession, user_id: uuid.UUID) -> None:
    since = _now() - timedelta(hours=1)
    recent = await db.scalar(
        select(func.count(Application.id)).where(
            Application.user_id == user_id, Application.created_at >= since
        )
    )
    if (recent or 0) >= settings.guest_applications_per_email_per_hour:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many applications from this person. Try again later.",
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


async def _send_status_link(
    *, phone: str, email: str | None, job: Job, application_id: uuid.UUID, again: bool
) -> tuple[bool, str]:
    """Status link by email when they gave one, and by SMS when SMS is on.

    Returns (sent, link); the done screen shows the link either way.
    """
    token = create_status_token(application_id)
    link = status_url(token)
    sent = await notify_applicant(
        phone, "received", company=job.company.name, job=job.title, url=link
    )
    if email:
        await _send_status_email(email, job.title, job.company.name, token, again=again)
        sent = True
    return sent, link


async def submit_guest_application(
    db: AsyncSession,
    *,
    slug: str,
    full_name: str,
    phone: str,
    email: str | None,
    cv: UploadFile | None,
    answers_json: str | None,
    consent: bool,
    source: str,
    ref: str | None,
    turnstile_token: str | None,
    client_ip: str,
    bg_tasks: BackgroundTasks,
) -> GuestApplicationCreated:
    """Apply without an account: name + (email or phone) + answers, CV optional."""
    if not consent:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Please agree to share your details with the business.",
        )
    full_name = " ".join(full_name.split())
    if not full_name:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Please enter your name."
        )
    normalized_phone = normalize_mobile(phone)
    if normalized_phone is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Please enter a valid mobile number.",
        )
    phone = normalized_phone
    email = email.strip().lower() if email and email.strip() else None

    await _verify_turnstile(turnstile_token, client_ip)
    job = await _load_open_job(db, slug)
    answers = parse_answers(answers_json, list(job.questions or []))
    cv_file = await cv_text.read_cv_upload(cv) if cv is not None else None

    user = await find_or_create_person(
        db,
        full_name=full_name,
        email=email,
        phone=phone,
        company_id=job.company_id,
    )
    existing = await db.scalar(
        select(Application.id).where(
            Application.job_id == job.id, Application.user_id == user.id
        )
    )
    if existing is not None:
        # The link itself is never returned here: anyone can type a number.
        resent, _link = await _send_status_link(
            phone=phone, email=email, job=job, application_id=existing, again=True
        )
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="You've already applied. We've sent your status link again."
            if resent
            else "You've already applied to this job.",
        )
    await _enforce_person_rate(db, user.id)

    suggestion = await _suggestion_for(db, job, ref)
    referrer = (
        await _referrer_for_suggestion(db, job, suggestion)
        if suggestion is not None
        else await _referrer_for(db, job, ref)
    )

    text = ""
    cv_key = None
    if cv_file is not None:
        if not cv_file.is_photo:
            text = await cv_text.extract_text(cv_file.data)
        cv_key = await storage_service.upload_private_document(
            cv_file.data,
            f"cv/{job.company_id}",
            extension=cv_file.extension,
            content_type=cv_file.content_type,
        )
    contact = cv_text.prefill_from_text(text)

    # No CV, no resume row: the application is reviewed on the answers alone.
    resume = None
    if cv_file is not None:
        resume = Resume(
            user_id=user.id,
            resume_name=f"CV for {job.title}"[:255],
            phone=phone,
            linkedin_url=contact["linkedin_url"],
            github_url=contact["github_url"],
            portfolio_url=contact["portfolio_url"],
            # Raw CV text until background parsing fills in structured fields;
            # this is what the review and the injection rail read meanwhile.
            summary=text[:6000] or None,
            cv_file_key=cv_key,
        )
        db.add(resume)
        await db.flush()

    try:
        application, sync_event = await create_application(
            db,
            job=job,
            user=user,
            resume_id=resume.id if resume else None,
            source=ApplicationSource.referral.value if referrer else source,
            referrer_id=referrer.id if referrer else None,
            flag_reason=cv_text.PHOTO_NOT_READ
            if cv_file is not None and cv_file.is_photo
            else None,
            fields={
                "consented_at": _now(),
                "screening_answers": answers,
                "share_phone": True,
                "shared_full_name": full_name,
                "shared_email_value": email,
                "shared_phone_value": phone,
                "shared_linkedin_url": contact["linkedin_url"],
                "shared_github_url": contact["github_url"],
                "shared_portfolio_url": contact["portfolio_url"],
            },
        )
        if suggestion is not None and suggestion.application_id is None:
            suggestion.application_id = application.id
        await db.commit()
    except Exception:
        await db.rollback()
        if cv_key:
            await storage_service.delete_key(cv_key)
        raise

    # A PDF is parsed first; that task then runs the review on the parsed CV.
    parse_first = bool(
        settings.llama_cloud_api_key
        and resume is not None
        and cv_file is not None
        and not cv_file.is_photo
    )
    if parse_first:
        bg_tasks.add_task(enrich_guest_cv, resume.id, application.id, cv_file.data)
    schedule_review(bg_tasks, application.id, sync_event.id, review=not parse_first)
    await invalidate_after_new_application(job)

    sent, link = await _send_status_link(
        phone=phone, email=email, job=job, application_id=application.id, again=False
    )
    return GuestApplicationCreated(
        application_id=application.id,
        job_title=job.title,
        company_name=job.company.name,
        phone=phone,
        email=email,
        status_link_sent=sent,
        status_url=None if email else link,
    )


async def _suggestion_for(
    db: AsyncSession, job: Job, token: str | None
) -> JobSuggestion | None:
    if not token:
        return None
    return await db.scalar(
        select(JobSuggestion).where(
            JobSuggestion.job_id == job.id, JobSuggestion.token == token
        )
    )


async def _referrer_for_suggestion(
    db: AsyncSession, job: Job, suggestion: JobSuggestion
) -> JobReferrer:
    """The person who suggested the applicant, as the job's referrer.

    Their own share link when they came through one, else a new referrer row,
    so the business sees "Referred by <name>" like any referral.
    """
    referrer = await _referrer_for(db, job, suggestion.referrer_ref)
    if referrer is None:
        referrer = JobReferrer(
            job_id=job.id,
            name=suggestion.referrer_name,
            phone=suggestion.referrer_phone,
            token=new_referrer_token(),
        )
        db.add(referrer)
        await db.flush()
    return referrer


# ---------------------------------------------------------------- suggest someone


def _suggestion_url(job: Job, token: str) -> str:
    return f"{settings.frontend_url}/jobs/{job.slug}?src=referral&ref={token}"


async def recommend(
    db: AsyncSession, slug: str, payload: RecommendRequest
) -> RecommendSent:
    """Store a suggestion and return the suggested person's own apply link.

    The person is texted the link when SMS is on. Suggesting the same number
    twice for a job returns the same link and texts once.
    """
    job = await _load_open_job(db, slug)
    phone = normalize_mobile(payload.phone)
    if phone is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Please enter their mobile number.",
        )
    referrer_phone = None
    if payload.referrer_phone and payload.referrer_phone.strip():
        referrer_phone = normalize_mobile(payload.referrer_phone)
        if referrer_phone is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Please check your mobile number.",
            )
    if referrer_phone == phone:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Their number must be different from yours.",
        )
    name = " ".join(payload.name.split())
    referrer_name = " ".join(payload.referrer_name.split())
    if not name or not referrer_name:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Please enter both names."
        )

    already = await db.scalar(
        select(JobSuggestion.token).where(
            JobSuggestion.job_id == job.id, JobSuggestion.phone == phone
        )
    )
    if already is not None:
        return RecommendSent(sent=False, job_url=_suggestion_url(job, already))
    if referrer_phone:
        since = _now() - timedelta(days=1)
        today = await db.scalar(
            select(func.count(JobSuggestion.id)).where(
                JobSuggestion.referrer_phone == referrer_phone,
                JobSuggestion.created_at >= since,
            )
        )
        if (today or 0) >= SUGGESTIONS_PER_REFERRER_PER_DAY:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                detail="That's a lot of suggestions today. Try again tomorrow.",
            )

    token = secrets.token_urlsafe(12)
    db.add(
        JobSuggestion(
            job_id=job.id,
            referrer_name=referrer_name[:255],
            referrer_phone=referrer_phone,
            referrer_ref=payload.ref,
            name=name[:255],
            phone=phone,
            note=(payload.note or "").strip() or None,
            token=token,
        )
    )
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()  # the same person was suggested a moment ago
        token = await db.scalar(
            select(JobSuggestion.token).where(
                JobSuggestion.job_id == job.id, JobSuggestion.phone == phone
            )
        )
        return RecommendSent(sent=False, job_url=_suggestion_url(job, token))

    url = _suggestion_url(job, token)
    sent = await notify_applicant(
        phone,
        "suggested",
        referrer=referrer_name,
        company=job.company.name,
        job=job.title,
        url=url,
    )
    return RecommendSent(sent=sent, job_url=url)


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
    from app.modules.resumes.parse import ParsedCv, apply_parsed_cv, extraction_schema
    from app.modules.review.service import review_application

    upload = UploadFile(
        file=io.BytesIO(cv_bytes),
        filename="cv.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )
    try:
        parsed = await resume_extraction_service.extract_structured(
            file=upload,
            data_schema=extraction_schema(),
            output_model=ParsedCv,
        )
        async with AsyncSessionLocal() as db:
            await apply_parsed_cv(db, resume_id, parsed)
            await db.commit()
    except Exception as exc:  # noqa: BLE001 - the raw-text CV is reviewed instead
        logger.warning("CV parsing failed for resume {}: {}", resume_id, exc)
    finally:
        # The review always runs, on the parsed CV or the raw text.
        await review_application(application_id)


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


async def _interviews_for(
    db: AsyncSession, application_ids: list[uuid.UUID]
) -> dict[uuid.UUID, InterviewInfo]:
    """The latest booked (or done) interview of each application."""
    if not application_ids:
        return {}
    rows = (
        await db.scalars(
            select(Interview)
            .where(
                Interview.application_id.in_(application_ids),
                Interview.status != InterviewStatus.cancelled,
            )
            .order_by(Interview.start_time.desc())
        )
    ).all()
    found: dict[uuid.UUID, InterviewInfo] = {}
    for row in rows:
        if row.application_id in found:
            continue
        link = row.location if (row.location or "").startswith("https://") else None
        found[row.application_id] = InterviewInfo(
            starts_at=row.start_time,
            ends_at=row.end_time,
            location=None if link else row.location,
            join_url=link,
        )
    return found


async def get_application_status(db: AsyncSession, token: str) -> ApplicationStatusView:
    application = await _load_application_for_token(db, token)
    interviews = await _interviews_for(db, [application.id])
    return ApplicationStatusView(
        application_id=application.id,
        job_title=application.job.title,
        job_slug=application.job.slug,
        company_name=application.job.company.name,
        company_slug=application.job.company.slug,
        stage=_stage_for(application.stage),
        interview=interviews.get(application.id),
        applied_at=application.created_at,
        updated_at=application.updated_at,
        can_withdraw=application.stage in _WITHDRAWABLE,
    )


async def withdraw_application(db: AsyncSession, token: str) -> WithdrawResult:
    """Withdraw and delete this application's data (CV, answers, guest account)."""
    application = await _load_application_for_token(db, token)
    if application.stage not in _WITHDRAWABLE:
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
    await invalidate_job_detail_caches(str(job.id))
    return WithdrawResult(withdrawn=True, data_deleted=data_deleted)


# ---------------------------------------------------------------- magic link


async def request_magic_link(db: AsyncSession, email: str) -> None:
    """Email a one-time sign-in link. Same response whether or not the email exists."""
    email = email.strip().lower()
    user = await db.scalar(select(User).where(func.lower(User.email) == email))
    if user is not None and user.is_deleted:
        return

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
            is_email_verified=True,
            is_onboarded=True,
        )
        db.add(user)
        await db.flush()
    elif user.is_deleted:
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
    interviews = await _interviews_for(db, [a.id for a in rows])
    return [
        MyApplication(
            application_id=application.id,
            job_title=application.job.title,
            job_slug=application.job.slug,
            company_name=application.job.company.name,
            company_slug=application.job.company.slug,
            company_logo_url=application.job.company.logo_url,
            stage=_stage_for(application.stage),
            interview=interviews.get(application.id),
            applied_at=application.created_at,
            updated_at=application.updated_at,
            status_token=create_status_token(application.id),
        )
        for application in rows
    ]
