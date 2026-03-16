import json
from typing import Any, Type, TypeVar

from fastapi import HTTPException, status
from groq import APIStatusError, AsyncGroq, BadRequestError
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from loguru import logger
from pydantic import BaseModel

from app.core.config import settings


SchemaT = TypeVar("SchemaT", bound=BaseModel)


def _extract_groq_error_message(exc: Exception) -> str:
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        error = body.get("error")
        if isinstance(error, dict):
            message = error.get("message")
            if isinstance(message, str) and message.strip():
                return message

    return str(exc)


def _is_groq_rate_limit(exc: Exception) -> bool:
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
        # Embeddings provider (currently Google Gemini)
        self._embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.google_api_key,
        )

        # LLM provider (currently Groq, easily swappable to OpenAI)
        self._llm_client = AsyncGroq(api_key=settings.groq_api_key)
        self._llm_model = settings.groq_model_job_drafting

    async def get_embeddings(self, text: str) -> list[float]:
        """Return a float vector for the given text using the configured provider."""
        return await self._embeddings.aembed_query(text)

    async def generate_structured(
        self,
        system_prompt: str,
        user_payload: dict[str, Any],
        schema_model: Type[SchemaT],
        model: str | None = None,
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
        schema = schema_model.model_json_schema()

        # Groq-specific implementation (swap this block for OpenAI/Anthropic)
        try:
            response = await self._llm_client.chat.completions.create(
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
            )
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
        data = json.loads(content)
        return schema_model.model_validate(data)


ai_service = AIService()
