"""Free-tier rate limits per model, shared by every worker (Redis).

Before a call, a model is skipped when it is cooling down after a 429 or when
the call would take it over its per-minute or per-day budget, so the agent
moves to the next model (Groq -> Gemini) without waiting for an error. After a
call, its request and tokens are counted. On a 429 the model cools down for as
long as the provider says, or until the daily reset for a daily cap.

Without Redis the counters live in this process only.
"""

from __future__ import annotations

import asyncio
import re
import time
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from langchain.agents.middleware import AgentMiddleware
from langchain_core.messages.utils import count_tokens_approximately
from loguru import logger

from app.infrastructures.redis.service import redis_service


@dataclass(frozen=True, slots=True)
class Limits:
    rpm: int  # requests per minute
    rpd: int  # requests per day
    tpm: int  # tokens per minute (prompt + max output, as Groq counts them)
    tpd: int | None  # tokens per day
    day_zone: str  # where the provider's day starts


# Groq free plan, from console.groq.com/docs/rate-limits (cached tokens don't
# count). Google doesn't publish free-tier numbers (they're per project, shown
# at aistudio.google.com/rate-limit), so Gemini's are cautious; its 429s teach
# the real cooldown either way. Unknown models use DEFAULT.
LIMITS: dict[str, Limits] = {
    "openai/gpt-oss-120b": Limits(30, 1_000, 8_000, 200_000, "UTC"),
    "openai/gpt-oss-20b": Limits(30, 1_000, 8_000, 200_000, "UTC"),
    "gemini": Limits(10, 250, 250_000, None, "America/Los_Angeles"),
}
DEFAULT = Limits(10, 250, 8_000, None, "UTC")
# Stay a little under each limit: other calls may be in flight.
HEADROOM = 0.9
# A 429 without a usable delay: wait this long.
DEFAULT_COOLDOWN_SECONDS = 60.0
# A model free again within this long is waited for, not skipped.
SHORT_WAIT_SECONDS = 3.0


def limits_for(model: str) -> Limits:
    if model in LIMITS:
        return LIMITS[model]
    return next((v for k, v in LIMITS.items() if k in model), DEFAULT)


class QuotaUnavailable(Exception):
    """This model can't take the call now. Looks like a 429 to the retry and
    error-mapping code, with how long to wait."""

    status_code = 429

    def __init__(self, model: str, retry_after: float, reason: str) -> None:
        super().__init__(f"{model}: {reason}, retry in {retry_after:.0f}s")
        self.model = model
        self.retry_after = retry_after


# ---- counters ---------------------------------------------------------------------

_local: dict[str, tuple[float, float]] = {}  # key -> (value, expires_at)


async def _add(key: str, amount: int, ttl: int) -> int:
    value = await redis_service.incr_window(f"ai:quota:{key}", ttl, amount)
    if value is not None:
        return value
    now = time.monotonic()
    current, expires = _local.get(key, (0.0, now + ttl))
    if expires <= now:
        current, expires = 0.0, now + ttl
    _local[key] = (current + amount, expires)
    return int(current + amount)


async def _read(key: str) -> float:
    raw = await redis_service.get(f"ai:quota:{key}")
    if raw is not None:
        try:
            return float(raw)
        except ValueError:
            return 0.0
    value, expires = _local.get(key, (0.0, 0.0))
    return value if expires > time.monotonic() else 0.0


def _minute() -> str:
    return datetime.now().strftime("%Y%m%d%H%M")


def _day(zone: str) -> str:
    return datetime.now(ZoneInfo(zone)).strftime("%Y%m%d")


def _seconds_to_next_minute() -> float:
    return 60.0 - (time.time() % 60)


