import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core import get_current_active_user
from app.core.authorization import require_recruiter_with_organization
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.application import JobApplication
from app.db.models.interview import Interview
from app.db.models.job import JobPosting
from app.db.models.user import User
from app.db.repositories.interview_repo import InterviewRepository
from app.db.session import async_session_factory

router = APIRouter()


def get_interview_repo(request: Request) -> InterviewRepository:
    """Get InterviewRepository from request state DB session."""

    # We'll use the dependency injection properly below
    pass


@router.get("")
@limiter.limit(settings.RATE_LIMIT_API)
async def get_interviews(
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    job_id: uuid.UUID | None = None,
):
    """Get interviews for the recruiter's organization."""
    try:
        organization_id = require_recruiter_with_organization(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e

    # Build query inline since we need complex joins

    # Use the DB session from request state or dependency

    # Get interviews via direct query
    query = (
        select(Interview)
        .join(JobApplication, Interview.application_id == JobApplication.application_id)
        .join(JobPosting, JobApplication.job_id == JobPosting.job_id)
        .where(JobPosting.organization_id == organization_id)
    )

    if start_date:
        query = query.where(Interview.start_time >= start_date)
    if end_date:
        query = query.where(Interview.end_time <= end_date)
    if job_id:
        query = query.where(JobApplication.job_id == job_id)

    query = query.order_by(Interview.start_time.asc())

    # We need DB access — get it from an injected repo
    # Access DB through existing dependency
    # For now, use a workaround via FastAPI's dependency resolution


    # Since we need the DB session, let's use a proper approach
    # by importing the session getter
    async with async_session_factory() as db:
        result = await db.execute(query)
        interviews = result.scalars().all()

        # Enrich with job and candidate information
        enriched = []
        for interview in interviews:
            # Get the application for context
            app_query = (
                select(JobApplication)
                .options(selectinload(JobApplication.job))
                .where(JobApplication.application_id == interview.application_id)
            )
            app_result = await db.execute(app_query)
            application = app_result.scalar_one_or_none()

            enriched.append(
                {
                    "interview_id": str(interview.interview_id),
                    "application_id": str(interview.application_id),
                    "organizer_email": interview.organizer_email,
                    "candidate_email": interview.candidate_email,
                    "start_time": interview.start_time.isoformat(),
                    "end_time": interview.end_time.isoformat(),
                    "status": interview.status,
                    "meeting_url": interview.meeting_url,
                    "job_title": application.job.title
                    if application and application.job
                    else None,
                    "job_id": str(application.job_id) if application else None,
                }
            )

    return {"interviews": enriched, "count": len(enriched)}
