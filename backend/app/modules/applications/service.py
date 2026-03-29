import os
import uuid
from datetime import datetime, timezone

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import AsyncSessionLocal
from app.infrastructures.redis.service import redis_service
from app.modules.applications.models import Application
from app.modules.applications.sync import (
    enqueue_application_sync_event,
    process_sync_event as process_application_sync_event,
)
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.applications.schemas import (
    ApplicantSummary,
    ApplicationListItem,
    ApplicationResponse,
    ApplyRequest,
    CandidateShareSettings,
    CandidateApplicationView,
    RecruiterCandidateApplicationSummary,
    RecruiterCandidateDetailView,
    RecruiterCandidateListItem,
    RecruiterApplicationView,
    UpdateApplicationReviewRequest,
    UpdateApplicationStatusRequest,
)
from app.modules.companies.models import Company
from app.modules.companies.models import CompanyMembership
from app.modules.jobs.models import Job
from app.modules.profiles.models import Profile
from app.modules.resumes.models import Resume
from app.shared.enums import ApplicationStatus, JobStatus

RECRUITER_SETTABLE = {
    ApplicationStatus.shortlisted,
    ApplicationStatus.rejected,
    ApplicationStatus.interview_completed,
    ApplicationStatus.offer,
}


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


def _application_share_settings(application: Application) -> CandidateShareSettings:
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


def _build_shared_profile_snapshot(
    user: User,
    profile: Profile | None,
    share_settings: CandidateShareSettings,
) -> dict[str, str | None]:
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
    bind = db.bind
    if bind is not None and hasattr(bind, "url"):
        return str(bind.url)

    fallback_bind = AsyncSessionLocal.kw.get("bind")
    if fallback_bind is not None and hasattr(fallback_bind, "url"):
        return str(fallback_bind.url)

    raise RuntimeError("Database bind is not configured for background task execution.")


def _job_is_open_for_auto_shortlisting(job: Job) -> bool:
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
    if not _job_is_open_for_auto_shortlisting(job):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job is not currently accepting applications.",
        )

    # 2. Verify the resume exists and belongs to the user (IDOR prevention)
    resume = await db.scalar(select(Resume).where(Resume.id == payload.resume_id))
    if not resume or resume.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid resume ID or access denied.",
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

    # 4. Create and persist the application
    application = Application(
        job_id=payload.job_id,
        user_id=user.id,
        resume_id=payload.resume_id,
        status=ApplicationStatus.applied,
        **share_settings.model_dump(),
        **_build_shared_profile_snapshot(user, profile, share_settings),
    )
    db.add(application)
    try:
        await db.flush()
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

    if (
        job.auto_shortlist
        and _job_is_open_for_auto_shortlisting(job)
        and bg_tasks is not None
        and "PYTEST_CURRENT_TEST" not in os.environ
    ):
        from app.modules.shortlisting.service import (
            process_auto_shortlist_for_application,
        )

        bg_tasks.add_task(
            process_auto_shortlist_for_application,
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

    # INVALIDATE CACHES asynchronously
    # 1. Candidate's own dashboard & applications list
    await redis_service.delete(f"dashboard:candidate:{user.id}")
    await redis_service.invalidate_pattern(f"applications:candidate:{user.id}:*")
    # 2. Recruiter dashboards (easiest is to wipe all recruiter dashboards, or you could target specific ones)
    await redis_service.invalidate_pattern("dashboard:recruiter*")
    # 3. Invalidate the job detail cache because the applicant count went up
    await redis_service.delete(f"job:detail:{payload.job_id}")
    await redis_service.invalidate_pattern(f"job:detail:{payload.job_id}:candidate:*")

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


async def _get_active_company_id(db: AsyncSession, user: User) -> str:
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


async def list_candidate_applications(
    db: AsyncSession, user_id, page: int = 1, size: int = 20
) -> list[CandidateApplicationView]:
    """Return candidate applications across all companies with job and company metadata."""
    cache_key = f"applications:candidate:{user_id}:p{page}:s{size}"

    # 1. Try Cache
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        import json

        data = json.loads(cached_data)
        return [CandidateApplicationView.model_validate(item) for item in data]

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

    response = [
        CandidateApplicationView(
            id=application.id,
            status=application.status,
            created_at=application.created_at,
            updated_at=application.updated_at,
            job_id=job.id,
            job_title=job.title,
            company_name=company.name,
            company_logo_url=company.logo_url,
            location=job.location,
            location_type=job.location_type,
            score=application.score,
            feedback=application.feedback,
        )
        for application, job, company in rows
    ]

    # 3. Save to Cache (TTL 5 minutes - applications status can change)
    import json

    await redis_service.set(
        cache_key,
        json.dumps([item.model_dump(mode="json") for item in response]),
        ttl_seconds=300,
    )

    return response


async def list_company_applications(
    db: AsyncSession,
    company_id,
    job_id=None,
    page: int = 1,
    size: int = 20,
) -> list[RecruiterApplicationView]:
    """Return applications for a company inbox, optionally filtered to a single job."""
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
            applicant_email=application.shared_email_value or applicant.email,
            applicant_avatar_url=application.shared_avatar_url,
            job_title=job.title,
            job_id=job.id,
            score=application.score,
            feedback=application.feedback,
        )
        for application, applicant, job in rows
    ]


