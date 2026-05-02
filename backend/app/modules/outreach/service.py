from __future__ import annotations

import html
import uuid
from datetime import datetime, timezone

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
)
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.infrastructures.email.service import EmailService
from app.modules.activity.service import create_activity_event
from app.modules.audit.service import create_custom_audit_log
from app.modules.applications.models import Application
from app.modules.applications.sync import enqueue_application_sync_events
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import Company, CompanyMembership
from app.modules.jobs.models import Job
from app.modules.outreach.email_composer import compose_email
from app.modules.outreach.models import EmailDraft
from app.modules.outreach.schemas import (
    ApproveDraftRequest,
    DeleteDraftsResponse,
    EmailDraftResponse,
    PrepareDraftsResponse,
    SendAllResponse,
    UpdateDraftRequest,
)
from app.modules.auth.models import User
from app.shared.enums import ApplicationStatus, SyncAction


def _utcnow() -> datetime:
    """Return the current UTC datetime."""
    return datetime.now(timezone.utc)


def _build_footer(recruiter_name: str, company_name: str) -> str:
    """Build the deterministic email footer appended to every outreach email."""
    safe_name = html.escape(recruiter_name)
    safe_company = html.escape(company_name)
    return f"<p>{safe_name}<br />{safe_company}<br />ConvexHire Recruiting Team</p>"


async def _get_company_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
    """Return the active company ID for a recruiter user."""
    result = await db.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company_id = result.scalar_one_or_none()
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active company membership required.",
        )
    return company_id


async def _get_job_for_company(
    db: AsyncSession, job_id: uuid.UUID, company_id: uuid.UUID
) -> Job:
    """Return a company-owned job or raise if unavailable."""
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or does not belong to your company.",
        )
    return job


async def _get_company(db: AsyncSession, company_id: uuid.UUID) -> Company | None:
    """Fetch a company by ID."""
    return await db.scalar(select(Company).where(Company.id == company_id))


async def _get_recruiter_name(db: AsyncSession, user_id: uuid.UUID) -> str:
    """Fetch the recruiter's full name, falling back to a generic label."""
    name = await db.scalar(select(User.full_name).where(User.id == user_id))
    return name or "The Recruiting Team"


async def _get_application_for_company(
    db: AsyncSession, application_id: uuid.UUID, company_id: uuid.UUID
) -> tuple[Application, Job]:
    """Return an application and job visible to the company."""
    result = await db.execute(
        select(Application, Job)
        .join(Job, Job.id == Application.job_id)
        .where(Application.id == application_id, Job.company_id == company_id)
    )
    row = result.one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )
    application, job = row
    return application, job


def _resolve_outreach_status(
    job: Job, application: Application
) -> ApplicationStatus | None:
    """Resolve whether an application is ready for shortlist or rejection outreach."""
    if application.status in {
        ApplicationStatus.shortlisted,
        ApplicationStatus.interview_booked,
        ApplicationStatus.interview_completed,
        ApplicationStatus.offer,
    }:
        return ApplicationStatus.shortlisted

    if application.status == ApplicationStatus.rejected:
        return ApplicationStatus.rejected

    if (
        application.status == ApplicationStatus.applied
        and job.final_shortlist_completed
        and application.score is not None
        and (application.strengths is not None or application.weaknesses is not None)
    ):
        return (
            ApplicationStatus.shortlisted
            if application.score >= job.shortlist_threshold
            else ApplicationStatus.rejected
        )

    return None


def _draft_to_response(draft: EmailDraft) -> EmailDraftResponse:
    """Convert an email draft ORM instance into its response schema."""
    app = draft.application
    user = app.user
    return EmailDraftResponse(
        draft_id=draft.id,
        application_id=draft.application_id,
        candidate_name=user.full_name,
        candidate_email=user.email,
        candidate_avatar_url=user.avatar_url,
        application_status=app.status,
        score=app.score,
        application_strengths=app.strengths,
        application_weaknesses=app.weaknesses,
        subject=draft.subject,
        body=draft.body,
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
        created_at=draft.created_at,
        updated_at=draft.updated_at,
    )


