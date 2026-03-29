import redis.asyncio as redis
from loguru import logger

from app.core.config import settings


class RedisService:
    def __init__(self) -> None:
        self._client: redis.Redis | None = None
        self.prefix = f"convexhire:{settings.environment}"

    async def connect(self) -> None:
        if not settings.redis_enabled or not settings.redis_url:
            logger.warning("Redis is disabled or REDIS_URL is missing.")
            return

        try:
            self._client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
            )
            await self._client.ping()
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._client = None

    async def disconnect(self) -> None:
        if self._client:
            await self._client.aclose()

    def _build_key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    async def get(self, key: str) -> str | None:
        """Fetch a value from cache. Fails gracefully."""
        if not self._client:
            return None
        try:
            return await self._client.get(self._build_key(key))
        except Exception as e:
            logger.error(f"Redis GET failed for key {key}: {e}")
            return None

    async def set(self, key: str, value: str, ttl_seconds: int = 300) -> None:
        """Set a value in cache with a TTL. Fails gracefully."""
        if not self._client:
            return
        try:
            await self._client.setex(self._build_key(key), ttl_seconds, value)
        except Exception as e:
            logger.error(f"Redis SET failed for key {key}: {e}")

    async def delete(self, key: str) -> None:
        """Delete a specific key (used for event-driven invalidation)."""
        if not self._client:
            return
        try:
            await self._client.delete(self._build_key(key))
        except Exception as e:
            logger.error(f"Redis DELETE failed for key {key}: {e}")

    async def invalidate_pattern(self, pattern: str) -> None:
        """Invalidate keys by pattern (e.g., 'dashboard:candidate:*')"""
        if not self._client:
            return
        try:
            full_pattern = self._build_key(pattern)
            keys = await self._client.keys(full_pattern)
            if keys:
                await self._client.delete(*keys)
        except Exception as e:
            logger.error(f"Redis INVALIDATE PATTERN failed: {e}")


redis_service = RedisService()
