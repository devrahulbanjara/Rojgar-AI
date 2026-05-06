from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, status
from langchain_core.runnables import RunnableLambda
from langchain_groq import ChatGroq
from loguru import logger
from nemoguardrails import RailsConfig
from nemoguardrails.integrations.langchain.runnable_rails import RunnableRails
from nemoguardrails.llm.providers import register_chat_provider

from app.core.config import settings

# Sentinel returned by the passthrough runnable when input rails do not block.
# Anything else in the rails output means the input rail short-circuited with
# a refusal message — i.e., a prompt-injection attempt.
_SAFE_SENTINEL = "__guardrails_input_safe__"

# Path to the shared NeMo Guardrails config (config.yml + input.co + prompts.yml).
_GUARDRAILS_CONFIG_DIR = Path(__file__).resolve().parents[3] / "guardrails_config"


@dataclass(slots=True)
class GuardrailResult:
    """Verdict for a single input check against the prompt-injection rail."""

    safe: bool
    source: str
    refusal_message: str | None = None


class PromptInjectionDetected(HTTPException):
    """Raised when a user-supplied input is blocked by the input rail."""

    def __init__(self, source: str, refusal_message: str | None = None) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "prompt_injection_detected",
                "source": source,
                "message": (refusal_message or "Input rejected by safety policy."),
            },
        )
        self.source = source
        self.refusal_message = refusal_message


class GuardrailsService:
    """Singleton wrapper around NeMo Guardrails self_check_input rail."""

    def __init__(self) -> None:
        self._rails: RunnableRails | None = None
        self._init_lock = asyncio.Lock()
        self._registered = False

    async def _ensure_ready(self) -> RunnableRails | None:
        # Lazy-build the rail on first use; subsequent calls reuse the singleton.
        if self._rails is not None:
            return self._rails

        async with self._init_lock:
            if self._rails is not None:
                return self._rails

            try:
                if not self._registered:
                    register_chat_provider("groq", ChatGroq)
                    self._registered = True

                # NeMo's self_check_input action also reads GROQ_API_KEY from env.
                import os

                os.environ.setdefault("GROQ_API_KEY", settings.groq_api_key)

                config = RailsConfig.from_path(str(_GUARDRAILS_CONFIG_DIR))
                rails = RunnableRails(config=config)
                # Sentinel keeps the second LLM hop a no-op when input is safe;
                # only the rail's own classifier call runs.
                self._rails = rails | RunnableLambda(lambda _: _SAFE_SENTINEL)
            except Exception as exc:
                logger.warning(
                    "Failed to initialize NeMo Guardrails: {}. Guardrails will fail-open.",
                    exc,
                )
                self._rails = None

            return self._rails

    async def check_input(self, text: str, *, source: str) -> GuardrailResult:
        """Run the input rail and return a verdict. Fails open on rail errors."""
        if not settings.guardrails_enabled:
            return GuardrailResult(safe=True, source=source)

        if not text or not text.strip():
            return GuardrailResult(safe=True, source=source)

        rails = await self._ensure_ready()
        if rails is None:
            # Fail-open: do not block real traffic if the rail itself is broken.
            return GuardrailResult(safe=True, source=source)

        try:
            result = await rails.ainvoke(text)
        except Exception as exc:
            logger.warning(
                "Guardrails rail invocation failed for source={}: {}. Failing open.",
                source,
                exc,
            )
            return GuardrailResult(safe=True, source=source)

        output = result.get("output") if isinstance(result, dict) else result
        if isinstance(output, str) and output == _SAFE_SENTINEL:
            return GuardrailResult(safe=True, source=source)

        refusal = output if isinstance(output, str) else None
        logger.warning(
            "Prompt injection blocked | source={} | refusal={!r}",
            source,
            (refusal or "")[:200],
        )
        return GuardrailResult(safe=False, source=source, refusal_message=refusal)

    async def assert_input_safe(self, text: str, *, source: str) -> None:
        """Same as check_input, but raises PromptInjectionDetected on block."""
        verdict = await self.check_input(text, source=source)
        if not verdict.safe:
            raise PromptInjectionDetected(
                source=verdict.source,
                refusal_message=verdict.refusal_message,
            )


guardrails_service = GuardrailsService()