def _compose_draft(
    candidate_name: str,
    company_name: str,
    job_title: str,
    application_status: ApplicationStatus,
    strengths: list[str] | None,
    weaknesses: list[str] | None,
    booking_url: str | None = None,
) -> tuple[str, str]:
    """Build a deterministic fallback outreach email draft."""
    safe_name = html.escape(candidate_name)
    safe_company = html.escape(company_name)
    safe_job = html.escape(job_title)

    if application_status == ApplicationStatus.shortlisted:
        subject = f"Next steps for your {job_title} application"
        body = (
            f"<p>Hi {safe_name},</p>"
            f"<p>Thank you for applying to <strong>{safe_job}</strong> at {safe_company}.</p>"
            "<p>We have reviewed your application and would like to move you forward "
            "to the next stage of our process.</p>"
        )
        if booking_url:
            safe_booking_url = html.escape(booking_url, quote=True)
            body += (
                "<p>Please book your interview using the same name and email address "
                "you used on ConvexHire so we can match your booking automatically.</p>"
                f'<p><a href="{safe_booking_url}">Book your interview</a></p>'
            )
    else:
        subject = f"Update on your {job_title} application"
        body = (
            f"<p>Hi {safe_name},</p>"
            f"<p>Thank you for your interest in <strong>{safe_job}</strong> at {safe_company}.</p>"
            "<p>After reviewing your application, we will not be moving forward at this time.</p>"
        )

    review_parts: list[str] = []
    if strengths:
        review_parts.append(
            "<strong>Strengths:</strong> "
            + ", ".join(html.escape(s) for s in strengths)
        )
    if weaknesses:
        review_parts.append(
            "<strong>Areas of concern:</strong> "
            + ", ".join(html.escape(w) for w in weaknesses)
        )
    if review_parts:
        body += "<p>" + "<br />".join(review_parts) + "</p>"

    body += (
        "<p>We appreciate the time you invested in applying and wish you the best.</p>"
    )

    return subject, body


async def _compose_draft_with_fallback(
    candidate_name: str,
    company_name: str,
    job_title: str,
    application_status: ApplicationStatus,
    strengths: list[str] | None,
    weaknesses: list[str] | None,
    booking_url: str | None = None,
) -> tuple[str, str]:
    """Compose an AI outreach draft and fall back to the static template on failure."""
    if application_status == ApplicationStatus.shortlisted and not booking_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Add your company's Cal booking link in Company Settings before sending shortlist emails."
            ),
        )

    try:
        subject, body = await compose_email(
            candidate_name=candidate_name,
            company_name=company_name,
            job_title=job_title,
            application_status=application_status,
            strengths=strengths,
            weaknesses=weaknesses,
            booking_url=booking_url,
        )
        if subject.strip() and body.strip():
            return subject, body
        logger.warning(
            "Email composer returned empty content for candidate '{}' on job '{}'. Falling back to static draft.",
            candidate_name,
            job_title,
        )
    except Exception as exc:
        logger.exception(
            "Failed to compose AI email draft for candidate '{}' on job '{}': {}",
            candidate_name,
            job_title,
            exc,
        )
    return _compose_draft(
        candidate_name=candidate_name,
        company_name=company_name,
        job_title=job_title,
        application_status=application_status,
        strengths=strengths,
        weaknesses=weaknesses,
        booking_url=booking_url,
    )


