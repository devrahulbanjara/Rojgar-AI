import os
import uuid
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
    invalidate_interview_list_caches,
    invalidate_job_detail_caches,
)
from app.core.config import settings
from app.core.swr_cache import swr_get
from app.infrastructures.email.service import EmailService
from app.infrastructures.qdrant.service import qdrant_service
from app.infrastructures.redis.service import redis_service
from app.modules.activity.schemas import ActivityEventResponse
from app.modules.activity.service import (
    create_activity_event,
    list_application_timeline,
)
from app.modules.applications.models import Application
from app.modules.applications.schemas import (
    ApplicantSummary,
    ApplicationListItem,
    ApplicationOutreachAuditItem,
    ApplicationResponse,
    ApplyRequest,
    CandidateApplicationView,
    CandidateShareSettings,
    RecruiterApplicationView,
    RecruiterCandidateApplicationSummary,
    RecruiterCandidateDetailView,
    RecruiterCandidateInterviewView,
    RecruiterCandidateListItem,
    SemanticCandidateSearchResponse,
    SemanticCandidateSearchResult,
    SimilarCandidateResult,
    SimilarCandidatesResponse,
    UpdateApplicationReviewRequest,
    RECRUITER_STATUS_TRANSITIONS,
    UpdateApplicationStatusRequest,
)
from app.modules.applications.sync import (
    enqueue_application_sync_event,
)
from app.modules.applications.sync import (
    process_sync_event as process_application_sync_event,
)
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.audit.service import create_custom_audit_log
from app.modules.companies.models import Company, CompanyMembership
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job
from app.modules.outreach.models import EmailDraft
from app.modules.profiles.models import Profile
from app.infrastructures.guardrails import guardrails_service
from app.modules.resume_gap.service import (
    consume_pending_patch as consume_pending_resume_patch,
    resume_text_for_guardrails,
)
from app.modules.resumes.models import Resume
from app.modules.resumes.schemas import ResumeResponse
from app.shared.enums import ApplicationStatus, JobStatus


async def _compute_resume_embedding(
    db: AsyncSession, resume_id: uuid.UUID
) -> list[float]:
    """Build resume text and compute its Gemini embedding for ML bouncer."""
    from app.infrastructures.ai.service import ai_service

    resume = await db.scalar(
        select(Resume)
        .where(Resume.id == resume_id)
        .options(
            selectinload(Resume.experiences),
            selectinload(Resume.educations),
            selectinload(Resume.skills),
        )
    )
    parts = [
        f"HEADLINE: {resume.headline or ''}",
        f"SUMMARY: {resume.summary or ''}",
        f"YEARS OF EXPERIENCE: {resume.years_of_experience if resume and resume.years_of_experience is not None else 'unknown'}",
    ]
    if resume.experiences:
        exp_strs = [
            f"{e.title or ''} at {e.company_name or ''}".strip()
            for e in resume.experiences
        ]
        parts.append(f"EXPERIENCE: {', '.join(exp_strs)}")
    if resume.educations:
        edu_strs = [
            " ".join(p for p in [e.degree, e.field_of_study, e.institution] if p)
            for e in resume.educations
        ]
        parts.append(f"EDUCATION: {', '.join(edu_strs)}")
    if resume.skills:
        parts.append(
            f"SKILLS: {', '.join(s.skill_name for s in resume.skills if s.skill_name)}"
        )
    text = "\n\n".join(parts)
    return await ai_service.get_embeddings(text)


def _application_detail_href(application_id: str) -> str:
    """Build the candidate-facing application detail URL path."""
    return f"/candidate/applications/{application_id}"


def _recruiter_candidate_href(application_id: str) -> str:
    """Build the recruiter-facing candidate detail URL path."""
    return f"/recruiter/candidates/{application_id}"


_EMAIL_STATUSES = {
    ApplicationStatus.shortlisted,
    ApplicationStatus.rejected,
    ApplicationStatus.offer,
}

_CANDIDATE_VISIBLE_STATUSES = {
    ApplicationStatus.shortlisted,
    ApplicationStatus.interview_booked,
    ApplicationStatus.interview_completed,
    ApplicationStatus.offer,
    ApplicationStatus.offer_accepted,
    ApplicationStatus.offer_declined,
    ApplicationStatus.rejected,
}


def _status_email_html(
    status: ApplicationStatus,
    *,
    applicant_name: str,
    job_title: str,
    company_name: str,
    app_href: str,
) -> tuple[str, str]:
    """Returns (subject, html_body) for candidate status notification emails."""
    link = f"{settings.frontend_url}{app_href}"
    if status == ApplicationStatus.shortlisted:
        subject = f"You've been shortlisted for {job_title}"
        body = (
            f"<p>Hi {applicant_name},</p>"
            f"<p>Great news — <strong>{company_name}</strong> has shortlisted you "
            f"for <strong>{job_title}</strong>.</p>"
            f'<p><a href="{link}">View your application</a></p>'
        )
    elif status == ApplicationStatus.rejected:
        subject = f"Update on your application for {job_title}"
        body = (
            f"<p>Hi {applicant_name},</p>"
            f"<p><strong>{company_name}</strong> has closed your application "
            f"for <strong>{job_title}</strong>. Thank you for your interest.</p>"
            f'<p><a href="{link}">View details</a></p>'
        )
    elif status == ApplicationStatus.offer:
        subject = f"An offer has been recorded for {job_title}"
        body = (
            f"<p>Hi {applicant_name},</p>"
            f"<p><strong>{company_name}</strong> has recorded an offer for you "
            f"for <strong>{job_title}</strong>.</p>"
            f'<p><a href="{link}">Review and respond</a></p>'
        )
    else:
        return "", ""
    return subject, body


def _status_event_copy(
    status: ApplicationStatus,
    *,
    applicant_name: str,
    job_title: str,
    company_name: str,
) -> tuple[str, str]:
    """Return activity-event title and description text for a status change."""
    if status == ApplicationStatus.shortlisted:
        return (
            f"Shortlisted for {job_title}",
            f"{company_name} shortlisted {applicant_name} for {job_title}.",
        )
    if status == ApplicationStatus.rejected:
        return (
            f"Application closed for {job_title}",
            f"{company_name} closed the application for {job_title}.",
        )
    if status == ApplicationStatus.interview_completed:
        return (
            f"Interview completed for {job_title}",
            f"The interview for {job_title} was marked complete.",
        )
    if status == ApplicationStatus.offer:
        return (
            f"Offer recorded for {job_title}",
            f"{company_name} recorded an offer for {applicant_name}.",
        )
    return (
        f"Application updated for {job_title}",
        f"{company_name} updated the application for {job_title}.",
    )


