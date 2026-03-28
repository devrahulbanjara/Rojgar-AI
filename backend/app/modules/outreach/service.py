from __future__ import annotations

import html
import uuid

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.infrastructures.email.service import EmailService
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
from app.shared.enums import ApplicationStatus, SyncAction


async def _get_company_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
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


async def _get_company_name(db: AsyncSession, company_id: uuid.UUID) -> str:
    company = await db.scalar(select(Company).where(Company.id == company_id))
    return company.name if company else "ConvexHire"


async def _get_application_for_company(
    db: AsyncSession, application_id: uuid.UUID, company_id: uuid.UUID
) -> tuple[Application, Job]:
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
    return row


def _resolve_outreach_status(
    job: Job, application: Application
) -> ApplicationStatus | None:
    if application.status in {
        ApplicationStatus.screening,
        ApplicationStatus.interview_booked,
        ApplicationStatus.interview,
        ApplicationStatus.offered,
        ApplicationStatus.hired,
    }:
        return ApplicationStatus.screening

    if application.status == ApplicationStatus.rejected:
        return ApplicationStatus.rejected

    if (
        application.status == ApplicationStatus.submitted
        and job.final_shortlist_completed
        and application.score is not None
        and application.feedback is not None
    ):
        return (
            ApplicationStatus.screening
            if application.score >= job.shortlist_threshold
            else ApplicationStatus.rejected
        )

    return None


def _draft_to_response(draft: EmailDraft) -> EmailDraftResponse:
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
        application_feedback=app.feedback,
        subject=draft.subject,
        body=draft.body,
        is_approved=draft.is_approved,
        is_sent=draft.is_sent,
        is_discarded=draft.is_discarded,
        created_at=draft.created_at,
        updated_at=draft.updated_at,
    )


def _compose_draft(
    candidate_name: str,
    company_name: str,
    job_title: str,
    application_status: ApplicationStatus,
    feedback: str | None,
) -> tuple[str, str]:
    safe_name = html.escape(candidate_name)
    safe_company = html.escape(company_name)
    safe_job = html.escape(job_title)
    safe_feedback = html.escape(feedback or "")

    if application_status == ApplicationStatus.screening:
        subject = f"Next steps for your {job_title} application"
        body = (
            f"<p>Hi {safe_name},</p>"
            f"<p>Thank you for applying to <strong>{safe_job}</strong> at {safe_company}.</p>"
            "<p>We have reviewed your application and would like to move you forward "
            "to the next stage of our process.</p>"
        )
    else:
        subject = f"Update on your {job_title} application"
        body = (
            f"<p>Hi {safe_name},</p>"
            f"<p>Thank you for your interest in <strong>{safe_job}</strong> at {safe_company}.</p>"
            "<p>After reviewing your application, we will not be moving forward at this time.</p>"
        )

    if safe_feedback:
        body += f"<p><strong>Review notes:</strong> {safe_feedback}</p>"

    body += (
        "<p>We appreciate the time you invested in applying and wish you the best.</p>"
    )
    body += f"<p>Best regards,<br />{safe_company}</p>"

    return subject, body


async def _compose_draft_with_fallback(
    candidate_name: str,
    company_name: str,
    job_title: str,
    application_status: ApplicationStatus,
    feedback: str | None,
) -> tuple[str, str]:
    try:
        subject, body = await compose_email(
            candidate_name=candidate_name,
            company_name=company_name,
            job_title=job_title,
            application_status=application_status,
            feedback=feedback,
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
        feedback=feedback,
    )


async def _upsert_generated_draft(
    db: AsyncSession,
    application: Application,
    job: Job,
    company_name: str,
) -> EmailDraft:
    outreach_status = _resolve_outreach_status(job, application)
    if outreach_status is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only shortlisted or rejected candidates can receive outreach drafts.",
        )

    if application.status == ApplicationStatus.submitted:
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

    subject, body = await _compose_draft_with_fallback(
        candidate_name=application.user.full_name,
        company_name=company_name,
        job_title=job.title,
        application_status=outreach_status,
        feedback=application.feedback,
    )

    if draft is None:
        draft = EmailDraft(
            application_id=application.id,
            subject=subject,
            body=body,
        )
        db.add(draft)
    else:
        draft.subject = subject
        draft.body = body
        draft.is_discarded = False

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
    company_id = await _get_company_id(db, user_id)
    job = await _get_job_for_company(db, job_id, company_id)
    company_name = await _get_company_name(db, company_id)

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

        if application.status == ApplicationStatus.submitted:
            application.status = outreach_status
            status_updated_ids.append(application.id)

        if application.id in existing_ids:
            continue
        subject, body = await _compose_draft_with_fallback(
            candidate_name=application.user.full_name,
            company_name=company_name,
            job_title=job.title,
            application_status=outreach_status,
            feedback=application.feedback,
        )
        db.add(
            EmailDraft(
                application_id=application.id,
                subject=subject,
                body=body,
                is_approved=direct_send,
            )
        )
        new_drafts += 1

    if status_updated_ids:
        enqueue_application_sync_events(db, status_updated_ids, SyncAction.UPSERT)

    await db.commit()

    if direct_send:
        bind = db.bind
        database_url = (
            str(bind.engine.url)
            if bind is not None and hasattr(bind, "engine")
            else None
        )
        background_tasks.add_task(_send_all_for_job, job_id, database_url)

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
    company_id = await _get_company_id(db, user_id)
    application, job = await _get_application_for_company(
        db, application_id, company_id
    )
    company_name = await _get_company_name(db, company_id)

    draft = await _upsert_generated_draft(db, application, job, company_name)
    await db.commit()
    await db.refresh(draft)
    return _draft_to_response(draft)


async def update_draft(
    db: AsyncSession,
    draft_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: UpdateDraftRequest,
) -> EmailDraftResponse:
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

    await db.commit()
    await db.refresh(draft)
    return _draft_to_response(draft)


async def approve_draft(
    db: AsyncSession,
    draft_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: ApproveDraftRequest,
) -> EmailDraftResponse:
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
        await db.commit()
        await db.refresh(draft)
        await _send_single_draft(draft)
        draft.is_sent = True
    else:
        draft.is_discarded = True

    await db.commit()
    await db.refresh(draft)
    return _draft_to_response(draft)


async def delete_draft(
    db: AsyncSession,
    draft_id: uuid.UUID,
    user_id: uuid.UUID,
) -> DeleteDraftsResponse:
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
    background_tasks.add_task(_send_all_for_job, job_id, database_url)
    return SendAllResponse(
        job_id=job_id,
        queued=len(drafts),
        message=f"Queued {len(drafts)} email(s) for sending.",
    )


async def _send_single_draft(draft: EmailDraft) -> None:
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


async def _send_all_for_job(job_id: uuid.UUID, database_url: str | None = None) -> None:
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
            except Exception as exc:
                logger.exception("Failed to send draft {}: {}", draft.id, exc)

        await db.commit()
    await engine.dispose()