async def _upsert_generated_draft(
    db: AsyncSession,
    application: Application,
    job: Job,
    company: Company | None,
    generated_by_user_id: uuid.UUID | None = None,
) -> EmailDraft:
    """Create or refresh a generated outreach draft for an application."""
    outreach_status = _resolve_outreach_status(job, application)
    if outreach_status is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only shortlisted or rejected candidates can receive outreach drafts.",
        )

    if application.status == ApplicationStatus.applied:
        application.status = outreach_status
        enqueue_application_sync_events(db, [application.id], SyncAction.UPSERT)

    draft = await db.scalar(
        select(EmailDraft).where(EmailDraft.application_id == application.id)
    )
    if draft is not None and draft.is_sent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot regenerate a draft that has already been sent.",
        )

    company_name = company.name if company else "ConvexHire"
    recruiter_name = (
        await _get_recruiter_name(db, generated_by_user_id)
        if generated_by_user_id
        else "The Recruiting Team"
    )

    subject, body = await _compose_draft_with_fallback(
        candidate_name=application.user.full_name,
        company_name=company_name,
        job_title=job.title,
        application_status=outreach_status,
        strengths=application.strengths,
        weaknesses=application.weaknesses,
        booking_url=company.cal_booking_url if company else None,
    )
    body += _build_footer(recruiter_name, company_name)

    if draft is None:
        draft = EmailDraft(
            application_id=application.id,
            subject=subject,
            body=body,
            generated_by_user_id=generated_by_user_id,
        )
        db.add(draft)
    else:
        draft.subject = subject
        draft.body = body
        draft.is_discarded = False
        if generated_by_user_id is not None:
            draft.generated_by_user_id = generated_by_user_id

    draft.is_approved = False
    await db.flush()
    return draft


async def prepare_drafts(
    db: AsyncSession,
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    direct_send: bool = False,
) -> PrepareDraftsResponse:
    """Prepare outreach drafts for all candidates ready on a job."""
    company_id = await _get_company_id(db, user_id)
    job = await _get_job_for_company(db, job_id, company_id)
    company = await _get_company(db, company_id)
    company_name = company.name if company else "ConvexHire"
    recruiter_name = await _get_recruiter_name(db, user_id)

    apps_result = await db.execute(
        select(Application).where(
            Application.job_id == job_id,
        )
    )
    applications = apps_result.scalars().all()
    outreach_ready_applications = [
        application
        for application in applications
        if _resolve_outreach_status(job, application) is not None
    ]
    if not outreach_ready_applications:
        return PrepareDraftsResponse(
            job_id=job_id,
            drafts_count=0,
            new_drafts=0,
            message="No candidates are ready for outreach yet.",
        )

    existing_result = await db.execute(
        select(EmailDraft.application_id).where(
            EmailDraft.application_id.in_(
                [application.id for application in outreach_ready_applications]
            )
        )
    )
    existing_ids = {row[0] for row in existing_result.fetchall()}

    new_drafts = 0
    status_updated_ids: list[uuid.UUID] = []
    for application in outreach_ready_applications:
        outreach_status = _resolve_outreach_status(job, application)
        if outreach_status is None:
            continue

        if application.status == ApplicationStatus.applied:
            application.status = outreach_status
            status_updated_ids.append(application.id)
            await create_activity_event(
                db,
                event_type=f"application_{outreach_status.value}",
                audience="candidate",
                title=(
                    f"Shortlisted for {job.title}"
                    if outreach_status == ApplicationStatus.shortlisted
                    else f"Application closed for {job.title}"
                ),
                description=(
                    f"{company.name if company else 'The recruiter'} updated your application after review."
                ),
                href=f"/candidate/applications/{application.id}",
                user_id=application.user_id,
                company_id=company_id,
                application_id=application.id,
                job_id=job.id,
                actor_user_id=user_id,
            )

        if application.id in existing_ids:
            continue
        subject, body = await _compose_draft_with_fallback(
            candidate_name=application.user.full_name,
            company_name=company_name,
            job_title=job.title,
            application_status=outreach_status,
            strengths=application.strengths,
            weaknesses=application.weaknesses,
            booking_url=company.cal_booking_url if company else None,
        )
        db.add(
            EmailDraft(
                application_id=application.id,
                subject=subject,
                body=body + _build_footer(recruiter_name, company_name),
                generated_by_user_id=user_id,
                is_approved=direct_send,
            )
        )
        new_drafts += 1
        await create_activity_event(
            db,
            event_type="outreach_draft_generated",
            audience="recruiter",
            title=f"Draft prepared for {application.user.full_name}",
            description=f"An outreach draft is ready for {application.user.full_name} on {job.title}.",
            href=f"/recruiter/jobs/{job.id}?view=pipeline&stage=shortlist",
            company_id=company_id,
            application_id=application.id,
            job_id=job.id,
            actor_user_id=user_id,
            metadata={"direct_send": direct_send},
        )

    if status_updated_ids:
        enqueue_application_sync_events(db, status_updated_ids, SyncAction.UPSERT)

    await db.commit()
    await invalidate_company_dashboard_caches(db, str(company_id))
    for application in outreach_ready_applications:
        await invalidate_candidate_read_caches(str(application.user_id))
        await invalidate_company_application_caches(
            str(company_id), str(application.id)
        )

    if direct_send:
        bind = db.bind
        database_url = (
            str(bind.engine.url)
            if bind is not None and hasattr(bind, "engine")
            else None
        )
        background_tasks.add_task(
            _send_all_for_job, job_id, database_url, user_id, company_id
        )

    return PrepareDraftsResponse(
        job_id=job_id,
        drafts_count=len(outreach_ready_applications),
        new_drafts=new_drafts,
        message=(
            "Drafts prepared and queued for sending."
            if direct_send
            else "Drafts prepared successfully."
        ),
    )


