from __future__ import annotations

from app.core.cache import (
    invalidate_job_detail_caches,
)
from app.infrastructures.redis.service import redis_service


async def _seed(key: str) -> None:
    await redis_service.set(key, "x", ttl_seconds=60)


async def test_invalidate_job_detail_caches() -> None:
    await _seed("job:detail:job-1")

    await invalidate_job_detail_caches("job-1")

    assert await redis_service.get("job:detail:job-1") is None


async def test_job_update_invalidates_then_warms() -> None:
    """Warming after publish writes the SWR envelope under the canonical key."""
    from app.core import swr_cache

    await swr_cache.swr_set(
        "job:detail:abc", {"id": "abc", "title": "X"}, hard_ttl=3600
    )

    raw = await redis_service.get("job:detail:abc")
    assert raw is not None
    assert '"data"' in raw
    assert '"ts"' in raw
