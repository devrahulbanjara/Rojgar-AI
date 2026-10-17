"""Applications: creating them (every path), candidate views, and the
cross-job candidate list. Recruiter decisions live in `pipeline.py`."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
    invalidate_job_detail_caches,
)
from app.core.swr_cache import swr_get
from app.infrastructures.qdrant.service import qdrant_service
from app.infrastructures.redis.service import redis_service
from app.modules.activity.schemas import ActivityEventResponse
from app.modules.activity.service import (
    create_activity_event,
    list_application_timeline,
)
from app.modules.applications.models import (
    Application,
    ApplicationEvent,
    ApplicationSyncEvent,
    Review,
)
from app.modules.applications.schemas import (
    ApplicationResponse,
    ApplyRequest,
    CandidateApplicationView,
    CandidateShareSettings,
    RecruiterCandidateApplicationSummary,
    RecruiterCandidateListItem,
    SemanticCandidateSearchResponse,
    SemanticCandidateSearchResult,
    SimilarCandidateResult,
    SimilarCandidatesResponse,
)
from app.modules.applications.sync import (
    enqueue_application_sync_event,
)
from app.modules.applications.sync import (
    process_sync_event as process_application_sync_event,
)
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.jobs.models import Job
from app.modules.profiles.models import Profile
from app.modules.resumes.models import Resume
from app.modules.resumes.schemas import ResumeResponse
from app.modules.review.service import ensure_review
from app.shared.enums import (
    ApplicationSource,
    ApplicationStage,
    EventType,
    JobStatus,
    ReviewState,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _in_tests() -> bool:
    return "PYTEST_CURRENT_TEST" in os.environ


def _application_detail_href(application_id: str) -> str:
    return f"/candidate/applications/{application_id}"


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


def _candidate_next_step_hint(stage: ApplicationStage) -> str:
    return {
        ApplicationStage.new: "The team is reviewing applications.",
        ApplicationStage.shortlisted: "You're shortlisted. Watch for an interview invite.",
        ApplicationStage.interview: "Check your email for the interview details.",
        ApplicationStage.offer: "You have an offer. The team will contact you.",
        ApplicationStage.hired: "Congratulations, you're hired.",
    }.get(stage, "This application is closed.")


def _build_share_settings(payload: ApplyRequest) -> CandidateShareSettings:
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


def _shared_profile_snapshot(
    user: User, profile: Profile | None, share: CandidateShareSettings
) -> dict[str, str | None]:
    """The shared_* snapshot stored on the application at apply time."""
    return {
        "shared_full_name": user.full_name,
        "shared_avatar_url": user.avatar_url if share.share_avatar else None,
        "shared_email_value": user.email,
        "shared_phone_value": (profile.phone if profile else None) or user.phone
        if share.share_phone
        else None,
        "shared_location_value": profile.location
        if profile and share.share_location
        else None,
        "shared_headline_value": profile.headline
        if profile and share.share_headline_summary
        else None,
        "shared_summary_value": profile.summary
        if profile and share.share_headline_summary
        else None,
        "shared_linkedin_url": profile.linkedin_url
        if profile and share.share_links
        else None,
        "shared_github_url": profile.github_url
        if profile and share.share_links
        else None,
        "shared_portfolio_url": profile.portfolio_url
        if profile and share.share_links
        else None,
    }


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
) -> tuple[Application, ApplicationSyncEvent]:
    """Insert an application with its pending review and `applied` event.

    Every entry path uses this (signed-in apply, guest apply, recruiter quick
    add, public recommendation). Caller commits, then schedules the review
    with `schedule_review`.
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
    ensure_review(db, application.id)
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
    bg_tasks: BackgroundTasks | None,
    application_id: uuid.UUID,
    sync_event_id: uuid.UUID | None = None,
) -> None:
    """Queue the rolling review (and vector sync) after the response is sent."""
    if bg_tasks is None or _in_tests():
        return
    from app.modules.review.service import review_application

    if sync_event_id is not None:
        bg_tasks.add_task(process_application_sync_event, sync_event_id)
    bg_tasks.add_task(review_application, application_id)


async def invalidate_after_new_application(job: Job, user_id: uuid.UUID, db) -> None:
    await invalidate_candidate_read_caches(str(user_id))
    await invalidate_company_dashboard_caches(db, str(job.company_id))
    await invalidate_company_application_caches(str(job.company_id))
    await invalidate_job_detail_caches(str(job.id))
    await redis_service.delete(f"jobs:company:{job.company_id}")


