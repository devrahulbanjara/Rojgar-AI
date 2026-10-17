from __future__ import annotations

import asyncio
import inspect
import json
import time
from collections.abc import Awaitable, Callable
from typing import Any

from loguru import logger

from app.infrastructures.redis.service import redis_service

_in_flight: set[asyncio.Task[Any]] = set()


def _envelope(payload: Any, now: int | None = None) -> str:
    ts = now if now is not None else int(time.time())
    return json.dumps({"data": payload, "ts": ts})


def _decode(raw: str) -> tuple[Any, int] | None:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(parsed, dict) or "data" not in parsed or "ts" not in parsed:
        return None
    return parsed["data"], int(parsed["ts"])


async def swr_get(
    key: str,
    loader: Callable[[], Awaitable[Any]],
    *,
    soft_ttl: int = 300,
    hard_ttl: int = 3600,
    lock_ttl: int = 10,
) -> Any:
    """Stale-while-revalidate read.

    - Returns fresh payload when age < soft_ttl.
    - When soft_ttl <= age < hard_ttl: if the loader accepts a ``db`` keyword,
      returns the stale payload and refreshes in the background on its own
      session; otherwise refreshes inline (loaders closing over the request
      session must never run concurrently with the request).
    - Blocks on loader for cold miss, gated by NX lock to prevent stampede.

    Loader must return a value that survives ``json.loads(json.dumps(x))``
    (use ``model.model_dump(mode="json")`` for Pydantic models).
    """
    raw = await redis_service.get(key)
    now = int(time.time())

    if raw:
        decoded = _decode(raw)
        if decoded is not None:
            payload, ts = decoded
            age = now - ts
            if age < soft_ttl:
                return payload
            if _accepts_session(loader):
                _schedule_refresh(key, loader, hard_ttl, lock_ttl)
                return payload
            # The loader is bound to the request's AsyncSession; running it in a
            # background task would use that session concurrently with the
            # request (and after it closes). Refresh inline instead.
            return await _refresh(key, loader, hard_ttl, lock_ttl)

    return await _refresh(key, loader, hard_ttl, lock_ttl)


async def swr_set(key: str, payload: Any, *, hard_ttl: int = 3600) -> None:
    """Write a payload into the SWR cache envelope."""
    await redis_service.set(key, _envelope(payload), ttl_seconds=hard_ttl)


def _accepts_session(loader: Callable[..., Awaitable[Any]]) -> bool:
    """True when the loader takes a ``db`` keyword to run on its own session."""
    try:
        return "db" in inspect.signature(loader).parameters
    except (TypeError, ValueError):
        return False


async def _load_with_own_session(loader: Callable[..., Awaitable[Any]]) -> Any:
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        return await loader(db=session)


def _schedule_refresh(
    key: str,
    loader: Callable[..., Awaitable[Any]],
    hard_ttl: int,
    lock_ttl: int,
) -> None:
    """Refresh in the background on a fresh session (never the request's)."""

    async def _isolated_loader() -> Any:
        return await _load_with_own_session(loader)

    try:
        task = asyncio.create_task(_refresh(key, _isolated_loader, hard_ttl, lock_ttl))
    except RuntimeError:
        return
    _in_flight.add(task)
    task.add_done_callback(_in_flight.discard)


async def _refresh(
    key: str,
    loader: Callable[[], Awaitable[Any]],
    hard_ttl: int,
    lock_ttl: int,
) -> Any:
    lock_key = f"{key}:lock"
    got_lock = await redis_service.set_nx(lock_key, "1", ttl_seconds=lock_ttl)
    if not got_lock:
        raw = await redis_service.get(key)
        if raw:
            decoded = _decode(raw)
            if decoded is not None:
                return decoded[0]
        return await loader()

    try:
        fresh = await loader()
        await redis_service.set(key, _envelope(fresh), ttl_seconds=hard_ttl)
        return fresh
    except Exception as exc:
        logger.error("SWR refresh failed for key {}: {}", key, exc)
        raise
    finally:
        await redis_service.delete(lock_key)
