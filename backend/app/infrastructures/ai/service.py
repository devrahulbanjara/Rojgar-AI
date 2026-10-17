from __future__ import annotations

import asyncio
import hashlib
import json
import os
import random
import threading
from array import array
from collections import OrderedDict
from collections.abc import AsyncIterator
from copy import deepcopy
from typing import Any, Literal, Protocol, TypeVar

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
# In-process embedding cache entries (float32, 1.5 KB each at 384 dims).
_EMBEDDING_LRU_SIZE = 1024
# Texts per ONNX run when many are embedded at once (reindex, batches).
_EMBEDDING_BATCH_SIZE = 16

# Local multilingual embedding model (Hugging Face, ONNX, CPU; no API, no quota).
# multilingual-e5-small covers ~100 languages including Nepali, and maps English,
# Devanagari Nepali and romanized Nepali with the same meaning close together.
# Xenova's int8 export: 118 MB, same quality as fp32 at a third of the RAM.
EMBEDDING_MODEL = "Xenova/multilingual-e5-small"
EMBEDDING_MODEL_FILE = "onnx/model_quantized.onnx"
EMBEDDING_DIM = 384
# e5 was trained with these prefixes; leaving them out hurts retrieval.
_E5_PREFIX = {"query": "query: ", "passage": "passage: "}

EmbeddingKind = Literal["query", "passage"]


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


class _EmbeddingClient(Protocol):
    def embed(self, texts: list[str], kind: EmbeddingKind) -> list[list[float]]: ...


