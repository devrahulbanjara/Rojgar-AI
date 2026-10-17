from __future__ import annotations

import asyncio
import hashlib
import json
import random
from array import array
from collections import OrderedDict
from collections.abc import AsyncIterator
from copy import deepcopy
from typing import TYPE_CHECKING, Any, Type, TypeVar

from fastapi import HTTPException, status
from groq import APIStatusError, AsyncGroq, BadRequestError
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from loguru import logger
from pydantic import BaseModel, SecretStr

from app.core.config import settings

SchemaT = TypeVar("SchemaT", bound=BaseModel)

# User-facing messages. Raw provider errors (model names, TPM quotas, org ids)
# are logged, never shown to users.
AI_BUSY_MESSAGE = (
    "Our AI assistant is busy right now. Please wait a few seconds and try again."
)
AI_UNAVAILABLE_MESSAGE = (
    "Our AI assistant is temporarily unavailable. Please try again in a moment."
)
# Upper bound on time spent waiting between retries for one call, so a user
# never waits ~80s for an answer that will fail anyway.
_RETRY_WAIT_BUDGET_SECONDS = 12.0
_MAX_SINGLE_RETRY_WAIT_SECONDS = 6.0
# In-process embedding cache entries (float32, ~12 KB each at 3072 dims).
_EMBEDDING_LRU_SIZE = 256


def _retry_after_seconds(exc: Exception) -> float | None:
    """Read the provider's Retry-After hint (seconds) from an API error."""
    response = getattr(exc, "response", None)
    headers = getattr(response, "headers", None)
    if not headers:
        return None
    value = headers.get("retry-after")
    try:
        return float(value) if value is not None else None
    except ValueError:
        return None


def ai_busy_error(retry_after: float | None = None) -> HTTPException:
    """429 with a friendly message (and Retry-After when known)."""
    headers = {"Retry-After": str(max(1, round(retry_after)))} if retry_after else None
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=AI_BUSY_MESSAGE,
        headers=headers,
    )


def map_provider_error(exc: Exception) -> HTTPException:
    """Translate any Groq/LangChain provider exception into a friendly HTTP error."""
    if isinstance(exc, HTTPException):
        return exc
    if _is_groq_rate_limit(exc):
        return ai_busy_error(_retry_after_seconds(exc))
    if isinstance(exc, TimeoutError):
        return HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=AI_UNAVAILABLE_MESSAGE
        )
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY, detail=AI_UNAVAILABLE_MESSAGE
    )


if TYPE_CHECKING:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings


