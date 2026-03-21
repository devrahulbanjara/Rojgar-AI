from __future__ import annotations

import os
import random
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.modules.applications.models import Application
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
from app.shared.enums import ApplicationStatus, ShortlistStatus
from app.infrastructures.redis.service import redis_service


SHORTLISTING_STALE_AFTER = timedelta(minutes=2)


async def _get_company_id_for_user(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
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


def _score_application(application: Application) -> tuple[int, str]:
    resume = application.resume
    if resume is None:
        return (
            10,
            "No resume was attached, so this application could not be meaningfully ranked.",
        )

    score = 25
    strengths: list[str] = []

    if resume.headline:
        score += 10
        strengths.append("a clear professional headline")
    if resume.summary:
        score += 10
        strengths.append("a written profile summary")
    if resume.years_of_experience:
        score += min(resume.years_of_experience * 5, 20)
        strengths.append(f"{resume.years_of_experience} year(s) of stated experience")
    if resume.experiences:
        score += min(len(resume.experiences) * 8, 24)
        strengths.append(
            f"{len(resume.experiences)} experience entr{'y' if len(resume.experiences) == 1 else 'ies'}"
        )
    if resume.educations:
        score += min(len(resume.educations) * 4, 8)
        strengths.append("education history")
    if resume.skills:
        score += min(len(resume.skills) * 3, 18)
        strengths.append(f"{len(resume.skills)} listed skill(s)")

    score = max(0, min(100, score))

    if strengths:
        feedback = (
            "This application was ranked from resume completeness and structure. "
            f"Strong signals included {', '.join(strengths)}."
        )
    else:
        feedback = (
            "This application was reviewed, but the resume had limited structured information "
            "available for ranking."
        )

    return score, feedback


def _dummy_ai_score_application(application: Application) -> tuple[int, str]:
    score = random.randint(1, 100)
    feedback = (
        "This candidate shows potential based on their background. "
        "Their skills align reasonably well with the core requirements. "
        "However, further technical assessment is recommended to verify their expertise."
    )
    return score, feedback


async def process_auto_shortlist_for_application(
    application_id: uuid.UUID, database_url: str
) -> None:
    engine = create_async_engine(database_url)
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
            if application is None or application.status != ApplicationStatus.submitted:
                return

            try:
                score, feedback = _dummy_ai_score_application(application)
                application.score = score
                application.feedback = feedback
                await db.commit()

                await redis_service.delete(f"dashboard:candidate:{application.user_id}")
                await redis_service.invalidate_pattern(
                    f"applications:candidate:{application.user_id}:*"
                )
                await redis_service.invalidate_pattern("dashboard:recruiter:*")
                await redis_service.delete(f"shortlist:summary:{application.job_id}")

                logger.info(
                    "Auto-shortlisted application {} with score {}",
                    application_id,
                    score,
                )
            except Exception as exc:
                await db.rollback()
                logger.exception(
                    "Auto-shortlist failed for application {}: {}",
                    application_id,
                    exc,
                )
    finally:
        await engine.dispose()


async def _run_shortlisting_task(job_id: uuid.UUID, database_url: str) -> None:
    engine = create_async_engine(database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as db:
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if job is None:
            return

        try:
            job.shortlist_status = ShortlistStatus.in_progress
            await db.commit()

            applications_result = await db.execute(
                select(Application)
                .where(
                    Application.job_id == job_id,
                    Application.status == ApplicationStatus.submitted,
                )
                .options(
                    selectinload(Application.resume).selectinload(Resume.experiences),
                    selectinload(Application.resume).selectinload(Resume.educations),
                    selectinload(Application.resume).selectinload(Resume.skills),
                )
            )
            applications = applications_result.scalars().all()

            for application in applications:
                score, feedback = _score_application(application)
                application.score = score
                application.feedback = feedback

            job.shortlist_status = ShortlistStatus.completed
            await db.commit()
            logger.info("Shortlisting completed for job {}", job_id)
        except Exception as exc:
            await db.rollback()
            refresh_result = await db.execute(select(Job).where(Job.id == job_id))
            refresh_job = refresh_result.scalar_one_or_none()
            if refresh_job is not None:
                refresh_job.shortlist_status = ShortlistStatus.failed
                await db.commit()
            logger.exception("Shortlisting failed for job {}: {}", job_id, exc)
    await engine.dispose()


async def get_shortlist_summary(
    db: AsyncSession, job_id: uuid.UUID, user_id: uuid.UUID
) -> ShortlistSummaryResponse:
    company_id = await _get_company_id_for_user(db, user_id)
    job = await _get_job_for_company(db, job_id, company_id)
    cache_key = f"shortlist:summary:{job_id}"

    cached_data = await redis_service.get(cache_key)
    if cached_data:
        return ShortlistSummaryResponse.model_validate_json(cached_data)

    counts = await db.execute(
        select(
            func.count(Application.id).label("total"),
            func.count(Application.score).label("scored"),
        ).where(Application.job_id == job_id)
    )
    row = counts.one()
    total = int(row.total or 0)
    scored = int(row.scored or 0)

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
    )

    await redis_service.set(cache_key, response.model_dump_json(), ttl_seconds=300)

    return response


async def trigger_shortlisting(
    db: AsyncSession,
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    background_tasks: BackgroundTasks,
) -> TriggerShortlistResponse:
    company_id = await _get_company_id_for_user(db, user_id)
    job = await _get_job_for_company(db, job_id, company_id)
    total_applications = await db.scalar(
        select(func.count(Application.id)).where(Application.job_id == job_id)
    )
    total_applications = int(total_applications or 0)

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

    job.shortlist_status = ShortlistStatus.in_progress
    job.final_shortlist_completed = False
    await db.commit()

    # INVALIDATE CACHE
    await redis_service.delete(f"shortlist:summary:{job_id}")

    if "PYTEST_CURRENT_TEST" not in os.environ:
        bind = db.bind
        database_url = (
            str(bind.engine.url)
            if bind is not None and hasattr(bind, "engine")
            else str(AsyncSessionLocal.kw["bind"].url)
        )
        background_tasks.add_task(_run_shortlisting_task, job_id, database_url)

    return TriggerShortlistResponse(
        job_id=job_id,
        shortlist_status=ShortlistStatus.in_progress,
        message="Shortlisting started. Poll the summary endpoint for progress.",
    )


async def finalize_shortlist(
    db: AsyncSession,
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: FinalizeShortlistRequest,
) -> FinalizeShortlistResponse:
    company_id = await _get_company_id_for_user(db, user_id)
    job = await _get_job_for_company(db, job_id, company_id)

    updated_count = 0

    if payload.use_ai_recommendations:
        shortlist_result = await db.execute(
            update(Application)
            .where(
                and_(
                    Application.job_id == job_id,
                    Application.status == ApplicationStatus.submitted,
                    Application.score.is_not(None),
                    Application.score >= payload.threshold,
                )
            )
            .values(status=ApplicationStatus.screening)
            .returning(Application.id)
        )
        shortlisted_rows = shortlist_result.fetchall()
        updated_count += len(shortlisted_rows)

        await db.execute(
            update(Application)
            .where(
                and_(
                    Application.job_id == job_id,
                    Application.status == ApplicationStatus.submitted,
                    Application.score.is_not(None),
                    Application.score < payload.threshold,
                )
            )
            .values(status=ApplicationStatus.rejected)
        )

    job.final_shortlist_completed = True
    await db.commit()

    # INVALIDATE CACHE
    await redis_service.delete(f"shortlist:summary:{job_id}")
    await redis_service.invalidate_pattern("dashboard:recruiter:*")

    return FinalizeShortlistResponse(
        job_id=job_id,
        updated_applications=updated_count,
        success=True,
    )
