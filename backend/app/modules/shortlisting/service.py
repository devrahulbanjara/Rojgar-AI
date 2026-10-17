from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.pool import NullPool

from app.agents.shortlisting import (
    evaluate_resume_text,
    stringify_job,
    stringify_resume,
)
from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_candidate_read_caches_for_users,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
)
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.swr_cache import swr_get
from app.infrastructures.redis.service import redis_service
from app.modules.applications.models import Application
from app.modules.applications.sync import enqueue_application_sync_events
from app.modules.audit.service import create_custom_audit_log
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import CompanyMembership
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume
from app.modules.shortlisting.schemas import (
    FinalizeShortlistRequest,
    FinalizeShortlistResponse,
    ShortlistSummaryResponse,
    TriggerShortlistResponse,
)
from app.shared.enums import ApplicationStatus, JobStatus, ShortlistStatus, SyncAction

# A claim older than this is treated as abandoned (crashed worker) and may be
# re-claimed; LLM review of a large job can legitimately take a while.
SHORTLISTING_CLAIM_STALE_AFTER = timedelta(minutes=30)

AI_REVIEW_PENDING = "pending"
AI_REVIEW_COMPLETED = "completed"
AI_REVIEW_FAILED = "failed"
AI_REVIEW_NEEDS_HUMAN = "needs_human_review"
_AI_REVIEW_TERMINAL = {AI_REVIEW_COMPLETED, AI_REVIEW_FAILED, AI_REVIEW_NEEDS_HUMAN}

_UNSCORED_REASON = (
    "Not scored automatically (missing experience data or resume embedding); "
    "please review manually."
)


def _job_is_open_for_auto_shortlisting(job: Job) -> bool:
    """Return True when a job is still open for auto-shortlisting."""
    return job.status == JobStatus.active and (
        job.expires_at is None or job.expires_at > datetime.now(timezone.utc)
    )


def _job_has_expired(job: Job) -> bool:
    """Return True when a job is effectively expired."""
    return job.status == JobStatus.expired or (
        job.expires_at is not None and job.expires_at <= datetime.now(timezone.utc)
    )


def _application_has_complete_review(application: Application) -> bool:
    """Return True when the application needs no further automatic review."""
    if application.ai_review_status in _AI_REVIEW_TERMINAL:
        return True
    return application.score is not None and (
        bool(application.strengths) or bool(application.weaknesses)
    )


def _apply_ml_score(application: Application, ml_score: float | None) -> None:
    """Store an ML pre-filter score; unscorable applications are flagged."""
    application.ml_bouncer_score = ml_score
    if ml_score is None:
        application.score = None
        if application.ai_flag_reason is None:
            application.ai_flag_reason = _UNSCORED_REASON
    else:
        application.score = max(0, min(100, round(ml_score * 100)))
        if application.ai_flag_reason == _UNSCORED_REASON:
            application.ai_flag_reason = None


