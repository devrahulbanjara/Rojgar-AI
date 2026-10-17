"""The two assistant agents (LangChain `create_agent`; Groq, Gemini as fallback).

- Job draft: writes the job post from what the recruiter says. One tool,
  `search_salary` (web search for typical pay), at most once per turn.
- Ask about an applicant: answers from that one applicant's data, no tools.

Guardrails on both:
- before: prompt-injection check on the recruiter's message, short history;
- after: salary numbers must come from the recruiter or a cited source, and
  quotes must appear word for word in the applicant's data;
- limits: model calls and tool calls per turn.

The agents can't change anything: no tool writes data. A person acts on the
answer with the normal buttons (and their undo window).
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, NotRequired

from fastapi import HTTPException
from langchain.agents.middleware import (
    AgentMiddleware,
    ModelRequest,
    ToolCallLimitMiddleware,
    ToolErrorMiddleware,
    dynamic_prompt,
)
from langchain.tools import ToolRuntime, tool
from langchain_core.messages import ToolMessage
from langgraph.types import Command

from app.infrastructures.ai import llm
from app.infrastructures.ai.guards import GuardState, PromptInjectionGuard, trim_history
from app.modules.assistant.grounding import ground_salary, verify_quotes
from app.modules.assistant.prompts import CANDIDATE_PROMPT, JOB_DRAFT_PROMPT
from app.modules.assistant.schemas import CandidateTurnOutput, DraftTurnOutput

BUSY_MESSAGE = "I'm busy — try again in a moment."
TIMEOUT_MESSAGE = "That took too long — try again in a moment."
UNAVAILABLE_MESSAGE = "I can't answer right now — try again in a moment."
INVALID_MESSAGE = "I couldn't put an answer together — try again."
BLOCKED_MESSAGE = "I can't help with that message."
NOT_IN_DATA = "Not in their CV or notes."

# One turn: hard deadline (retries and fallback included), sampling, size.
TURN_TIMEOUT_SECONDS = 30.0
TEMPERATURE = 0.2
# Drafts are under 1,000 tokens; Groq counts this cap against tokens per minute.
MAX_TOKENS = 1500
# A draft turn: maybe one search, one answer, one fix of an invalid answer.
DRAFT_MODEL_CALLS = 4
CANDIDATE_MODEL_CALLS = 3


class AssistantError(Exception):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def _from_http(exc: HTTPException) -> AssistantError:
    if exc.status_code == 429:
        return AssistantError("busy", BUSY_MESSAGE)
    if exc.status_code == 504:
        return AssistantError("timeout", TIMEOUT_MESSAGE)
    if exc.status_code == 502 and exc.detail == llm.AI_INVALID_MESSAGE:
        return AssistantError("invalid", INVALID_MESSAGE)
    return AssistantError("unavailable", UNAVAILABLE_MESSAGE)


# ---- A. job draft ---------------------------------------------------------------


@dataclass(slots=True)
class DraftContext:
    """Per turn: what the page holds now, and everything the recruiter wrote
    (salary numbers they typed are allowed in the draft)."""

    data: dict[str, Any]
    recruiter_text: str


class DraftState(GuardState):
    salary_sources: NotRequired[list[dict[str, str]]]


@tool
async def search_salary(
    title: str, location: str | None, runtime: ToolRuntime
) -> Command:
    """Look up typical monthly pay for a job title in Nepal on the web.

    Use it only when the recruiter asks what to pay or what the market pays,
    once per message. Send only the job title and the town, never anything
    about a person.
    """
    from app.modules.assistant import service  # salary_search caches in Redis

    results = await service.salary_search(title, location)
    return Command(
        update={
            "salary_sources": results,
            "messages": [
                ToolMessage(
                    json.dumps(results, ensure_ascii=False),
                    tool_call_id=runtime.tool_call_id,
                )
            ],
        }
    )


async def _search_failed(*_: Any) -> str:
    return "Salary search is not available right now. Leave the salary empty."


@dynamic_prompt
def _draft_prompt(request: ModelRequest) -> str:
    context: DraftContext = request.runtime.context
    return f"{JOB_DRAFT_PROMPT}\n\n{json.dumps(context.data, ensure_ascii=False)}"


class SalaryGrounding(AgentMiddleware):
    """Drop salary numbers nobody wrote; keep only the sources actually used."""

    state_schema = DraftState

    async def aafter_agent(self, state: Any, runtime: Any) -> dict[str, Any] | None:
        out = state.get("structured_response")
        if not isinstance(out, DraftTurnOutput):
            return None
        sources = state.get("salary_sources") or []
        cited = [r for r in sources if r["url"] in out.salary_source_urls]
        draft = ground_salary(out.draft, runtime.context.recruiter_text, cited)
        return {
            "structured_response": out.model_copy(
                update={"draft": draft, "salary_source_urls": [r["url"] for r in cited]}
            ),
        }


def job_draft_agent() -> Any:
    return llm.structured_agent(
        DraftTurnOutput,
        tools=[search_salary],
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        context_schema=DraftContext,
        state_schema=DraftState,
        middleware=[
            PromptInjectionGuard(source="assistant.job_draft"),
            trim_history,
            _draft_prompt,
            ToolCallLimitMiddleware(tool_name="search_salary", run_limit=1),
            ToolErrorMiddleware(aon_error=_search_failed),
            SalaryGrounding(),
        ],
        max_model_calls=DRAFT_MODEL_CALLS,
    )


# ---- B. ask about an applicant --------------------------------------------------


@dataclass(slots=True)
class AskContext:
    """The applicant's data (untrusted), wrapped in a random tag."""

    data: dict[str, Any]
    tag: str
    sections: dict[str, str] = field(default_factory=dict)
    cv_available: bool = True