def _status_visible_to_candidate(status: ApplicationStatus) -> bool:
    """Reveal recruiter decision fields when the application has moved beyond applied."""
    return status in _CANDIDATE_VISIBLE_STATUSES


def _mask_for_candidate(
    application: Application, _job: Job
) -> tuple[ApplicationStatus, int | None, list[str] | None, list[str] | None]:
    """Return (visible_status, visible_score, visible_strengths, visible_weaknesses) for a candidate view.

    Show recruiter decisions/AI signals only after the application has progressed
    to shortlist/interview/offer/rejected stages.
    """
    if _status_visible_to_candidate(application.status):
        return (
            application.status,
            application.score,
            application.strengths,
            application.weaknesses,
        )
    return ApplicationStatus.applied, None, None, None


def _candidate_next_step_hint(status: ApplicationStatus) -> str:
    """Return a human-friendly next-step hint for a candidate-facing status view."""
    if status == ApplicationStatus.applied:
        return "Your application has been submitted. You'll see updates when the recruiter moves this application forward."
    if status == ApplicationStatus.shortlisted:
        return "You have been shortlisted. Watch for outreach or interview booking instructions."
    if status == ApplicationStatus.interview_booked:
        return "Your interview is booked. Review the schedule and prepare with the resume you used for this application."
    if status == ApplicationStatus.interview_completed:
        return "Your interview is complete. The recruiter can now move this application to offer or rejection."
    if status == ApplicationStatus.offer:
        return "An offer has been recorded for this application."
    return "This application is no longer moving through the process."


def _company_applications_cache_key(
    company_id: str,
    job_id: str | None,
    page: int,
    size: int,
) -> str:
    """Build the Redis cache key for recruiter application list queries."""
    job_scope = job_id or "all"
    return f"applications:company:{company_id}:job:{job_scope}:p{page}:s{size}"


def _company_candidates_cache_key(
    company_id: str,
    job_id: str | None,
    status_filter: ApplicationStatus | None,
    page: int,
    size: int,
) -> str:
    """Build the Redis cache key for recruiter candidate list queries."""
    job_scope = job_id or "all"
    status_scope = status_filter.value if status_filter is not None else "all"
    return (
        f"applications:company:{company_id}:candidates:job:{job_scope}:"
        f"status:{status_scope}:p{page}:s{size}"
    )


def _company_candidate_detail_cache_key(company_id: str, application_id: str) -> str:
    """Build the Redis cache key for one recruiter candidate detail view."""
    return f"applications:company:{company_id}:candidate-detail:{application_id}"


def _build_share_settings(payload: ApplyRequest) -> CandidateShareSettings:
    """Derive persisted share settings from an application request payload."""
    if payload.share_profile_all:
        return CandidateShareSettings(
            share_profile_all=True,
            share_avatar=True,
            share_email=True,
            share_phone=True,
            share_location=True,
            share_links=True,
            share_headline_summary=True,
        )

    return CandidateShareSettings(
        share_profile_all=False,
        share_avatar=payload.share_avatar,
        share_email=True,
        share_phone=payload.share_phone,
        share_location=payload.share_location,
        share_links=payload.share_links,
        share_headline_summary=payload.share_headline_summary,
    )


def _application_share_settings(application: Application) -> CandidateShareSettings:
    """Read the effective share settings from a persisted application."""
    if application.share_profile_all:
        return CandidateShareSettings(
            share_profile_all=True,
            share_avatar=True,
            share_email=True,
            share_phone=True,
            share_location=True,
            share_links=True,
            share_headline_summary=True,
        )

    return CandidateShareSettings(
        share_profile_all=False,
        share_avatar=application.share_avatar,
        share_email=application.share_email,
        share_phone=application.share_phone,
        share_location=application.share_location,
        share_links=application.share_links,
        share_headline_summary=application.share_headline_summary,
    )


def _application_response_options():
    """SQLAlchemy loader options for building a full ApplicationResponse."""
    return [
        joinedload(Application.resume).selectinload(Resume.experiences),
        joinedload(Application.resume).selectinload(Resume.educations),
        joinedload(Application.resume).selectinload(Resume.skills),
    ]


async def _get_outreach_audit_items(
    db: AsyncSession,
    application_id,
) -> list[ApplicationOutreachAuditItem]:
    """Fetch outreach draft audit rows for one application."""
    result = await db.execute(
        select(EmailDraft)
        .where(EmailDraft.application_id == application_id)
        .order_by(EmailDraft.updated_at.asc())
    )
    return [
        ApplicationOutreachAuditItem(
            draft_id=draft.id,
            subject=draft.subject,
            is_approved=draft.is_approved,
            is_sent=draft.is_sent,
            is_discarded=draft.is_discarded,
            generated_by_user_id=draft.generated_by_user_id,
            approved_by_user_id=draft.approved_by_user_id,
            approved_at=draft.approved_at,
            sent_by_user_id=draft.sent_by_user_id,
            sent_at=draft.sent_at,
            discarded_by_user_id=draft.discarded_by_user_id,
            discarded_at=draft.discarded_at,
            updated_at=draft.updated_at,
        )
        for draft in result.scalars().all()
    ]


def _build_shared_profile_snapshot(
    user: User,
    profile: Profile | None,
    share_settings: CandidateShareSettings,
) -> dict[str, str | None]:
    """Build the shared_* snapshot stored on the application at apply time."""
    return {
        "shared_full_name": user.full_name,
        "shared_avatar_url": user.avatar_url if share_settings.share_avatar else None,
        "shared_email_value": user.email,
        "shared_phone_value": profile.phone
        if profile and share_settings.share_phone
        else None,
        "shared_location_value": profile.location
        if profile and share_settings.share_location
        else None,
        "shared_headline_value": profile.headline
        if profile and share_settings.share_headline_summary
        else None,
        "shared_summary_value": profile.summary
        if profile and share_settings.share_headline_summary
        else None,
        "shared_linkedin_url": profile.linkedin_url
        if profile and share_settings.share_links
        else None,
        "shared_github_url": profile.github_url
        if profile and share_settings.share_links
        else None,
        "shared_portfolio_url": profile.portfolio_url
        if profile and share_settings.share_links
        else None,
    }


