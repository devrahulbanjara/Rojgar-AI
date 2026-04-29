from __future__ import annotations

import random

import redis.asyncio as redis
from loguru import logger

from app.core.config import settings


class RedisService:
    """Thin Redis wrapper for prefixed keys, TTL jitter, and safe invalidation."""

    def __init__(self) -> None:
        self._client: redis.Redis | None = None
        self.prefix = f"convexhire:{settings.environment}"

    async def connect(self) -> None:
        """Connect to Redis if enabled; fail gracefully on connection errors."""
        if not settings.redis_enabled or not settings.redis_url:
            logger.warning("Redis is disabled or REDIS_URL is missing.")
            return

        try:
            self._client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
                socket_keepalive=True,
                health_check_interval=30,
            )
            await self._client.ping()  # type: ignore[misc]
            logger.info("Successfully connected to Redis.")
        except Exception as exc:
            logger.error("Failed to connect to Redis: {}", exc)
            self._client = None

    async def disconnect(self) -> None:
        """Close the Redis client if one is active."""
        if self._client:
            await self._client.aclose()

    def _build_key(self, key: str) -> str:
        """Apply the environment-specific key prefix."""
        return f"{self.prefix}:{key}"

    def _build_ttl(self, ttl_seconds: int, ttl_jitter_seconds: int) -> int:
        """Return the base TTL plus optional random jitter."""
        if ttl_seconds <= 0:
            raise ValueError("ttl_seconds must be greater than zero.")
        if ttl_jitter_seconds <= 0:
            return ttl_seconds
        return ttl_seconds + random.randint(0, ttl_jitter_seconds)

    async def get(self, key: str) -> str | None:
        """Fetch a value from cache. Fails gracefully."""
        if not self._client:
            return None
        try:
            return await self._client.get(self._build_key(key))
        except Exception as exc:
            logger.error("Redis GET failed for key {}: {}", key, exc)
            return None

    async def set(
        self,
        key: str,
        value: str,
        ttl_seconds: int = 300,
        *,
        ttl_jitter_seconds: int = 0,
    ) -> None:
        """Set a value in cache with a TTL. Fails gracefully."""
        if not self._client:
            return
        try:
            effective_ttl = self._build_ttl(ttl_seconds, ttl_jitter_seconds)
            await self._client.set(self._build_key(key), value, ex=effective_ttl)
        except Exception as exc:
            logger.error("Redis SET failed for key {}: {}", key, exc)

    async def delete(self, key: str) -> None:
        """Delete a specific key (used for event-driven invalidation)."""
        await self.delete_many(key)

    async def delete_many(self, *keys: str) -> None:
        """Delete multiple keys with a single Redis call where possible."""
        if not self._client or not keys:
            return

        prefixed_keys = [self._build_key(key) for key in keys]
        try:
            await self._client.unlink(*prefixed_keys)
        except Exception as exc:
            logger.error("Redis DELETE failed for keys {}: {}", keys, exc)

    async def invalidate_pattern(self, pattern: str) -> None:
        """Invalidate keys by pattern without using blocking KEYS scans."""
        await self.invalidate_patterns(pattern)

    async def invalidate_patterns(self, *patterns: str) -> None:
        """Invalidate one or more key patterns using non-blocking scan iteration."""
        if not self._client or not patterns:
            return

        try:
            for pattern in patterns:
                full_pattern = self._build_key(pattern)
                batch: list[str] = []
                async for redis_key in self._client.scan_iter(
                    match=full_pattern,
                    count=200,
                ):
                    batch.append(redis_key)
                    if len(batch) >= 200:
                        await self._client.unlink(*batch)
                        batch.clear()

                if batch:
                    await self._client.unlink(*batch)
        except Exception as exc:
            logger.error("Redis INVALIDATE PATTERN failed for {}: {}", patterns, exc)


redis_service = RedisService()