async def get_drafts_for_job(
    db: AsyncSession, job_id: uuid.UUID, user_id: uuid.UUID
) -> list[EmailDraftResponse]:
    """List outreach drafts for a job."""
    company_id = await _get_company_id(db, user_id)
    await _get_job_for_company(db, job_id, company_id)

    result = await db.execute(
        select(EmailDraft)
        .join(Application, Application.id == EmailDraft.application_id)
        .where(Application.job_id == job_id)
        .order_by(Application.score.desc().nullslast(), EmailDraft.created_at.asc())
    )
    drafts = result.scalars().all()
    return [_draft_to_response(draft) for draft in drafts]


async def generate_draft_for_application(
    db: AsyncSession,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
) -> EmailDraftResponse:
    """Generate or refresh the outreach draft for one application."""
    company_id = await _get_company_id(db, user_id)
    application, job = await _get_application_for_company(
        db, application_id, company_id
    )
    company = await _get_company(db, company_id)

    draft = await _upsert_generated_draft(
        db,
        application,
        job,
        company,
        generated_by_user_id=user_id,
    )
    await create_activity_event(
        db,
        event_type="outreach_draft_generated",
        audience="recruiter",
        title=f"Draft prepared for {application.user.full_name}",
        description=f"An outreach draft is ready for {application.user.full_name} on {job.title}.",
        href=f"/recruiter/jobs/{job.id}?view=pipeline&stage=shortlist",
        company_id=company_id,
        application_id=application.id,
        draft_id=draft.id,
        job_id=job.id,
        actor_user_id=user_id,
    )
    await db.commit()
    await db.refresh(draft)
    await invalidate_candidate_read_caches(str(draft.application.user_id))
    await invalidate_company_application_caches(
        str(company_id), str(draft.application_id)
    )
    return _draft_to_response(draft)


