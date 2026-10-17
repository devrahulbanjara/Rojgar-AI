"""Two assistant purposes, one LLM call per turn, never any writes to hiring data.

A. Job draft: rough description -> structured draft (with at most 2 follow-ups).
B. Candidate Q&A: answers only from one application's data, with checked quotes.

Tenant scoping is done here: company_id comes from the caller's active
membership, never from the request or the model. Asking the assistant to
shortlist/reject/email only returns a suggested action for the UI's button.
"""

import asyncio
import hashlib
import json
import re
import secrets
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from loguru import logger
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.infrastructures.guardrails import guardrails_service
from app.infrastructures.guardrails.service import heuristic_injection_signal
from app.infrastructures.redis.service import redis_service
from app.infrastructures.search.service import search_service
from app.modules.assistant import llm
from app.modules.assistant.context import CandidateContext, load_candidate_context
from app.modules.assistant.models import AssistantThread
from app.modules.assistant.prompts import CANDIDATE_PROMPT, JOB_DRAFT_PROMPT
from app.modules.assistant.schemas import (
    AssistantMessage,
    CandidateHistory,
    CandidateTurnOutput,
    CandidateTurnRequest,
    DraftTurnOutput,
    JobDraft,
    JobDraftHistory,
    JobDraftTurnRequest,
    Quote,
)
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.shared.text_safety import redact_pii

NOT_IN_DATA = "Not in their CV or notes."
BLOCKED_MESSAGE = "I can't help with that message."
MAX_FOLLOW_UPS = 2

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
    return messages[-2 * settings.assistant_history_turns :]


def _history(messages: list[dict]) -> list[dict[str, str]]:
    return [{"role": m["role"], "content": m["content"]} for m in _trim(messages)]


def _to_messages(raw: list[dict]) -> list[AssistantMessage]:
    return [AssistantMessage.model_validate(m) for m in raw]


async def _guard(text: str, source: str) -> None:
    """Input rail. A slow classifier falls back to the marker scan so it can
    never stretch a turn past a few seconds."""
    try:
        verdict = await asyncio.wait_for(
            guardrails_service.check_input(text, source=source),
            settings.assistant_guard_timeout_seconds,
        )
        safe = verdict.safe
    except TimeoutError:
        logger.warning("Assistant guardrail timed out for {}", source)
        safe = heuristic_injection_signal(text) is None
    if not safe:
        raise llm.AssistantError("blocked", BLOCKED_MESSAGE)


async def _run_turn(
    llm_messages: list[dict[str, str]],
    *,
    stream_field: str,
    user_text: str,
    source: str,
    finish: Callable[[dict[str, Any]], Awaitable[dict[str, Any]]],
) -> AsyncIterator[str]:
    """Stream one turn as SSE: token* then final, or a single error event.

    The input guardrail runs alongside the model; no token is sent until it passes.
    """
    guard = asyncio.create_task(_guard(user_text, source))
    streamer = llm.FieldStreamer(stream_field)
    raw = ""
    try:
        async for chunk in llm.stream_json(llm_messages):
            raw += chunk
            await guard
            text = streamer.feed(chunk)
            if text:
                yield _sse("token", {"text": text})
        await guard
        try:
            final = await finish(llm.parse_json_object(raw))
        except ValidationError:
            raise llm.AssistantError("invalid", llm.INVALID_MESSAGE) from None
        yield _sse("final", final)
    except llm.AssistantError as exc:
        yield _sse("error", {"code": exc.code, "message": exc.message})
    finally:
        guard.cancel()


# ---- A. job draft -----------------------------------------------------------------

_DEVANAGARI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")
_NUMBER = re.compile(
    r"(\d+(?:[.,]\d+)*)\s*(k|thousand|hajar|hazar|हजार|lakhs?|lacs?|लाख|million)?(?![a-z])"
)
_MULTIPLIERS = {
    "k": 1_000,
    "thousand": 1_000,
    "hajar": 1_000,
    "hazar": 1_000,
    "हजार": 1_000,
    "lakh": 100_000,
    "lac": 100_000,
    "लाख": 100_000,
    "million": 1_000_000,
}
_SALARY_WORD = re.compile(r"salary|pay|talab|compensation|तलब|सेलरी", re.IGNORECASE)
_RESEARCH_WORD = re.compile(
    r"\b(market|benchmark|typical|average|going rate|research|look ?up|search|"
    r"kati|how much)\b|कति",
    re.IGNORECASE,
)


def numbers_in(text: str) -> set[int]:
    """Every amount written in `text`, e.g. "145-215k" -> {145000, 215000, ...}.

    A bare number also counts with any multiplier used in the same text, so a
    range written once with a suffix is understood.
    """
    text = text.translate(_DEVANAGARI_DIGITS).lower()
    values: list[float] = []
    multipliers = {1}
    for match in _NUMBER.finditer(text):
        try:
            value = float(match.group(1).replace(",", ""))
        except ValueError:
            continue
        values.append(value)
        suffix = (match.group(2) or "").rstrip("s")
        multipliers.add(_MULTIPLIERS.get(suffix, 1))
    return {round(v * m) for v in values for m in multipliers}


def draft_language(texts: list[str]) -> str:
    """Nepali when the recruiter mostly writes Devanagari; English for English or
    Romanized Nepali (Romanized Nepali reads badly in a public job post)."""
    letters = [c for t in texts for c in t if c.isalpha()]
    devanagari = sum(1 for c in letters if "\u0900" <= c <= "\u097f")
    return "Nepali" if letters and devanagari * 2 > len(letters) else "English"


