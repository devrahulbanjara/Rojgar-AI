from __future__ import annotations

import asyncio
import hashlib
import json
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

        # LLM provider (currently Groq, easily swappable to OpenAI)
        self._llm_client = AsyncGroq(api_key=settings.groq_api_key)
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

        Results are cached in Redis keyed by a hash of the input text.
        Cache TTL is 1 hour — covers repeated searches within a session
        while keeping embeddings fresh as profiles / queries change.
        """
        from app.infrastructures.redis.service import redis_service

        cache_key = f"embedding:{hashlib.sha256(text.encode()).hexdigest()[:16]}"
        cached = await redis_service.get(cache_key)
        if cached is not None:
            return json.loads(cached)

        embeddings_client = self._get_embeddings_client()
        vector = await embeddings_client.aembed_query(text)

        await redis_service.set(cache_key, json.dumps(vector), ttl_seconds=3600)
        return vector

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
        if temperature is not None:
            request_kwargs["temperature"] = temperature

        try:
            async with asyncio.timeout(120):
                response = await self._llm_client.chat.completions.create(
                    **request_kwargs
                )
        except TimeoutError:
            logger.error("Groq structured generation timed out after 120s")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="The AI service did not respond in time. Please try again.",
            ) from None
        except (APIStatusError, BadRequestError) as exc:
            message = _extract_groq_error_message(exc)
            if _is_groq_rate_limit(exc):
                logger.error("Groq rate limit/token cap hit: {}", message)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=message,
                ) from exc

            logger.error("Groq structured generation failed: {}", message)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=message,
            ) from exc

        content = response.choices[0].message.content
        if content is None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI service returned an empty response.",
            )
        data = json.loads(content)
        return schema_model.model_validate(data)

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
            logger.error("Groq streaming timed out after 60s")
            return


ai_service = AIService()
