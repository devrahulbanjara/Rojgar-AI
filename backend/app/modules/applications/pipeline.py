"""Recruiter v2: one job's pipeline, the candidate panel, and decisions.

A person makes every decision. Each decision writes a `stage_changed` event
and, where the candidate should hear back, schedules the email that goes out
after the UI's undo window (see emails.py).
"""

from __future__ import annotations

import csv
import io
import os
import secrets
import uuid
from datetime import UTC, datetime

from fastapi import BackgroundTasks, HTTPException, UploadFile, status
from sqlalchemy import case, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import (
    invalidate_company_application_caches,
)
from app.core.config import settings
from app.modules.applications import emails
from app.modules.applications.models import Application, ApplicationEvent, Review
from app.modules.applications.schemas import (
    AnswerView,
    CandidatePanelResponse,
    DecideRequest,
    DecideResponse,
    DecideResult,
    EventActor,
    EventView,
    JobPipelineResponse,
    PanelJob,
    PersonContact,
    PipelineItem,
    PipelineJob,
    QuickAddCreated,
    QuickAddForm,
    ReferrerCreate,
    ReferrerRef,
    ReferrerResponse,
    ReviewCheck,
    ReviewView,
    StageCounts,
    UndoFailure,
    UndoResponse,
)
from app.modules.applications.service import (
    application_share_settings,
    create_application,
    display_name,
    get_active_company_id,
    invalidate_after_new_application,
    is_flagged,
    schedule_review,
    shared_email,
    shared_phone,
    visible_fit,
)
from app.modules.applications.sync import enqueue_application_sync_event
from app.modules.audit.service import create_custom_audit_log
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.jobs.models import Job, JobReferrer
from app.modules.resumes.models import Resume
from app.modules.resumes.schemas import ResumeResponse
from app.modules.review.service import rereview
from app.shared.enums import (
    ACTIVE_STAGES,
    ApplicationStage,
    EventType,
    Fit,
    RejectedReason,
    ReviewState,
)

S = ApplicationStage

# action -> (stages it applies to, target stage, email template or None)
ACTIONS: dict[
    str, tuple[frozenset[ApplicationStage], ApplicationStage | None, str | None]
] = {
    "shortlist": (frozenset({S.new}), S.shortlisted, "shortlist"),
    "reject": (frozenset(ACTIVE_STAGES), S.rejected, "rejection"),
    "invite_to_interview": (
        frozenset({S.shortlisted}),
        S.interview,
        "interview_invite",
    ),
    "make_offer": (frozenset({S.shortlisted, S.interview}), S.offer, "offer"),
    "mark_hired": (frozenset({S.offer}), S.hired, None),
    "move_back": (
        frozenset(
            {S.shortlisted, S.interview, S.offer, S.hired, S.rejected, S.withdrawn}
        ),
        None,
        None,
    ),
    "withdraw": (frozenset(ACTIVE_STAGES), S.withdrawn, None),
}
# Previous stage when no event says where an application came from.
_BACK = {
    S.shortlisted: S.new,
    S.interview: S.shortlisted,
    S.offer: S.interview,
    S.hired: S.offer,
    S.rejected: S.new,
    S.withdrawn: S.new,
}
# Button order in the panel: forward action first, then reject, then "More".
_PANEL_ORDER = [
    "shortlist",
    "invite_to_interview",
    "make_offer",
    "mark_hired",
    "reject",
    "move_back",
    "withdraw",
]
_FIT_ORDER = {Fit.strong.value: 0, Fit.possible.value: 1, Fit.weak.value: 2}


def _now() -> datetime:
    return datetime.now(UTC)


def actions_for(stage: ApplicationStage) -> list[str]:
    return [a for a in _PANEL_ORDER if stage in ACTIONS[a][0]]


async def _company_job(db: AsyncSession, user: User, job_id) -> tuple[uuid.UUID, Job]:
    company_id = await get_active_company_id(db, user)
    job = await db.scalar(
        select(Job).where(Job.id == job_id, Job.company_id == company_id)
    )
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return company_id, job


def _referrer_ref(referrer: JobReferrer | None) -> ReferrerRef | None:
    return ReferrerRef(id=referrer.id, name=referrer.name) if referrer else None


# ---------------------------------------------------------------- pipeline