def wants_salary_research(message: str) -> bool:
    return bool(_SALARY_WORD.search(message) and _RESEARCH_WORD.search(message))


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


def ground_salary(
    draft: JobDraft, recruiter_text: str, cited: list[dict[str, str]]
) -> JobDraft:
    """Drop salary numbers that neither the recruiter nor a cited source wrote."""
    allowed = numbers_in(recruiter_text + " " + " ".join(r["snippet"] for r in cited))
    update: dict[str, Any] = {
        name: None
        for name in ("salary_min", "salary_max")
        if getattr(draft, name) is not None and getattr(draft, name) not in allowed
    }
    draft = draft.model_copy(update=update)
    if draft.salary_min is None and draft.salary_max is None:
        draft = draft.model_copy(update={"currency": None})
    elif not draft.currency:
        draft = draft.model_copy(update={"currency": "NPR"})
    return draft


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

    results: list[dict[str, str]] = []
    if current and current.title and wants_salary_research(payload.message):
        results = await salary_search(current.title, current.location)

    context: dict[str, Any] = {
        "current_draft": current.model_dump() if current else None,
        "follow_ups_left": max(0, follow_ups_left),
        "draft_language": draft_language(
            [m["content"] for m in stored if m["role"] == "user"] + [payload.message]
        ),
    }
    if results:
        context["search_results"] = results
    llm_messages = [
        {"role": "system", "content": JOB_DRAFT_PROMPT},
        {"role": "system", "content": json.dumps(context, ensure_ascii=False)},
        *_history(stored),
        {"role": "user", "content": payload.message},
    ]

    async def finish(data: dict[str, Any]) -> dict[str, Any]:
        nonlocal thread
        out = DraftTurnOutput.model_validate(data)
        cited = [r for r in results if r["url"] in out.salary_source_urls]
        recruiter_text = " ".join(
            [m["content"] for m in stored if m["role"] == "user"] + [payload.message]
        )
        if current:  # salary already on the page (typed or grounded earlier)
            recruiter_text += f" {current.salary_min} {current.salary_max}"
        draft = ground_salary(out.draft, recruiter_text, cited)
        follow_up = out.follow_up and follow_ups_left > 0
        reply = out.reply.strip() or "Here's a draft. Edit anything that's off."

        if thread is None:
            thread = AssistantThread(
                company_id=company_id, recruiter_id=user.id, kind="job_draft"
            )
            db.add(thread)
        thread.draft = draft.model_dump()
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

    return _run_turn(
        llm_messages,
        stream_field="reply",
        user_text=payload.message,
        source="assistant.job_draft",
        finish=finish,
    )


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


def _norm(text: str) -> str:
    return " ".join(text.lower().split()).strip(" .…\"'“”‘’")


def verify_quotes(quotes: list[Quote], sections: dict[str, str]) -> list[Quote]:
    """Keep only quotes that appear word for word in the data (source corrected)."""
    normalized = {name: _norm(text) for name, text in sections.items()}
    kept: list[Quote] = []
    for quote in quotes:
        needle = _norm(quote.text)
        if len(needle) < 3:
            continue
        order = [quote.source] + [s for s in normalized if s != quote.source]
        source = next((s for s in order if needle in normalized.get(s, "")), None)
        if source:
            kept.append(Quote(text=quote.text.strip(), source=source))
    return kept[:3]


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

    tag = f"applicant_data_{secrets.token_hex(6)}"
    data = {
        "job": {
            "title": ctx.job_title,
            "must_haves": ctx.must_haves,
            "nice_to_haves": ctx.nice_to_haves,
        },
        "stage": ctx.stage,
        "flagged": ctx.flag_reason,
        "cv_available": ctx.cv_available,
        **ctx.sections,
    }
    llm_messages = [
        {"role": "system", "content": CANDIDATE_PROMPT},
        {
            "role": "system",
            "content": f"<{tag}>\n{json.dumps(data, ensure_ascii=False)}\n</{tag}>",
        },
        *_history(stored),
        {"role": "user", "content": payload.message},
    ]

    async def finish(raw: dict[str, Any]) -> dict[str, Any]:
        nonlocal thread
        out = CandidateTurnOutput.model_validate(raw)
        quotes = verify_quotes(out.quotes, ctx.sections)
        answer = out.answer.strip()
        action = (
            {"action": out.action, "application_ids": [str(ctx.application_id)]}
            if out.action
            else None
        )
        # Unsupported claims become the fixed "not in data" answer.
        if not action and (not out.found or not answer or (out.quotes and not quotes)):
            answer, quotes = NOT_IN_DATA, []
        elif not ctx.cv_available and not action and "no cv" not in answer.lower():
            answer = f"No CV was sent. {answer}"
        quote_dicts = [q.model_dump() for q in quotes]

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
                    "content": answer,
                    "created_at": _now(),
                    "quotes": quote_dicts,
                    "suggested_action": action,
                },
            ]
        )
        await db.commit()
        return {
            "answer": answer,
            "quotes": quote_dicts,
            "suggested_action": action,
            "cv_available": ctx.cv_available,
        }

    return _run_turn(
        llm_messages,
        stream_field="answer",
        user_text=payload.message,
        source="assistant.candidate",
        finish=finish,
    )


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