def _response_options():
    return [
        joinedload(Application.resume).selectinload(Resume.experiences),
        joinedload(Application.resume).selectinload(Resume.educations),
        joinedload(Application.resume).selectinload(Resume.skills),
    ]


async def apply_to_job(
    db: AsyncSession,
    user: User,
    payload: ApplyRequest,
    bg_tasks: BackgroundTasks | None = None,
) -> ApplicationResponse:
    """Signed-in candidate applies with one of their own resumes."""
    job = await db.scalar(select(Job).where(Job.id == payload.job_id))
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Job not found.")
    if not job_is_open(job):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="This job is not currently accepting applications.",
        )
    resume = await db.scalar(select(Resume).where(Resume.id == payload.resume_id))
    if not resume or resume.user_id != user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, detail="Invalid resume ID or access denied."
        )
    existing = await db.scalar(
        select(Application.id).where(
            Application.job_id == job.id, Application.user_id == user.id
        )
    )
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="You have already applied to this job."
        )
    profile = await db.scalar(select(Profile).where(Profile.user_id == user.id))
    share = _build_share_settings(payload)
    try:
        application, sync_event = await create_application(
            db,
            job=job,
            user=user,
            resume_id=resume.id,
            source=ApplicationSource.direct.value,
            fields={
                **share.model_dump(),
                **_shared_profile_snapshot(user, profile, share),
                "consented_at": _utcnow(),
            },
            actor_user_id=user.id,
        )
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="You have already applied to this job."
        ) from None
    schedule_review(bg_tasks, application.id, sync_event.id)
    await invalidate_after_new_application(job, user.id, db)
    logger.info("User {} applied to job {}", user.id, job.id)
    application = await db.scalar(
        select(Application)
        .where(Application.id == application.id)
        .options(*_response_options())
        .execution_options(populate_existing=True)
    )
    return ApplicationResponse(
        id=application.id,
        job_id=application.job_id,
        user_id=application.user_id,
        resume_id=application.resume_id,
        stage=application.stage,
        created_at=application.created_at,
        updated_at=application.updated_at,
        resume=ResumeResponse.model_validate(application.resume)
        if application.resume
        else None,
        job_title=job.title,
        location=job.location,
        location_type=job.location_type,
        next_step_hint=_candidate_next_step_hint(application.stage),
    )


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


# ---------------------------------------------------------------- candidate side


async def _build_candidate_applications(
    db: AsyncSession, user_id, page: int, size: int
) -> list[CandidateApplicationView]:
    rows = (
        await db.execute(
            select(Application, Job, Company)
            .join(Job, Job.id == Application.job_id)
            .join(Company, Company.id == Job.company_id)
            .where(Application.user_id == user_id)
            .order_by(Application.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
        )
    ).all()
    return [
        CandidateApplicationView(
            id=application.id,
            stage=application.stage,
            created_at=application.created_at,
            updated_at=application.updated_at,
            job_id=job.id,
            job_title=job.title,
            company_name=company.name,
            company_logo_url=company.logo_url,
            location=job.location,
            location_type=job.location_type,
        )
        for application, job, company in rows
    ]


async def list_user_applications(
    db: AsyncSession, user: User, page: int, size: int
) -> list[CandidateApplicationView]:
    cache_key = f"applications:candidate:{user.id}:p{page}:s{size}"

    async def _load(db: AsyncSession = db) -> list:
        items = await _build_candidate_applications(db, user.id, page, size)
        return [item.model_dump(mode="json") for item in items]

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=300)
    return [CandidateApplicationView.model_validate(item) for item in payload]


async def get_application(
    db: AsyncSession, user: User, application_id: str
) -> ApplicationResponse:
    """One application, for the candidate who owns it."""
    application = await db.scalar(
        select(Application)
        .where(Application.id == application_id, Application.user_id == user.id)
        .options(*_response_options())
    )
    if not application:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found.")
    job = await db.scalar(select(Job).where(Job.id == application.job_id))
    company = await db.scalar(select(Company).where(Company.id == job.company_id))
    timeline = await list_application_timeline(
        db, application_id=str(application.id), audience="candidate"
    )
    return ApplicationResponse(
        id=application.id,
        job_id=application.job_id,
        user_id=application.user_id,
        resume_id=application.resume_id,
        stage=application.stage,
        created_at=application.created_at,
        updated_at=application.updated_at,
        resume=ResumeResponse.model_validate(application.resume)
        if application.resume
        else None,
        job_title=job.title,
        company_name=company.name if company else None,
        company_logo_url=company.logo_url if company else None,
        location=job.location,
        location_type=job.location_type,
        timeline=timeline,
        next_step_hint=_candidate_next_step_hint(application.stage),
    )


