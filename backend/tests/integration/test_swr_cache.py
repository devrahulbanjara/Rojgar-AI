from __future__ import annotations

import asyncio
from typing import Any

import pytest

from app.core import swr_cache
from app.core.swr_cache import swr_get, swr_set
from app.infrastructures.redis.service import redis_service


async def test_swr_cold_miss_calls_loader() -> None:
    calls = 0

    async def loader() -> dict[str, Any]:
        nonlocal calls
        calls += 1
        return {"v": calls}

    result = await swr_get("k", loader, soft_ttl=10, hard_ttl=60)
    assert result == {"v": 1}
    assert calls == 1


async def test_swr_fresh_hit_skips_loader() -> None:
    calls = 0

    async def loader() -> dict[str, Any]:
        nonlocal calls
        calls += 1
        return {"v": calls}

    await swr_get("k", loader, soft_ttl=10, hard_ttl=60)
    await swr_get("k", loader, soft_ttl=10, hard_ttl=60)
    assert calls == 1


async def test_swr_stale_returns_old_and_refreshes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls = 0

    async def loader() -> dict[str, Any]:
        nonlocal calls
        calls += 1
        return {"v": calls}

    now = [1000]
    monkeypatch.setattr(swr_cache.time, "time", lambda: now[0])

    first = await swr_get("k", loader, soft_ttl=10, hard_ttl=60)
    assert first == {"v": 1}

    now[0] = 1020  # past soft, within hard
    stale = await swr_get("k", loader, soft_ttl=10, hard_ttl=60)
    assert stale == {"v": 1}  # served stale

    pending = list(swr_cache._in_flight)
    if pending:
        await asyncio.gather(*pending, return_exceptions=True)

    assert calls == 2


async def test_swr_set_writes_envelope() -> None:
    await swr_set("warmed", {"v": 42}, hard_ttl=60)
    calls = 0

    async def loader() -> dict[str, Any]:
        nonlocal calls
        calls += 1
        return {"v": -1}

    result = await swr_get("warmed", loader, soft_ttl=10, hard_ttl=60)
    assert result == {"v": 42}
    assert calls == 0  # warm cache, loader never called


async def test_swr_ignores_legacy_format() -> None:
    await redis_service.set("legacy", '{"id": "abc"}', ttl_seconds=3600)

    calls = 0

    async def loader() -> dict[str, Any]:
        nonlocal calls
        calls += 1
        return {"v": calls}

    result = await swr_get("legacy", loader, soft_ttl=10, hard_ttl=60)
    assert result == {"v": 1}
    assert calls == 1