async def job_pipeline(
    db: AsyncSession,
    user: User,
    job_id: uuid.UUID,
    *,
    stage: ApplicationStage | None = None,
    sort: str = "best_fit",
) -> JobPipelineResponse:
    """Stage counts + the application list for one job."""
    _company_id, job = await _company_job(db, user, job_id)
    counts_rows = await db.execute(
        select(Application.stage, func.count(Application.id))
        .where(Application.job_id == job.id)
        .group_by(Application.stage)
    )
    counts = StageCounts(**{s.value: n for s, n in counts_rows.all()})
    review_rows = await db.execute(
        select(Review.state, func.count(Review.id))
        .join(Application, Application.id == Review.application_id)
        .where(Application.job_id == job.id)
        .group_by(Review.state)
    )
    by_state = dict(review_rows.all())

    stmt = (
        select(Application, User, Review, JobReferrer)
        .join(User, User.id == Application.user_id)
        .outerjoin(Review, Review.application_id == Application.id)
        .outerjoin(JobReferrer, JobReferrer.id == Application.referrer_id)
        .where(Application.job_id == job.id)
    )
    if stage is not None:
        stmt = stmt.where(Application.stage == stage)
    if sort == "newest":
        stmt = stmt.order_by(Application.created_at.desc())
    else:
        fit_rank = case(
            (Review.state != ReviewState.done.value, 3),
            *((Review.fit == fit, rank) for fit, rank in _FIT_ORDER.items()),
            else_=3,
        )
        stmt = stmt.order_by(
            fit_rank.asc(),
            Review.rank_score.desc().nulls_last(),
            Application.created_at.asc(),
        )
    items = []
    for application, applicant, review, referrer in (await db.execute(stmt)).all():
        flagged = is_flagged(review)
        items.append(
            PipelineItem(
                application_id=application.id,
                person_id=applicant.id,
                name=display_name(application, applicant),
                email=shared_email(application),
                phone=shared_phone(application),
                avatar_url=application.shared_avatar_url
                if application.share_avatar
                else None,
                summary=review.summary if review and not flagged else None,
                fit=visible_fit(review),
                review_state=review.state if review else ReviewState.pending.value,
                flagged=flagged,
                stage=application.stage,
                source=application.source,
                referred_by=_referrer_ref(referrer),
                applied_at=application.created_at,
                updated_at=application.updated_at,
            )
        )
    return JobPipelineResponse(
        job=PipelineJob.model_validate(job),
        counts=counts,
        reviewing=int(by_state.get(ReviewState.pending.value, 0)),
        waiting_for_quota=int(by_state.get(ReviewState.waiting_for_quota.value, 0)),
        reviewed=int(
            sum(
                n
                for s, n in by_state.items()
                if s
                not in (ReviewState.pending.value, ReviewState.waiting_for_quota.value)
            )
        ),
        items=items,
    )


# ---------------------------------------------------------------- candidate panel


async def _company_application(
    db: AsyncSession, user: User, application_id
) -> tuple[uuid.UUID, Application, Job]:
    company_id = await get_active_company_id(db, user)
    row = await db.execute(
        select(Application, Job)
        .join(Job, Job.id == Application.job_id)
        .where(Application.id == application_id, Job.company_id == company_id)
        .options(
            selectinload(Application.referrer),
            selectinload(Application.resume).selectinload(Resume.experiences),
            selectinload(Application.resume).selectinload(Resume.educations),
            selectinload(Application.resume).selectinload(Resume.skills),
        )
    )
    found = row.one_or_none()
    if found is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return company_id, found[0], found[1]


async def _events(db: AsyncSession, application_id) -> list[EventView]:
    rows = await db.execute(
        select(ApplicationEvent, User.id, User.full_name)
        .outerjoin(User, User.id == ApplicationEvent.actor_user_id)
        .where(ApplicationEvent.application_id == application_id)
        .order_by(ApplicationEvent.created_at.asc())
    )
    views = []
    for event, actor_id, actor_name in rows.all():
        payload = dict(event.payload or {})
        payload.pop("html", None)  # the email body is not needed in the timeline
        views.append(
            EventView(
                id=event.id,
                type=event.type,
                actor=EventActor(id=actor_id, name=actor_name) if actor_id else None,
                payload=payload,
                created_at=event.created_at,
            )
        )
    return views


def _recruiter_safe_resume(application: Application) -> ResumeResponse | None:
    """The CV as recruiters may see it, honouring the candidate's share flags."""
    if application.resume is None:
        return None
    resume = ResumeResponse.model_validate(application.resume)
    hidden: dict[str, None] = {}
    if not application.share_phone:
        hidden["phone"] = None
    if not application.share_location:
        hidden["location"] = None
    if not application.share_links:
        hidden.update(linkedin_url=None, github_url=None, portfolio_url=None)
    return resume.model_copy(update=hidden) if hidden else resume