class _FakeEmbeddings:
    """Deterministic offline embeddings used in tests/CI when no API key is set."""

    def __init__(self, dim: int) -> None:
        self._dim = dim

    def _vector(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        return [digest[i % len(digest)] / 255.0 for i in range(self._dim)]

    async def aembed_query(self, text: str) -> list[float]:
        return self._vector(text)


def _walk_groq_strict_schema(node: Any) -> None:
    """Mutate a JSON schema tree in-place to satisfy Groq strict mode."""
    if isinstance(node, list):
        for item in node:
            _walk_groq_strict_schema(item)
        return

    if not isinstance(node, dict):
        return

    properties = node.get("properties")
    if isinstance(properties, dict):
        # Groq strict json_schema expects every declared property to appear in required.
        node["required"] = list(properties.keys())
        node["additionalProperties"] = False
        for value in properties.values():
            _walk_groq_strict_schema(value)

    for key in ("$defs", "definitions"):
        definitions = node.get(key)
        if isinstance(definitions, dict):
            for value in definitions.values():
                _walk_groq_strict_schema(value)

    for key in ("items", "additionalProperties", "not"):
        value = node.get(key)
        if isinstance(value, (dict, list)):
            _walk_groq_strict_schema(value)

    for key in ("anyOf", "allOf", "oneOf", "prefixItems"):
        value = node.get(key)
        if isinstance(value, list):
            _walk_groq_strict_schema(value)


def _to_groq_strict_json_schema(schema_model: Type[SchemaT]) -> dict[str, Any]:
    """Return a Groq-compatible strict JSON schema for a Pydantic model."""
    schema = deepcopy(schema_model.model_json_schema())
    _walk_groq_strict_schema(schema)
    return schema


def _extract_groq_error_message(exc: Exception) -> str:
    """Extract a human-readable error message from a Groq exception."""
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        error = body.get("error")
        if isinstance(error, dict):
            message = error.get("message")
            if isinstance(message, str) and message.strip():
                return message

    return str(exc)


def _is_groq_rate_limit(exc: Exception) -> bool:
    """Return True when a Groq error indicates throttling or token-cap exhaustion."""
    status_code = getattr(exc, "status_code", None)
    body = getattr(exc, "body", None)
    code = None
    message = _extract_groq_error_message(exc).lower()

    if isinstance(body, dict):
        error = body.get("error")
        if isinstance(error, dict):
            code = error.get("code")

    return (
        status_code in {413, 429}
        or code == "rate_limit_exceeded"
        or "tokens per minute" in message
    )


class AIService:
    """
    Encapsulates all AI/LLM/embedding third-party infrastructures.

    This is the ONLY place where vendor-specific SDKs (Groq, OpenAI, Gemini, etc.)
    should be imported. Swap providers here without touching business logic.
    """

    def __init__(self) -> None:
        self._embeddings: GoogleGenerativeAIEmbeddings | _FakeEmbeddings | None = None
        self._embedding_lru: OrderedDict[str, array] = OrderedDict()
        self._embedding_inflight: dict[str, asyncio.Future] = {}

        # LLM provider (currently Groq, easily swappable to OpenAI)
        # SDK retries off: `_create_with_retries` owns retry/backoff so waits are
        # bounded and honour Retry-After (SDK + our retries stacked to ~80s).
        self._llm_client = AsyncGroq(
            api_key=settings.groq_api_key, max_retries=0, timeout=60
        )
        self._llm_model = settings.groq_model_job_drafting

    def _get_embeddings_client(self) -> GoogleGenerativeAIEmbeddings | _FakeEmbeddings:
        """Lazily initialise and return the Gemini embeddings client."""
        if self._embeddings is None:
            api_key = settings.google_api_key
            if settings.environment == "test" or not api_key or api_key == "unused":
                self._embeddings = _FakeEmbeddings(
                    dim=settings.embedding_output_dimensionality
                )
                return self._embeddings

            from langchain_google_genai import GoogleGenerativeAIEmbeddings

            self._embeddings = GoogleGenerativeAIEmbeddings(
                model=settings.embedding_model,
                api_key=SecretStr(api_key),
            )

        return self._embeddings

    async def get_embeddings(self, text: str) -> list[float]:
        """Return a float vector for the given text using the configured provider.

        Cached in Redis (1 hour) and in a small in-process LRU, so the same
        text is embedded once even when Redis is off. Concurrent requests for
        the same uncached text share one provider call.
        """
        from app.infrastructures.redis.service import redis_service

        digest = hashlib.sha256(text.encode()).hexdigest()[:32]
        local = self._embedding_lru.get(digest)
        if local is not None:
            self._embedding_lru.move_to_end(digest)
            return local.tolist()

        cache_key = f"embedding:{digest}"
        cached = await redis_service.get(cache_key)
        if cached is not None:
            vector = json.loads(cached)
            self._remember_embedding(digest, vector)
            return vector

        pending = self._embedding_inflight.get(digest)
        if pending is not None:
            return list(await asyncio.shield(pending))

        future: asyncio.Future = asyncio.get_running_loop().create_future()
        self._embedding_inflight[digest] = future
        try:
            vector = await self._get_embeddings_client().aembed_query(text)
        except Exception as exc:
            future.set_exception(exc)
            future.exception()  # waiters re-raise it; no "never retrieved" noise
            raise
        else:
            future.set_result(vector)
        finally:
            self._embedding_inflight.pop(digest, None)
            if not future.done():  # caller was cancelled mid-call
                future.cancel()

        self._remember_embedding(digest, vector)
        await redis_service.set(cache_key, json.dumps(vector), ttl_seconds=3600)
        return vector

    def _remember_embedding(self, digest: str, vector: list[float]) -> None:
        """Keep a float32 copy in the in-process LRU (about 12 KB per vector)."""
        self._embedding_lru[digest] = array("f", vector)
        self._embedding_lru.move_to_end(digest)
        while len(self._embedding_lru) > _EMBEDDING_LRU_SIZE:
            self._embedding_lru.popitem(last=False)

    def _build_chat_model(
        self,
        *,
        model: str | None = None,
        temperature: float = 0.0,
    ) -> ChatGroq:
        """Create a ChatGroq client configured for plain-text streaming."""
        return ChatGroq(
            model=model or settings.groq_model_recruiter_chat,
            temperature=temperature,
            api_key=SecretStr(settings.groq_api_key),
            max_tokens=4096,
            # SDK retry honours Retry-After on 429; keep it short for chat.
            max_retries=1,
            timeout=60,
        )

    async def generate_structured(
        self,
        system_prompt: str,
        user_payload: dict[str, Any],
        schema_model: Type[SchemaT],
        model: str | None = None,
        temperature: float | None = None,
    ) -> SchemaT:
        """
        Generate structured JSON output conforming to a Pydantic schema.

        This is the unified way to get typed responses from an LLM.
        If you switch to OpenAI, only the implementation below changes.

        Args:
            system_prompt: Instructions for the LLM
            user_payload: Input data as a dictionary
            schema_model: Pydantic model defining the expected output structure

        Returns:
            Validated instance of schema_model
        """
        schema = _to_groq_strict_json_schema(schema_model)

        # Groq-specific implementation (swap this block for OpenAI/Anthropic)
        request_kwargs: dict[str, Any] = dict(
            model=model or self._llm_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"{system_prompt.strip()}\n\n"
                        "Output requirements:\n"
                        "- Return exactly one JSON object matching the schema.\n"
                        "- Do not wrap the result in another object.\n"
                        "- Do not echo the input payload.\n"
                        "- Do not include prose, markdown, or explanations."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(user_payload, ensure_ascii=False),
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": schema_model.__name__,
                    "strict": True,
                    "schema": schema,
                },
            },
            max_tokens=4096,
        )
        # Structured calls drive scores and decisions: default to deterministic.
        request_kwargs["temperature"] = 0.0 if temperature is None else temperature

        response = await self._create_with_retries(request_kwargs)

        choice = response.choices[0]
        if getattr(choice, "finish_reason", None) == "length":
            logger.error(
                "Groq structured output for {} hit the token limit",
                schema_model.__name__,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI response was cut off. Please try again.",
            )
        content = choice.message.content
        if content is None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI service returned an empty response.",
            )
        try:
            return schema_model.model_validate(json.loads(content))
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error(
                "Groq structured output for {} failed validation: {}",
                schema_model.__name__,
                type(exc).__name__,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI service returned an invalid response. Please try again.",
            ) from exc

    async def _create_with_retries(self, request_kwargs: dict[str, Any]) -> Any:
        """Call Groq with bounded retries on transient errors.

        Rate limits (429/413 token caps), 5xx and timeouts are retried up to 3
        attempts, waiting the provider's Retry-After (capped) or exponential
        backoff, within a total wait budget. Final failures surface as friendly
        HTTP errors; raw provider messages are only logged.
        """
        attempts = 3
        waited = 0.0
        for attempt in range(1, attempts + 1):
            retry_after: float | None = None
            try:
                async with asyncio.timeout(60):
                    return await self._llm_client.chat.completions.create(
                        **request_kwargs
                    )
            except TimeoutError as exc:
                last_exc: Exception = exc
                logger.warning("Groq call timed out (attempt {})", attempt)
            except (APIStatusError, BadRequestError) as exc:
                last_exc = exc
                status_code = getattr(exc, "status_code", None) or 0
                rate_limited = _is_groq_rate_limit(exc)
                logger.warning(
                    "Groq call failed (attempt {}, status {}): {}",
                    attempt,
                    status_code,
                    _extract_groq_error_message(exc),
                )
                if not (rate_limited or status_code >= 500):
                    raise map_provider_error(exc) from exc
                retry_after = _retry_after_seconds(exc)

            delay = min(
                retry_after
                if retry_after is not None
                else (2 ** (attempt - 1)) + random.uniform(0, 0.5),
                _MAX_SINGLE_RETRY_WAIT_SECONDS,
            )
            if attempt == attempts or waited + delay > _RETRY_WAIT_BUDGET_SECONDS:
                break
            waited += delay
            await asyncio.sleep(delay)
        raise map_provider_error(last_exc) from last_exc

    async def stream_text(
        self,
        *,
        system_prompt: str,
        user_payload: dict[str, Any],
        model: str | None = None,
        temperature: float = 0.0,
    ) -> AsyncIterator[str]:
        """Stream plain-text output from the configured chat model."""
        llm = self._build_chat_model(model=model, temperature=temperature)
        messages = [
            SystemMessage(content=system_prompt.strip()),
            HumanMessage(content=json.dumps(user_payload, ensure_ascii=False)),
        ]

        try:
            async with asyncio.timeout(60):
                async for chunk in llm.astream(messages):
                    content = getattr(chunk, "content", None)
                    if isinstance(content, str) and content:
                        yield content
        except TimeoutError:
            # Fail loudly: returning here made callers treat a partial answer
            # (e.g. a half-written interview evaluation) as complete.
            logger.error("Groq streaming timed out after 60s")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="The AI response timed out before it finished. Please try again.",
            ) from None
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning(
                "Groq streaming failed: {}: {}",
                type(exc).__name__,
                _extract_groq_error_message(exc),
            )
            raise map_provider_error(exc) from exc


ai_service = AIService()