def select_llm_cohort(applications: list[Application]) -> list[Application]:
    """Pick which applications get an LLM review.

    Small jobs: everyone, so the ML pre-filter never decides who gets read.
    Large jobs: the top N% by ML score among those above the minimum score.
    Applications the ML model could not score are never silently skipped — they
    are flagged for human review by the caller.
    """
    if len(applications) <= settings.shortlisting_full_review_max_applicants:
        return list(applications)
    ranked = sorted(
        (a for a in applications if a.ml_bouncer_score is not None),
        key=lambda a: a.ml_bouncer_score or 0.0,
        reverse=True,
    )
    eligible = [
        a
        for a in ranked
        if (a.ml_bouncer_score or 0.0) >= settings.ml_bouncer_min_score
    ]
    top_n = max(1, -(-len(applications) * settings.ml_bouncer_top_percent // 100))
    return eligible[:top_n]


async def claim_job_for_shortlisting(db: AsyncSession, job_id: uuid.UUID) -> bool:
    """Atomically mark a job in_progress. Returns False if another run owns it.

    Prevents duplicate LLM runs across workers/replicas (cron, startup recovery,
    manual triggers). An in_progress claim older than the stale window is
    considered abandoned and can be taken over.
    """
    stale_before = datetime.now(timezone.utc) - SHORTLISTING_CLAIM_STALE_AFTER
    result = await db.execute(
        update(Job)
        .where(
            Job.id == job_id,
            Job.final_shortlist_completed.is_(False),
            or_(
                Job.shortlist_status != ShortlistStatus.in_progress,
                Job.updated_at < stale_before,
            ),
        )
        .values(shortlist_status=ShortlistStatus.in_progress)
        .returning(Job.id)
        .execution_options(synchronize_session=False)
    )
    claimed = result.scalar_one_or_none() is not None
    await db.commit()
    return claimed


async def _get_company_id_for_user(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
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


async def queue_auto_shortlist_backfill(job_id: uuid.UUID, database_url: str) -> None:
    """Backfill ML bouncer scores for all applications of a job (no LLM).

    Runs when auto-shortlist is freshly enabled on a job that already has
    applications. LLM evaluation is deferred until the job expires.
    """
    await _run_ml_bouncer_backfill_task(job_id, database_url)


async def _run_ml_bouncer_backfill_task(job_id: uuid.UUID, database_url: str) -> None:
    """ML bouncer-only scoring for every application on the job. No LLM."""
    from app.modules.shortlisting.ml_bouncer import score_applications

    engine = create_async_engine(database_url, poolclass=NullPool)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_factory() as db:
            result = await db.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()
            if job is None:
                return

            try:
                if not _job_is_open_for_auto_shortlisting(job) and not _job_has_expired(
                    job
                ):
                    job.shortlist_status = ShortlistStatus.not_started
                    await db.commit()
                    return

                job.shortlist_status = ShortlistStatus.in_progress
                await db.commit()

                applications = list(
                    (
                        await db.execute(
                            select(Application)
                            .where(Application.job_id == job_id)
                            .options(
                                selectinload(Application.resume).selectinload(
                                    Resume.experiences
                                ),
                                selectinload(Application.resume).selectinload(
                                    Resume.educations
                                ),
                                selectinload(Application.resume).selectinload(
                                    Resume.skills
                                ),
                            )
                        )
                    )
                    .scalars()
                    .all()
                )

                if not applications:
                    job.shortlist_status = ShortlistStatus.completed
                    await db.commit()
                    return

                ml_scores = score_applications(job, applications)
                for app, ml_score in zip(applications, ml_scores, strict=True):
                    _apply_ml_score(app, ml_score)

                enqueue_application_sync_events(
                    db, [a.id for a in applications], SyncAction.UPSERT
                )
                job.shortlist_status = ShortlistStatus.completed
                await db.commit()

                await invalidate_company_dashboard_caches(db, str(job.company_id))
                await invalidate_company_application_caches(str(job.company_id))
                await redis_service.delete(f"shortlist:summary:{job_id}")
                logger.info(
                    "ML bouncer backfill scored {} applications for job {}",
                    len(applications),
                    job_id,
                )
            except Exception as exc:
                await db.rollback()
                refresh_result = await db.execute(select(Job).where(Job.id == job_id))
                refresh_job = refresh_result.scalar_one_or_none()
                if refresh_job is not None:
                    refresh_job.shortlist_status = ShortlistStatus.failed
                    await db.commit()
                logger.exception(
                    "ML bouncer backfill failed for job {}: {}", job_id, exc
                )
    finally:
        await engine.dispose()


async def score_application_ml_bouncer(
    application_id: uuid.UUID, database_url: str
) -> None:
    """Run ML bouncer on a single application (called on apply when auto_shortlist=True).

    No LLM. LLM evaluation is run only on the top 20% when the job expires.
    """
    from app.modules.shortlisting.ml_bouncer import score_applications

    engine = create_async_engine(database_url, poolclass=NullPool)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_factory() as db:
            application = await db.scalar(
                select(Application)
                .where(Application.id == application_id)
                .options(
                    selectinload(Application.resume).selectinload(Resume.experiences),
                    selectinload(Application.resume).selectinload(Resume.educations),
                    selectinload(Application.resume).selectinload(Resume.skills),
                )
            )
            if application is None:
                return
            job = await db.scalar(select(Job).where(Job.id == application.job_id))
            if job is None or not job.auto_shortlist:
                return

            ml_score = score_applications(job, [application])[0]
            _apply_ml_score(application, ml_score)
            enqueue_application_sync_events(db, [application.id], SyncAction.UPSERT)
            await db.commit()

            await invalidate_candidate_read_caches_for_users([str(application.user_id)])
            await invalidate_company_dashboard_caches(db, str(job.company_id))
            await invalidate_company_application_caches(str(job.company_id))
            await redis_service.delete(f"shortlist:summary:{job.id}")
            logger.info(
                "ML bouncer scored application {} for job {} (score={})",
                application_id,
                job.id,
                "unscored" if ml_score is None else f"{ml_score:.3f}",
            )
    except Exception as exc:
        logger.exception(
            "ML bouncer scoring failed for application {}: {}", application_id, exc
        )
    finally:
        await engine.dispose()


async def _load_job_applications(db: AsyncSession, job_id: uuid.UUID) -> list:
    """Load every application of a job with the resume data the pipeline needs."""
    return list(
        (
            await db.execute(
                select(Application)
                .where(Application.job_id == job_id)
                .options(
                    selectinload(Application.resume).selectinload(Resume.experiences),
                    selectinload(Application.resume).selectinload(Resume.educations),
                    selectinload(Application.resume).selectinload(Resume.skills),
                    joinedload(Application.user),
                )
                # Review fields are written with Core UPDATEs; refresh any
                # identity-mapped instances so retries see current attempts.
                .execution_options(populate_existing=True)
            )
        )
        .scalars()
        .all()
    )


async def _set_review_fields(
    db: AsyncSession, application_id: uuid.UUID, **values
) -> None:
    """Write AI review fields for one application in its own short transaction."""
    await db.execute(
        update(Application)
        .where(Application.id == application_id)
        .values(**values)
        .execution_options(synchronize_session=False)
    )
    enqueue_application_sync_events(db, [application_id], SyncAction.UPSERT)
    await db.commit()


async def _run_llm_reviews(
    db: AsyncSession, job: Job, cohort: list[Application]
) -> tuple[int, int, int]:
    """LLM-review each application in the cohort. Returns (done, flagged, failed).

    Every input the LLM needs is rendered to plain text up front, then each
    application is processed as: count the attempt (commit) -> LLM call with no
    open transaction -> write the outcome (commit). A failure affects only its
    own application and is never retried past the attempt cap, so a single bad
    resume can neither stall the job nor be retried forever.
    """
    jd_text = stringify_job(job)
    job_title = job.title
    max_attempts = settings.shortlisting_max_review_attempts
    work = [
        (
            application.id,
            stringify_resume(
                application,
                getattr(application.__dict__.get("user"), "full_name", None),
            ),
            application.ai_review_attempts or 0,
        )
        for application in cohort
        if not _application_has_complete_review(application)
    ]

    done = flagged = failed = 0
    for application_id, resume_text, attempts in work:
        if attempts >= max_attempts:
            await _set_review_fields(
                db,
                application_id,
                ai_review_status=AI_REVIEW_FAILED,
                ai_flag_reason="Automatic review failed repeatedly; please review manually.",
            )
            failed += 1
            continue

        await _set_review_fields(
            db,
            application_id,
            ai_review_status=AI_REVIEW_PENDING,
            ai_review_attempts=attempts + 1,
        )
        try:
            result = await evaluate_resume_text(
                application_ref=str(application_id),
                job_title=job_title,
                jd_text=jd_text,
                resume_text=resume_text,
            )
        except Exception as exc:
            exhausted = attempts + 1 >= max_attempts
            await _set_review_fields(
                db,
                application_id,
                ai_review_status=AI_REVIEW_FAILED if exhausted else None,
                ai_flag_reason=(
                    "Automatic review failed repeatedly; please review manually."
                    if exhausted
                    else None
                ),
            )
            failed += 1
            logger.warning(
                "Stage2 LLM failed for application {} on job {} (attempt {}/{}): {}",
                application_id,
                job.id,
                attempts + 1,
                max_attempts,
                type(exc).__name__,
            )
            continue

        if result.needs_human_review:
            await _set_review_fields(
                db,
                application_id,
                ai_review_status=AI_REVIEW_NEEDS_HUMAN,
                ai_flag_reason=result.review_note,
            )
            flagged += 1
        else:
            await _set_review_fields(
                db,
                application_id,
                strengths=result.strengths,
                weaknesses=result.weaknesses,
                ai_review_status=AI_REVIEW_COMPLETED,
            )
            done += 1
    return done, flagged, failed


async def run_two_stage_for_expired_job(
    db: AsyncSession, job: Job, *, already_claimed: bool = False
) -> None:
    """Run ML ranking + LLM review for a job, then mark recommendations ready.

    Never changes application statuses: the recruiter confirms decisions
    (`finalize_shortlist`). Idempotent and crash-safe: work already done is
    skipped, and a run already owned by another worker is not duplicated.
    """
    from app.modules.shortlisting.ml_bouncer import score_applications

    if job.final_shortlist_completed:
        logger.info("Two-stage skipped for job {}: already finalized.", job.id)
        return

    job_id = job.id
    if not already_claimed and not await claim_job_for_shortlisting(db, job_id):
        logger.info("Two-stage skipped for job {}: another run owns it.", job_id)
        return
    logger.info("Two-stage START for job {}. status=in_progress", job_id)

    try:
        applications = await _load_job_applications(db, job_id)

        # --- Stage 1: ML ranking for applications missing a score ---
        unscored = [
            a
            for a in applications
            if a.ml_bouncer_score is None and a.ai_flag_reason != _UNSCORED_REASON
        ]
        if unscored:
            for app, ml_score in zip(
                unscored, score_applications(job, unscored), strict=True
            ):
                _apply_ml_score(app, ml_score)
            enqueue_application_sync_events(
                db, [a.id for a in unscored], SyncAction.UPSERT
            )
            await db.commit()

        # --- Stage 2: LLM review ---
        cohort = select_llm_cohort(applications)
        done, flagged, failed = await _run_llm_reviews(db, job, cohort)

        # Unscored applications outside the LLM cohort go to a human, visibly.
        cohort_ids = {a.id for a in cohort}
        for application in applications:
            if (
                application.id not in cohort_ids
                and application.score is None
                and application.ai_review_status not in _AI_REVIEW_TERMINAL
            ):
                await _set_review_fields(
                    db,
                    application.id,
                    ai_review_status=AI_REVIEW_NEEDS_HUMAN,
                    ai_flag_reason=_UNSCORED_REASON,
                )

        await db.execute(
            update(Job)
            .where(Job.id == job_id)
            .values(shortlist_status=ShortlistStatus.completed)
            .execution_options(synchronize_session=False)
        )
        await db.commit()
        job.shortlist_status = ShortlistStatus.completed
        await auto_finalize_expired_job(db, job)
        logger.info(
            "Two-stage DONE for job {}: {} apps, {} reviewed, {} flagged, {} failed.",
            job_id,
            len(applications),
            done,
            flagged,
            failed,
        )
    except Exception as exc:
        await db.rollback()
        try:
            await db.execute(
                update(Job)
                .where(Job.id == job_id)
                .values(shortlist_status=ShortlistStatus.failed)
                .execution_options(synchronize_session=False)
            )
            await db.commit()
        except Exception:
            await db.rollback()
        logger.exception("Two-stage FAILED for job {}: {}", job_id, exc)


async def recover_unfinished_shortlisting() -> None:
    """Resume expired auto-shortlist jobs left unfinished by a prior crash.

    Called in the background after startup (never blocking it). Each job is
    claimed atomically, so concurrent replicas do not duplicate work, and the
    per-application attempt cap bounds how often a failing resume is retried.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Job).where(
                Job.status == JobStatus.expired,
                Job.auto_shortlist.is_(True),
                Job.final_shortlist_completed.is_(False),
                Job.shortlist_status != ShortlistStatus.completed,
            )
        )
        jobs = list(result.scalars().all())
        if not jobs:
            logger.info("Shortlisting recovery: no unfinished expired jobs.")
            return

        logger.info(
            "Shortlisting recovery: found {} unfinished expired job(s) to resume.",
            len(jobs),
        )
        for job in jobs:
            try:
                await run_two_stage_for_expired_job(db, job)
            except Exception as exc:
                logger.exception(
                    "Shortlisting recovery failed for job {}: {}", job.id, exc
                )


async def process_job_expiry_shortlisting(job_id: uuid.UUID, database_url: str) -> None:
    """Run two-stage shortlisting + finalize for a manually-expired job.

    Mirrors the per-job logic of `expire_due_jobs` so manual expiry from the
    recruiter UI matches the behavior of the daily cron.
    """
    engine = create_async_engine(database_url, poolclass=NullPool)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_factory() as db:
            job = await db.scalar(select(Job).where(Job.id == job_id))
            if job is None or job.status != JobStatus.expired:
                return

            logger.info(
                "Manual expiry shortlisting for job '{}' ({}) (auto_shortlist={}, final_completed={})",
                job.title,
                job_id,
                job.auto_shortlist,
                job.final_shortlist_completed,
            )

            if job.auto_shortlist and not job.final_shortlist_completed:
                await run_two_stage_for_expired_job(db, job)
            else:
                await auto_finalize_expired_job(db, job)

            applicant_rows = (
                await db.execute(
                    select(Application.user_id)
                    .where(Application.job_id == job_id)
                    .distinct()
                )
            ).all()
            applicant_user_ids = [str(row[0]) for row in applicant_rows]
            if applicant_user_ids:
                await invalidate_candidate_read_caches_for_users(applicant_user_ids)
    except Exception as exc:
        logger.exception(
            "process_job_expiry_shortlisting failed for job {}: {}", job_id, exc
        )
    finally:
        await engine.dispose()


async def evaluate_single_application(
    db: AsyncSession,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Application:
    """Run AI evaluation on a single application, overwriting any existing review.

    No silent fallbacks: if the ML model cannot score the application its score
    stays empty, and if the LLM review fails the request fails (the previous
    review is kept) instead of storing heuristic text dressed up as AI output.
    """
    company_id = await _get_company_id_for_user(db, user_id)

    application = await db.scalar(
        select(Application)
        .where(Application.id == application_id)
        .options(
            selectinload(Application.resume).selectinload(Resume.experiences),
            selectinload(Application.resume).selectinload(Resume.educations),
            selectinload(Application.resume).selectinload(Resume.skills),
            joinedload(Application.user),
        )
    )
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    job = await _get_job_for_company(db, application.job_id, company_id)

    from app.modules.shortlisting.ml_bouncer import score_applications

    try:
        _apply_ml_score(application, score_applications(job, [application])[0])
    except Exception:
        logger.exception("ML bouncer scoring failed for application {}", application_id)
        _apply_ml_score(application, None)

    jd_text = stringify_job(job)
    resume_text = stringify_resume(application, application.user.full_name)
    application.ai_review_attempts = (application.ai_review_attempts or 0) + 1
    application.ai_review_status = AI_REVIEW_PENDING
    # Release the connection before the slow LLM call.
    await db.commit()

    try:
        result = await evaluate_resume_text(
            application_ref=str(application.id),
            job_title=job.title,
            jd_text=jd_text,
            resume_text=resume_text,
        )
    except Exception as exc:
        application.ai_review_status = AI_REVIEW_FAILED
        await db.commit()
        logger.warning(
            "AI evaluation failed for application {}: {}",
            application_id,
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI evaluation failed. The previous review was kept; please retry.",
        ) from exc

    if result.needs_human_review:
        application.ai_review_status = AI_REVIEW_NEEDS_HUMAN
        application.ai_flag_reason = result.review_note
    else:
        application.strengths = result.strengths
        application.weaknesses = result.weaknesses
        application.ai_review_status = AI_REVIEW_COMPLETED
        if application.ai_flag_reason != _UNSCORED_REASON:
            application.ai_flag_reason = None

    enqueue_application_sync_events(db, [application.id], SyncAction.UPSERT)
    await db.commit()

    await invalidate_candidate_read_caches(str(application.user_id))
    await invalidate_company_dashboard_caches(db, str(job.company_id))
    await invalidate_company_application_caches(
        str(job.company_id), str(application.id)
    )
    await redis_service.delete(f"shortlist:summary:{application.job_id}")

    return application


async def _build_shortlist_summary(
    db: AsyncSession, job_id: uuid.UUID, company_id: uuid.UUID
) -> ShortlistSummaryResponse:
    """Compute shortlist summary; auto-fails stale in-progress runs."""
    job = await _get_job_for_company(db, job_id, company_id)
    total = int(
        await db.scalar(
            select(func.count(Application.id)).where(Application.job_id == job_id)
        )
        or 0
    )
    scored = int(
        await db.scalar(
            select(func.count(Application.id)).where(
                Application.job_id == job_id,
                Application.score.is_not(None),
            )
        )
        or 0
    )

    if (
        job.shortlist_status == ShortlistStatus.in_progress
        and job.updated_at is not None
    ):
        updated_at = (
            job.updated_at
            if job.updated_at.tzinfo is not None
            else job.updated_at.replace(tzinfo=timezone.utc)
        )
        # Same window as the claim: a live LLM run must not be reported as failed
        # (and thereby made re-claimable) while it is still working.
        if datetime.now(timezone.utc) - updated_at > SHORTLISTING_CLAIM_STALE_AFTER:
            job.shortlist_status = ShortlistStatus.failed
            await db.commit()
            await db.refresh(job)

    needs_human_review = int(
        await db.scalar(
            select(func.count(Application.id)).where(
                Application.job_id == job_id,
                Application.ai_review_status.in_(
                    [AI_REVIEW_NEEDS_HUMAN, AI_REVIEW_FAILED]
                ),
            )
        )
        or 0
    )

    return ShortlistSummaryResponse(
        job_id=job_id,
        total_applications=total,
        scored=scored,
        pending_review=max(total - scored, 0),
        shortlist_status=job.shortlist_status,
        final_shortlist_completed=job.final_shortlist_completed,
        shortlist_threshold=job.shortlist_threshold,
        ai_recommendations_ready=(
            job.shortlist_status == ShortlistStatus.completed
            and not job.final_shortlist_completed
            and scored > 0
        ),
        needs_human_review=needs_human_review,
    )


async def get_shortlist_summary(
    db: AsyncSession, job_id: uuid.UUID, user_id: uuid.UUID
) -> ShortlistSummaryResponse:
    """Return shortlisting progress for a recruiter-visible job.

    SWR-cached only when not in_progress; live progress reads bypass the cache.
    """
    company_id = await _get_company_id_for_user(db, user_id)
    job = await _get_job_for_company(db, job_id, company_id)
    cache_key = f"shortlist:summary:{job_id}"

    if job.shortlist_status == ShortlistStatus.in_progress:
        await redis_service.delete(cache_key)
        return await _build_shortlist_summary(db, job_id, company_id)

    async def _load() -> dict:
        response = await _build_shortlist_summary(db, job_id, company_id)
        return response.model_dump(mode="json")

    payload = await swr_get(cache_key, _load, soft_ttl=60, hard_ttl=300)
    return ShortlistSummaryResponse.model_validate(payload)


async def trigger_shortlisting(
    db: AsyncSession,
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    background_tasks: BackgroundTasks,
) -> TriggerShortlistResponse:
    """Start shortlisting for a job if work remains."""
    company_id = await _get_company_id_for_user(db, user_id)
    job = await _get_job_for_company(db, job_id, company_id)
    total_applications = await db.scalar(
        select(func.count(Application.id)).where(Application.job_id == job_id)
    )
    total_applications = int(total_applications or 0)
    reviewed_applications = int(
        await db.scalar(
            select(func.count(Application.id)).where(
                Application.job_id == job_id,
                Application.score.is_not(None),
            )
        )
        or 0
    )

    if job.shortlist_status == ShortlistStatus.in_progress:
        return TriggerShortlistResponse(
            job_id=job_id,
            shortlist_status=job.shortlist_status,
            message="Shortlisting is already in progress.",
        )

    if total_applications == 0:
        job.shortlist_status = ShortlistStatus.not_started
        await db.commit()
        return TriggerShortlistResponse(
            job_id=job_id,
            shortlist_status=ShortlistStatus.not_started,
            message="This job has no applications to screen yet.",
        )

    if reviewed_applications >= total_applications:
        job.shortlist_status = ShortlistStatus.completed
        await db.commit()
        return TriggerShortlistResponse(
            job_id=job_id,
            shortlist_status=ShortlistStatus.completed,
            message="All applications already have score and feedback.",
        )

    if job.final_shortlist_completed:
        return TriggerShortlistResponse(
            job_id=job_id,
            shortlist_status=job.shortlist_status,
            message="Decisions for this job are already finalized.",
        )

    if not await claim_job_for_shortlisting(db, job_id):
        return TriggerShortlistResponse(
            job_id=job_id,
            shortlist_status=ShortlistStatus.in_progress,
            message="Shortlisting is already in progress.",
        )

    await create_custom_audit_log(
        db,
        entity_type="job",
        action_type="ai_evaluation_triggered",
        category="pipeline",
        message=f"AI screening (ML ranking + LLM review) started for {job.title}",
        entity_id=job_id,
        company_id=company_id,
        metadata={"job_title": job.title, "total_applications": total_applications},
    )
    await db.commit()

    # INVALIDATE CACHE
    await redis_service.delete(f"shortlist:summary:{job_id}")

    if "PYTEST_CURRENT_TEST" not in os.environ:
        bind = db.bind
        database_url = (
            bind.engine.url.render_as_string(hide_password=False)
            if bind is not None and hasattr(bind, "engine")
            else AsyncSessionLocal.kw["bind"].url.render_as_string(hide_password=False)
        )
        background_tasks.add_task(_run_claimed_shortlisting_task, job_id, database_url)

    return TriggerShortlistResponse(
        job_id=job_id,
        shortlist_status=ShortlistStatus.in_progress,
        message="Shortlisting started. Poll the summary endpoint for progress.",
    )


async def _run_claimed_shortlisting_task(job_id: uuid.UUID, database_url: str) -> None:
    """Background runner for a recruiter-triggered screening run (already claimed)."""
    engine = create_async_engine(database_url, poolclass=NullPool)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_factory() as db:
            job = await db.scalar(select(Job).where(Job.id == job_id))
            if job is not None:
                await run_two_stage_for_expired_job(db, job, already_claimed=True)
    except Exception as exc:
        logger.exception("Triggered shortlisting failed for job {}: {}", job_id, exc)
    finally:
        await engine.dispose()


async def _apply_threshold_finalize(
    db: AsyncSession, job: Job, threshold: int
) -> tuple[int, list, list]:
    """Apply the score threshold to all `applied` rows for a job. Returns (count, shortlisted, rejected)."""
    shortlist_result = await db.execute(
        update(Application)
        .where(
            and_(
                Application.job_id == job.id,
                Application.status == ApplicationStatus.applied,
                Application.score.is_not(None),
                Application.score >= threshold,
            )
        )
        .values(status=ApplicationStatus.shortlisted)
        .returning(Application.id, Application.user_id)
    )
    shortlisted_rows = shortlist_result.fetchall()

    rejected_result = await db.execute(
        update(Application)
        .where(
            and_(
                Application.job_id == job.id,
                Application.status == ApplicationStatus.applied,
                Application.score.is_not(None),
                Application.score < threshold,
            )
        )
        .values(status=ApplicationStatus.rejected)
        .returning(Application.id, Application.user_id)
    )
    rejected_rows = rejected_result.fetchall()

    if shortlisted_rows or rejected_rows:
        enqueue_application_sync_events(
            db,
            [row[0] for row in shortlisted_rows] + [row[0] for row in rejected_rows],
            SyncAction.UPSERT,
        )
    return len(shortlisted_rows) + len(rejected_rows), shortlisted_rows, rejected_rows


async def auto_finalize_expired_job(db: AsyncSession, job: Job) -> int:
    """Mark AI recommendations ready for recruiter review. Changes no statuses.

    Shortlist/reject decisions are consequential, so they are never applied
    automatically: the recruiter confirms them via `finalize_shortlist`
    ("Approve AI recommendations"), which records who made the decision.
    """
    if not job.auto_shortlist or job.final_shortlist_completed:
        return 0

    await create_custom_audit_log(
        db,
        entity_type="job",
        action_type="ai_recommendations_ready",
        category="pipeline",
        message=f"AI recommendations ready for recruiter review on {job.title}",
        entity_id=job.id,
        company_id=job.company_id,
        metadata={"job_title": job.title, "threshold": job.shortlist_threshold},
    )
    await db.commit()

    await invalidate_company_application_caches(str(job.company_id))
    await invalidate_company_dashboard_caches(db, str(job.company_id))
    await redis_service.delete(f"shortlist:summary:{job.id}")
    logger.info(
        "AI recommendations ready for job {}; awaiting recruiter confirmation.",
        job.id,
    )
    return 0


async def finalize_shortlist(
    db: AsyncSession,
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: FinalizeShortlistRequest,
) -> FinalizeShortlistResponse:
    """Finalize shortlist outcomes for a job and invalidate caches."""
    company_id = await _get_company_id_for_user(db, user_id)
    job = await _get_job_for_company(db, job_id, company_id)

    updated_count = 0
    shortlisted_rows: list = []
    rejected_rows: list = []

    if payload.use_ai_recommendations:
        threshold = (
            payload.threshold
            if payload.threshold is not None
            else job.shortlist_threshold
        )
        (
            updated_count,
            shortlisted_rows,
            rejected_rows,
        ) = await _apply_threshold_finalize(db, job, threshold)

    if _job_has_expired(job):
        job.final_shortlist_completed = True
    if payload.use_ai_recommendations:
        await create_custom_audit_log(
            db,
            entity_type="job",
            action_type="ai_recommendations_approved",
            category="pipeline",
            message=(
                f"Recruiter approved AI recommendations for {job.title}: "
                f"{len(shortlisted_rows)} shortlisted, {len(rejected_rows)} rejected"
            ),
            entity_id=job.id,
            company_id=company_id,
            metadata={
                "threshold": payload.threshold
                if payload.threshold is not None
                else job.shortlist_threshold,
                "shortlisted": len(shortlisted_rows),
                "rejected": len(rejected_rows),
                "approved_by_user_id": str(user_id),
            },
        )
    await db.commit()

    changed_user_ids = [
        str(row[1]) for row in list(shortlisted_rows) + list(rejected_rows)
    ]
    await invalidate_candidate_read_caches_for_users(changed_user_ids)
    await invalidate_company_application_caches(str(company_id))
    await invalidate_company_dashboard_caches(db, str(company_id))
    await redis_service.delete(f"shortlist:summary:{job_id}")

    return FinalizeShortlistResponse(
        job_id=job_id,
        updated_applications=updated_count,
        success=True,
    )