async def candidate_panel(
    db: AsyncSession, user: User, application_id: uuid.UUID
) -> CandidatePanelResponse:
    company_id, application, job = await _company_application(db, user, application_id)
    review = await db.scalar(
        select(Review)
        .where(Review.application_id == application.id)
        .execution_options(populate_existing=True)
    )
    applicant = application.user
    share = application_share_settings(application)
    resume = application.resume
    cv_url = None
    if resume is not None and resume.cv_file_key:
        from app.infrastructures.storage.service import storage_service

        try:
            cv_url = await storage_service.generate_presigned_url(
                resume.cv_file_key, expires_in=600
            )
        except Exception:  # noqa: BLE001 - the panel still works without the file
            cv_url = None
    others = await db.scalar(
        select(func.count(Application.id))
        .join(Job, Job.id == Application.job_id)
        .where(
            Application.user_id == application.user_id,
            Application.id != application.id,
            Job.company_id == company_id,
        )
    )
    flagged = is_flagged(review)
    return CandidatePanelResponse(
        application_id=application.id,
        job=PanelJob(id=job.id, title=job.title),
        stage=application.stage,
        source=application.source,
        referred_by=_referrer_ref(application.referrer),
        applied_at=application.created_at,
        decided_at=application.decided_at,
        rejected_reason=application.rejected_reason,
        person=PersonContact(
            id=applicant.id,
            name=display_name(application, applicant),
            email=shared_email(application),
            phone=shared_phone(application),
            location=application.shared_location_value
            if share.share_location
            else None,
            avatar_url=application.shared_avatar_url if share.share_avatar else None,
            headline=application.shared_headline_value
            if share.share_headline_summary
            else None,
            linkedin_url=application.shared_linkedin_url if share.share_links else None,
            github_url=application.shared_github_url if share.share_links else None,
            portfolio_url=application.shared_portfolio_url
            if share.share_links
            else None,
        ),
        review=ReviewView(
            state=review.state if review else ReviewState.pending.value,
            fit=visible_fit(review),
            summary=review.summary if review and not flagged else None,
            checks=[ReviewCheck.model_validate(c) for c in review.checks or []]
            if review and not flagged
            else [],
            flagged=flagged,
            flag_reason=review.flag_reason if flagged else None,
        ),
        answers=[
            AnswerView(
                question=str(a.get("question", "")), answer=str(a.get("answer", ""))
            )
            for a in application.screening_answers or []
        ],
        cv_url=cv_url,
        resume=_recruiter_safe_resume(application),
        other_applications=int(others or 0),
        events=await _events(db, application.id),
        actions=actions_for(application.stage),
    )


# ---------------------------------------------------------------- decide / undo


async def _move_back_target(
    db: AsyncSession, application: Application
) -> ApplicationStage:
    payload = await db.scalar(
        select(ApplicationEvent.payload)
        .where(
            ApplicationEvent.application_id == application.id,
            ApplicationEvent.type == EventType.stage_changed.value,
        )
        .order_by(ApplicationEvent.created_at.desc())
        .limit(1)
    )
    if payload and payload.get("to") == application.stage.value and payload.get("from"):
        try:
            return ApplicationStage(payload["from"])
        except ValueError:
            pass
    return _BACK[application.stage]


