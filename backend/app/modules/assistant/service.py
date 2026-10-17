"""Two assistant purposes, one agent run per turn, never any writes to hiring data.

A. Job draft: rough description -> structured draft (with at most 2 follow-ups).
B. Candidate Q&A: answers only from one application's data, with checked quotes.

The agents (agents.py) do the AI work and its guardrails. This module checks
access, keeps the conversation (short-term memory, in `assistant_threads`) and
turns each run into SSE events.

Tenant scoping is done here: company_id comes from the caller's active
membership, never from the request or the model. Asking the assistant to
shortlist/reject/email only returns a suggested action for the UI's button.
"""

import hashlib
import json
import secrets
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructures.redis.service import redis_service
from app.infrastructures.search.service import search_service
from app.modules.assistant import agents
from app.modules.assistant.agents import AskContext, DraftContext
from app.modules.assistant.context import CandidateContext, load_candidate_context
from app.modules.assistant.grounding import draft_language
from app.modules.assistant.models import AssistantThread
from app.modules.assistant.schemas import (
    AssistantMessage,
    CandidateHistory,
    CandidateTurnOutput,
    CandidateTurnRequest,
    DraftTurnOutput,
    JobDraft,
    JobDraftHistory,
    JobDraftTurnRequest,
)
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.shared.text_safety import redact_pii

MAX_FOLLOW_UPS = 2
# Turns (question + answer) kept per thread and sent to the model.
HISTORY_TURNS = 8

# ---- shared ---------------------------------------------------------------------


