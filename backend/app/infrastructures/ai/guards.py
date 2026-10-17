"""Guardrail middleware shared by the agents.

- `PromptInjectionGuard` (before the agent): the user's message goes through
  the injection check (marker scan + classifier). A slow classifier falls back
  to the marker scan, so it can never stretch a turn past a few seconds.
- `pii_redaction()`: emails, links, IP addresses and phone numbers are replaced
  before the model sees the text. A second net under the blind-review redaction.
- `trim_history`: keeps the conversation the model sees short (short-term memory
  lives in our own `assistant_threads` table, so it is deleted with the rest of
  an applicant's data).
"""

from __future__ import annotations

import asyncio
from typing import Any, NotRequired

from langchain.agents.middleware import (
    AgentMiddleware,
    AgentState,
    PIIMiddleware,
    before_model,
    hook_config,
)
from langchain_core.messages import HumanMessage, RemoveMessage, trim_messages
from langchain_core.messages.utils import count_tokens_approximately
from langgraph.graph.message import REMOVE_ALL_MESSAGES
from loguru import logger

from app.infrastructures.guardrails.service import (
    guardrails_service,
    heuristic_injection_signal,
)

# Nepal mobiles (98/97/96 + 8 digits, optional +977) and landlines (01-4xxxxxx).
NEPAL_PHONE = r"(?:\+?977[\s-]?)?9[678]\d{8}\b|\b0\d{1,2}[\s-]?\d{6,7}\b"
# Tokens of history the model sees per turn (system prompt not included).
HISTORY_TOKENS = 6000
# Longest wait for the injection check before falling back to the marker scan.
GUARD_TIMEOUT_SECONDS = 6.0


class GuardState(AgentState):
    blocked: NotRequired[str]


def _latest_human_text(state: dict[str, Any]) -> str:
    for message in reversed(state.get("messages", [])):
        if isinstance(message, HumanMessage):
            content = message.content
            return content if isinstance(content, str) else str(content)
    return ""


class PromptInjectionGuard(AgentMiddleware):
    """Stops the run before any model call when the newest message is an
    injection attempt. The caller reads `state["blocked"]`."""

    state_schema = GuardState

    def __init__(self, *, source: str) -> None:
        super().__init__()
        self.source = source

    @hook_config(can_jump_to=["end"])
    async def abefore_agent(self, state: Any, runtime: Any) -> dict[str, Any] | None:
        text = _latest_human_text(state)
        if not text:
            return None
        try:
            verdict = await asyncio.wait_for(
                guardrails_service.check_input(text, source=self.source),
                GUARD_TIMEOUT_SECONDS,
            )
            reason = None if verdict.safe else verdict.reason or "Unsafe input."
        except TimeoutError:
            logger.warning("Injection check timed out for {}", self.source)
            reason = heuristic_injection_signal(text)
        if reason is None:
            return None
        return {"blocked": reason, "jump_to": "end"}


def pii_redaction() -> list[AgentMiddleware]:
    return [
        PIIMiddleware("email", strategy="redact"),
        PIIMiddleware("url", strategy="redact"),
        PIIMiddleware("ip", strategy="redact"),
        PIIMiddleware("phone", detector=NEPAL_PHONE, strategy="redact"),
    ]


@before_model
def trim_history(state: AgentState, runtime: Any) -> dict[str, Any] | None:
    """Keep the newest messages within HISTORY_TOKENS, starting on a user turn."""
    messages = state["messages"]
    kept = trim_messages(
        messages,
        max_tokens=HISTORY_TOKENS,
        token_counter=count_tokens_approximately,
        strategy="last",
        start_on="human",
    )
    if len(kept) == len(messages):
        return None
    return {"messages": [RemoveMessage(id=REMOVE_ALL_MESSAGES), *kept]}
