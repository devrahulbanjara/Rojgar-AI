"""Applications: creating them (every path), candidate views, and the
cross-job candidate list. Recruiter decisions live in `pipeline.py`."""

from __future__ import annotations

import os
import uuid
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import (
    invalidate_company_application_caches,
    invalidate_job_detail_caches,
)
from app.core.swr_cache import swr_get
from app.infrastructures.qdrant.service import qdrant_service
from app.modules.activity.service import (
    create_activity_event,
)
from app.modules.applications.models import (
    Application,
    ApplicationEvent,
    ApplicationSyncEvent,
    Review,
)
from app.modules.applications.schemas import (
    CandidateShareSettings,
    RecruiterCandidateApplicationSummary,
    RecruiterCandidateListItem,
    SemanticCandidateSearchResponse,
    SemanticCandidateSearchResult,
)
from app.modules.applications.sync import (
    enqueue_application_sync_event,
)
from app.modules.applications.sync import (
    process_sync_event as process_application_sync_event,
)
from app.modules.auth.enums import MembershipRole, MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.jobs.models import Job
from app.modules.review.service import ensure_review
from app.shared.enums import (
    ApplicationStage,
    EventType,
    JobStatus,
    ReviewState,
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _in_tests() -> bool:
    return "PYTEST_CURRENT_TEST" in os.environ


def _recruiter_candidate_href(application_id: str) -> str:
    return f"/recruiter/applications/{application_id}"


def job_is_open(job: Job) -> bool:
    """Open and not past its closing time (the hourly sweep may lag)."""
    return job.status == JobStatus.open and (
        job.closes_at is None or job.closes_at > _utcnow()
    )


def visible_fit(review: Review | None) -> str | None:
    """Fit shown to recruiters: hidden while reviewing or flagged."""
    if review is None or review.state != ReviewState.done.value:
        return None
    return review.fit


def is_flagged(review: Review | None) -> bool:
    return review is not None and review.state in {
        ReviewState.needs_person.value,
        ReviewState.failed.value,
    }


def application_share_settings(application: Application) -> CandidateShareSettings:
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


def shared_email(application: Application) -> str | None:
    return application.shared_email_value if application.share_email else None


def shared_phone(application: Application) -> str | None:
    return application.shared_phone_value if application.share_phone else None


def display_name(application: Application, user: User | None = None) -> str:
    return application.shared_full_name or (user.full_name if user else "Candidate")


async def create_application(
    db: AsyncSession,
    *,
    job: Job,
    user: User,
    resume_id: uuid.UUID | None,
    source: str,
    fields: dict[str, Any] | None = None,
    actor_user_id: uuid.UUID | None = None,
    referrer_id: uuid.UUID | None = None,
    flag_reason: str | None = None,
) -> tuple[Application, ApplicationSyncEvent]:
    """Insert an application with its pending review and `applied` event.

    Every entry path uses this (signed-in apply, guest apply, recruiter quick
    add). Caller commits, then schedules the review with `schedule_review`.
    ``flag_reason`` hands the review straight to a person (e.g. a CV photo
    that can't be read).
    """
    application = Application(
        job_id=job.id,
        user_id=user.id,
        resume_id=resume_id,
        stage=ApplicationStage.new,
        source=source,
        referrer_id=referrer_id,
        **(fields or {}),
    )
    db.add(application)
    await db.flush()
    review = ensure_review(db, application.id)
    if flag_reason:
        review.state = ReviewState.needs_person.value
        review.flag_reason = flag_reason
    payload: dict[str, Any] = {"source": source}
    if referrer_id is not None:
        payload["referrer_id"] = str(referrer_id)
    db.add(
        ApplicationEvent(
            application_id=application.id,
            type=EventType.applied.value,
            actor_user_id=actor_user_id,
            payload=payload,
        )
    )
    name = application.shared_full_name or user.full_name
    await create_activity_event(
        db,
        event_type="application_received",
        audience="recruiter",
        title=f"New applicant for {job.title}",
        description=f"{name} applied to {job.title}.",
        href=_recruiter_candidate_href(str(application.id)),
        company_id=job.company_id,
        application_id=application.id,
        job_id=job.id,
        actor_user_id=actor_user_id,
        metadata={"candidate_name": name, "source": source},
    )
    sync_event = enqueue_application_sync_event(db, application.id)
    return application, sync_event


def schedule_review(
    bg_tasks: BackgroundTasks,
    application_id: uuid.UUID,
    sync_event_id: uuid.UUID | None = None,
    *,
    review: bool = True,
) -> None:
    """Queue the rolling review (and vector sync) after the response is sent.

    ``review=False`` when another task runs the review itself (CV parsing
    first, then the review).
    """
    if _in_tests():
        return
    from app.modules.review.service import review_application

    if sync_event_id is not None:
        bg_tasks.add_task(process_application_sync_event, sync_event_id)
    if review:
        bg_tasks.add_task(review_application, application_id)


async def invalidate_after_new_application(job: Job) -> None:
    await invalidate_company_application_caches(str(job.company_id))
    await invalidate_job_detail_caches(str(job.id))


async def get_active_company_id(db: AsyncSession, user: User) -> UUID:
    company_id = await db.scalar(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    if not company_id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Only active company members can view applications.",
        )
    return company_id


async def member_access(db: AsyncSession, user: User) -> tuple[UUID, MembershipRole]:
    """The business the person works in now, and their role there."""
    row = (
        await db.execute(
            select(CompanyMembership.company_id, CompanyMembership.role).where(
                CompanyMembership.user_id == user.id,
                CompanyMembership.status == MembershipStatus.active,
            )
        )
    ).first()
    if row is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="You're not part of a business yet."
        )
    return row[0], row[1]


