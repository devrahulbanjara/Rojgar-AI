"""Adapters that drive the REAL review code paths in-process.

Nothing here re-implements scoring. We only:
  * hand the production functions attribute-compatible stand-in objects, and
  * hash every reviewer input so "the attribute never reached the model" is
    provable, not assumed.

The review itself is `app.modules.review.service._evaluate` (knockouts ->
cheap pass -> full evidence review only when plausible -> quote verification ->
deterministic fit), called without a database. The injection rail is run
separately (see `guardrail`) so its verdicts can be repeated and counted.
"""

from __future__ import annotations

import asyncio
import hashlib
import uuid
from types import SimpleNamespace
from typing import Any

from simulation.safety import EST, Budget

# Groq on-demand tier: 8k tokens/minute. One Groq call at a time, with backoff.
_GROQ_LOCK = asyncio.Lock()
CLASSIFIER_RETRIES = 6


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


class Instrumented:
    """Process-wide counters and spend meter around external calls."""

    def __init__(self, budget: Budget) -> None:
        self.budget = budget
        self.review_retries = 0  # provider errors (429/5xx) absorbed by retries
        self.classifier_retries = 0  # guardrail errors retried (never SAFE now)
        self.classifier_unavailable = 0  # still erroring after all retries


# ---------------------------------------------------------------- blind review


def blind_text(job: SimpleNamespace, app: SimpleNamespace) -> str:
    from app.modules.review.blind import build_blind_text

    return build_blind_text(
        resume=app.resume,
        answers=app.screening_answers,
        candidate_name=app.shared_full_name,
        must_haves=job.must_haves,
    )


def _inputs(job: SimpleNamespace, app: SimpleNamespace):
    from app.modules.review.blind import candidate_text_for_guardrail
    from app.modules.review.reviewer import criteria_for
    from app.modules.review.service import _Inputs

    return _Inputs(
        application_id=uuid.uuid4(),
        job_id=job.id,
        attempts=0,
        job_title=job.title,
        criteria=criteria_for(job),
        questions=list(job.questions or []),
        answers=list(app.screening_answers or []),
        blind_text=blind_text(job, app),
        raw_text=candidate_text_for_guardrail(app.resume, app.screening_answers),
        # The rail is audited separately (guardrail below).
        skip_guardrail=True,
    )


async def _no_rail(*_args, **_kwargs):
    raise AssertionError("rail is skipped in review runs")


def _outcome_dict(outcome: Any) -> dict:
    from app.modules.review.reviewer import cost_npr

    return {
        "state": outcome.state,
        "fit": outcome.fit,
        "summary": outcome.summary,
        "rank_score": outcome.rank_score,
        "triage": outcome.triage,
        "checks": outcome.checks,
        "tokens_in": sum(u.tokens_in for u in outcome.usages),
        "tokens_out": sum(u.tokens_out for u in outcome.usages),
        "cost_npr": round(sum(cost_npr(u) for u in outcome.usages), 4),
        "models": sorted({u.model for u in outcome.usages}),
    }


async def deterministic_review(job: SimpleNamespace, app: SimpleNamespace) -> dict:
    """Production triage + rubric with the deterministic FakeReviewer (no LLM)."""
    from app.modules.review.reviewer import FakeReviewer
    from app.modules.review.service import _evaluate

    outcome = await _evaluate(_inputs(job, app), FakeReviewer(), _no_rail)
    return _outcome_dict(outcome)


async def live_review(
    job: SimpleNamespace,
    app: SimpleNamespace,
    inst: Instrumented,
) -> dict:
    """Production triage + rubric with the live LLM reviewer (Groq, then Gemini)."""
    from app.modules.review.reviewer import LLMReviewer
    from app.modules.review.service import _evaluate, _RetryableError

    async with _GROQ_LOCK:
        for attempt in range(8):
            try:
                outcome = await _evaluate(_inputs(job, app), LLMReviewer(), _no_rail)
                break
            except _RetryableError:
                if attempt == 7:
                    raise
                inst.review_retries += 1
                await asyncio.sleep(15)
    result = _outcome_dict(outcome)
    usd = result["cost_npr"] / 137.0
    inst.budget.charge("review", usd or EST["review"])
    return result


# ---------------------------------------------------------------- injection rail


async def guardrail(
    resume: SimpleNamespace | None,
    answers: list[dict] | None,
    inst: Instrumented,
    source: str = "simulation",
) -> dict:
    """Production review-time rail on the production candidate text.

    The rail is fail-closed: a classifier error (429, timeout, bad reply) is
    never SAFE, it routes the application to a person. We retry those so the
    recorded verdict is the classifier's real answer, and count the retries.
    """
    from app.infrastructures.guardrails import guardrails_service
    from app.modules.review.blind import candidate_text_for_guardrail

    text = candidate_text_for_guardrail(resume, answers)
    async with _GROQ_LOCK:
        for attempt in range(CLASSIFIER_RETRIES):
            verdict = await guardrails_service.check_input(
                text, source=source, fail_closed=True
            )
            if not verdict.error:
                break
            if attempt < CLASSIFIER_RETRIES - 1:
                inst.classifier_retries += 1
                await asyncio.sleep(15)
        else:
            inst.classifier_unavailable += 1
            return {
                "safe": False,
                "error": True,
                "score": None,
                "reason": "classifier unavailable: needs a person",
            }
    inst.budget.charge("guardrail", EST["guardrail"])
    return {
        "safe": verdict.safe,
        "error": False,
        "score": verdict.score,
        "reason": verdict.reason,
    }
