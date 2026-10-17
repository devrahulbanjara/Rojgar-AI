import os
import uuid
from datetime import UTC, datetime

from fastapi import BackgroundTasks, HTTPException, status
from loguru import logger
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import (
    invalidate_company_application_caches,
    invalidate_interview_list_caches,
    invalidate_job_detail_caches,
)
from app.core.schemas import BaseSchema
from app.core.swr_cache import swr_get, swr_set
from app.modules.applications.models import Application, ApplicationSyncEvent
from app.modules.applications.sync import (
    process_sync_event as process_application_sync_event,
)
from app.modules.audit.service import create_custom_audit_log
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.entitlements.service import ensure_can_open_job, on_job_opened
from app.modules.jobs.models import Job
from app.modules.jobs.protected_grounds import CriterionWarning, check_protected_grounds
from app.modules.jobs.schemas import (
    CompanySnippet,
    JobCreate,
    JobDetailResponse,
    JobListItem,
    JobQuestion,
    JobUpdate,
    SuggestMustHavesRequest,
    SuggestMustHavesResponse,
)
from app.shared.enums import (
    ApplicationStage,
    JobClosedReason,
    JobStatus,
    RejectedReason,
    SyncAction,
)


def _utcnow() -> datetime:
    """Return the current UTC datetime."""
    return datetime.now(UTC)


def _effective_job_status(job: Job) -> JobStatus:
    """Open jobs past their closing time read as closed before the sweep runs."""
    if (
        job.status == JobStatus.open
        and job.closes_at is not None
        and job.closes_at <= _utcnow()
    ):
        return JobStatus.closed
    return job.status


def _warnings_for(job: Job) -> list[CriterionWarning]:
    return check_protected_grounds(job.must_haves, job.nice_to_haves, job.questions)


async def close_due_jobs(db: AsyncSession) -> int:
    """Close open jobs whose closing time has passed (closed_reason expired).

    Closing only stops new applications. Nobody is reviewed, shortlisted or
    rejected because of it: reviews are rolling and people decide.
    """
    jobs = list(
        (
            await db.execute(
                select(Job).where(
                    Job.status == JobStatus.open,
                    Job.closes_at.is_not(None),
                    Job.closes_at <= _utcnow(),
                )
            )
        )
        .scalars()
        .all()
    )
    if not jobs:
        return 0
    for job in jobs:
        job.status = JobStatus.closed
        job.closed_reason = JobClosedReason.expired.value
        job.closed_at = job.closes_at
    await db.commit()
    for job in jobs:
        await invalidate_job_detail_caches(str(job.id))
    logger.info("Closed {} job(s) past their closing time.", len(jobs))
    return len(jobs)


def _job_list_item_from_row(
    job: Job,
    applications_count: int | None = None,
) -> JobListItem:
    return JobListItem.model_validate(
        {
            "id": job.id,
            "company_id": job.company_id,
            "company": CompanySnippet.model_validate(job.company),
            "slug": job.slug,
            "title": job.title,
            "location": job.location,
            "location_type": job.location_type,
            "category": job.category,
            "employment_type": job.employment_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "currency": job.currency,
            "status": _effective_job_status(job),
            "closed_reason": job.closed_reason,
            "closes_at": job.closes_at,
            "closed_at": job.closed_at,
            "applications_count": int(applications_count or 0),
            "created_at": job.created_at,
        }
    )


def _job_detail_response_from_row(
    job: Job, applications_count: int | None = None
) -> JobDetailResponse:
    return JobDetailResponse.model_validate(
        {
            "id": job.id,
            "company_id": job.company_id,
            "company": CompanySnippet.model_validate(job.company),
            "posted_by": job.posted_by,
            "slug": job.slug,
            "title": job.title,
            "location": job.location,
            "location_type": job.location_type,
            "category": job.category,
            "employment_type": job.employment_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "currency": job.currency,
            "status": _effective_job_status(job),
            "closed_reason": job.closed_reason,
            "closes_at": job.closes_at,
            "closed_at": job.closed_at,
            "description": job.description or "",
            "must_haves": job.must_haves or [],
            "nice_to_haves": job.nice_to_haves or [],
            "questions": job.questions or [],
            "applications_count": int(applications_count or 0),
            "created_at": job.created_at,
            "updated_at": job.updated_at,
        }
    )


async def _get_user_company_id(db: AsyncSession, user: User):
    """Return the active company ID for the authenticated recruiter."""
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
            detail="Active company membership required to perform this action.",
        )
    return company_id


