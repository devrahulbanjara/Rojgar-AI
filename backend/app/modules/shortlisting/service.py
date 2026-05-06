from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.pool import NullPool

from app.agents.shortlisting import evaluate_application_with_shortlisting_agent
from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_candidate_read_caches_for_users,
    invalidate_company_application_caches,
    invalidate_company_dashboard_caches,
)
from app.core.config import settings
from app.core.database import AsyncSessionLocal
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

SHORTLISTING_STALE_AFTER = timedelta(minutes=2)


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
    """Return True when an application already has score and review."""
    return application.score is not None and (
        bool(application.strengths) or bool(application.weaknesses)
    )


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


def _score_application(
    application: Application,
) -> tuple[int, list[str] | None, list[str] | None]:
    """Fallback-score an application from resume completeness."""
    resume = application.resume
    if resume is None:
        return 10, None, ["No resume attached"]

    score = 25
    strengths: list[str] = []

    if resume.headline:
        score += 10
        strengths.append("Clear professional headline")
    if resume.summary:
        score += 10
        strengths.append("Written profile summary")
    if resume.years_of_experience:
        score += min(resume.years_of_experience * 5, 20)
        strengths.append(f"{resume.years_of_experience} years of experience")
    if resume.experiences:
        score += min(len(resume.experiences) * 8, 24)
        strengths.append(f"{len(resume.experiences)} experience entries")
    if resume.educations:
        score += min(len(resume.educations) * 4, 8)
        strengths.append("Education history present")
    if resume.skills:
        score += min(len(resume.skills) * 3, 18)
        strengths.append(f"{len(resume.skills)} listed skills")

    score = max(0, min(100, score))

    return score, strengths or None, None


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
                for app, ml_score in zip(applications, ml_scores):
                    app.ml_bouncer_score = ml_score
                    app.score = max(0, min(100, round(ml_score * 100)))

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
            application.ml_bouncer_score = ml_score
            application.score = max(0, min(100, round(ml_score * 100)))
            enqueue_application_sync_events(db, [application.id], SyncAction.UPSERT)
            await db.commit()

            await invalidate_candidate_read_caches_for_users([str(application.user_id)])
            await invalidate_company_dashboard_caches(db, str(job.company_id))
            await invalidate_company_application_caches(str(job.company_id))
            await redis_service.delete(f"shortlist:summary:{job.id}")
            logger.info(
                "ML bouncer scored application {} for job {} (score={:.3f})",
                application_id,
                job.id,
                ml_score,
            )
    except Exception as exc:
        logger.exception(
            "ML bouncer scoring failed for application {}: {}", application_id, exc
        )
    finally:
        await engine.dispose()