def _background_database_url(db: AsyncSession) -> str:
    """Return the configured async DB URL for background tasks needing a new session."""
    return settings.database_url


def _job_is_open_for_auto_shortlisting(job: Job) -> bool:
    """Return True when a job is active and not yet expired."""
    return job.status == JobStatus.active and (
        job.expires_at is None or job.expires_at > datetime.now(timezone.utc)
    )


async def apply_to_job(
    db: AsyncSession,
    user: User,
    payload: ApplyRequest,
    bg_tasks: BackgroundTasks | None = None,
) -> ApplicationResponse:
    """Submit an application. A resume_id belonging to the user is required."""
    # 1. Verify the job exists and is active
    result = await db.execute(select(Job).where(Job.id == payload.job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )
    if job.hiring_completed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="position_filled",
        )
    if not _job_is_open_for_auto_shortlisting(job):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job is not currently accepting applications.",
        )

    # 2. Verify the resume exists and belongs to the user (IDOR prevention)
    resume_stmt = (
        select(Resume)
        .where(Resume.id == payload.resume_id)
        .options(
            selectinload(Resume.experiences),
            selectinload(Resume.educations),
            selectinload(Resume.skills),
        )
    )
    resume = await db.scalar(resume_stmt)
    if not resume or resume.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid resume ID or access denied.",
        )

    # 2b. Apply any pending AI resume patch the candidate accepted in the apply flow.
    if payload.apply_pending_patch:
        await consume_pending_resume_patch(db, user, payload.resume_id, payload.job_id)
        resume = await db.scalar(resume_stmt)

    # 2c. Prompt-injection guardrail on candidate-controlled resume text.
    # Block submission outright so injected payloads never sit in the DB or hit
    # downstream LLM hops (shortlisting, recruiter chat candidate summaries).
    scanned_text = resume_text_for_guardrails(resume)
    logger.info(
        "Apply guardrail scan | resume_id={} | text_len={} | preview={!r}",
        payload.resume_id,
        len(scanned_text),
        scanned_text[:300],
    )
    await guardrails_service.assert_input_safe(
        scanned_text,
        source="applications.apply",
    )

    # 3. Check for duplicate application before inserting
    existing = await db.execute(
        select(Application).where(
            Application.job_id == payload.job_id,
            Application.user_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job.",
        )

    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))
    share_settings = _build_share_settings(payload)

    resume_embedding = await _compute_resume_embedding(db, payload.resume_id)

    # 4. Create and persist the application
    application = Application(
        job_id=payload.job_id,
        user_id=user.id,
        resume_id=payload.resume_id,
        resume_embedding=resume_embedding,
        status=ApplicationStatus.applied,
        **share_settings.model_dump(),
        **_build_shared_profile_snapshot(user, profile, share_settings),
    )
    db.add(application)
    try:
        await db.flush()
        company = await db.scalar(select(Company).where(Company.id == job.company_id))
        await create_activity_event(
            db,
            event_type="application_applied",
            audience="candidate",
            title=f"Applied to {job.title}",
            description=(
                f"You applied to {job.title}"
                + (f" at {company.name}." if company else ".")
            ),
            href=_application_detail_href(str(application.id)),
            user_id=application.user_id,
            company_id=job.company_id,
            application_id=application.id,
            job_id=job.id,
            actor_user_id=user.id,
            metadata={
                "status": application.status.value,
                "job_title": job.title,
                "company_name": company.name if company else None,
            },
        )
        await create_activity_event(
            db,
            event_type="application_received",
            audience="recruiter",
            title=f"New applicant for {job.title}",
            description=f"{user.full_name} applied to {job.title}.",
            href=_recruiter_candidate_href(str(application.id)),
            user_id=None,
            company_id=job.company_id,
            application_id=application.id,
            job_id=job.id,
            actor_user_id=user.id,
            metadata={
                "candidate_name": user.full_name,
                "status": application.status.value,
            },
        )
        sync_event = enqueue_application_sync_event(db, application.id)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job.",
        )
    if bg_tasks is not None and "PYTEST_CURRENT_TEST" not in os.environ:
        bg_tasks.add_task(process_application_sync_event, sync_event.id)
        if job.auto_shortlist:
            from app.modules.shortlisting.service import score_application_ml_bouncer

            bg_tasks.add_task(
                score_application_ml_bouncer,
                application.id,
                _background_database_url(db),
            )

    # Re-fetch with resume + children eagerly loaded
    result = await db.execute(
        select(Application)
        .where(Application.id == application.id)
        .options(*_application_response_options())
    )
    application = result.scalar_one()

    await invalidate_candidate_read_caches(str(user.id))
    await invalidate_company_dashboard_caches(db, str(job.company_id))
    await invalidate_company_application_caches(str(job.company_id))
    await invalidate_job_detail_caches(str(payload.job_id))
    await redis_service.delete(f"shortlist:summary:{payload.job_id}")
    await redis_service.delete(f"jobs:company:{job.company_id}")

    logger.info(
        "User {user_id} applied to job {job_id}", user_id=user.id, job_id=payload.job_id
    )
    return ApplicationResponse.model_validate(application)


def _app_to_list_item(app: Application) -> ApplicationListItem:
    """Build an ApplicationListItem with nested ApplicantSummary from a loaded Application."""
    return ApplicationListItem(
        id=app.id,
        job_id=app.job_id,
        user_id=app.user_id,
        status=app.status,
        created_at=app.created_at,
        applicant=ApplicantSummary(
            id=app.user.id,
            full_name=app.user.full_name,
            email=app.user.email,
        ),
    )


def _shared_email(application: Application) -> str | None:
    """Candidate email as recruiters may see it (None when not shared)."""
    return application.shared_email_value if application.share_email else None


def _recruiter_safe_resume(application: Application) -> ResumeResponse | None:
    """Resume as shown to recruiters, honouring the candidate's share settings."""
    if not application.resume:
        return None
    resume = ResumeResponse.model_validate(application.resume)
    hidden: dict[str, None] = {}
    if not application.share_phone:
        hidden["phone"] = None
    if not application.share_location:
        hidden["location"] = None
    if not application.share_links:
        hidden.update(linkedin_url=None, github_url=None, portfolio_url=None)
    return resume.model_copy(update=hidden) if hidden else resume


