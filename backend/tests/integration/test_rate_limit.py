"""Per-key rate limiting: one client running out never blocks anyone else."""

import pytest

from app.core import rate_limit
from app.core.config import settings
from app.infrastructures.redis.service import redis_service


@pytest.fixture
def limits_on(monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(settings, "trusted_proxy_hops", 1)
    rate_limit._memory.clear()
    yield
    rate_limit._memory.clear()


@pytest.fixture(params=["redis", "memory"])
def backend(request, monkeypatch, redis_test_client):
    if request.param == "memory":
        monkeypatch.setattr(redis_service, "_client", None)
    rate_limit._memory.clear()
    return request.param


async def test_keys_have_separate_buckets(backend):
    results = [await rate_limit.hit(f"t:{key}", 2, 60) for key in "AAABC"]
    assert results == [True, True, False, True, True]


async def test_window_resets(backend, monkeypatch):
    if backend == "redis":
        assert await rate_limit.hit("t:w", 1, 1)
        await redis_service._client.delete(redis_service._build_key("rl:t:w"))
    else:
        assert await rate_limit.hit("t:w", 1, 60)
        rate_limit._memory._counts["t:w"] = (0.0, 5)  # expired window
    assert await rate_limit.hit("t:w", 1, 60)


def _login(client, ip: str, email: str):
    return client.post(
        "/auth/login",
        json={"email": email, "password": "wrong-password"},
        headers={"X-Forwarded-For": ip},
    )


async def test_login_lockout_is_per_client(client, limits_on):
    # One client hammering one account is stopped after 5 tries ...
    codes = [
        (await _login(client, "198.51.100.1", "a@test.dev")).status_code
        for _ in range(6)
    ]
    assert codes[:5] == [401] * 5
    assert codes[5] == 429

    # ... but the same account still works from somewhere else,
    other = await _login(client, "198.51.100.2", "a@test.dev")
    assert other.status_code == 401
    # and other accounts from the first client are only bound by the IP limit.
    assert (await _login(client, "198.51.100.1", "b@test.dev")).status_code == 401


async def test_ip_limit_covers_many_emails(client, limits_on):
    codes = [
        (await _login(client, "198.51.100.9", f"u{i}@test.dev")).status_code
        for i in range(11)
    ]
    assert codes[:10] == [401] * 10
    assert codes[10] == 429
    assert (await _login(client, "198.51.100.10", "u0@test.dev")).status_code == 401


async def test_public_limit_is_per_ip(client, limits_on):
    async def status_page(ip):
        return await client.get(
            "/public/applications/status",
            params={"token": "not-a-real-token"},
            headers={"X-Forwarded-For": ip},
        )

    for _ in range(60):
        await status_page("203.0.113.1")
    assert (await status_page("203.0.113.1")).status_code == 429
    assert (await status_page("203.0.113.2")).status_code != 429