async def create_job(
    db: AsyncSession, user: User, payload: JobCreate, bg_tasks: BackgroundTasks
) -> JobDetailResponse:
    """Create a new job posting under the user's company."""
    company_id = await _get_user_company_id(db, user)

    job = Job(
        company_id=company_id,
        posted_by=user.id,
        title=payload.title,
        location=payload.location,
        location_type=payload.location_type,
        category=payload.category,
        employment_type=payload.employment_type,
        salary_min=payload.salary_min,
        salary_max=payload.salary_max,
        currency=payload.currency,
        status=payload.status,
        closes_at=payload.closes_at,
        description=payload.description or "",
        must_haves=payload.must_haves or [],
        nice_to_haves=payload.nice_to_haves or [],
        questions=[q.model_dump(mode="json") for q in payload.questions or []],
    )

    if job.status == JobStatus.open and job.closes_at and job.closes_at <= _utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Open jobs must have a closes_at in the future.",
        )

    if job.status == JobStatus.open:
        await ensure_can_open_job(db, company_id)

    db.add(job)
    await db.flush()  # Generates job.id without committing yet
    if job.status == JobStatus.open:
        await on_job_opened(db, company_id, job.id)

    await create_custom_audit_log(
        db,
        entity_type="job",
        action_type="job_created",
        category="jobs",
        message=f"Job '{job.title}' created ({job.status.value}) by {user.full_name}",
        entity_id=job.id,
        company_id=company_id,
        metadata={"job_title": job.title, "status": job.status.value},
    )
    await db.commit()

    result = await db.execute(
        select(Job, func.count(Application.id).label("applications_count"))
        .options(selectinload(Job.company))
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.id == job.id)
        .group_by(Job.id)
    )
    job, applications_count = result.one()
    logger.info(f"Job '{job.title}' created by user {user.id}")

    response = _job_detail_response_from_row(job, applications_count)
    response.warnings = _warnings_for(job)
    return response


async def list_company_jobs(db: AsyncSession, user: User) -> list[JobListItem]:
    """Jobs of the person's business (interviewers: the ones they interview for)."""
    from app.modules.applications.service import visible_job_ids

    company_id, _role, job_ids = await visible_job_ids(db, user)
    only = [] if job_ids is None else [Job.id.in_(job_ids)]

    result = await db.execute(
        select(Job, func.count(Application.id).label("applications_count"))
        .options(selectinload(Job.company))
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.company_id == company_id, *only)
        .group_by(Job.id)
        .order_by(Job.created_at.desc())
    )
    rows = result.all()
    response = [
        _job_list_item_from_row(job, applications_count)
        for job, applications_count in rows
    ]

    return response


async def _load_job_detail_response(db: AsyncSession, job_id: str) -> JobDetailResponse:
    """Load a job detail response from the database for cache population."""
    result = await db.execute(
        select(Job, func.count(Application.id).label("applications_count"))
        .options(selectinload(Job.company))
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.id == job_id)
        .group_by(Job.id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )
    job, applications_count = row
    return _job_detail_response_from_row(job, applications_count)


async def get_job_detail(
    db: AsyncSession, job_id: str, user: User | None = None
) -> JobDetailResponse:
    """Get full job details including description (SWR-cached)."""
    cache_key = f"job:detail:{job_id}"

    async def _load() -> dict:
        response = await _load_job_detail_response(db, job_id)
        return response.model_dump(mode="json")

    payload = await swr_get(
        cache_key,
        loader=_load,
        soft_ttl=300,
        hard_ttl=3600,
    )
    response = JobDetailResponse.model_validate(payload)
    if response.status == JobStatus.draft and not await _is_company_member(
        db, user, response.company_id
    ):
        # Drafts are private to the company until published.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found."
        )
    # Never cached: the shared payload above is visible to the public.
    if user is not None and await _is_company_member(db, user, response.company_id):
        rows = await db.execute(
            select(Application.source, func.count(Application.id))
            .where(Application.job_id == response.id)
            .group_by(Application.source)
        )
        response.source_counts = {source: count for source, count in rows.all()}
    return response