async def _get_active_company_id(db: AsyncSession, user: User) -> UUID:
    """Return the user's active company ID or raise HTTP 403."""
    result = await db.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company_id = result.scalar_one_or_none()
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only active company members can view applications.",
        )
    return company_id


async def _build_candidate_applications(
    db: AsyncSession, user_id, page: int, size: int
) -> list[CandidateApplicationView]:
    """Run the queries that produce the candidate applications list."""
    stmt = (
        select(Application, Job, Company)
        .join(Job, Job.id == Application.job_id)
        .join(Company, Company.id == Job.company_id)
        .where(Application.user_id == user_id)
        .order_by(Application.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    rows = (await db.execute(stmt)).all()

    response = []
    for application, job, company in rows:
        visible_status, visible_score, visible_strengths, visible_weaknesses = (
            _mask_for_candidate(application, job)
        )
        response.append(
            CandidateApplicationView(
                id=application.id,
                status=visible_status,
                created_at=application.created_at,
                updated_at=application.updated_at,
                job_id=job.id,
                job_title=job.title,
                company_name=company.name,
                company_logo_url=company.logo_url,
                location=job.location,
                location_type=job.location_type,
                score=visible_score,
                strengths=visible_strengths,
                weaknesses=visible_weaknesses,
            )
        )
    return response


async def list_candidate_applications(
    db: AsyncSession, user_id, page: int = 1, size: int = 20
) -> list[CandidateApplicationView]:
    """Return candidate applications across all companies (SWR-cached)."""
    cache_key = f"applications:candidate:{user_id}:p{page}:s{size}"

    async def _load(db: AsyncSession = db) -> list:
        items = await _build_candidate_applications(db, user_id, page, size)
        return [item.model_dump(mode="json") for item in items]

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=300)
    return [CandidateApplicationView.model_validate(item) for item in payload]


async def _build_company_applications(
    db: AsyncSession,
    company_id,
    job_id,
    page: int,
    size: int,
) -> list[RecruiterApplicationView]:
    """Run the queries that produce the company applications list."""
    stmt = (
        select(Application, User, Job)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .where(Job.company_id == company_id)
    )

    if job_id is not None:
        stmt = stmt.where(Application.job_id == job_id)

    stmt = (
        stmt.order_by(Application.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    rows = (await db.execute(stmt)).all()

    return [
        RecruiterApplicationView(
            id=application.id,
            status=application.status,
            created_at=application.created_at,
            updated_at=application.updated_at,
            applicant_name=application.shared_full_name or applicant.full_name,
            applicant_email=_shared_email(application),
            applicant_avatar_url=application.shared_avatar_url,
            job_title=job.title,
            job_id=job.id,
            score=application.score,
            strengths=application.strengths,
            weaknesses=application.weaknesses,
        )
        for application, applicant, job in rows
    ]


async def list_company_applications(
    db: AsyncSession,
    company_id,
    job_id=None,
    page: int = 1,
    size: int = 20,
) -> list[RecruiterApplicationView]:
    """Return applications for a company inbox (SWR-cached)."""
    cache_key = _company_applications_cache_key(
        str(company_id), str(job_id) if job_id else None, page, size
    )

    async def _load(db: AsyncSession = db) -> list:
        items = await _build_company_applications(db, company_id, job_id, page, size)
        return [item.model_dump(mode="json") for item in items]

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=180)
    return [RecruiterApplicationView.model_validate(item) for item in payload]


async def _build_company_candidates(
    db: AsyncSession,
    company_id,
    job_id: str | None,
    status_filter: ApplicationStatus | None,
    page: int,
    size: int,
) -> list[RecruiterCandidateListItem]:
    """Run the queries that produce the company candidates list."""
    stmt = (
        select(Application, User, Job)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .where(Job.company_id == company_id)
    )

    if job_id is not None:
        stmt = stmt.where(Application.job_id == job_id)

    if status_filter is not None:
        stmt = stmt.where(Application.status == status_filter)

    stmt = stmt.order_by(Application.updated_at.desc(), Application.created_at.desc())
    rows = (await db.execute(stmt)).all()
    grouped: dict[str, dict[str, Any]] = {}

    for application, applicant, job in rows:
        bucket = grouped.get(str(applicant.id))
        summary = RecruiterCandidateApplicationSummary(
            application_id=application.id,
            job_id=job.id,
            job_title=job.title,
            status=application.status,
            created_at=application.created_at,
            updated_at=application.updated_at,
            score=application.score,
            strengths=application.strengths,
            weaknesses=application.weaknesses,
        )

        if bucket is None:
            grouped[str(applicant.id)] = {
                "candidate_id": applicant.id,
                "applicant_name": application.shared_full_name or applicant.full_name,
                "applicant_email": _shared_email(application),
                "applicant_avatar_url": application.shared_avatar_url,
                "latest_application_id": application.id,
                "latest_status": application.status,
                "latest_applied_at": application.created_at,
                "latest_updated_at": application.updated_at,
                "primary_job_title": job.title,
                "primary_job_id": job.id,
                "applications": [summary],
                "application_count": 1,
            }
            continue

        bucket["applications"].append(summary)  # type: ignore[union-attr]
        bucket["application_count"] = int(bucket["application_count"]) + 1

    candidate_rows = [
        RecruiterCandidateListItem(
            candidate_id=bucket["candidate_id"],
            applicant_name=bucket["applicant_name"],
            applicant_email=bucket["applicant_email"],
            applicant_avatar_url=bucket["applicant_avatar_url"],
            latest_application_id=bucket["latest_application_id"],
            latest_status=bucket["latest_status"],
            latest_applied_at=bucket["latest_applied_at"],
            latest_updated_at=bucket["latest_updated_at"],
            primary_job_title=bucket["primary_job_title"],
            primary_job_id=bucket["primary_job_id"],
            application_count=bucket["application_count"],
            applications=sorted(
                bucket["applications"],  # type: ignore[arg-type]
                key=lambda item: item.updated_at,
                reverse=True,
            ),
        )
        for bucket in grouped.values()
    ]
    candidate_rows.sort(key=lambda item: item.latest_updated_at, reverse=True)
    start = (page - 1) * size
    end = start + size
    return candidate_rows[start:end]


async def list_company_candidates(
    db: AsyncSession,
    user: User,
    job_id: str | None,
    status_filter: ApplicationStatus | None,
    page: int,
    size: int,
) -> list[RecruiterCandidateListItem]:
    """Return recruiter candidate rows grouped by candidate (SWR-cached)."""
    company_id = await _get_active_company_id(db, user)
    cache_key = _company_candidates_cache_key(
        str(company_id),
        job_id,
        status_filter,
        page,
        size,
    )

    async def _load(db: AsyncSession = db) -> list:
        items = await _build_company_candidates(
            db, company_id, job_id, status_filter, page, size
        )
        return [item.model_dump(mode="json") for item in items]

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=180)
    return [RecruiterCandidateListItem.model_validate(item) for item in payload]


async def _build_company_candidate_detail(
    db: AsyncSession, company_id, application_id: str
) -> RecruiterCandidateDetailView:
    """Run the queries that produce the recruiter candidate detail view."""
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(*_application_response_options())
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate application not found.",
        )

    job = await db.scalar(
        select(Job).where(Job.id == application.job_id, Job.company_id == company_id)
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This candidate does not belong to your company.",
        )

    share = _application_share_settings(application)
    applicant = application.user
    interview = await db.scalar(
        select(Interview).where(Interview.application_id == application.id)
    )
    timeline = await list_application_timeline(
        db,
        application_id=str(application.id),
        audience="recruiter",
    )
    outreach_audit = await _get_outreach_audit_items(db, application.id)

    return RecruiterCandidateDetailView(
        id=application.id,
        candidate_id=applicant.id,
        status=application.status,
        created_at=application.created_at,
        updated_at=application.updated_at,
        applicant_name=application.shared_full_name or applicant.full_name,
        applicant_email=application.shared_email_value if share.share_email else None,
        applicant_avatar_url=application.shared_avatar_url
        if share.share_avatar
        else None,
        candidate_headline=application.shared_headline_value
        if share.share_headline_summary
        else None,
        candidate_summary=application.shared_summary_value
        if share.share_headline_summary
        else None,
        candidate_phone=application.shared_phone_value if share.share_phone else None,
        candidate_location=application.shared_location_value
        if share.share_location
        else None,
        linkedin_url=application.shared_linkedin_url if share.share_links else None,
        github_url=application.shared_github_url if share.share_links else None,
        portfolio_url=application.shared_portfolio_url if share.share_links else None,
        job_title=job.title,
        job_id=job.id,
        score=application.score,
        strengths=application.strengths,
        weaknesses=application.weaknesses,
        interview=RecruiterCandidateInterviewView.model_validate(interview)
        if interview
        else None,
        resume=_recruiter_safe_resume(application),
        share_settings=share,
        timeline=timeline,
        outreach_audit=outreach_audit,
    )