async def get_application_timeline(
    db: AsyncSession, user: User, application_id: str
) -> list[ActivityEventResponse]:
    owned = await db.scalar(
        select(Application.id).where(
            Application.id == application_id, Application.user_id == user.id
        )
    )
    if not owned:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return await list_application_timeline(
        db, application_id=application_id, audience="candidate"
    )


async def respond_to_offer(
    db: AsyncSession, application_id: uuid.UUID, accepted: bool, user: User
) -> None:
    """Candidate accepts (hired) or declines (withdrawn) an offer."""
    application = await db.scalar(
        select(Application).where(
            Application.id == application_id, Application.user_id == user.id
        )
    )
    if not application:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found")
    if application.stage != ApplicationStage.offer:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Application is not at offer stage"
        )
    job = await db.scalar(select(Job).where(Job.id == application.job_id))
    new_stage = ApplicationStage.hired if accepted else ApplicationStage.withdrawn
    application.stage = new_stage
    application.decided_at = _utcnow()
    application.decided_by = user.id
    word = "accepted" if accepted else "declined"
    db.add(
        ApplicationEvent(
            application_id=application.id,
            type=EventType.stage_changed.value,
            actor_user_id=user.id,
            payload={
                "from": ApplicationStage.offer.value,
                "to": new_stage.value,
                "action": f"offer_{word}",
                "note": f"{word} offer",
            },
        )
    )
    await create_activity_event(
        db,
        event_type=f"application_offer_{word}",
        audience="recruiter",
        title=f"{user.full_name} {word} the offer for {job.title}",
        href=_recruiter_candidate_href(str(application.id)),
        company_id=job.company_id,
        application_id=application.id,
        job_id=job.id,
        actor_user_id=user.id,
    )
    enqueue_application_sync_event(db, application.id)
    await db.commit()
    await invalidate_candidate_read_caches(str(user.id))
    await invalidate_company_application_caches(
        str(job.company_id), str(application.id)
    )


# ---------------------------------------------------------------- recruiter: candidates across jobs


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


async def find_similar_candidates(
    db: AsyncSession, user: User, application_id: str, limit: int = 10
) -> SimilarCandidatesResponse:
    """ "More like this one" within the same company."""
    company_id = await get_active_company_id(db, user)
    ref = await db.execute(
        select(Application, User, Job, Review)
        .join(User, User.id == Application.user_id)
        .join(Job, Job.id == Application.job_id)
        .outerjoin(Review, Review.application_id == Application.id)
        .where(Application.id == application_id, Job.company_id == company_id)
    )
    ref_row = ref.one_or_none()
    if ref_row is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="Reference application not found or does not belong to your company.",
        )
    ref_app, ref_user, ref_job, ref_review = ref_row
    document = qdrant_service._build_application_document(ref_app, ref_job, ref_review)
    hits = await qdrant_service.search_applications(
        query=document, company_id=uuid.UUID(str(company_id)), limit=limit + 5
    )
    hits = [h for h in hits or [] if h["application_id"] != ref_app.id]
    row_map = await _rows_by_id(db, [h["application_id"] for h in hits], company_id)
    candidates: list[SimilarCandidateResult] = []
    for hit in hits:
        row = row_map.get(hit["application_id"])
        if row is None:
            continue
        application, applicant, job, review = row
        candidates.append(
            SimilarCandidateResult(
                application_id=application.id,
                candidate_id=applicant.id,
                applicant_name=display_name(application, applicant),
                applicant_email=shared_email(application),
                applicant_avatar_url=application.shared_avatar_url,
                job_title=job.title,
                job_id=job.id,
                stage=application.stage,
                fit=visible_fit(review),
                similarity_score=round(hit["score"], 4),
                applied_at=application.created_at,
                updated_at=application.updated_at,
            )
        )
        if len(candidates) >= limit:
            break
    return SimilarCandidatesResponse(
        reference_application_id=ref_app.id,
        reference_candidate_name=display_name(ref_app, ref_user),
        total=len(candidates),
        candidates=candidates,
    )