async def _company_id(db: AsyncSession, user: User) -> uuid.UUID:
    company_id = await db.scalar(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user.id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    if company_id is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No active company membership.")
    return company_id


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _trim(messages: list[dict]) -> list[dict]:
    return messages[-2 * HISTORY_TURNS :]


def _history(messages: list[dict]) -> list[dict[str, str]]:
    return [{"role": m["role"], "content": m["content"]} for m in _trim(messages)]


def _to_messages(raw: list[dict]) -> list[AssistantMessage]:
    return [AssistantMessage.model_validate(m) for m in raw]


async def _run_turn(
    run: Callable[[], Awaitable[dict[str, Any]]], *, text_field: str
) -> AsyncIterator[str]:
    """One turn as SSE: the answer text as one `token`, then `final`; or a
    single `error` event with a short, safe message."""
    try:
        final = await run()
    except agents.AssistantError as exc:
        yield _sse("error", {"code": exc.code, "message": exc.message})
        return
    if final.get(text_field):
        yield _sse("token", {"text": final[text_field]})
    yield _sse("final", final)


# ---- A. job draft -----------------------------------------------------------------


async def salary_search(title: str, location: str | None) -> list[dict[str, str]]:
    """Web results for "<title> salary <place>". Only the job title and place are
    sent (PII-redacted), never the recruiter's text or anything about a person."""
    place = redact_pii(location or "Nepal")[:60]
    query = f"{redact_pii(title)[:80]} salary {place} {datetime.now().year}"
    key = "assistant:salary:" + hashlib.sha256(query.lower().encode()).hexdigest()[:24]
    cached = await redis_service.get(key)
    if cached:
        return json.loads(cached)
    rows = await search_service.query(query, max_results=5, search_depth="basic")
    results = [
        {
            "title": (r.get("title") or "")[:160],
            "url": r["url"],
            "snippet": " ".join((r.get("content") or "").split())[:500],
        }
        for r in rows
        if r.get("url")
    ]
    await redis_service.set(key, json.dumps(results), ttl_seconds=86400)
    return results


async def _draft_thread(
    db: AsyncSession, user: User, company_id: uuid.UUID, draft_id: uuid.UUID
) -> AssistantThread:
    thread = await db.scalar(
        select(AssistantThread).where(
            AssistantThread.id == draft_id,
            AssistantThread.kind == "job_draft",
            AssistantThread.company_id == company_id,
            AssistantThread.recruiter_id == user.id,
        )
    )
    if thread is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Draft not found.")
    return thread


async def job_draft_turn(
    db: AsyncSession, user: User, payload: JobDraftTurnRequest
) -> AsyncIterator[str]:
    """Check access, then return the SSE stream for one job-draft turn."""
    company_id = await _company_id(db, user)
    thread = (
        await _draft_thread(db, user, company_id, payload.draft_id)
        if payload.draft_id
        else None
    )
    stored = list(thread.messages) if thread else []
    current = payload.draft or (
        JobDraft.model_validate(thread.draft) if thread and thread.draft else None
    )
    follow_ups_left = MAX_FOLLOW_UPS - sum(1 for m in stored if m.get("follow_up"))
    # End the read transaction: nothing is held open during the LLM call.
    await db.commit()

    said = [m["content"] for m in stored if m["role"] == "user"] + [payload.message]
    recruiter_text = " ".join(said)
    if current:  # salary already on the page (typed or grounded earlier)
        recruiter_text += f" {current.salary_min} {current.salary_max}"
    context = DraftContext(
        data={
            "current_draft": current.model_dump() if current else None,
            "follow_ups_left": max(0, follow_ups_left),
            "draft_language": draft_language(said),
        },
        recruiter_text=recruiter_text,
    )

    async def run() -> dict[str, Any]:
        nonlocal thread
        out, state = await agents.run_turn(
            agents.job_draft_agent(),
            [*_history(stored), {"role": "user", "content": payload.message}],
            context=context,
            schema=DraftTurnOutput,
            label="Job draft",
        )
        sources = state.get("salary_sources") or []
        cited = [r for r in sources if r["url"] in out.salary_source_urls]
        follow_up = out.follow_up and follow_ups_left > 0
        reply = out.reply.strip() or "Here's a draft. Edit anything that's off."

        if thread is None:
            thread = AssistantThread(
                company_id=company_id, recruiter_id=user.id, kind="job_draft"
            )
            db.add(thread)
        thread.draft = out.draft.model_dump()
        thread.messages = _trim(
            stored
            + [
                {"role": "user", "content": payload.message, "created_at": _now()},
                {
                    "role": "assistant",
                    "content": reply,
                    "created_at": _now(),
                    "follow_up": follow_up,
                },
            ]
        )
        await db.commit()
        return {
            "draft_id": str(thread.id),
            "reply": reply,
            "follow_up": follow_up,
            "draft": thread.draft,
            "sources": [{"title": r["title"], "url": r["url"]} for r in cited],
        }

    return _run_turn(run, text_field="reply")


async def job_draft_history(
    db: AsyncSession, user: User, draft_id: uuid.UUID
) -> JobDraftHistory:
    thread = await _draft_thread(db, user, await _company_id(db, user), draft_id)
    return JobDraftHistory(
        draft_id=thread.id,
        draft=JobDraft.model_validate(thread.draft) if thread.draft else None,
        messages=_to_messages(thread.messages),
    )


# ---- B. candidate Q&A -----------------------------------------------------------


async def _load_context(
    db: AsyncSession, company_id: uuid.UUID, application_id: uuid.UUID
) -> CandidateContext:
    ctx = await load_candidate_context(
        db, company_id=company_id, application_id=application_id
    )
    if ctx is None:
        # Same answer for "doesn't exist" and "another company's": no probing.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found.")
    return ctx


async def _candidate_thread(
    db: AsyncSession, user: User, application_id: uuid.UUID
) -> AssistantThread | None:
    return await db.scalar(
        select(AssistantThread).where(
            AssistantThread.kind == "candidate",
            AssistantThread.recruiter_id == user.id,
            AssistantThread.application_id == application_id,
        )
    )


async def candidate_turn(
    db: AsyncSession,
    user: User,
    application_id: uuid.UUID,
    payload: CandidateTurnRequest,
) -> AsyncIterator[str]:
    """Check access, then return the SSE stream for one candidate question."""
    company_id = await _company_id(db, user)
    ctx = await _load_context(db, company_id, application_id)
    thread = await _candidate_thread(db, user, application_id)
    stored = list(thread.messages) if thread else []
    await db.commit()

    context = AskContext(
        data={
            "job": {
                "title": ctx.job_title,
                "must_haves": ctx.must_haves,
                "nice_to_haves": ctx.nice_to_haves,
            },
            "stage": ctx.stage,
            "flagged": ctx.flag_reason,
            "cv_available": ctx.cv_available,
            **ctx.sections,
        },
        tag=f"applicant_data_{secrets.token_hex(6)}",
        sections=ctx.sections,
        cv_available=ctx.cv_available,
    )

    async def run() -> dict[str, Any]:
        nonlocal thread
        out, _state = await agents.run_turn(
            agents.candidate_agent(),
            [*_history(stored), {"role": "user", "content": payload.message}],
            context=context,
            schema=CandidateTurnOutput,
            label="Ask about applicant",
        )
        action = (
            {"action": out.action, "application_ids": [str(ctx.application_id)]}
            if out.action
            else None
        )
        quote_dicts = [q.model_dump() for q in out.quotes]

        if thread is None:
            thread = AssistantThread(
                company_id=company_id,
                recruiter_id=user.id,
                kind="candidate",
                application_id=ctx.application_id,
            )
            db.add(thread)
        thread.messages = _trim(
            stored
            + [
                {"role": "user", "content": payload.message, "created_at": _now()},
                {
                    "role": "assistant",
                    "content": out.answer,
                    "created_at": _now(),
                    "quotes": quote_dicts,
                    "suggested_action": action,
                },
            ]
        )
        await db.commit()
        return {
            "answer": out.answer,
            "quotes": quote_dicts,
            "suggested_action": action,
            "cv_available": ctx.cv_available,
        }

    return _run_turn(run, text_field="answer")


async def candidate_history(
    db: AsyncSession, user: User, application_id: uuid.UUID
) -> CandidateHistory:
    company_id = await _company_id(db, user)
    await _load_context(db, company_id, application_id)
    thread = await _candidate_thread(db, user, application_id)
    return CandidateHistory(
        application_id=application_id,
        messages=_to_messages(thread.messages if thread else []),
    )