async def get_company_candidate_detail(
    db: AsyncSession, user: User, application_id: str
) -> RecruiterCandidateDetailView:
    """Return the recruiter-safe candidate detail view (SWR-cached)."""
    company_id = await _get_active_company_id(db, user)
    cache_key = _company_candidate_detail_cache_key(str(company_id), application_id)

    async def _load(db: AsyncSession = db) -> dict:
        response = await _build_company_candidate_detail(db, company_id, application_id)
        return response.model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=180)
    return RecruiterCandidateDetailView.model_validate(payload)


async def list_user_applications(
    db: AsyncSession, user: User, page: int, size: int
) -> list[CandidateApplicationView]:
    """List all applications by the authenticated candidate (paginated)."""
    return await list_candidate_applications(db, user.id, page, size)


async def list_job_applications(
    db: AsyncSession, user: User, job_id: str, page: int, size: int
) -> list[RecruiterApplicationView]:
    """List all applications for a job (company/recruiter access check, paginated)."""
    company_id = await _get_active_company_id(db, user)

    # Verify job belongs to the user's company
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or does not belong to your company.",
        )

    return await list_company_applications(db, company_id, job_id, page, size)


async def list_my_company_applications(
    db: AsyncSession, user: User, job_id: str | None, page: int, size: int
) -> list[RecruiterApplicationView]:
    """List applications for the authenticated recruiter's company, optionally by job."""
    company_id = await _get_active_company_id(db, user)

    if job_id is not None:
        result = await db.execute(
            select(Job).where(Job.id == job_id, Job.company_id == company_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found or does not belong to your company.",
            )

    return await list_company_applications(db, company_id, job_id, page, size)


async def get_application(
    db: AsyncSession, user: User, application_id: str
) -> ApplicationResponse:
    """Get a single application (accessible by applicant or company member)."""
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(*_application_response_options())
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    # Applicant can see their own
    if application.user_id == user.id:
        job = await db.scalar(select(Job).where(Job.id == application.job_id))
        company = (
            await db.scalar(select(Company).where(Company.id == job.company_id))
            if job is not None
            else None
        )
        interview = await db.scalar(
            select(Interview).where(Interview.application_id == application.id)
        )
        timeline = await list_application_timeline(
            db,
            application_id=str(application.id),
            audience="candidate",
        )
        if job is not None:
            visible_status, visible_score, visible_strengths, visible_weaknesses = (
                _mask_for_candidate(application, job)
            )
        else:
            visible_status, visible_score, visible_strengths, visible_weaknesses = (
                application.status,
                application.score,
                application.strengths,
                application.weaknesses,
            )
        return ApplicationResponse(
            id=application.id,
            job_id=application.job_id,
            user_id=application.user_id,
            resume_id=application.resume_id,
            status=visible_status,
            created_at=application.created_at,
            updated_at=application.updated_at,
            score=visible_score,
            strengths=visible_strengths,
            weaknesses=visible_weaknesses,
            resume=ResumeResponse.model_validate(application.resume)
            if application.resume
            else None,
            job_title=job.title if job is not None else None,
            company_name=company.name if company is not None else None,
            company_logo_url=company.logo_url if company is not None else None,
            location=job.location if job is not None else None,
            location_type=job.location_type if job is not None else None,
            interview=RecruiterCandidateInterviewView.model_validate(interview)
            if interview
            else None,
            timeline=timeline,
            next_step_hint=_candidate_next_step_hint(visible_status),
        )

    # Active company members (recruiter / recruiter_admin) can see applications
    # for jobs belonging to their company — but only if their membership is active.
    company_id = None
    try:
        company_id = await _get_active_company_id(db, user)
    except HTTPException:
        company_id = None
    if company_id:
        result = await db.execute(
            select(Job).where(
                Job.id == application.job_id, Job.company_id == company_id
            )
        )
        job = result.scalar_one_or_none()
        if job:
            company = await db.scalar(
                select(Company).where(Company.id == job.company_id)
            )
            interview = await db.scalar(
                select(Interview).where(Interview.application_id == application.id)
            )
            timeline = await list_application_timeline(
                db,
                application_id=str(application.id),
                audience="recruiter",
            )
            return ApplicationResponse(
                id=application.id,
                job_id=application.job_id,
                user_id=application.user_id,
                resume_id=application.resume_id,
                status=application.status,
                created_at=application.created_at,
                updated_at=application.updated_at,
                score=application.score,
                strengths=application.strengths,
                weaknesses=application.weaknesses,
                resume=_recruiter_safe_resume(application),
                job_title=job.title,
                company_name=company.name if company is not None else None,
                company_logo_url=company.logo_url if company is not None else None,
                location=job.location,
                location_type=job.location_type,
                interview=RecruiterCandidateInterviewView.model_validate(interview)
                if interview
                else None,
                timeline=timeline,
                next_step_hint=_candidate_next_step_hint(application.status),
            )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view this application.",
    )