async def run_two_stage_for_expired_job(db: AsyncSession, job: Job) -> None:
    """Run the two-stage pipeline inline for a single expired job, then finalize.

    Crash-safe and idempotent: per-application commits, status tracked on the
    Job row, work already done is skipped on retry.
    """
    from app.modules.shortlisting.ml_bouncer import score_applications

    if job.final_shortlist_completed:
        logger.info(
            "Two-stage skipped for job '{}' ({}): already finalized.",
            job.title,
            job.id,
        )
        return

    job.shortlist_status = ShortlistStatus.in_progress
    await db.commit()
    logger.info(
        "Two-stage START for expired job '{}' ({}). status=in_progress",
        job.title,
        job.id,
    )

    try:
        applications = list(
            (
                await db.execute(
                    select(Application)
                    .where(Application.job_id == job.id)
                    .options(
                        selectinload(Application.resume).selectinload(
                            Resume.experiences
                        ),
                        selectinload(Application.resume).selectinload(
                            Resume.educations
                        ),
                        selectinload(Application.resume).selectinload(Resume.skills),
                        joinedload(Application.user),
                    )
                )
            )
            .scalars()
            .all()
        )

        if not applications:
            job.shortlist_status = ShortlistStatus.completed
            await db.commit()
            await auto_finalize_expired_job(db, job)
            logger.info(
                "Two-stage DONE (no applications) for job '{}' ({}).",
                job.title,
                job.id,
            )
            return

        # --- Stage 1: ML Bouncer — score applications missing a bouncer score ---
        unscored = [a for a in applications if a.ml_bouncer_score is None]
        if unscored:
            ml_scores = score_applications(job, unscored)
            for app, ml_score in zip(unscored, ml_scores, strict=True):
                app.ml_bouncer_score = ml_score
                app.score = max(0, min(100, round(ml_score * 100)))
            await db.commit()
            logger.info(
                "Stage1 ML bouncer scored {}/{} application(s) for job '{}' ({})",
                len(unscored),
                len(applications),
                job.title,
                job.id,
            )
        else:
            logger.info(
                "Stage1 ML bouncer skipped for job '{}' ({}): all {} app(s) already scored.",
                job.title,
                job.id,
                len(applications),
            )

        # --- Stage 2: LLM for top candidates (per-app commit so partial work survives crash) ---
        scored_apps = sorted(
            applications, key=lambda a: a.ml_bouncer_score or 0, reverse=True
        )
        min_score = settings.ml_bouncer_min_score
        eligible = [a for a in scored_apps if (a.ml_bouncer_score or 0) >= min_score]
        top_n = max(1, len(applications) * settings.ml_bouncer_top_percent // 100)
        candidates_for_llm = eligible[:top_n]

        already_done = sum(
            1 for a in candidates_for_llm if _application_has_complete_review(a)
        )
        logger.info(
            "Stage2 LLM cohort {}/{} for job '{}' ({}). already_reviewed={}",
            len(candidates_for_llm),
            len(applications),
            job.title,
            job.id,
            already_done,
        )

        for application in candidates_for_llm:
            if _application_has_complete_review(application):
                continue
            try:
                agent_result = await evaluate_application_with_shortlisting_agent(
                    job=job, application=application
                )
                application.score = agent_result.score
                application.strengths = agent_result.strengths
                application.weaknesses = agent_result.weaknesses
                enqueue_application_sync_events(db, [application.id], SyncAction.UPSERT)
                await db.commit()
                logger.info(
                    "Stage2 LLM scored app {} for job '{}' ({})",
                    application.id,
                    job.title,
                    job.id,
                )
            except Exception as exc:
                await db.rollback()
                applicant_name = getattr(
                    getattr(application, "user", None), "full_name", None
                ) or str(application.id)
                logger.warning(
                    "Stage2 LLM failed for applicant '{}' on job '{}' ({}): {}",
                    applicant_name,
                    job.title,
                    job.id,
                    exc,
                )

        # --- Stage 3: Threshold finalization ---
        job.shortlist_status = ShortlistStatus.completed
        await db.commit()
        await auto_finalize_expired_job(db, job)
        logger.info(
            "Two-stage DONE + finalized for job '{}' ({}). status=completed",
            job.title,
            job.id,
        )
    except Exception as exc:
        await db.rollback()
        try:
            refreshed = await db.scalar(select(Job).where(Job.id == job.id))
            if refreshed is not None:
                refreshed.shortlist_status = ShortlistStatus.failed
                await db.commit()
        except Exception:
            await db.rollback()
        logger.exception(
            "Two-stage FAILED for expired job '{}' ({}). status=failed: {}",
            job.title,
            job.id,
            exc,
        )


async def recover_unfinished_shortlisting() -> None:
    """Resume any expired auto-shortlist jobs left unfinished from a prior crash.

    Runs at app startup. Any expired job that has `auto_shortlist=True` and
    `final_shortlist_completed=False` is re-entered through the two-stage
    pipeline. The pipeline itself is idempotent: applications already scored
    by the bouncer are skipped, applications already reviewed by the LLM are
    skipped, and finalization is a no-op when already done.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Job).where(
                Job.status == JobStatus.expired,
                Job.auto_shortlist.is_(True),
                Job.final_shortlist_completed.is_(False),
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
            logger.info(
                "Shortlisting recovery: resuming job '{}' ({}). prior_status={}",
                job.title,
                job.id,
                job.shortlist_status,
            )
            try:
                await run_two_stage_for_expired_job(db, job)
            except Exception as exc:
                logger.exception(
                    "Shortlisting recovery failed for job '{}' ({}): {}",
                    job.title,
                    job.id,
                    exc,
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
    """Run AI evaluation on a single application, overwriting any existing review."""
    company_id = await _get_company_id_for_user(db, user_id)

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    job = await _get_job_for_company(db, application.job_id, company_id)

    try:
        result = await evaluate_application_with_shortlisting_agent(
            job=job,
            application=application,
        )
        application.score = result.score
        application.strengths = result.strengths
        application.weaknesses = result.weaknesses
    except Exception:
        score, strengths, weaknesses = _score_application(application)
        application.score = score
        application.strengths = strengths
        application.weaknesses = weaknesses
        logger.warning(
            "AI evaluation failed for application {}, used fallback scoring",
            application_id,
        )

    enqueue_application_sync_events(db, [application.id], SyncAction.UPSERT)
    await db.commit()

    await invalidate_candidate_read_caches(str(application.user_id))
    await invalidate_company_dashboard_caches(db, str(job.company_id))
    await invalidate_company_application_caches(
        str(job.company_id), str(application.id)
    )
    await redis_service.delete(f"shortlist:summary:{application.job_id}")

    return application


async def get_shortlist_summary(
    db: AsyncSession, job_id: uuid.UUID, user_id: uuid.UUID
) -> ShortlistSummaryResponse:
    """Return shortlisting progress for a recruiter-visible job."""
    company_id = await _get_company_id_for_user(db, user_id)
    job = await _get_job_for_company(db, job_id, company_id)
    cache_key = f"shortlist:summary:{job_id}"

    if job.shortlist_status != ShortlistStatus.in_progress:
        cached_data = await redis_service.get(cache_key)
        if cached_data:
            return ShortlistSummaryResponse.model_validate_json(cached_data)
    else:
        await redis_service.delete(cache_key)

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
        and scored < total
    ):
        updated_at = (
            job.updated_at
            if job.updated_at.tzinfo is not None
            else job.updated_at.replace(tzinfo=timezone.utc)
        )
        if datetime.now(timezone.utc) - updated_at > SHORTLISTING_STALE_AFTER:
            job.shortlist_status = ShortlistStatus.failed
            await db.commit()
            await db.refresh(job)

    response = ShortlistSummaryResponse(
        job_id=job_id,
        total_applications=total,
        scored=scored,
        pending_review=max(total - scored, 0),
        shortlist_status=job.shortlist_status,
        final_shortlist_completed=job.final_shortlist_completed,
        shortlist_threshold=job.shortlist_threshold,
    )

    if response.shortlist_status != ShortlistStatus.in_progress:
        await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)

    return response


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

    job.shortlist_status = ShortlistStatus.in_progress
    job.final_shortlist_completed = False
    await create_custom_audit_log(
        db,
        entity_type="job",
        action_type="ai_evaluation_triggered",
        category="pipeline",
        message=f"AI evaluation triggered for {job.title}",
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
        background_tasks.add_task(_run_ml_bouncer_backfill_task, job_id, database_url)

    return TriggerShortlistResponse(
        job_id=job_id,
        shortlist_status=ShortlistStatus.in_progress,
        message="Shortlisting started. Poll the summary endpoint for progress.",
    )


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
    """Run threshold finalize for a freshly-expired auto-shortlist job. Returns updated count."""
    if not job.auto_shortlist or job.final_shortlist_completed:
        return 0
    updated, shortlisted_rows, rejected_rows = await _apply_threshold_finalize(
        db, job, job.shortlist_threshold
    )
    job.final_shortlist_completed = True
    await db.commit()

    changed_user_ids = [
        str(row[1]) for row in list(shortlisted_rows) + list(rejected_rows)
    ]
    if changed_user_ids:
        await invalidate_candidate_read_caches_for_users(changed_user_ids)
    await invalidate_company_application_caches(str(job.company_id))
    await invalidate_company_dashboard_caches(db, str(job.company_id))
    await redis_service.delete(f"shortlist:summary:{job.id}")
    logger.info(
        "Auto-finalize on expiry for job '{}' ({}) updated {} application(s).",
        job.title,
        job.id,
        updated,
    )
    return updated


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