class _FakeEmbeddings:
    """Deterministic offline embeddings for tests (ENVIRONMENT=test)."""

    def __init__(self, dim: int) -> None:
        self._dim = dim

    def _vector(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        return [digest[i % len(digest)] / 255.0 for i in range(self._dim)]

    def embed(self, texts: list[str], kind: EmbeddingKind) -> list[list[float]]:
        return [self._vector(text) for text in texts]


class _LocalEmbeddings:
    """fastembed (ONNX Runtime) on CPU. Sync and CPU-bound: call from a thread.

    The model downloads from Hugging Face on first use (then cached on disk)
    and loads once per process; the lock keeps two threads from loading it
    twice.
    """

    def __init__(self) -> None:
        self._model: Any | None = None
        self._lock = threading.Lock()

    def _get_model(self) -> Any:
        with self._lock:
            if self._model is None:
                from fastembed import TextEmbedding
                from fastembed.common.model_description import (
                    ModelSource,
                    PoolingType,
                )

                if EMBEDDING_MODEL not in {
                    m["model"] for m in TextEmbedding.list_supported_models()
                }:
                    TextEmbedding.add_custom_model(
                        model=EMBEDDING_MODEL,
                        pooling=PoolingType.MEAN,
                        normalization=True,
                        sources=ModelSource(hf=EMBEDDING_MODEL),
                        dim=EMBEDDING_DIM,
                        model_file=EMBEDDING_MODEL_FILE,
                    )
                self._model = TextEmbedding(
                    model_name=EMBEDDING_MODEL,
                    cache_dir=os.path.expanduser(settings.model_cache_dir),
                    threads=settings.embedding_threads,
                )
                logger.info("Embedding model {} loaded", EMBEDDING_MODEL)
        return self._model

    def embed(self, texts: list[str], kind: EmbeddingKind) -> list[list[float]]:
        model = self._get_model()
        prefixed = [_E5_PREFIX[kind] + text for text in texts]
        return [
            vector.tolist()
            for vector in model.embed(prefixed, batch_size=_EMBEDDING_BATCH_SIZE)
        ]


class EmbeddingError(Exception):
    """Embedding failed (model missing, download failed). Message is short."""


def short_error(exc: Exception) -> str:
    """One log-friendly line: the type and the first line of the message."""
    lines = str(exc).strip().splitlines()
    return f"{type(exc).__name__}: {lines[0][:160]}" if lines else type(exc).__name__


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


def _to_groq_strict_json_schema(schema_model: type[SchemaT]) -> dict[str, Any]:
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

    This is the ONLY place where vendor-specific SDKs (Groq, fastembed, etc.)
    should be imported. Swap providers here without touching business logic.
    """

    def __init__(self) -> None:
        self._embeddings: _EmbeddingClient | None = None
        self._embedding_lru: OrderedDict[str, array] = OrderedDict()
        self._embedding_inflight: dict[str, asyncio.Future] = {}
        # One ONNX run at a time: each already uses `embedding_threads` cores,
        # so parallel runs would only fight for the CPU.
        self._embedding_slots = asyncio.Semaphore(1)

        # LLM provider (currently Groq, easily swappable to OpenAI)
        # SDK retries off: `_create_with_retries` owns retry/backoff so waits are
        # bounded and honour Retry-After (SDK + our retries stacked to ~80s).
        self._llm_client = AsyncGroq(
            api_key=settings.groq_api_key, max_retries=0, timeout=60
        )
        self._llm_model = settings.groq_model_structured

    @property
    def embedding_dim(self) -> int:
        """Vector size of the embedding model (Qdrant collections use it)."""
        return EMBEDDING_DIM

    def _get_embeddings_client(self) -> _EmbeddingClient:
        if self._embeddings is None:
            self._embeddings = (
                _FakeEmbeddings(EMBEDDING_DIM)
                if settings.environment == "test"
                else _LocalEmbeddings()
            )
        return self._embeddings

    def preload_embeddings(self) -> None:
        """Download/load the model now (sync; run in a thread at startup)."""
        client = self._get_embeddings_client()
        if isinstance(client, _LocalEmbeddings):
            client._get_model()

    async def _run_embed(
        self, texts: list[str], kind: EmbeddingKind
    ) -> list[list[float]]:
        client = self._get_embeddings_client()
        async with self._embedding_slots:
            try:
                return await asyncio.to_thread(client.embed, texts, kind)
            except Exception as exc:
                raise EmbeddingError(short_error(exc)) from None

    @staticmethod
    def _digest(text: str, kind: EmbeddingKind) -> str:
        key = f"{EMBEDDING_MODEL}|{kind}|{text}"
        return hashlib.sha256(key.encode()).hexdigest()[:32]

    async def _cached(self, digest: str) -> list[float] | None:
        from app.infrastructures.redis.service import redis_service

        local = self._embedding_lru.get(digest)
        if local is not None:
            self._embedding_lru.move_to_end(digest)
            return local.tolist()
        cached = await redis_service.get(f"embedding:{digest}")
        if cached is None:
            return None
        vector = json.loads(cached)
        self._remember_embedding(digest, vector)
        return vector

    async def _store(self, digest: str, vector: list[float]) -> None:
        from app.infrastructures.redis.service import redis_service

        self._remember_embedding(digest, vector)
        await redis_service.set(
            f"embedding:{digest}", json.dumps(vector), ttl_seconds=3600
        )

    async def embed(self, text: str, kind: EmbeddingKind = "passage") -> list[float]:
        """Vector for one text. Raises `EmbeddingError` on failure.

        Cached in Redis (1 hour) and in a small in-process LRU, so the same
        text is embedded once even when Redis is off. Concurrent requests for
        the same uncached text share one model run.
        """
        digest = self._digest(text, kind)
        cached = await self._cached(digest)
        if cached is not None:
            return cached

        pending = self._embedding_inflight.get(digest)
        if pending is not None:
            return list(await asyncio.shield(pending))

        future: asyncio.Future = asyncio.get_running_loop().create_future()
        self._embedding_inflight[digest] = future
        try:
            vector = (await self._run_embed([text], kind))[0]
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

        await self._store(digest, vector)
        return vector

    async def embed_many(
        self, texts: list[str], kind: EmbeddingKind = "passage"
    ) -> list[list[float]]:
        """Vectors for many texts in batched model runs (cache-aware)."""
        digests = [self._digest(text, kind) for text in texts]
        vectors: list[list[float] | None] = [await self._cached(d) for d in digests]
        missing = [i for i, v in enumerate(vectors) if v is None]
        if missing:
            fresh = await self._run_embed([texts[i] for i in missing], kind)
            for i, vector in zip(missing, fresh, strict=True):
                vectors[i] = vector
                await self._store(digests[i], vector)
        return [v for v in vectors if v is not None]

    async def embed_query(self, text: str) -> list[float]:
        """Vector for a search query (e5 'query:' side). Raises on failure."""
        return await self.embed(text, "query")

    async def get_embeddings(self, text: str) -> list[float] | None:
        """Best-effort document vector: None (one warning line) on failure.

        For callers where a missing vector must never fail the request
        (saving a job, storing a CV); the sync worker fills gaps later.
        """
        try:
            return await self.embed(text, "passage")
        except Exception as exc:
            logger.warning("Embedding unavailable, saved without it: {}", exc)
            return None

    def _remember_embedding(self, digest: str, vector: list[float]) -> None:
        """Keep a float32 copy in the in-process LRU."""
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
            model=model or settings.groq_model_chat,
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
        schema_model: type[SchemaT],
        model: str | None = None,
        temperature: float | None = None,
    ) -> SchemaT:
        """Structured output only; see `generate_structured_with_usage`."""
        result, _usage = await self.generate_structured_with_usage(
            system_prompt, user_payload, schema_model, model, temperature
        )
        return result

    async def generate_structured_with_usage(
        self,
        system_prompt: str,
        user_payload: dict[str, Any] | str,
        schema_model: type[SchemaT],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int = 4096,
    ) -> tuple[SchemaT, dict[str, Any]]:
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
                    "content": user_payload
                    if isinstance(user_payload, str)
                    else json.dumps(user_payload, ensure_ascii=False),
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
            max_tokens=max_tokens,
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
        raw_usage = getattr(response, "usage", None)
        details = getattr(raw_usage, "prompt_tokens_details", None)
        usage = {
            "model": request_kwargs["model"],
            "tokens_in": int(getattr(raw_usage, "prompt_tokens", 0) or 0),
            "tokens_out": int(getattr(raw_usage, "completion_tokens", 0) or 0),
            "cached_tokens": int(getattr(details, "cached_tokens", 0) or 0),
        }
        try:
            return schema_model.model_validate(json.loads(content)), usage
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