async def get_application_timeline(
    db: AsyncSession, user: User, application_id: str
) -> list[ActivityEventResponse]:
    """Return the application timeline for the correct candidate or recruiter audience."""
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    if application.user_id == user.id:
        return await list_application_timeline(
            db,
            application_id=application_id,
            audience="candidate",
        )

    company_id = await _get_active_company_id(db, user)
    job = await db.scalar(
        select(Job).where(Job.id == application.job_id, Job.company_id == company_id)
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this application.",
        )

    return await list_application_timeline(
        db,
        application_id=application_id,
        audience="recruiter",
    )


async def get_company_candidate_timeline(
    db: AsyncSession, user: User, application_id: str
) -> list[ActivityEventResponse]:
    """Return the recruiter-scoped timeline for a company candidate application."""
    await get_company_candidate_detail(db, user, application_id)
    return await list_application_timeline(
        db,
        application_id=application_id,
        audience="recruiter",
    )


async def update_application_status(
    db: AsyncSession,
    user: User,
    application_id: str,
    payload: UpdateApplicationStatusRequest,
    bg_tasks: BackgroundTasks | None = None,
) -> ApplicationResponse:
    """Update application status (active company members only)."""
    company_id = await _get_active_company_id(db, user)

    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(*_application_response_options())
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    # Verify the job belongs to the user's company
    result = await db.execute(
        select(Job).where(Job.id == application.job_id, Job.company_id == company_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This application's job does not belong to your company.",
        )

    current = ApplicationStatus(application.status)
    if current == payload.status:
        return ApplicationResponse.model_validate(application)
    if payload.status not in RECRUITER_STATUS_TRANSITIONS.get(current, frozenset()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Cannot change status from '{current.value}' "
                f"to '{payload.status.value}'."
            ),
        )

    company = await db.scalar(select(Company).where(Company.id == company_id))
    application.status = payload.status
    candidate_title, candidate_description = _status_event_copy(
        payload.status,
        applicant_name=application.user.full_name,
        job_title=job.title,
        company_name=company.name if company else "Your recruiter",
    )
    await create_activity_event(
        db,
        event_type=f"application_{payload.status.value}",
        audience="candidate",
        title=candidate_title,
        description=candidate_description,
        href=_application_detail_href(str(application.id)),
        user_id=application.user_id,
        company_id=company_id,
        application_id=application.id,
        job_id=job.id,
        actor_user_id=user.id,
        metadata={"status": payload.status.value, "job_title": job.title},
    )
    await create_activity_event(
        db,
        event_type=f"candidate_{payload.status.value}",
        audience="recruiter",
        title=f"{application.user.full_name}: {payload.status.value.replace('_', ' ')}",
        description=f"{application.user.full_name} is now {payload.status.value.replace('_', ' ')} for {job.title}.",
        href=_recruiter_candidate_href(str(application.id)),
        company_id=company_id,
        application_id=application.id,
        job_id=job.id,
        actor_user_id=user.id,
        metadata={
            "status": payload.status.value,
            "candidate_name": application.user.full_name,
        },
    )
    _PIPELINE_AUDIT_STATUSES = {
        ApplicationStatus.shortlisted,
        ApplicationStatus.rejected,
        ApplicationStatus.interview_completed,
        ApplicationStatus.offer,
        ApplicationStatus.offer_accepted,
        ApplicationStatus.offer_declined,
    }
    if payload.status in _PIPELINE_AUDIT_STATUSES:
        _action_map = {
            ApplicationStatus.shortlisted: "candidate_shortlisted",
            ApplicationStatus.rejected: "candidate_rejected",
            ApplicationStatus.interview_completed: "interview_completed",
            ApplicationStatus.offer: "offer_given",
            ApplicationStatus.offer_accepted: "offer_accepted",
            ApplicationStatus.offer_declined: "offer_declined",
        }
        _msg_map = {
            ApplicationStatus.shortlisted: f"Candidate {application.user.full_name} shortlisted for {job.title} by {user.full_name}",
            ApplicationStatus.rejected: f"Candidate {application.user.full_name} rejected for {job.title} by {user.full_name}",
            ApplicationStatus.interview_completed: f"Interview marked complete for {application.user.full_name} on {job.title} by {user.full_name}",
            ApplicationStatus.offer: f"Offer given to {application.user.full_name} for {job.title} by {user.full_name}",
            ApplicationStatus.offer_accepted: f"Offer accepted by {application.user.full_name} for {job.title}",
            ApplicationStatus.offer_declined: f"Offer declined by {application.user.full_name} for {job.title}",
        }
        await create_custom_audit_log(
            db,
            entity_type="application",
            action_type=_action_map[payload.status],
            category="pipeline",
            message=_msg_map[payload.status],
            entity_id=application.id,
            company_id=company_id,
            target_user_id=application.user_id,
            metadata={
                "candidate_name": application.user.full_name,
                "job_title": job.title,
                "status": payload.status.value,
            },
        )

    if payload.status in _EMAIL_STATUSES:
        subject, html_body = _status_email_html(
            payload.status,
            applicant_name=application.user.full_name,
            job_title=job.title,
            company_name=company.name if company else "Your recruiter",
            app_href=_application_detail_href(str(application.id)),
        )
        try:
            await EmailService.send_generic_email(
                to_email=application.user.email,
                subject=subject,
                html_body=html_body,
            )
        except Exception:
            logger.warning(
                "Failed to send status email to {} for status {}",
                application.user.email,
                payload.status.value,
            )

    sync_event = enqueue_application_sync_event(db, uuid.UUID(str(application.id)))
    await db.commit()
    await db.refresh(application)
    if bg_tasks is not None and "PYTEST_CURRENT_TEST" not in os.environ:
        bg_tasks.add_task(process_application_sync_event, sync_event.id)

    await invalidate_candidate_read_caches(str(application.user_id))
    await invalidate_company_dashboard_caches(db, str(company_id))
    await invalidate_company_application_caches(str(company_id), str(application.id))
    if payload.status == ApplicationStatus.interview_completed:
        await invalidate_interview_list_caches(str(company_id))

    logger.info(
        "Application {app_id} status updated to {new_status} by user {user_id}",
        app_id=application_id,
        new_status=payload.status,
        user_id=user.id,
    )
    return ApplicationResponse.model_validate(application)