@dynamic_prompt
def _candidate_prompt(request: ModelRequest) -> str:
    context: AskContext = request.runtime.context
    data = json.dumps(context.data, ensure_ascii=False)
    return f"{CANDIDATE_PROMPT}\n\n<{context.tag}>\n{data}\n</{context.tag}>"


class AnswerGrounding(AgentMiddleware):
    """Keep only quotes found word for word in the data. An answer whose quotes
    were all made up becomes the fixed "not in their data" answer."""

    async def aafter_agent(self, state: Any, runtime: Any) -> dict[str, Any] | None:
        out = state.get("structured_response")
        if not isinstance(out, CandidateTurnOutput):
            return None
        context: AskContext = runtime.context
        quotes = verify_quotes(out.quotes, context.sections)
        answer = out.answer.strip()
        if not out.action and (
            not out.found or not answer or (out.quotes and not quotes)
        ):
            answer, quotes = NOT_IN_DATA, []
        elif (
            not context.cv_available
            and not out.action
            and "no cv" not in answer.lower()
        ):
            answer = f"No CV was sent. {answer}"
        return {
            "structured_response": out.model_copy(
                update={"answer": answer, "quotes": quotes}
            )
        }


def candidate_agent() -> Any:
    return llm.structured_agent(
        CandidateTurnOutput,
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        context_schema=AskContext,
        state_schema=GuardState,
        middleware=[
            PromptInjectionGuard(source="assistant.candidate"),
            trim_history,
            _candidate_prompt,
            AnswerGrounding(),
        ],
        max_model_calls=CANDIDATE_MODEL_CALLS,
    )


# ---- running a turn -------------------------------------------------------------


async def run_turn[T: (DraftTurnOutput, CandidateTurnOutput)](
    agent: Any,
    messages: list[dict[str, str]],
    *,
    context: Any,
    schema: type[T],
    label: str,
) -> tuple[T, dict[str, Any]]:
    """Run one turn; raise AssistantError with a short, safe message."""
    try:
        state = await llm.run_agent(
            agent,
            messages,
            context=context,
            deadline_seconds=TURN_TIMEOUT_SECONDS,
            label=label,
        )
    except HTTPException as exc:
        raise _from_http(exc) from None
    if state.get("blocked"):
        raise AssistantError("blocked", BLOCKED_MESSAGE)
    try:
        return llm.structured_result(state, schema), state
    except HTTPException:
        raise AssistantError("invalid", INVALID_MESSAGE) from None
