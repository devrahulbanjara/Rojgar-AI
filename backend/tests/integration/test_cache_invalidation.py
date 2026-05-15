from __future__ import annotations

from app.core.cache import (
    invalidate_candidate_read_caches,
    invalidate_job_detail_caches,
    invalidate_profile_read_caches,
    invalidate_resume_caches,
    invalidate_resume_gap_caches,
)
from app.infrastructures.redis.service import redis_service


async def _seed(key: str) -> None:
    await redis_service.set(key, "x", ttl_seconds=60)


async def test_invalidate_job_detail_caches() -> None:
    await _seed("job:detail:job-1")
    await _seed("job:detail:job-1:candidate:a")
    await _seed("job:detail:job-1:candidate:b")

    await invalidate_job_detail_caches("job-1")

    assert await redis_service.get("job:detail:job-1") is None
    assert await redis_service.get("job:detail:job-1:candidate:a") is None
    assert await redis_service.get("job:detail:job-1:candidate:b") is None


async def test_invalidate_candidate_read_caches() -> None:
    await _seed("dashboard:candidate:user-1")
    await _seed("dashboard:candidate:user-1:analytics:weekly")
    await _seed("applications:candidate:user-1:page-1")

    await invalidate_candidate_read_caches("user-1")

    assert await redis_service.get("dashboard:candidate:user-1") is None
    assert (
        await redis_service.get("dashboard:candidate:user-1:analytics:weekly") is None
    )
    assert await redis_service.get("applications:candidate:user-1:page-1") is None


async def test_invalidate_profile_read_caches() -> None:
    await _seed("profile:detail:user-1")
    await _seed("dashboard:candidate:user-1")
    await _seed("dashboard:candidate:user-1:analytics:weekly")

    await invalidate_profile_read_caches("user-1")

    assert await redis_service.get("profile:detail:user-1") is None
    assert await redis_service.get("dashboard:candidate:user-1") is None
    assert (
        await redis_service.get("dashboard:candidate:user-1:analytics:weekly") is None
    )


async def test_invalidate_resume_caches_list_only() -> None:
    await _seed("resumes:list:user-1")
    await _seed("resume:detail:resume-9:user:user-1")

    await invalidate_resume_caches("user-1")

    assert await redis_service.get("resumes:list:user-1") is None
    # Detail key untouched when no resume_id passed.
    assert await redis_service.get("resume:detail:resume-9:user:user-1") == "x"


async def test_invalidate_resume_caches_with_detail() -> None:
    await _seed("resumes:list:user-1")
    await _seed("resume:detail:resume-9:user:user-1")

    await invalidate_resume_caches("user-1", "resume-9")

    assert await redis_service.get("resumes:list:user-1") is None
    assert await redis_service.get("resume:detail:resume-9:user:user-1") is None


async def test_invalidate_resume_gap_caches() -> None:
    await _seed("resume_gap:resume-9:summary")
    await _seed("resume_gap:resume-9:detail")

    await invalidate_resume_gap_caches("resume-9")

    assert await redis_service.get("resume_gap:resume-9:summary") is None
    assert await redis_service.get("resume_gap:resume-9:detail") is None


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