async def decide(
    db: AsyncSession,
    user: User,
    payload: DecideRequest,
    bg_tasks: BackgroundTasks | None,
) -> DecideResponse:
    company_id = await get_active_company_id(db, user)
    allowed, target, template = ACTIONS[payload.action]
    rows = await db.execute(
        select(Application, Job)
        .join(Job, Job.id == Application.job_id)
        .where(
            Application.id.in_(payload.application_ids), Job.company_id == company_id
        )
        .with_for_update(of=Application)
    )
    found = {app.id: (app, job) for app, job in rows.all()}
    company = await db.scalar(select(Company).where(Company.id == company_id))
    now = _now()
    results: list[DecideResult] = []
    email_ids: list[uuid.UUID] = []
    for application_id in payload.application_ids:
        pair = found.get(application_id)
        if pair is None:
            results.append(
                DecideResult(application_id=application_id, ok=False, error="not_found")
            )
            continue
        application, job = pair
        current = application.stage
        if current not in allowed:
            results.append(
                DecideResult(
                    application_id=application_id,
                    ok=False,
                    stage=current,
                    error=f"cannot {payload.action} from {current.value}",
                )
            )
            continue
        new_stage = target or await _move_back_target(db, application)
        reason = None
        if new_stage == S.rejected:
            reason = (payload.rejected_reason or RejectedReason.not_a_fit).value
        event = ApplicationEvent(
            id=uuid.uuid4(),
            application_id=application.id,
            type=EventType.stage_changed.value,
            actor_user_id=user.id,
            payload={
                "action": payload.action,
                "from": current.value,
                "to": new_stage.value,
                "rejected_reason": reason,
                "previous": {
                    "decided_by": str(application.decided_by)
                    if application.decided_by
                    else None,
                    "decided_at": application.decided_at.isoformat()
                    if application.decided_at
                    else None,
                    "rejected_reason": application.rejected_reason,
                },
            },
        )
        db.add(event)
        application.stage = new_stage
        application.decided_by = user.id
        application.decided_at = now
        application.rejected_reason = reason
        enqueue_application_sync_event(db, application.id)
        email = None
        if template:
            booking_url = None
            if template == "interview_invite" and emails.candidate_email(application):
                # The person inviting is the interviewer; the email carries
                # the link to pick a time.
                from app.modules.interviews.service import scheduling_url_for

                booking_url = await scheduling_url_for(db, application.id, user.id)
            email = emails.schedule_email(
                db,
                application=application,
                job=job,
                company=company,
                template=template,
                actor_user_id=user.id,
                decision_event_id=event.id,
                booking_url=booking_url,
            )
            if email is not None:
                event.payload = {**event.payload, "email_event_id": str(email.id)}
                email_ids.append(email.id)
        results.append(
            DecideResult(
                application_id=application.id,
                ok=True,
                stage=new_stage,
                event_id=event.id,
                email_scheduled=email is not None,
            )
        )
    done = [r for r in results if r.ok]
    if done:
        await create_custom_audit_log(
            db,
            entity_type="application",
            action_type=f"decision_{payload.action}",
            category="pipeline",
            message=f"{user.full_name}: {payload.action.replace('_', ' ')} "
            f"({len(done)} application{'s' if len(done) != 1 else ''})",
            entity_id=done[0].application_id if len(done) == 1 else None,
            company_id=company_id,
            metadata={"application_ids": [str(r.application_id) for r in done]},
        )
    await db.commit()
    if email_ids and bg_tasks is not None and "PYTEST_CURRENT_TEST" not in os.environ:
        bg_tasks.add_task(emails.send_after_undo_window, email_ids)
    await _invalidate(db, company_id, [found[r.application_id][0] for r in done])
    return DecideResponse(
        results=results,
        undo_event_ids=[r.event_id for r in done if r.event_id],
        undo_seconds=emails.UNDO_SECONDS,
    )