async def visible_job_ids(
    db: AsyncSession, user: User
) -> tuple[UUID, MembershipRole, set[UUID] | None]:
    """(business, role, jobs this person may see; None = every job).

    Interviewers see only the jobs they interview for: an interview invite or
    a booked interview with them as the interviewer.
    """
    from app.modules.interviews.models import Interview, InterviewInvite

    company_id, role = await member_access(db, user)
    if role != MembershipRole.interviewer:
        return company_id, role, None
    invited = (
        select(Application.job_id)
        .join(InterviewInvite, InterviewInvite.application_id == Application.id)
        .where(InterviewInvite.interviewer_user_id == user.id)
    )
    booked = (
        select(Application.job_id)
        .join(Interview, Interview.application_id == Application.id)
        .where(
            Interview.interviewer_user_id == user.id,
            Interview.company_id == company_id,
        )
    )
    job_ids = set(await db.scalars(invited.union(booked)))
    return company_id, role, job_ids


# ---------------------------------------------------------------- candidate side


def _company_candidates_cache_key(
    company_id: str, job_id: str | None, stage: str | None, page: int, size: int
) -> str:
    return (
        f"applications:company:{company_id}:candidates:job:{job_id or 'all'}:"
        f"stage:{stage or 'all'}:p{page}:s{size}"
    )