async def list_company_candidates(
    db: AsyncSession,
    user: User,
    job_id: str | None,
    status_filter: ApplicationStatus | None,
    page: int,
    size: int,
) -> list[RecruiterCandidateListItem]:
    company_id = await _get_active_company_id(db, user)

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
    grouped: dict[str, dict[str, object]] = {}

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
            feedback=application.feedback,
        )

        if bucket is None:
            grouped[str(applicant.id)] = {
                "candidate_id": applicant.id,
                "applicant_name": application.shared_full_name or applicant.full_name,
                "applicant_email": application.shared_email_value or applicant.email,
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


async def get_company_candidate_detail(
    db: AsyncSession, user: User, application_id: str
) -> RecruiterCandidateDetailView:
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
        feedback=application.feedback,
        resume=application.resume,
        share_settings=share,
    )


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
        return ApplicationResponse.model_validate(application)

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
        if result.scalar_one_or_none():
            return ApplicationResponse.model_validate(application)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view this application.",
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

    if payload.status not in RECRUITER_SETTABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status '{payload.status.value}' cannot be set manually.",
        )

    if payload.status == ApplicationStatus.shortlisted:
        if application.status not in {
            ApplicationStatus.applied,
            ApplicationStatus.screening,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only applied or screening applications can be shortlisted.",
            )
        if job.status != JobStatus.expired and (
            job.expires_at is None or job.expires_at > datetime.now(timezone.utc)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shortlist and reject actions are only available after the job expires.",
            )

    if payload.status == ApplicationStatus.rejected:
        if application.status in {
            ApplicationStatus.applied,
            ApplicationStatus.screening,
        }:
            if job.status != JobStatus.expired and (
                job.expires_at is None or job.expires_at > datetime.now(timezone.utc)
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Shortlist and reject actions are only available after the job expires.",
                )
        elif application.status not in {
            ApplicationStatus.shortlisted,
            ApplicationStatus.interview_completed,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Rejection is only valid after screening decisions or interview evaluation."
                ),
            )

    if payload.status == ApplicationStatus.interview_completed:
        if application.status != ApplicationStatus.interview_booked:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only mark interview as completed when status is 'interview_booked'.",
            )

    if payload.status == ApplicationStatus.offer:
        if application.status != ApplicationStatus.interview_completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Offer or reject is only valid after interview is completed.",
            )

    application.status = payload.status
    sync_event = enqueue_application_sync_event(db, uuid.UUID(str(application.id)))
    await db.commit()
    await db.refresh(application)
    if bg_tasks is not None and "PYTEST_CURRENT_TEST" not in os.environ:
        bg_tasks.add_task(process_application_sync_event, sync_event.id)

    # INVALIDATE CACHES
    # 1. Candidate's own dashboard & applications list
    await redis_service.delete(f"dashboard:candidate:{application.user_id}")
    await redis_service.invalidate_pattern(
        f"applications:candidate:{application.user_id}:*"
    )
    # 2. Recruiter dashboards (since counts of interviews/offers might have changed)
    await redis_service.invalidate_pattern("dashboard:recruiter*")

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
    """Update manual score and/or feedback for an application (active company members only)."""
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

    if payload.score is None and payload.feedback is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a score, feedback, or both.",
        )

    if payload.score is not None:
        application.score = payload.score
    if payload.feedback is not None:
        application.feedback = payload.feedback.strip() or None

    sync_event = enqueue_application_sync_event(db, uuid.UUID(str(application.id)))
    await db.commit()
    await db.refresh(application)

    if bg_tasks is not None and "PYTEST_CURRENT_TEST" not in os.environ:
        bg_tasks.add_task(process_application_sync_event, sync_event.id)

    await redis_service.delete(f"dashboard:candidate:{application.user_id}")
    await redis_service.invalidate_pattern(
        f"applications:candidate:{application.user_id}:*"
    )
    await redis_service.invalidate_pattern("dashboard:recruiter*")
    await redis_service.delete(f"shortlist:summary:{application.job_id}")

    logger.info(
        "Application {app_id} review updated by user {user_id}",
        app_id=application_id,
        user_id=user.id,
    )
    return ApplicationResponse.model_validate(application)