def _seconds_to_next_day(zone: str) -> float:
    now = datetime.now(ZoneInfo(zone))
    midnight = (now + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return (midnight - now).total_seconds()


# ---- 429s -----------------------------------------------------------------------

_DELAY = re.compile(
    r"(?:try again in|retry in|retrydelay['\"]?\s*[:=]\s*['\"]?)\s*"
    r"(?:(\d+)h)?(?:(\d+)m(?!s))?(?:([\d.]+)s)?(?:([\d.]+)ms)?",
    re.IGNORECASE,
)
_DAILY = re.compile(r"per ?day|\(rpd\)|\(tpd\)|perday|daily", re.IGNORECASE)


def retry_delay_seconds(exc: BaseException) -> float | None:
    """How long the provider asked us to wait, if it said."""
    headers = getattr(getattr(exc, "response", None), "headers", None)
    value = headers.get("retry-after") if headers else None
    if value:
        try:
            return float(value)
        except ValueError:
            pass
    match = _DELAY.search(str(exc))
    if not match or not any(match.groups()):
        return None
    hours, minutes, seconds, millis = (float(g) if g else 0.0 for g in match.groups())
    return hours * 3600 + minutes * 60 + seconds + millis / 1000


async def cool_down(model: str, exc: BaseException) -> float:
    """Mark the model unavailable after a 429; returns the cooldown in seconds."""
    delay = retry_delay_seconds(exc)
    if delay is None:
        delay = (
            _seconds_to_next_day(limits_for(model).day_zone)
            if _DAILY.search(str(exc))
            else DEFAULT_COOLDOWN_SECONDS
        )
    delay = max(1.0, delay)
    until = time.time() + delay
    await redis_service.set(
        f"ai:quota:cool:{model}", str(until), ttl_seconds=int(delay) + 1
    )
    _local[f"cool:{model}"] = (until, time.monotonic() + delay)
    logger.warning("{} rate limited: cooling down for {:.0f}s", model, delay)
    return delay


async def _cooling_for(model: str) -> float:
    until = await _read(f"cool:{model}")
    return max(0.0, until - time.time())


# ---- before and after each call -------------------------------------------------


async def reserve(model: str, tokens: int) -> None:
    """Wait briefly, or raise QuotaUnavailable, if this call would go over the
    model's budget."""
    try:
        await _check(model, tokens)
    except QuotaUnavailable as exc:
        if exc.retry_after > SHORT_WAIT_SECONDS:
            raise
        await asyncio.sleep(exc.retry_after)
        await _check(model, tokens)


async def _check(model: str, tokens: int) -> None:
    wait = await _cooling_for(model)
    if wait > 0:
        raise QuotaUnavailable(model, wait, "cooling down after a rate limit")
    limits = limits_for(model)
    minute, day = _minute(), _day(limits.day_zone)
    checks = [
        ("requests this minute", f"rpm:{model}:{minute}", 1, limits.rpm, False),
        ("tokens this minute", f"tpm:{model}:{minute}", tokens, limits.tpm, False),
        ("requests today", f"rpd:{model}:{day}", 1, limits.rpd, True),
    ]
    if limits.tpd:
        checks.append(("tokens today", f"tpd:{model}:{day}", tokens, limits.tpd, True))
    for reason, key, amount, limit, daily in checks:
        if await _read(key) + amount > limit * HEADROOM:
            retry = (
                _seconds_to_next_day(limits.day_zone)
                if daily
                else _seconds_to_next_minute()
            )
            raise QuotaUnavailable(model, retry, f"would pass its {reason} limit")


async def record(model: str, tokens: int) -> None:
    limits = limits_for(model)
    minute, day = _minute(), _day(limits.day_zone)
    await _add(f"rpm:{model}:{minute}", 1, 120)
    await _add(f"tpm:{model}:{minute}", tokens, 120)
    await _add(f"rpd:{model}:{day}", 1, 2 * 86400)
    if limits.tpd:
        await _add(f"tpd:{model}:{day}", tokens, 2 * 86400)


def model_name(model: Any) -> str:
    return str(
        getattr(model, "model_name", None) or getattr(model, "model", None) or "model"
    ).removeprefix("models/")


def _max_output(model: Any) -> int:
    for attr in ("max_tokens", "max_output_tokens"):
        value = getattr(model, attr, None)
        if isinstance(value, int):
            return value
    return 1024


class QuotaGuard(AgentMiddleware):
    """Innermost model-call wrapper: budget check, count, cooldown on 429."""

    async def awrap_model_call(self, request: Any, handler: Any) -> Any:
        from app.infrastructures.ai.llm import is_rate_limited

        name = model_name(request.model)
        prompt = count_tokens_approximately(list(request.messages))
        if request.system_message is not None:
            prompt += count_tokens_approximately([request.system_message])
        await reserve(name, prompt + _max_output(request.model))
        try:
            response = await handler(request)
        except QuotaUnavailable:
            raise
        except Exception as exc:
            if is_rate_limited(exc):
                await cool_down(name, exc)
            raise
        used = 0
        for message in getattr(response, "result", None) or []:
            meta = getattr(message, "usage_metadata", None) or {}
            used += int(meta.get("total_tokens") or 0)
        await record(name, used or prompt)
        return response