async def update_draft(
    db: AsyncSession,
    draft_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: UpdateDraftRequest,
) -> EmailDraftResponse:
    """Update a saved outreach draft."""
    company_id = await _get_company_id(db, user_id)
    result = await db.execute(
        select(EmailDraft)
        .join(Application, Application.id == EmailDraft.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(EmailDraft.id == draft_id, Job.company_id == company_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found.",
        )
    if draft.is_sent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit a draft that has already been sent.",
        )

    if payload.subject is not None:
        draft.subject = payload.subject
    if payload.body is not None:
        draft.body = payload.body

    await create_activity_event(
        db,
        event_type="outreach_draft_updated",
        audience="recruiter",
        title=f"Draft updated for {draft.application.user.full_name}",
        description=f"The outreach draft for {draft.application.user.full_name} was edited.",
        href=f"/recruiter/jobs/{draft.application.job_id}?view=pipeline&stage=shortlist",
        company_id=company_id,
        application_id=draft.application_id,
        draft_id=draft.id,
        job_id=draft.application.job_id,
        actor_user_id=user_id,
    )
    await db.commit()
    await db.refresh(draft)
    await invalidate_candidate_read_caches(str(draft.application.user_id))
    await invalidate_company_application_caches(
        str(company_id), str(draft.application_id)
    )
    return _draft_to_response(draft)


async def approve_draft(
    db: AsyncSession,
    draft_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: ApproveDraftRequest,
) -> EmailDraftResponse:
    """Approve or discard an outreach draft and send it when approved."""
    company_id = await _get_company_id(db, user_id)
    result = await db.execute(
        select(EmailDraft)
        .join(Application, Application.id == EmailDraft.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(EmailDraft.id == draft_id, Job.company_id == company_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found.",
        )
    if draft.is_sent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Draft already sent.",
        )

    if payload.approved:
        draft.is_approved = True
        draft.approved_by_user_id = user_id
        draft.approved_at = _utcnow()
        draft.sent_by_user_id = user_id
        draft.sent_at = _utcnow()
        _draft_job = await db.scalar(
            select(Job).where(Job.id == draft.application.job_id)
        )
        _draft_job_title = _draft_job.title if _draft_job else "unknown job"
        _email_type = (
            "shortlist"
            if draft.application.status.value in ("shortlisted", "applied")
            else "rejection"
        )
        await create_custom_audit_log(
            db,
            entity_type="email_draft",
            action_type=f"{_email_type}_email_sent",
            category="outreach",
            message=f"{'Shortlist' if _email_type == 'shortlist' else 'Rejection'} email sent to {draft.application.user.full_name} for {_draft_job_title}",
            entity_id=draft.id,
            company_id=company_id,
            target_user_id=draft.application.user_id,
            metadata={
                "candidate_name": draft.application.user.full_name,
                "job_title": _draft_job_title,
                "draft_id": str(draft.id),
            },
        )
        await create_activity_event(
            db,
            event_type="outreach_draft_approved",
            audience="recruiter",
            title=f"Draft approved for {draft.application.user.full_name}",
            description=f"The outreach draft for {draft.application.user.full_name} was approved and sent.",
            href=f"/recruiter/jobs/{draft.application.job_id}?view=pipeline&stage=shortlist",
            company_id=company_id,
            application_id=draft.application_id,
            draft_id=draft.id,
            job_id=draft.application.job_id,
            actor_user_id=user_id,
        )
        await create_activity_event(
            db,
            event_type="outreach_email_sent",
            audience="candidate",
            title="Application update sent",
            description="The recruiter sent an update related to your application.",
            href=f"/candidate/applications/{draft.application_id}",
            user_id=draft.application.user_id,
            company_id=company_id,
            application_id=draft.application_id,
            draft_id=draft.id,
            job_id=draft.application.job_id,
            actor_user_id=user_id,
        )
        await db.commit()
        await db.refresh(draft)
        await _send_single_draft(draft)
        draft.is_sent = True
    else:
        draft.is_discarded = True
        draft.discarded_by_user_id = user_id
        draft.discarded_at = _utcnow()
        await create_activity_event(
            db,
            event_type="outreach_draft_discarded",
            audience="recruiter",
            title=f"Draft discarded for {draft.application.user.full_name}",
            description=f"The outreach draft for {draft.application.user.full_name} was discarded.",
            href=f"/recruiter/jobs/{draft.application.job_id}?view=pipeline&stage=shortlist",
            company_id=company_id,
            application_id=draft.application_id,
            draft_id=draft.id,
            job_id=draft.application.job_id,
            actor_user_id=user_id,
        )

    await db.commit()
    await db.refresh(draft)
    await invalidate_candidate_read_caches(str(draft.application.user_id))
    await invalidate_company_application_caches(
        str(company_id), str(draft.application_id)
    )
    return _draft_to_response(draft)


async def delete_draft(
    db: AsyncSession,
    draft_id: uuid.UUID,
    user_id: uuid.UUID,
) -> DeleteDraftsResponse:
    """Delete a single unsent outreach draft."""
    company_id = await _get_company_id(db, user_id)
    result = await db.execute(
        select(EmailDraft)
        .join(Application, Application.id == EmailDraft.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(EmailDraft.id == draft_id, Job.company_id == company_id)
    )
    draft = result.scalar_one_or_none()
    if draft is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found.",
        )
    if draft.is_sent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sent drafts cannot be deleted.",
        )

    await db.delete(draft)
    await db.commit()
    return DeleteDraftsResponse(deleted_count=1, message="Draft deleted.")


async def delete_all_drafts_for_job(
    db: AsyncSession,
    job_id: uuid.UUID,
    user_id: uuid.UUID,
) -> DeleteDraftsResponse:
    """Delete all unsent drafts for a job."""
    company_id = await _get_company_id(db, user_id)
    await _get_job_for_company(db, job_id, company_id)

    result = await db.execute(
        select(EmailDraft)
        .join(Application, Application.id == EmailDraft.application_id)
        .where(
            Application.job_id == job_id,
            EmailDraft.is_sent.is_(False),
        )
    )
    drafts = result.scalars().all()
    for draft in drafts:
        await db.delete(draft)

    await db.commit()
    return DeleteDraftsResponse(
        deleted_count=len(drafts),
        message=f"Deleted {len(drafts)} draft(s).",
    )


async def send_all_drafts(
    db: AsyncSession,
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    background_tasks: BackgroundTasks,
) -> SendAllResponse:
    """Queue sending for all unsent drafts on a job."""
    company_id = await _get_company_id(db, user_id)
    await _get_job_for_company(db, job_id, company_id)

    result = await db.execute(
        select(EmailDraft)
        .join(Application, Application.id == EmailDraft.application_id)
        .where(
            Application.job_id == job_id,
            EmailDraft.is_sent.is_(False),
            EmailDraft.is_discarded.is_(False),
        )
    )
    drafts = result.scalars().all()
    if not drafts:
        return SendAllResponse(
            job_id=job_id,
            queued=0,
            message="No drafts are ready to send.",
        )

    bind = db.bind
    database_url = (
        str(bind.engine.url) if bind is not None and hasattr(bind, "engine") else None
    )
    background_tasks.add_task(
        _send_all_for_job, job_id, database_url, user_id, company_id
    )
    return SendAllResponse(
        job_id=job_id,
        queued=len(drafts),
        message=f"Queued {len(drafts)} email(s) for sending.",
    )


async def _send_single_draft(draft: EmailDraft) -> None:
    """Send one outreach email draft if email delivery is enabled."""
    if not settings.send_emails:
        logger.info(
            "Skipping real email send for draft {} because send_emails is disabled.",
            draft.id,
        )
        return

    await EmailService.send_generic_email(
        to_email=draft.application.user.email,
        subject=draft.subject or "Application update",
        html_body=draft.body or "",
    )


async def _send_all_for_job(
    job_id: uuid.UUID,
    database_url: str | None = None,
    initiated_by_user_id: uuid.UUID | None = None,
    company_id: uuid.UUID | None = None,
) -> None:
    """Send all pending drafts for a job in a background session."""
    if database_url is None:
        database_url = str(AsyncSessionLocal.kw["bind"].url)

    engine = create_async_engine(database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as db:
        result = await db.execute(
            select(EmailDraft)
            .join(Application, Application.id == EmailDraft.application_id)
            .where(
                Application.job_id == job_id,
                EmailDraft.is_sent.is_(False),
                EmailDraft.is_discarded.is_(False),
            )
        )
        drafts = result.scalars().all()

        for draft in drafts:
            try:
                await _send_single_draft(draft)
                draft.is_approved = True
                draft.is_sent = True
                if initiated_by_user_id is not None:
                    draft.approved_by_user_id = initiated_by_user_id
                    draft.sent_by_user_id = initiated_by_user_id
                draft.approved_at = _utcnow()
                draft.sent_at = _utcnow()
                await create_activity_event(
                    db,
                    event_type="outreach_email_sent",
                    audience="candidate",
                    title="Application update sent",
                    description="The recruiter sent an update related to your application.",
                    href=f"/candidate/applications/{draft.application_id}",
                    user_id=draft.application.user_id,
                    company_id=company_id,
                    application_id=draft.application_id,
                    draft_id=draft.id,
                    job_id=draft.application.job_id,
                    actor_user_id=initiated_by_user_id,
                )
            except Exception as exc:
                logger.exception("Failed to send draft {}: {}", draft.id, exc)

        await db.commit()
    await engine.dispose()
