"""Chat models and agents. The only place that builds an LLM client (LangChain).

Groq answers first. When GEMINI_API_KEY is set, Gemini answers whenever Groq
fails or is rate limited, so the two providers' free tiers add up. Every call
is an agent (`create_agent`) with structured output, so the same middleware
(retries, fallback, guardrails, limits) wraps every model call.

Raw provider errors (model names, quotas, org ids) are logged, never shown:
callers get a short HTTPException from `map_provider_error`.
"""

from __future__ import annotations

import asyncio
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any, TypeVar

from fastapi import HTTPException, status
from langchain.agents import create_agent
from langchain.agents.middleware import (
    AgentMiddleware,
    ModelCallLimitMiddleware,
    ModelFallbackMiddleware,
    ModelRetryMiddleware,
)
from langchain.agents.structured_output import ToolStrategy
from langchain_core.exceptions import ModelError, ModelRateLimitError
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from loguru import logger
from pydantic import BaseModel, SecretStr

from app.core.config import settings
from app.infrastructures.ai.quota import (
    QuotaGuard,
    QuotaUnavailable,
    retry_delay_seconds,
)
from app.infrastructures.ai.service import short_error

SchemaT = TypeVar("SchemaT", bound=BaseModel)

AI_BUSY_MESSAGE = (
    "Our AI assistant is busy right now. Please wait a few seconds and try again."
)
AI_UNAVAILABLE_MESSAGE = (
    "Our AI assistant is temporarily unavailable. Please try again in a moment."
)
AI_INVALID_MESSAGE = "The AI service returned an invalid response. Please try again."

# Per model call. The caller's deadline bounds the whole run (retries included).
_CALL_TIMEOUT_SECONDS = 30
_RETRIES = 2
_RETRY_FIRST_DELAY_SECONDS = 1.0
_RETRY_MAX_DELAY_SECONDS = 6.0


def _status_code(exc: BaseException) -> int | None:
    for value in (
        getattr(exc, "status_code", None),
        getattr(exc, "code", None),
        getattr(getattr(exc, "response", None), "status_code", None),
    ):
        if isinstance(value, int):
            return value
    return None


def is_rate_limited(exc: BaseException) -> bool:
    """429s and Groq's 413 token caps, from either provider."""
    if isinstance(exc, ModelRateLimitError):
        return True
    text = str(exc).lower()
    return (
        _status_code(exc) in {413, 429}
        or "rate_limit_exceeded" in text
        or "tokens per minute" in text
        or "resource_exhausted" in text
    )


def is_retryable(exc: BaseException) -> bool:
    """Worth another try: rate limits, 5xx, timeouts, dropped connections, and
    Groq's server-side "tool call validation failed" (the model produced
    malformed arguments; the next sample is usually fine). Not when every model
    is out of quota for longer than a retry would wait."""
    if isinstance(exc, QuotaUnavailable):
        return exc.retry_after <= _RETRY_MAX_DELAY_SECONDS
    if isinstance(exc, ModelError):
        return exc.is_retryable
    if isinstance(exc, TimeoutError | ConnectionError) or is_rate_limited(exc):
        return True
    name = type(exc).__name__
    if any(word in name for word in ("Timeout", "Connection", "InternalServer")):
        return True
    code = _status_code(exc)
    if code is not None and code >= 500:
        return True
    return code == 400 and "tool call validation failed" in str(exc).lower()


def _retry_after_seconds(exc: BaseException) -> float | None:
    if isinstance(exc, QuotaUnavailable):
        return exc.retry_after
    return retry_delay_seconds(exc)


def ai_busy_error(retry_after: float | None = None) -> HTTPException:
    """429 with a friendly message (and Retry-After when known)."""
    headers = {"Retry-After": str(max(1, round(retry_after)))} if retry_after else None
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=AI_BUSY_MESSAGE,
        headers=headers,
    )


def map_provider_error(exc: BaseException) -> HTTPException:
    """Any provider or agent failure as a short, safe HTTP error."""
    if isinstance(exc, HTTPException):
        return exc
    if is_rate_limited(exc):
        return ai_busy_error(_retry_after_seconds(exc))
    if isinstance(exc, TimeoutError):
        return HTTPException(status.HTTP_504_GATEWAY_TIMEOUT, AI_UNAVAILABLE_MESSAGE)
    return HTTPException(status.HTTP_502_BAD_GATEWAY, AI_UNAVAILABLE_MESSAGE)


# ---- models ---------------------------------------------------------------------


def groq_model(
    *, small: bool = False, temperature: float = 0.0, max_tokens: int = 2000
) -> BaseChatModel:
    name = settings.groq_small_model if small else settings.groq_model
    extra: dict[str, Any] = {}
    if name.startswith("openai/gpt-oss"):
        # Reasoning models: keep thinking short so it can't eat the token budget.
        extra["reasoning_effort"] = "low"
    return ChatGroq(
        model=name,
        api_key=SecretStr(settings.groq_api_key),
        temperature=temperature,
        max_tokens=max_tokens,
        # Retries belong to ModelRetryMiddleware, so waits stay bounded.
        max_retries=0,
        timeout=_CALL_TIMEOUT_SECONDS,
        **extra,
    )


def gemini_model(
    *, temperature: float = 0.0, max_tokens: int = 2000
) -> BaseChatModel | None:
    if not settings.gemini_api_key:
        return None
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=SecretStr(settings.gemini_api_key),
        temperature=temperature,
        max_output_tokens=max_tokens,
        max_retries=0,
        timeout=_CALL_TIMEOUT_SECONDS,
    )