async def undo(
    db: AsyncSession, user: User, event_ids: list[uuid.UUID]
) -> UndoResponse:
    """Revert decisions whose email has not gone out yet."""
    company_id = await get_active_company_id(db, user)
    rows = await db.execute(
        select(ApplicationEvent, Application)
        .join(Application, Application.id == ApplicationEvent.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(ApplicationEvent.id.in_(event_ids), Job.company_id == company_id)
        .with_for_update(of=Application)
    )
    found = {event.id: (event, application) for event, application in rows.all()}
    response = UndoResponse()
    touched: list[Application] = []
    for event_id in dict.fromkeys(event_ids):
        pair = found.get(event_id)
        if pair is None or pair[0].type != EventType.stage_changed.value:
            response.failed.append(UndoFailure(event_id=event_id, reason="not_found"))
            continue
        event, application = pair
        data = event.payload or {}
        latest = await db.scalar(
            select(ApplicationEvent.id)
            .where(
                ApplicationEvent.application_id == application.id,
                ApplicationEvent.type == EventType.stage_changed.value,
            )
            .order_by(ApplicationEvent.created_at.desc())
            .limit(1)
        )
        if latest != event.id or application.stage.value != data.get("to"):
            response.failed.append(UndoFailure(event_id=event_id, reason="superseded"))
            continue
        email_id = data.get("email_event_id")
        if email_id and not await emails.cancel_scheduled(db, uuid.UUID(email_id)):
            response.failed.append(UndoFailure(event_id=event_id, reason="email_sent"))
            continue
        previous = data.get("previous") or {}
        application.stage = ApplicationStage(data["from"])
        application.decided_by = (
            uuid.UUID(previous["decided_by"]) if previous.get("decided_by") else None
        )
        application.decided_at = (
            datetime.fromisoformat(previous["decided_at"])
            if previous.get("decided_at")
            else None
        )
        application.rejected_reason = previous.get("rejected_reason")
        await db.execute(
            delete(ApplicationEvent).where(ApplicationEvent.id == event.id)
        )
        enqueue_application_sync_event(db, application.id)
        response.undone.append(application.id)
        touched.append(application)
    if touched:
        await create_custom_audit_log(
            db,
            entity_type="application",
            action_type="decision_undone",
            category="pipeline",
            message=f"{user.full_name} undid {len(touched)} decision(s)",
            company_id=company_id,
            metadata={"application_ids": [str(a.id) for a in touched]},
        )
    await db.commit()
    await _invalidate(db, company_id, touched)
    return response


async def _invalidate(
    db: AsyncSession, company_id, applications: list[Application]
) -> None:
    await invalidate_company_application_caches(str(company_id))


# ---------------------------------------------------------------- notes, flags


async def add_note(
    db: AsyncSession, user: User, application_id: uuid.UUID, text: str
) -> EventView:
    _company_id, application, _job = await _company_application(
        db, user, application_id
    )
    event = ApplicationEvent(
        id=uuid.uuid4(),
        application_id=application.id,
        type=EventType.note.value,
        actor_user_id=user.id,
        payload={"text": text},
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return EventView(
        id=event.id,
        type=event.type,
        actor=EventActor(id=user.id, name=user.full_name),
        payload=event.payload,
        created_at=event.created_at,
    )


async def clear_flag(
    db: AsyncSession, user: User, application_id: uuid.UUID, bg_tasks: BackgroundTasks
) -> CandidatePanelResponse:
    """A person read the CV and cleared the flag: review it (rail skipped)."""
    company_id, application, _job = await _company_application(db, user, application_id)
    review = await db.scalar(
        select(Review).where(Review.application_id == application.id)
    )
    if review is None or not is_flagged(review):
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="This application is not flagged."
        )
    db.add(
        ApplicationEvent(
            application_id=application.id,
            type=EventType.flag_cleared.value,
            actor_user_id=user.id,
            payload={"reason": review.flag_reason},
        )
    )
    await rereview(db, application.id)
    await db.commit()
    schedule_review(bg_tasks, application.id)
    await invalidate_company_application_caches(str(company_id), str(application.id))
    return await candidate_panel(db, user, application.id)


# ---------------------------------------------------------------- quick add, referrers


async def find_or_create_person(
    db: AsyncSession,
    *,
    full_name: str,
    email: str | None,
    phone: str | None,
    company_id: uuid.UUID,
) -> User:
    """Person = User row. Matched by email, else by E.164 phone.

    The business's own team can't be added to (or apply for) its own jobs.
    """
    user = None
    if email:
        user = await db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None and phone:
        user = await db.scalar(select(User).where(User.phone == phone))
    if user is None:
        user = User(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=None,
            is_email_verified=False,
            is_onboarded=True,
        )
        db.add(user)
        await db.flush()
        return user
    is_member = await db.scalar(
        select(CompanyMembership.id).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.company_id == company_id,
        )
    )
    if user.is_deleted or is_member:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Please use a different email or phone number.",
        )
    if phone and not user.phone:
        clash = await db.scalar(select(User.id).where(User.phone == phone))
        if clash is None:
            user.phone = phone
    return user


def new_referrer_token() -> str:
    return secrets.token_urlsafe(12)[:16]


def referrer_link(job: Job, token: str) -> str:
    return f"{settings.frontend_url}/jobs/{job.slug}?ref={token}"


