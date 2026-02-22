from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select

from app.api.dependencies import get_email_draft_repo, get_job_repo
from app.core import get_current_active_user
from app.core.authorization import require_recruiter_with_organization
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.application import JobApplication
from app.db.models.email_draft import EmailDraft
from app.db.models.job import JobPosting, ShortlistStatus
from app.db.models.user import User
from app.db.repositories.email_draft_repo import EmailDraftRepository
from app.db.repositories.job_repo import JobRepository

router = APIRouter()


@router.get("/pending-emails")
@limiter.limit(settings.RATE_LIMIT_API)
async def get_pending_emails(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    draft_repo: Annotated[EmailDraftRepository, Depends(get_email_draft_repo)],
):
    """Get pending (not sent, not discarded) email drafts for the org."""
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e

    query = (
        select(EmailDraft)
        .join(
            JobApplication, EmailDraft.application_id == JobApplication.application_id
        )
        .join(JobPosting, JobApplication.job_id == JobPosting.job_id)
        .where(
            JobPosting.organization_id == organization_id,
            EmailDraft.is_sent == False,  # noqa: E712
            EmailDraft.is_discarded == False,  # noqa: E712
        )
        .order_by(EmailDraft.created_at.desc())
        .limit(20)
    )

    result = await draft_repo.db.execute(query)
    drafts = result.scalars().all()

    return {
        "count": len(drafts),
        "drafts": [
            {
                "draft_id": str(d.draft_id),
                "application_id": str(d.application_id),
                "subject": d.subject,
                "is_approved": d.is_approved,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in drafts
        ],
    }


@router.get("/pending-shortlists")
@limiter.limit(settings.RATE_LIMIT_API)
async def get_pending_shortlists(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    job_repo: Annotated[JobRepository, Depends(get_job_repo)],
):
    """Get jobs with completed AI shortlist that need human review (finalization)."""
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e

    query = (
        select(JobPosting)
        .where(
            JobPosting.organization_id == organization_id,
            JobPosting.shortlist_status == ShortlistStatus.COMPLETED,
            JobPosting.final_shortlist_completed == False,  # noqa: E712
            JobPosting.status == "active",
        )
        .order_by(JobPosting.updated_at.desc())
    )

    result = await job_repo.db.execute(query)
    jobs = result.scalars().all()

    return {
        "count": len(jobs),
        "jobs": [
            {
                "job_id": str(j.job_id),
                "title": j.title,
                "department": j.department,
                "updated_at": j.updated_at.isoformat() if j.updated_at else None,
            }
            for j in jobs
        ],
    }
