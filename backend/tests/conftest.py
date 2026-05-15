import asyncio
import os

import pytest
from _pytest.monkeypatch import MonkeyPatch
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from main import app
from app.core.config import settings
from app.core.database import Base, get_db


@pytest.fixture(scope="session")
def monkeypatch_session():
    mp = MonkeyPatch()
    yield mp
    mp.undo()


@pytest.fixture(scope="session", autouse=True)
def disable_side_effects(monkeypatch_session):
    original_send_emails = settings.send_emails
    original_redis_url = settings.redis_url
    settings.send_emails = False
    settings.redis_url = settings.test_redis_url

    import app.infrastructures.qdrant.service as _qdrant_mod

    async def _mock_search_jobs(**_kwargs):
        return [], 0

    monkeypatch_session.setattr(
        _qdrant_mod.qdrant_service, "search_jobs", _mock_search_jobs
    )

    async def _mock_search_applications(**_kwargs):
        return []

    monkeypatch_session.setattr(
        _qdrant_mod.qdrant_service, "search_applications", _mock_search_applications
    )

    # Bypass in-memory rate limiter so tests don't hit per-IP request caps.
    # Must match the original signature (self, request, response) so FastAPI
    # injects the Starlette types correctly and doesn't treat param names as
    # required request body fields.
    import fastapi_limiter.depends as _limiter_mod
    from starlette.requests import Request
    from starlette.responses import Response

    async def _noop_rate_limit(self, request: Request, response: Response):
        pass

    monkeypatch_session.setattr(_limiter_mod.RateLimiter, "__call__", _noop_rate_limit)

    yield
    settings.send_emails = original_send_emails
    settings.redis_url = original_redis_url


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def redis_test_client(disable_side_effects):
    from app.infrastructures.redis.service import redis_service

    await redis_service.connect()
    if redis_service._client is None:
        pytest.skip("No test Redis: failed to connect to redis-test container")
    try:
        await redis_service._client.ping()
    except Exception as exc:
        await redis_service.disconnect()
        pytest.skip(f"No test Redis: {exc}")

    yield redis_service

    await redis_service.disconnect()


@pytest.fixture(autouse=True)
async def _flush_redis_between_tests(redis_test_client):
    if redis_test_client._client is not None:
        await redis_test_client._client.flushdb()
    yield


@pytest.fixture(scope="session")
async def engine():
    database_url = os.getenv("TEST_DATABASE_URL") or settings.test_database_url
    engine = create_async_engine(database_url, poolclass=NullPool)

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        await engine.dispose()
        pytest.skip(f"No test DB: {exc}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def db(engine):
    async with engine.connect() as connection:
        transaction = await connection.begin()
        session_factory = async_sessionmaker(
            bind=connection,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        )
        async with session_factory() as session:
            try:
                yield session
            finally:
                await session.close()
                await transaction.rollback()


@pytest.fixture
async def client(db):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()