async def quick_add(
    db: AsyncSession,
    user: User,
    job_id: uuid.UUID,
    form: QuickAddForm,
    *,
    phone: str,
    email: str | None,
    answers: list[dict] | None,
    cv: UploadFile | None,
    bg_tasks: BackgroundTasks,
) -> QuickAddCreated:
    """Recruiter adds a walk-in, phone or referral candidate. Same review."""
    from app.infrastructures.storage.service import storage_service
    from app.modules.public import cv_text

    _company_id, job = await _company_job(db, user, job_id)
    person = await find_or_create_person(
        db,
        full_name=form.full_name,
        email=email,
        phone=phone,
        company_id=job.company_id,
    )
    existing = await db.scalar(
        select(Application.id).where(
            Application.job_id == job.id, Application.user_id == person.id
        )
    )
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="This person already applied to this job."
        )
    resume_id = None
    cv_key = None
    if cv is not None:
        data = await cv_text.read_cv_upload(cv)
        text = await cv_text.extract_text(data)
        cv_key = await storage_service.upload_private_document(
            data, "cvs", extension="pdf", content_type="application/pdf"
        )
        resume = Resume(
            user_id=person.id,
            resume_name=f"CV for {job.title}"[:255],
            summary=text[:6000] or None,
            cv_file_key=cv_key,
        )
        db.add(resume)
        await db.flush()
        resume_id = resume.id
    referrer_id = None
    if form.source == "referral" and form.referred_by:
        referrer = JobReferrer(
            job_id=job.id,
            name=form.referred_by,
            token=new_referrer_token(),
            created_by=user.id,
        )
        db.add(referrer)
        await db.flush()
        referrer_id = referrer.id
    try:
        application, sync_event = await create_application(
            db,
            job=job,
            user=person,
            resume_id=resume_id,
            source=form.source,
            actor_user_id=user.id,
            referrer_id=referrer_id,
            fields={
                "shared_full_name": form.full_name,
                "shared_email_value": email,
                "shared_phone_value": phone,
                "screening_answers": answers or None,
            },
        )
        await db.commit()
    except Exception:
        if cv_key:
            await storage_service.delete_key(cv_key)
        raise
    schedule_review(bg_tasks, application.id, sync_event.id)
    await invalidate_after_new_application(job)
    return QuickAddCreated(application_id=application.id, person_id=person.id)


async def create_referrer(
    db: AsyncSession, user: User, job_id: uuid.UUID, payload: ReferrerCreate
) -> ReferrerResponse:
    from app.shared.normalize import normalize_phone

    _company_id, job = await _company_job(db, user, job_id)
    referrer = JobReferrer(
        job_id=job.id,
        name=" ".join(payload.name.split()),
        phone=normalize_phone(payload.phone),
        token=new_referrer_token(),
        created_by=user.id,
    )
    db.add(referrer)
    await db.commit()
    await db.refresh(referrer)
    return ReferrerResponse(
        id=referrer.id,
        name=referrer.name,
        phone=referrer.phone,
        token=referrer.token,
        link=referrer_link(job, referrer.token),
        created_at=referrer.created_at,
    )


async def list_referrers(
    db: AsyncSession, user: User, job_id: uuid.UUID
) -> list[ReferrerResponse]:
    _company_id, job = await _company_job(db, user, job_id)
    rows = await db.execute(
        select(JobReferrer, func.count(Application.id))
        .outerjoin(Application, Application.referrer_id == JobReferrer.id)
        .where(JobReferrer.job_id == job.id)
        .group_by(JobReferrer.id)
        .order_by(JobReferrer.created_at.asc())
    )
    return [
        ReferrerResponse(
            id=r.id,
            name=r.name,
            phone=r.phone,
            token=r.token,
            link=referrer_link(job, r.token),
            applications=int(n),
            created_at=r.created_at,
        )
        for r, n in rows.all()
    ]


# ---------------------------------------------------------------- export

_FIT_LABEL = {"strong": "Strong fit", "possible": "Possible fit", "weak": "Weak fit"}


async def export_csv(
    db: AsyncSession, user: User, job_id: uuid.UUID
) -> tuple[str, str]:
    """(filename, CSV text) of a job's applications in pipeline order."""
    pipeline = await job_pipeline(db, user, job_id)
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(
        [
            "Name",
            "Phone",
            "Email",
            "Stage",
            "Fit",
            "Summary",
            "Source",
            "Referred by",
            "Applied",
        ]
    )
    for item in pipeline.items:
        writer.writerow(
            [
                item.name,
                item.phone or "",
                item.email or "",
                item.stage.value.replace("_", " ").capitalize(),
                "Flagged" if item.flagged else _FIT_LABEL.get(item.fit or "", ""),
                item.summary or "",
                item.source.replace("_", " "),
                item.referred_by.name if item.referred_by else "",
                item.applied_at.strftime("%Y-%m-%d"),
            ]
        )
    slug = pipeline.job.slug[:60]
    # Excel opens UTF-8 CSV (Nepali names) correctly only with a BOM.
    return f"{slug}-applications.csv", "﻿" + out.getvalue()