async def _build_company_candidates(
    db: AsyncSession,
    company_id,
    job_id: str | None,
    stage: ApplicationStage | None,
    page: int,
    size: int,
) -> list[RecruiterCandidateListItem]:
    last_event = (
        select(
            ApplicationEvent.application_id,
            func.max(ApplicationEvent.created_at).label("last_at"),
        )
        .group_by(ApplicationEvent.application_id)
        .subquery()
    )
    stmt = (
        select(Application, User, Job, Review, last_event.c.last_at)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .outerjoin(Review, Review.application_id == Application.id)
        .outerjoin(last_event, last_event.c.application_id == Application.id)
        .where(Job.company_id == company_id)
    )
    if job_id is not None:
        stmt = stmt.where(Application.job_id == job_id)
    if stage is not None:
        stmt = stmt.where(Application.stage == stage)
    stmt = stmt.order_by(Application.updated_at.desc())
    grouped: dict[UUID, dict[str, Any]] = {}
    for application, applicant, job, review, last_at in (await db.execute(stmt)).all():
        activity = max(filter(None, [last_at, application.updated_at]))
        summary = RecruiterCandidateApplicationSummary(
            application_id=application.id,
            job_id=job.id,
            job_title=job.title,
            stage=application.stage,
            fit=visible_fit(review),
            summary=review.summary if review and not is_flagged(review) else None,
            flagged=is_flagged(review),
            source=application.source,
            created_at=application.created_at,
            updated_at=application.updated_at,
        )
        bucket = grouped.get(applicant.id)
        if bucket is None:
            grouped[applicant.id] = {
                "candidate_id": applicant.id,
                "applicant_name": display_name(application, applicant),
                "applicant_email": shared_email(application),
                "applicant_phone": shared_phone(application),
                "applicant_avatar_url": application.shared_avatar_url,
                "latest_application_id": application.id,
                "latest_stage": application.stage,
                "latest_fit": summary.fit,
                "latest_applied_at": application.created_at,
                "last_activity_at": activity,
                "primary_job_title": job.title,
                "primary_job_id": job.id,
                "applications": [summary],
            }
        else:
            bucket["applications"].append(summary)
            bucket["last_activity_at"] = max(bucket["last_activity_at"], activity)
    rows = [
        RecruiterCandidateListItem(
            **bucket, application_count=len(bucket["applications"])
        )
        for bucket in grouped.values()
    ]
    rows.sort(key=lambda item: item.last_activity_at, reverse=True)
    start = (page - 1) * size
    return rows[start : start + size]


async def list_company_candidates(
    db: AsyncSession,
    user: User,
    job_id: str | None,
    stage: ApplicationStage | None,
    page: int,
    size: int,
) -> list[RecruiterCandidateListItem]:
    company_id = await get_active_company_id(db, user)
    cache_key = _company_candidates_cache_key(
        str(company_id), job_id, stage.value if stage else None, page, size
    )

    async def _load(db: AsyncSession = db) -> list:
        items = await _build_company_candidates(
            db, company_id, job_id, stage, page, size
        )
        return [item.model_dump(mode="json") for item in items]

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=180)
    return [RecruiterCandidateListItem.model_validate(item) for item in payload]


_SEMANTIC_SEARCH_MAX_HITS = 500


async def _rows_by_id(db: AsyncSession, application_ids, company_id) -> dict:
    stmt = (
        select(Application, User, Job, Review)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .outerjoin(Review, Review.application_id == Application.id)
        .where(Application.id.in_(application_ids), Job.company_id == company_id)
    )
    return {row[0].id: row for row in (await db.execute(stmt)).all()}


async def semantic_search_candidates(
    db: AsyncSession,
    user: User,
    query: str,
    stages: list[str] | None,
    page: int,
    size: int,
) -> SemanticCandidateSearchResponse:
    """Natural-language search over this company's applications (Qdrant)."""
    company_id = await get_active_company_id(db, user)
    hits = await qdrant_service.search_applications(
        query=query,
        company_id=uuid.UUID(str(company_id)),
        statuses=stages,
        limit=min(page * size, _SEMANTIC_SEARCH_MAX_HITS),
    )
    if not hits:
        return SemanticCandidateSearchResponse(query=query, total=0, candidates=[])
    # Re-check tenancy in SQL; never rely on the vector store filter alone.
    row_map = await _rows_by_id(db, [h["application_id"] for h in hits], company_id)
    candidates: list[SemanticCandidateSearchResult] = []
    for hit in hits:
        row = row_map.get(hit["application_id"])
        if row is None:
            continue
        application, applicant, job, review = row
        candidates.append(
            SemanticCandidateSearchResult(
                application_id=application.id,
                candidate_id=applicant.id,
                applicant_name=display_name(application, applicant),
                applicant_email=shared_email(application),
                applicant_avatar_url=application.shared_avatar_url,
                job_title=job.title,
                job_id=job.id,
                stage=application.stage,
                fit=visible_fit(review),
                summary=review.summary if review and not is_flagged(review) else None,
                match_score=round(hit["score"], 4),
                applied_at=application.created_at,
                updated_at=application.updated_at,
            )
        )
    start = (page - 1) * size
    return SemanticCandidateSearchResponse(
        query=query, total=len(candidates), candidates=candidates[start : start + size]
    )