def resilience(
    *, fallback: bool = True, temperature: float = 0.0, max_tokens: int = 2000
) -> list[AgentMiddleware]:
    """Retry outermost, then fallback, then the quota guard (innermost, so it
    sees whichever model is actually called). A Groq call that is rate limited,
    or would be, goes to Gemini at once; only when both fail do we back off."""
    middleware: list[AgentMiddleware] = [
        ModelRetryMiddleware(
            max_retries=_RETRIES,
            retry_on=is_retryable,
            on_failure="error",
            initial_delay=_RETRY_FIRST_DELAY_SECONDS,
            max_delay=_RETRY_MAX_DELAY_SECONDS,
        )
    ]
    backup = gemini_model(temperature=temperature, max_tokens=max_tokens)
    if fallback and backup is not None:
        middleware.append(ModelFallbackMiddleware(backup))
    middleware.append(QuotaGuard())
    return middleware


# ---- agents ---------------------------------------------------------------------


@dataclass(slots=True)
class Usage:
    """Tokens of every model call in one run; `model` is the one that answered."""

    model: str
    tokens_in: int = 0
    tokens_out: int = 0
    cached_tokens: int = 0


def usage_of(messages: Sequence[BaseMessage], default_model: str) -> Usage:
    usage = Usage(default_model)
    for message in messages:
        if not isinstance(message, AIMessage):
            continue
        meta = message.usage_metadata or {}
        usage.tokens_in += int(meta.get("input_tokens") or 0)
        usage.tokens_out += int(meta.get("output_tokens") or 0)
        details = meta.get("input_token_details") or {}
        usage.cached_tokens += int(details.get("cache_read") or 0)
        name = (message.response_metadata or {}).get("model_name")
        if name:
            usage.model = name
    return usage


def structured_agent(
    schema: type[BaseModel],
    *,
    system_prompt: str | None = None,
    model: BaseChatModel | None = None,
    tools: Sequence[Any] = (),
    middleware: Sequence[AgentMiddleware] = (),
    fallback: bool = True,
    small: bool = False,
    temperature: float = 0.0,
    max_tokens: int = 2000,
    max_model_calls: int = 3,
    **kwargs: Any,
) -> Any:
    """An agent whose answer is `schema`, returned as a tool call.

    Tool-call structured output works the same on Groq and Gemini and next to
    real tools (Groq refuses JSON mode together with tools). Invalid output is
    sent back to the model to fix (ToolStrategy's default), within
    `max_model_calls`, so a model that keeps getting it wrong can't loop.
    """
    return create_agent(
        model=model
        or groq_model(small=small, temperature=temperature, max_tokens=max_tokens),
        tools=list(tools),
        system_prompt=system_prompt,
        response_format=ToolStrategy(schema),
        middleware=[
            *middleware,
            ModelCallLimitMiddleware(run_limit=max_model_calls, exit_behavior="end"),
            *resilience(
                fallback=fallback and model is None,
                temperature=temperature,
                max_tokens=max_tokens,
            ),
        ],
        **kwargs,
    )


async def run_agent(
    agent: Any,
    messages: list[Any],
    *,
    deadline_seconds: float,
    context: Any = None,
    label: str,
) -> dict[str, Any]:
    """Run an agent to the end within a hard deadline (retries included).

    Raises a friendly HTTPException on any provider failure.
    """
    try:
        async with asyncio.timeout(deadline_seconds):
            return await agent.ainvoke({"messages": messages}, context=context)
    except HTTPException:
        raise
    except TimeoutError:
        logger.warning("{} timed out after {}s", label, deadline_seconds)
        raise map_provider_error(TimeoutError()) from None
    except Exception as exc:
        logger.warning("{} failed: {}", label, short_error(exc))
        raise map_provider_error(exc) from exc


def structured_result(state: dict[str, Any], schema: type[SchemaT]) -> SchemaT:
    """The run's validated answer, or a 502 when the model never gave one."""
    value = state.get("structured_response")
    if isinstance(value, schema):
        return value
    if isinstance(value, dict):
        try:
            return schema.model_validate(value)
        except ValueError:
            pass
    errors = [
        str(m.content)[:300]
        for m in state.get("messages", [])
        if getattr(m, "type", None) == "tool"
        and getattr(m, "name", None) == schema.__name__
    ]
    logger.error(
        "Agent returned no valid {}; last error: {}",
        schema.__name__,
        errors[-1] if errors else "none (call limit or no answer)",
    )
    raise HTTPException(status.HTTP_502_BAD_GATEWAY, AI_INVALID_MESSAGE)


async def generate_structured(
    system_prompt: str,
    user_message: str,
    schema: type[SchemaT],
    *,
    small: bool = False,
    model: BaseChatModel | None = None,
    middleware: Sequence[AgentMiddleware] = (),
    temperature: float = 0.0,
    max_tokens: int = 2000,
    deadline_seconds: float = 45.0,
    label: str | None = None,
) -> tuple[SchemaT, Usage]:
    """One structured answer from a tool-less agent, plus token usage."""
    agent = structured_agent(
        schema,
        system_prompt=system_prompt,
        model=model,
        middleware=middleware,
        small=small,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    state = await run_agent(
        agent,
        [{"role": "user", "content": user_message}],
        deadline_seconds=deadline_seconds,
        label=label or schema.__name__,
    )
    default_model = (
        getattr(model, "model_id", None) or getattr(model, "model_name", None)
        if model is not None
        else (settings.groq_small_model if small else settings.groq_model)
    )
    return structured_result(state, schema), usage_of(
        state.get("messages", []), str(default_model)
    )