async def _is_company_member(
    db: AsyncSession, user: User | None, company_id: uuid.UUID
) -> bool:
    if user is None:
        return False
    membership_id = await db.scalar(
        select(CompanyMembership.id).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.company_id == company_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    return membership_id is not None


_JD_FIELDS = {"title", "description", "must_haves", "nice_to_haves", "status"}
_CRITERIA_FIELDS = {"must_haves", "nice_to_haves"}


async def update_job(
    db: AsyncSession,
    user: User,
    job_id: str,
    payload: JobUpdate,
    bg_tasks: BackgroundTasks,
) -> JobDetailResponse:
    """Edit, publish, close or reopen a job (company members only)."""
    company_id = await _get_user_company_id(db, user)
    job = await db.scalar(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you do not have permission.",
        )
    old_status = job.status
    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("status") == JobStatus.open and old_status != JobStatus.open:
        await ensure_can_open_job(db, company_id, job_id=job.id)
        await on_job_opened(db, company_id, job.id)

    closed_reason = update_data.pop("closed_reason", None)
    if "questions" in update_data:
        update_data["questions"] = [
            q.model_dump(mode="json") for q in payload.questions or []
        ]
    for key in ("must_haves", "nice_to_haves"):
        if key in update_data and update_data[key] is None:
            update_data[key] = []
    if update_data.get("description") is None and "description" in update_data:
        update_data["description"] = ""
    criteria_changed = any(
        key in update_data and update_data[key] != getattr(job, key)
        for key in _CRITERIA_FIELDS
    )
    for field, value in update_data.items():
        setattr(job, field, value)

    if job.status == JobStatus.open and old_status != JobStatus.open:
        job.closed_reason = None
        job.closed_at = None
        if job.closes_at is not None and job.closes_at <= _utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pick a closing date in the future to reopen this job.",
            )
    closing = job.status == JobStatus.closed and old_status != JobStatus.closed
    if closing:
        job.closed_reason = closed_reason
        job.closed_at = _utcnow()

    if _JD_FIELDS & set(update_data):
        # Recomputed by the next review (ml_rank.ensure_embeddings), outside
        # this request and its transaction.
        job.jd_embedding = None

    email_ids: list[uuid.UUID] = []
    closed_out = 0
    if closing:
        closed_out, email_ids = await _close_out_applications(
            db, user, job, closed_reason
        )
    published = old_status == JobStatus.draft and job.status == JobStatus.open
    action = (
        "job_published"
        if published
        else f"job_closed_{closed_reason}"
        if closing
        else "job_edited"
    )
    await create_custom_audit_log(
        db,
        entity_type="job",
        action_type=action,
        category="jobs",
        message=f"Job '{job.title}' {action.replace('job_', '').replace('_', ' ')} "
        f"by {user.full_name}"
        + (
            f"; {closed_out} candidate(s) told the position is closed"
            if closing
            else ""
        ),
        entity_id=job.id,
        company_id=company_id,
        diff_json={
            f: {"after": v}
            for f, v in payload.model_dump(mode="json", exclude_unset=True).items()
        },
        metadata={"job_title": job.title, "changed_fields": list(update_data)},
    )
    rereview_ids: list[uuid.UUID] = []
    if criteria_changed:
        rereview_ids = await _rereview_new_applications(db, job.id)
    await db.commit()

    if email_ids and "PYTEST_CURRENT_TEST" not in os.environ:
        from app.modules.applications.emails import send_after_undo_window

        bg_tasks.add_task(send_after_undo_window, email_ids)
    if rereview_ids and "PYTEST_CURRENT_TEST" not in os.environ:
        from app.modules.review.service import review_application

        for application_id in rereview_ids:
            bg_tasks.add_task(review_application, application_id)

    result = await db.execute(
        select(Job, func.count(Application.id).label("applications_count"))
        .options(selectinload(Job.company))
        .outerjoin(Application, Application.job_id == Job.id)
        .where(Job.id == job.id)
        .group_by(Job.id)
        .execution_options(populate_existing=True)
    )
    job, applications_count = result.one()
    response = _job_detail_response_from_row(job, applications_count)
    response.warnings = _warnings_for(job)

    await invalidate_job_detail_caches(job_id)
    await invalidate_company_application_caches(str(company_id))
    await invalidate_interview_list_caches(str(company_id))
    if published:
        await swr_set(
            f"job:detail:{job_id}", response.model_dump(mode="json"), hard_ttl=3600
        )
    return response


async def _close_out_applications(
    db: AsyncSession, user: User, job: Job, reason: str | None
) -> tuple[int, list[uuid.UUID]]:
    """Closing as hired/cancelled tells everyone still waiting, kindly.

    Candidates in new / shortlisted / interview move to rejected with
    position_filled (hired) or other (cancelled) and get the rejection email.
    Offers and hires are left alone.
    """
    from app.modules.applications.emails import schedule_email
    from app.modules.applications.models import ApplicationEvent
    from app.modules.companies.models import Company
    from app.shared.enums import EventType

    waiting = list(
        await db.scalars(
            select(Application).where(
                Application.job_id == job.id,
                Application.stage.in_(
                    [
                        ApplicationStage.new,
                        ApplicationStage.shortlisted,
                        ApplicationStage.interview,
                    ]
                ),
            )
        )
    )
    company = await db.scalar(select(Company).where(Company.id == job.company_id))
    rejected_reason = (
        RejectedReason.position_filled
        if reason == JobClosedReason.hired.value
        else RejectedReason.other
    ).value
    now = _utcnow()
    email_ids: list[uuid.UUID] = []
    for application in waiting:
        event = ApplicationEvent(
            id=uuid.uuid4(),
            application_id=application.id,
            type=EventType.stage_changed.value,
            actor_user_id=user.id,
            payload={
                "action": "job_closed",
                "from": application.stage.value,
                "to": ApplicationStage.rejected.value,
                "rejected_reason": rejected_reason,
            },
        )
        db.add(event)
        application.stage = ApplicationStage.rejected
        application.rejected_reason = rejected_reason
        application.decided_by = user.id
        application.decided_at = now
        email = schedule_email(
            db,
            application=application,
            job=job,
            company=company,
            template="rejection",
            actor_user_id=user.id,
            decision_event_id=event.id,
        )
        if email is not None:
            email_ids.append(email.id)
        db.add(
            ApplicationSyncEvent(
                application_id=application.id, action=SyncAction.UPSERT
            )
        )
    return len(waiting), email_ids