async def update_application_review(
    db: AsyncSession,
    user: User,
    application_id: str,
    payload: UpdateApplicationReviewRequest,
    bg_tasks: BackgroundTasks | None = None,
) -> ApplicationResponse:
    """Update manual score and/or review for an application (active company members only)."""
    company_id = await _get_active_company_id(db, user)

    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(*_application_response_options())
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    job_result = await db.execute(
        select(Job).where(Job.id == application.job_id, Job.company_id == company_id)
    )
    if not job_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This application's job does not belong to your company.",
        )

    if (
        payload.score is None
        and payload.strengths is None
        and payload.weaknesses is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a score, strengths, weaknesses, or a combination.",
        )

    old_score = application.score
    if payload.score is not None:
        application.score = payload.score
    if payload.strengths is not None:
        application.strengths = payload.strengths or None
    if payload.weaknesses is not None:
        application.weaknesses = payload.weaknesses or None

    job = await db.scalar(select(Job).where(Job.id == application.job_id))
    company = (
        await db.scalar(select(Company).where(Company.id == company_id))
        if job is not None
        else None
    )
    if payload.score is not None and old_score != payload.score:
        await create_custom_audit_log(
            db,
            entity_type="application",
            action_type="score_overridden",
            category="pipeline",
            message=f"AI score overridden for {application.user.full_name} on {job.title if job else 'unknown job'} by {user.full_name}",
            entity_id=application.id,
            company_id=company_id,
            target_user_id=application.user_id,
            before_json={"score": old_score},
            after_json={"score": payload.score},
            diff_json={"score": {"before": old_score, "after": payload.score}},
            metadata={
                "candidate_name": application.user.full_name,
                "job_title": job.title if job else None,
            },
        )
    await create_activity_event(
        db,
        event_type="application_review_updated",
        audience="recruiter",
        title=f"Review updated for {application.user.full_name}",
        description=f"Manual review notes were updated for {application.user.full_name} on {job.title if job else 'this application'}.",
        href=_recruiter_candidate_href(str(application.id)),
        company_id=company_id,
        application_id=application.id,
        job_id=job.id if job else None,
        actor_user_id=user.id,
        metadata={
            "score": application.score,
            "has_review": bool(application.strengths or application.weaknesses),
        },
    )
    if (
        payload.strengths is not None
        or payload.weaknesses is not None
        or payload.score is not None
    ):
        await create_activity_event(
            db,
            event_type="application_review_ready",
            audience="candidate",
            title=f"Review updated for {job.title if job else 'your application'}",
            description=(
                f"{company.name if company else 'The recruiter'} updated the review for your application."
            ),
            href=_application_detail_href(str(application.id)),
            user_id=application.user_id,
            company_id=company_id,
            application_id=application.id,
            job_id=job.id if job else None,
            actor_user_id=user.id,
            metadata={"score": application.score},
        )

    sync_event = enqueue_application_sync_event(db, uuid.UUID(str(application.id)))
    await db.commit()
    await db.refresh(application)

    if bg_tasks is not None and "PYTEST_CURRENT_TEST" not in os.environ:
        bg_tasks.add_task(process_application_sync_event, sync_event.id)

    await invalidate_candidate_read_caches(str(application.user_id))
    await invalidate_company_dashboard_caches(db, str(company_id))
    await invalidate_company_application_caches(str(company_id), str(application.id))
    await redis_service.delete(f"shortlist:summary:{application.job_id}")

    logger.info(
        "Application {app_id} review updated by user {user_id}",
        app_id=application_id,
        user_id=user.id,
    )
    return ApplicationResponse.model_validate(application)


async def respond_to_offer(
    db: AsyncSession,
    application_id: uuid.UUID,
    accepted: bool,
    user: User,
) -> None:
    """Candidate accepts or declines a recorded offer."""
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id, Application.user_id == user.id)
        .options(
            selectinload(Application.job).selectinload(Job.company),
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    if application.status != ApplicationStatus.offer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application is not at offer stage",
        )

    new_status = (
        ApplicationStatus.offer_accepted
        if accepted
        else ApplicationStatus.offer_declined
    )
    application.status = new_status
    company_id = application.job.company_id

    event_type = (
        "application_offer_accepted" if accepted else "application_offer_declined"
    )
    response_word = "accepted" if accepted else "declined"
    job_title = application.job.title
    company_name = (
        application.job.company.name if application.job.company else "The recruiter"
    )

    await create_activity_event(
        db,
        event_type=event_type,
        audience="candidate",
        title=f"Offer {response_word} for {job_title}",
        description=f"You {response_word} the offer for {job_title}.",
        href=_application_detail_href(str(application.id)),
        user_id=user.id,
        company_id=company_id,
        application_id=application.id,
        job_id=application.job_id,
        actor_user_id=user.id,
    )
    await create_activity_event(
        db,
        event_type=event_type,
        audience="recruiter",
        title=f"{user.full_name} {response_word} the offer for {job_title}",
        description=f"{user.full_name} responded to the offer for {job_title}.",
        href=_recruiter_candidate_href(str(application.id)),
        company_id=company_id,
        application_id=application.id,
        job_id=application.job_id,
        actor_user_id=user.id,
    )

    try:
        await EmailService.send_generic_email(
            to_email=user.email,
            subject=f"Offer {response_word} — {job_title}",
            html_body=(
                f"<p>Hi {user.full_name},</p>"
                f"<p>This confirms you have <strong>{response_word}</strong> the offer "
                f"from <strong>{company_name}</strong> for <strong>{job_title}</strong>.</p>"
            ),
        )
    except Exception:
        logger.warning(
            "Failed to send offer response confirmation email to {}", user.email
        )

    enqueue_application_sync_event(db, application.id)
    await invalidate_candidate_read_caches(str(user.id))
    await db.commit()
    logger.info(
        "Offer {} by candidate {} for application {}",
        response_word,
        user.id,
        application_id,
    )


