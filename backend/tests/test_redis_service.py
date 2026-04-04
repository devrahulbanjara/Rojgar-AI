import pytest

from app.infrastructures.redis.service import RedisService


class FakeRedisClient:
    def __init__(self) -> None:
        self.set_calls: list[tuple[str, str, int]] = []
        self.unlink_calls: list[list[str]] = []
        self.scan_matches: dict[str, list[str]] = {}

    async def set(self, key: str, value: str, ex: int) -> None:
        self.set_calls.append((key, value, ex))

    async def unlink(self, *keys: str) -> None:
        self.unlink_calls.append(list(keys))

    async def scan_iter(self, *, match: str, count: int):
        for key in self.scan_matches.get(match, []):
            yield key


@pytest.mark.asyncio
async def test_set_adds_ttl_jitter(monkeypatch: pytest.MonkeyPatch) -> None:
    service = RedisService()
    fake_client = FakeRedisClient()
    service._client = fake_client

    monkeypatch.setattr(
        "app.infrastructures.redis.service.random.randint", lambda a, b: 17
    )

    await service.set(
        "dashboard:candidate:123",
        "payload",
        ttl_seconds=300,
        ttl_jitter_seconds=30,
    )

    assert fake_client.set_calls == [
        (f"{service.prefix}:dashboard:candidate:123", "payload", 317)
    ]


@pytest.mark.asyncio
async def test_invalidate_patterns_uses_scan_and_unlink() -> None:
    service = RedisService()
    fake_client = FakeRedisClient()
    service._client = fake_client

    first_pattern = f"{service.prefix}:applications:company:abc:job:*"
    second_pattern = f"{service.prefix}:applications:company:abc:candidates:*"
    fake_client.scan_matches[first_pattern] = [
        f"{service.prefix}:applications:company:abc:job:all:p1:s20",
        f"{service.prefix}:applications:company:abc:job:job-1:p1:s20",
    ]
    fake_client.scan_matches[second_pattern] = [
        f"{service.prefix}:applications:company:abc:candidates:job:all:status:all:p1:s50",
    ]

    await service.invalidate_patterns(
        "applications:company:abc:job:*",
        "applications:company:abc:candidates:*",
    )

    assert fake_client.unlink_calls == [
        fake_client.scan_matches[first_pattern],
        fake_client.scan_matches[second_pattern],
    ]