async def _rereview_new_applications(db: AsyncSession, job_id) -> list[uuid.UUID]:
    """Criteria changed: review undecided applications again against them."""
    from app.modules.review.service import rereview

    ids = list(
        await db.scalars(
            select(Application.id).where(
                Application.job_id == job_id,
                Application.stage == ApplicationStage.new,
            )
        )
    )
    for application_id in ids:
        await rereview(db, application_id)
    return ids


async def delete_job(
    db: AsyncSession, user: User, job_id: str, bg_tasks: BackgroundTasks
) -> None:
    """Delete a job posting (must belong to user's company)."""
    company_id = await _get_user_company_id(db, user)

    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or you do not have permission.",
        )

    application_ids = list(
        await db.scalars(select(Application.id).where(Application.job_id == job.id))
    )
    job_title = job.title  # capture before deletion
    job_company_id = job.company_id
    await create_custom_audit_log(
        db,
        entity_type="job",
        action_type="job_deleted",
        category="jobs",
        message=f"Job '{job_title}' deleted by {user.full_name}",
        entity_id=job_id,
        company_id=job_company_id,
        metadata={"job_title": job_title},
    )
    await db.delete(job)

    application_sync_events = [
        ApplicationSyncEvent(application_id=application_id, action=SyncAction.DELETE)
        for application_id in application_ids
    ]
    for application_sync_event in application_sync_events:
        db.add(application_sync_event)

    await db.commit()

    for application_sync_event in application_sync_events:
        bg_tasks.add_task(process_application_sync_event, application_sync_event.id)

    await invalidate_job_detail_caches(job_id)
    await invalidate_company_application_caches(str(company_id))
    await invalidate_interview_list_caches(str(company_id))

    logger.info(f"Job '{job_title}' deleted by user {user.id}")


_SUGGEST_PROMPT = """You help a small business in Nepal write a job post. The job can be any kind of work (shop, hotel, school, clinic, bank, factory, office, transport, IT).

From the job description, propose:
- must_haves: 3 to 6 short criteria a CV or a short answer can show, e.g. "Valid driving licence (heavy vehicle)", "2+ years as a cook in a restaurant", "Registered with Nepal Nursing Council".
- nice_to_haves: 0 to 4 short criteria, same style.
- questions: 1 to 3 short questions for the apply form. Use type "yes_no" with knockout_answer when a wrong answer means the person cannot do the job (e.g. "Do you have a valid driving licence?" knockout_answer "yes"); otherwise "short_text" with knockout_answer null.
Each item at most 120 characters, in the language of the description.
Never ask about gender, age range, caste, ethnicity, religion, marital status, pregnancy, disability, looks or hometown (Labour Act 2074, s.6). Describe the work instead."""


class _Suggestion(BaseSchema):
    must_haves: list[str]
    nice_to_haves: list[str]
    questions: list[JobQuestion]


async def suggest_must_haves(
    payload: SuggestMustHavesRequest,
) -> SuggestMustHavesResponse:
    """LLM-suggested criteria and questions; protected grounds are dropped."""
    from app.infrastructures.ai.service import ai_service

    suggestion = await ai_service.generate_structured(
        _SUGGEST_PROMPT,
        {"title": payload.title or "", "description": payload.description},
        _Suggestion,
        temperature=0.0,
    )
    must = [" ".join(m.split())[:200] for m in suggestion.must_haves if m.strip()][:6]
    nice = [" ".join(m.split())[:200] for m in suggestion.nice_to_haves if m.strip()][
        :6
    ]
    questions = suggestion.questions[:3]
    warnings = check_protected_grounds(must, nice, [q.model_dump() for q in questions])
    flagged = {(w.field, w.index) for w in warnings}
    return SuggestMustHavesResponse(
        must_haves=[m for i, m in enumerate(must) if ("must_haves", i) not in flagged],
        nice_to_haves=[
            m for i, m in enumerate(nice) if ("nice_to_haves", i) not in flagged
        ],
        questions=[
            q for i, q in enumerate(questions) if ("questions", i) not in flagged
        ],
        warnings=warnings,
    )
