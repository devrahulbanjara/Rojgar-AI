"""One streaming JSON call per assistant turn.

Opening the stream reuses ai_service's bounded retry (429/5xx/timeouts, honours
Retry-After, at most 12 s of waiting in total). The whole turn has a hard
deadline. Every failure becomes an AssistantError with a short message that is
safe to show; raw provider text only goes to the log.
"""

import asyncio
import json
import re
from collections.abc import AsyncIterator
from typing import Any

from fastapi import HTTPException
from loguru import logger

from app.core.config import settings
from app.infrastructures.ai.service import ai_service

BUSY_MESSAGE = "I'm busy — try again in a moment."
TIMEOUT_MESSAGE = "That took too long — try again in a moment."
UNAVAILABLE_MESSAGE = "I can't answer right now — try again in a moment."
INVALID_MESSAGE = "I couldn't put an answer together — try again."


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
    return AssistantError("unavailable", UNAVAILABLE_MESSAGE)


# One turn: hard deadline (retries included), sampling and answer size.
TURN_TIMEOUT_SECONDS = 30.0
TEMPERATURE = 0.2
MAX_TOKENS = 3000


async def stream_json(messages: list[dict[str, str]]) -> AsyncIterator[str]:
    """Yield raw text chunks of one JSON-object completion."""
    loop = asyncio.get_running_loop()
    deadline = loop.time() + TURN_TIMEOUT_SECONDS
    request: dict[str, Any] = {
        "model": settings.assistant_model,
        "messages": messages,
        "temperature": TEMPERATURE,
        "max_tokens": MAX_TOKENS,
        "response_format": {"type": "json_object"},
        "stream": True,
    }
    if settings.assistant_model.startswith("openai/gpt-oss"):
        request["reasoning_effort"] = "low"

    try:
        stream = await asyncio.wait_for(
            ai_service._create_with_retries(request), deadline - loop.time()
        )
    except TimeoutError:
        raise AssistantError("timeout", TIMEOUT_MESSAGE) from None
    except HTTPException as exc:
        raise _from_http(exc) from None

    chunks = stream.__aiter__()
    try:
        while True:
            try:
                chunk = await asyncio.wait_for(
                    chunks.__anext__(), max(0.1, deadline - loop.time())
                )
            except StopAsyncIteration:
                return
            if not chunk.choices:
                continue
            text = chunk.choices[0].delta.content
            if text:
                yield text
    except TimeoutError:
        raise AssistantError("timeout", TIMEOUT_MESSAGE) from None
    except Exception as exc:  # provider error mid-stream
        logger.warning("Assistant stream failed: {}", type(exc).__name__)
        raise AssistantError("unavailable", UNAVAILABLE_MESSAGE) from None


def parse_json_object(raw: str) -> dict[str, Any]:
    """Parse the model's JSON object, tolerating code fences or stray prose."""
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end < start:
        raise AssistantError("invalid", INVALID_MESSAGE)
    try:
        value = json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        raise AssistantError("invalid", INVALID_MESSAGE) from None
    if not isinstance(value, dict):
        raise AssistantError("invalid", INVALID_MESSAGE)
    return value


_ESCAPES = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f"}


class FieldStreamer:
    """Pull one top-level string field out of JSON as it streams in.

    Lets the UI show the reply word by word while the rest of the object (the
    draft, the quotes) is still being generated.
    """

    def __init__(self, key: str) -> None:
        self._key = re.compile(r'"%s"\s*:\s*"' % re.escape(key))
        self._buf = ""
        self._pos: int | None = None
        self._done = False

    def feed(self, chunk: str) -> str:
        self._buf += chunk
        if self._done:
            return ""
        if self._pos is None:
            match = self._key.search(self._buf)
            if not match:
                return ""
            self._pos = match.end()
        out: list[str] = []
        buf, i = self._buf, self._pos
        while i < len(buf):
            char = buf[i]
            if char == '"':
                self._done = True
                i += 1
                break
            if char == "\\":
                if i + 1 >= len(buf):
                    break
                esc = buf[i + 1]
                if esc == "u":
                    if i + 6 > len(buf):
                        break
                    try:
                        out.append(chr(int(buf[i + 2 : i + 6], 16)))
                    except ValueError:
                        pass
                    i += 6
                    continue
                out.append(_ESCAPES.get(esc, esc))
                i += 2
                continue
            out.append(char)
            i += 1
        self._pos = i
        return "".join(out)