_SEMANTIC_SEARCH_MAX_HITS = 500


async def semantic_search_candidates(
    db: AsyncSession,
    user: User,
    query: str,
    statuses: list[str] | None,
    page: int,
    size: int,
) -> SemanticCandidateSearchResponse:
    """
    Semantic candidate search using the Qdrant candidate-applications collection.

    Converts a free-text query into an embedding and returns the most
    semantically similar applications within the recruiter's company.
    """
    company_id = await _get_active_company_id(db, user)

    # Fetch enough hits to cover the requested page (previously limit=size,
    # so every page after the first was empty).
    qdrant_results = await qdrant_service.search_applications(
        query=query,
        company_id=uuid.UUID(str(company_id)),
        statuses=statuses,
        limit=min(page * size, _SEMANTIC_SEARCH_MAX_HITS),
    )

    if not qdrant_results:
        return SemanticCandidateSearchResponse(query=query, total=0, candidates=[])

    application_ids = [res["application_id"] for res in qdrant_results]

    # Re-check tenancy in SQL; never rely on the vector store filter alone.
    stmt = (
        select(Application, User, Job)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .where(Application.id.in_(application_ids), Job.company_id == company_id)
    )
    rows = (await db.execute(stmt)).all()

    row_map: dict[uuid.UUID, tuple[Application, User, Job]] = {
        app.id: (app, user_row, job) for app, user_row, job in rows
    }

    candidates: list[SemanticCandidateSearchResult] = []
    for res in qdrant_results:
        app_id = res["application_id"]
        row = row_map.get(app_id)
        if row is None:
            continue  # ghost vector
        application, applicant, job = row
        candidates.append(
            SemanticCandidateSearchResult(
                application_id=application.id,
                candidate_id=applicant.id,
                applicant_name=application.shared_full_name or applicant.full_name,
                applicant_email=_shared_email(application),
                applicant_avatar_url=application.shared_avatar_url,
                job_title=job.title,
                job_id=job.id,
                status=application.status,
                score=application.score,
                strengths=application.strengths,
                weaknesses=application.weaknesses,
                match_score=round(res["score"], 4),
                applied_at=application.created_at,
                updated_at=application.updated_at,
            )
        )

    total = len(candidates)
    start = (page - 1) * size
    end = start + size
    paged = candidates[start:end]

    return SemanticCandidateSearchResponse(
        query=query,
        total=total,
        candidates=paged,
    )


async def find_similar_candidates(
    db: AsyncSession,
    user: User,
    application_id: str,
    limit: int = 10,
) -> SimilarCandidatesResponse:
    """
    Given one application, find the most similar candidates within the
    same company using the Qdrant vector of the reference application.

    This is useful when a recruiter likes one candidate and wants to
    surface "more like this" from the talent pool.
    """
    company_id = await _get_active_company_id(db, user)

    # Verify the reference application belongs to the company
    ref_result = await db.execute(
        select(Application, User, Job)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .where(
            Application.id == application_id,
            Job.company_id == company_id,
        )
    )
    ref_row = ref_result.one_or_none()
    if ref_row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reference application not found or does not belong to your company.",
        )
    ref_app, ref_user, ref_job = ref_row

    # Build the same document the sync daemon would have embedded
    from app.infrastructures.qdrant.service import QdrantService

    qdrant_doc = QdrantService._build_application_document(
        qdrant_service, ref_app, ref_job
    )

    qdrant_results = await qdrant_service.search_applications(
        query=qdrant_doc,
        company_id=uuid.UUID(str(company_id)),
        limit=limit + 5,  # extra to drop self + ghosts
    )

    if not qdrant_results:
        return SimilarCandidatesResponse(
            reference_application_id=ref_app.id,
            reference_candidate_name=ref_app.shared_full_name or ref_user.full_name,
            total=0,
            candidates=[],
        )

    # Drop the reference candidate itself
    qdrant_results = [r for r in qdrant_results if r["application_id"] != ref_app.id]
    application_ids = [res["application_id"] for res in qdrant_results]

    stmt = (
        select(Application, User, Job)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .where(Application.id.in_(application_ids))
    )
    rows = (await db.execute(stmt)).all()

    row_map: dict[uuid.UUID, tuple[Application, User, Job]] = {
        app.id: (app, user_row, job) for app, user_row, job in rows
    }

    candidates: list[SimilarCandidateResult] = []
    for res in qdrant_results:
        app_id = res["application_id"]
        row = row_map.get(app_id)
        if row is None:
            continue
        application, applicant, job = row
        candidates.append(
            SimilarCandidateResult(
                application_id=application.id,
                candidate_id=applicant.id,
                applicant_name=application.shared_full_name or applicant.full_name,
                applicant_email=_shared_email(application),
                applicant_avatar_url=application.shared_avatar_url,
                job_title=job.title,
                job_id=job.id,
                status=application.status,
                score=application.score,
                similarity_score=round(res["score"], 4),
                applied_at=application.created_at,
                updated_at=application.updated_at,
            )
        )
        if len(candidates) >= limit:
            break

    return SimilarCandidatesResponse(
        reference_application_id=ref_app.id,
        reference_candidate_name=ref_app.shared_full_name or ref_user.full_name,
        total=len(candidates),
        candidates=candidates,
    )
