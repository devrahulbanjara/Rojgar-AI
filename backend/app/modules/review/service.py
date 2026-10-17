"""Rolling, cost-controlled review of each application.

An application is reviewed shortly after it arrives (background task), not
when the job closes. Triage keeps the cost per applicant low:

1. knockout questions (deterministic, no LLM): a wrong answer -> weak fit;
2. injection rail on the normalised candidate text (flag or outage ->
   needs_person, never "safe");
3. cheap pass (small model) over the blind text;
4. full evidence review (large model) only when the cheap pass finds the
   applicant plausible.

Every quote is verified against the text; fit and rank are computed in code
(rubric.py). The review never changes an application's stage.

Idempotent (a finished review is never redone unless a person asks) and safe
to run twice at once (attempts are claimed with compare-and-set). Failures are
retried up to `review_max_attempts`, then the review goes to a person.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field

from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.modules.applications.models import Application, ApplicationEvent, Review
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume
from app.modules.review import rubric
from app.modules.review.blind import build_blind_text, candidate_text_for_guardrail
from app.modules.review.reviewer import (
    PROMPT_VERSION,
    Reviewer,
    Usage,
    cost_npr,
    criteria_for,
    get_reviewer,
    system_prompt,
)
from app.shared.enums import EventType, Fit, ReviewState, ReviewTriage

FLAG_INJECTION = "Possible hidden instructions in the CV. Check the CV before deciding."
FLAG_UNCHECKED = (
    "The automatic safety check was unavailable. Read this application yourself."
)
FLAG_FAILED = "The automatic review failed. Read this application yourself."
NOTHING_YET = "No CV or answers yet"

_semaphore: asyncio.Semaphore | None = None


def _gate() -> asyncio.Semaphore:
    global _semaphore
    if _semaphore is None:
        _semaphore = asyncio.Semaphore(max(1, settings.review_concurrency))
    return _semaphore


GuardrailFn = Callable[..., Awaitable]


def _default_guardrail() -> GuardrailFn:
    from app.infrastructures.guardrails import guardrails_service

    return guardrails_service.check_input


class _RetryableError(Exception):
    """Provider or classifier outage: try again, then hand to a person."""


@dataclass
class _Inputs:
    application_id: uuid.UUID
    attempts: int
    job_title: str
    criteria: list[tuple[str, str]]
    questions: list[dict]
    answers: list[dict]
    blind_text: str
    raw_text: str
    skip_guardrail: bool
    tiebreak: float | None


@dataclass
class _Outcome:
    state: str
    fit: str | None = None
    summary: str | None = None
    checks: list[dict] = field(default_factory=list)
    flag_reason: str | None = None
    rank_score: float | None = None
    triage: str | None = None
    usages: list[Usage] = field(default_factory=list)


def ensure_review(db: AsyncSession, application_id: uuid.UUID) -> Review:
    """Add a pending review for a new application (caller commits)."""
    review = Review(application_id=application_id, state=ReviewState.pending.value)
    db.add(review)
    return review


async def _load_inputs(db: AsyncSession, application_id: uuid.UUID) -> _Inputs | None:
    """Load everything the review needs and render it to plain text."""
    from app.modules.review.ml_rank import ml_signal

    application = await db.scalar(
        select(Application)
        .where(Application.id == application_id)
        .options(
            selectinload(Application.resume).selectinload(Resume.experiences),
            selectinload(Application.resume).selectinload(Resume.educations),
            selectinload(Application.resume).selectinload(Resume.skills),
        )
        .execution_options(populate_existing=True)
    )
    review = await db.scalar(
        select(Review)
        .where(Review.application_id == application_id)
        .execution_options(populate_existing=True)
    )
    if application is None or review is None:
        return None
    if review.state != ReviewState.pending.value:
        return None  # idempotent: already done or with a person
    job = await db.scalar(select(Job).where(Job.id == application.job_id))
    if job is None:
        return None
    flag_cleared = await db.scalar(
        select(ApplicationEvent.id)
        .where(
            ApplicationEvent.application_id == application_id,
            ApplicationEvent.type == EventType.flag_cleared.value,
        )
        .limit(1)
    )
    name = application.shared_full_name or (
        application.user.full_name if application.user else None
    )
    answers = list(application.screening_answers or [])
    try:
        tiebreak = await asyncio.to_thread(ml_signal, job, application)
    except Exception:  # noqa: BLE001 - tie-break only; never blocks a review
        logger.exception("ML tie-break failed for application {}", application_id)
        tiebreak = None
    return _Inputs(
        application_id=application_id,
        attempts=review.attempts,
        job_title=job.title,
        criteria=criteria_for(job),
        questions=list(job.questions or []),
        answers=answers,
        blind_text=build_blind_text(
            resume=application.resume,
            answers=answers,
            candidate_name=name,
            must_haves=job.must_haves,
        ),
        raw_text=candidate_text_for_guardrail(application.resume, answers),
        skip_guardrail=flag_cleared is not None,
        tiebreak=tiebreak,
    )


async def _claim(db: AsyncSession, application_id: uuid.UUID, attempts: int) -> bool:
    """Count one attempt; False if another worker took this attempt first."""
    result = await db.execute(
        update(Review)
        .where(
            Review.application_id == application_id,
            Review.state == ReviewState.pending.value,
            Review.attempts == attempts,
        )
        .values(attempts=attempts + 1)
        .returning(Review.id)
        .execution_options(synchronize_session=False)
    )
    claimed = result.scalar_one_or_none() is not None
    await db.commit()
    return claimed


async def _evaluate(
    inputs: _Inputs, reviewer: Reviewer, guardrail: GuardrailFn
) -> _Outcome:
    """Run the triage. No database access here (no open transaction)."""
    knocked = rubric.failed_knockouts(inputs.questions, inputs.answers)
    if knocked:
        checks = [
            {
                "criterion": item["question"],
                "kind": "knockout",
                "result": "missing",
                "evidence": item["answer"],
            }
            for item in knocked
        ]
        first = knocked[0]
        return _Outcome(
            state=ReviewState.done.value,
            fit=Fit.weak.value,
            summary=rubric.cap_summary(
                f"Answered “{first['answer']}” to: {first['question']}"
            ),
            checks=checks,
            rank_score=0.0,
            triage=ReviewTriage.knockout.value,
        )

    if not inputs.blind_text.strip():
        # e.g. a recommendation with only a name and phone: nothing to check,
        # nothing suspicious. Re-reviewed when details arrive.
        return _Outcome(
            state=ReviewState.done.value,
            summary=NOTHING_YET,
            checks=[
                {"criterion": text, "kind": kind, "result": "missing", "evidence": None}
                for kind, text in inputs.criteria
            ],
            rank_score=rubric.rank_score([], inputs.tiebreak),
        )

    if not inputs.skip_guardrail:
        verdict = await guardrail(
            inputs.raw_text or inputs.blind_text, source="review", fail_closed=True
        )
        if verdict.error:
            raise _RetryableError("guardrail unavailable")
        if not verdict.safe:
            return _Outcome(
                state=ReviewState.needs_person.value, flag_reason=FLAG_INJECTION
            )

    if not inputs.criteria:
        # Nothing to check against: summary only, no fit.
        call = await _call(reviewer, inputs, cheap=True)
        return _Outcome(
            state=ReviewState.done.value,
            summary=rubric.cap_summary(call.output.summary),
            triage=ReviewTriage.extract.value,
            usages=[call.usage],
            rank_score=rubric.rank_score([], inputs.tiebreak),
        )

    usages: list[Usage] = []
    cheap = await _call(reviewer, inputs, cheap=True)
    usages.append(cheap.usage)
    checks = _checks(inputs, cheap.output)
    summary = cheap.output.summary
    triage = ReviewTriage.extract.value
    plausible = (rubric.coverage(checks, "must") or 0.0) >= (
        settings.review_full_review_min_coverage
    ) or rubric.coverage(checks, "must") is None
    if plausible:
        full = await _call(reviewer, inputs, cheap=False)
        usages.append(full.usage)
        checks = _checks(inputs, full.output)
        summary = full.output.summary
        triage = ReviewTriage.full.value
    return _Outcome(
        state=ReviewState.done.value,
        fit=rubric.derive_fit(checks),
        summary=rubric.cap_summary(summary),
        checks=checks,
        rank_score=rubric.rank_score(checks, inputs.tiebreak),
        triage=triage,
        usages=usages,
    )


async def _call(reviewer: Reviewer, inputs: _Inputs, *, cheap: bool):
    try:
        return await reviewer.review(
            system=system_prompt(inputs.job_title, tuple(inputs.criteria)),
            text=inputs.blind_text,
            criteria=inputs.criteria,
            cheap=cheap,
        )
    except Exception as exc:
        raise _RetryableError(type(exc).__name__) from exc


def _checks(inputs: _Inputs, output) -> list[dict]:
    raw = {
        item.index: {"result": item.result, "evidence": item.evidence}
        for item in output.checks
    }
    return rubric.build_checks(inputs.criteria, raw, inputs.blind_text)


async def _save(
    db: AsyncSession, application_id: uuid.UUID, outcome: _Outcome, model: str
) -> None:
    tokens_in = sum(u.tokens_in for u in outcome.usages)
    tokens_out = sum(u.tokens_out for u in outcome.usages)
    cost = round(sum(cost_npr(u) for u in outcome.usages), 4)
    result = await db.execute(
        update(Review)
        .where(
            Review.application_id == application_id,
            Review.state == ReviewState.pending.value,
        )
        .values(
            state=outcome.state,
            fit=outcome.fit,
            summary=outcome.summary,
            checks=outcome.checks,
            flag_reason=outcome.flag_reason,
            rank_score=outcome.rank_score,
            triage=outcome.triage,
            tokens_in=Review.tokens_in + tokens_in,
            tokens_out=Review.tokens_out + tokens_out,
            cost_npr=Review.cost_npr + cost,
            model=model,
            prompt_version=PROMPT_VERSION,
        )
        .returning(Review.id)
        .execution_options(synchronize_session=False)
    )
    if result.scalar_one_or_none() is not None:
        db.add(
            ApplicationEvent(
                application_id=application_id,
                type=EventType.review_done.value,
                payload={
                    "state": outcome.state,
                    "fit": outcome.fit,
                    "flagged": outcome.state == ReviewState.needs_person.value,
                    "triage": outcome.triage,
                },
            )
        )
    await db.commit()


async def _invalidate(db: AsyncSession, application_id: uuid.UUID) -> None:
    from app.core.cache import invalidate_company_application_caches
    from app.modules.applications.sync import enqueue_application_sync_event

    company_id = await db.scalar(
        select(Job.company_id)
        .join(Application, Application.job_id == Job.id)
        .where(Application.id == application_id)
    )
    enqueue_application_sync_event(db, application_id)
    await db.commit()
    if company_id is not None:
        await invalidate_company_application_caches(
            str(company_id), str(application_id)
        )


async def review_application(
    application_id: uuid.UUID,
    *,
    db: AsyncSession | None = None,
    reviewer: Reviewer | None = None,
    guardrail: GuardrailFn | None = None,
    retry_delay: float | None = None,
) -> str | None:
    """Review one application. Returns the final state, or None if skipped.

    Safe to call any number of times: a finished review is left alone.
    """
    if db is None:
        async with AsyncSessionLocal() as session:
            return await review_application(
                application_id,
                db=session,
                reviewer=reviewer,
                guardrail=guardrail,
                retry_delay=retry_delay,
            )

    reviewer = reviewer or get_reviewer()
    guardrail = guardrail or _default_guardrail()
    delay = settings.review_retry_delay_seconds if retry_delay is None else retry_delay
    max_attempts = max(1, settings.review_max_attempts)

    while True:
        inputs = await _load_inputs(db, application_id)
        if inputs is None:
            return None
        if inputs.attempts >= max_attempts:
            await _save(
                db,
                application_id,
                _Outcome(state=ReviewState.needs_person.value, flag_reason=FLAG_FAILED),
                reviewer.name,
            )
            await _invalidate(db, application_id)
            return ReviewState.needs_person.value
        if not await _claim(db, application_id, inputs.attempts):
            return None  # another worker owns this attempt
        try:
            async with _gate():
                outcome = await _evaluate(inputs, reviewer, guardrail)
        except _RetryableError as exc:
            exhausted = inputs.attempts + 1 >= max_attempts
            logger.warning(
                "Review attempt {}/{} failed for application {}: {}",
                inputs.attempts + 1,
                max_attempts,
                application_id,
                exc,
            )
            if exhausted:
                reason = FLAG_UNCHECKED if "guardrail" in str(exc) else FLAG_FAILED
                await _save(
                    db,
                    application_id,
                    _Outcome(state=ReviewState.needs_person.value, flag_reason=reason),
                    reviewer.name,
                )
                await _invalidate(db, application_id)
                return ReviewState.needs_person.value
            # Exponential backoff: provider rate limits are per minute.
            await asyncio.sleep(delay * 2**inputs.attempts)
            continue
        model = ",".join(sorted({u.model for u in outcome.usages})) or reviewer.name
        await _save(db, application_id, outcome, model)
        await _invalidate(db, application_id)
        logger.info(
            "Reviewed application {}: state={} fit={} triage={}",
            application_id,
            outcome.state,
            outcome.fit,
            outcome.triage,
        )
        return outcome.state


async def rereview(db: AsyncSession, application_id: uuid.UUID) -> None:
    """Reset a review to pending so it runs again (e.g. job criteria changed or a
    person cleared a flag). Caller commits and schedules `review_application`."""
    await db.execute(
        update(Review)
        .where(Review.application_id == application_id)
        .values(
            state=ReviewState.pending.value,
            attempts=0,
            flag_reason=None,
            fit=None,
            checks=[],
            summary=None,
        )
        .execution_options(synchronize_session=False)
    )


async def recover_pending_reviews(limit: int = 500) -> int:
    """Resume reviews left pending (crash, restart, backlog). Called at startup."""
    async with AsyncSessionLocal() as db:
        ids = list(
            await db.scalars(
                select(Review.application_id)
                .where(Review.state == ReviewState.pending.value)
                .order_by(Review.created_at.asc())
                .limit(limit)
            )
        )
    for application_id in ids:
        try:
            await review_application(application_id)
        except Exception:  # noqa: BLE001 - keep going through the backlog
            logger.exception("Review recovery failed for {}", application_id)
    if ids:
        logger.info("Review recovery processed {} pending review(s).", len(ids))
    return len(ids)
