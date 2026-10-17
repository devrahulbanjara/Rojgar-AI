"""Per-key rate limiting for auth and public endpoints.

Each limit counts requests per key (trusted client IP, and optionally IP plus
the email in the request) in a fixed time window. Counters live in Redis
(``INCR`` on a key that expires with the window) so every API worker shares
them; without Redis an in-process counter is used instead.
"""

from __future__ import annotations

import time

from fastapi import HTTPException, status
from starlette.requests import Request

from app.core.config import settings
from app.infrastructures.redis.service import redis_service

TOO_MANY_MESSAGE = "Too many attempts. Please wait a moment and try again."


def client_ip(request: Request) -> str:
    """Best-effort client IP that a caller cannot spoof.

    With ``TRUSTED_PROXY_HOPS=0`` (default) the socket peer is used. Behind N
    trusted reverse proxies, each proxy appends the address it saw, so the
    N-th entry from the right of X-Forwarded-For is the real client.
    """
    hops = settings.trusted_proxy_hops
    if hops > 0:
        forwarded = [
            part.strip()
            for part in request.headers.get("X-Forwarded-For", "").split(",")
            if part.strip()
        ]
        if len(forwarded) >= hops:
            return forwarded[-hops]
    if request.client:
        return request.client.host
    return "unknown"


class _MemoryCounter:
    """Fixed-window counters for a single process (used when Redis is off)."""

    def __init__(self, max_keys: int = 50_000) -> None:
        self._counts: dict[str, tuple[float, int]] = {}
        self._max_keys = max_keys

    def incr(self, key: str, window_seconds: int) -> int:
        now = time.monotonic()
        expires_at, count = self._counts.get(key, (0.0, 0))
        if expires_at <= now:
            expires_at, count = now + window_seconds, 0
        count += 1
        self._counts[key] = (expires_at, count)
        if len(self._counts) > self._max_keys:
            self._prune(now)
        return count

    def _prune(self, now: float) -> None:
        for stale in [k for k, (exp, _) in self._counts.items() if exp <= now]:
            del self._counts[stale]

    def clear(self) -> None:
        self._counts.clear()


_memory = _MemoryCounter()


async def hit(key: str, limit: int, window_seconds: int) -> bool:
    """Count one request for ``key``; return False once it is over ``limit``."""
    count = await redis_service.incr_window(f"rl:{key}", window_seconds)
    if count is None:
        count = _memory.incr(key, window_seconds)
    return count <= limit


async def _email_from_request(request: Request) -> str | None:
    """Read the target email from a JSON or form body (already cached by FastAPI)."""
    content_type = request.headers.get("content-type", "")
    try:
        if content_type.startswith("application/json"):
            body = await request.json()
            value = body.get("email") if isinstance(body, dict) else None
        elif "form" in content_type:
            value = (await request.form()).get("email")
        else:
            return None
    except Exception:
        return None
    if not isinstance(value, str):
        return None
    return value.strip().lower()[:255] or None


class RateLimit:
    """FastAPI dependency: ``times`` requests per ``seconds`` for each client.

    ``scope`` names the endpoint so each route has its own counters. With
    ``per_email`` a second, tighter counter keyed on IP + the email in the
    body stops one client from hammering one account, without letting anyone
    else lock that account out.
    """

    def __init__(
        self,
        scope: str,
        times: int,
        seconds: int,
        *,
        per_email: int | None = None,
    ) -> None:
        self.scope = scope
        self.times = times
        self.seconds = seconds
        self.per_email = per_email

    async def __call__(self, request: Request) -> None:
        if not settings.rate_limit_enabled:
            return
        ip = client_ip(request)
        allowed = await hit(f"{self.scope}:ip:{ip}", self.times, self.seconds)
        if allowed and self.per_email is not None:
            email = await _email_from_request(request)
            if email:
                allowed = await hit(
                    f"{self.scope}:ip-email:{ip}:{email}",
                    self.per_email,
                    self.seconds,
                )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=TOO_MANY_MESSAGE,
                headers={"Retry-After": str(self.seconds)},
            )
