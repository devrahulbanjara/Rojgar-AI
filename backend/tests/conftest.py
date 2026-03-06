import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from main import app
from app.core.database import Base, get_db
from app.core.config import settings


@pytest.fixture(scope="session", autouse=True)
def disable_emails():
    """Prevent real emails from being sent during tests."""
    settings.send_emails = False
    yield
    settings.send_emails = True

@pytest.fixture(scope="session")
def event_loop():
    """Explicitly manage the event loop lifecycle."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def engine():
    """Create engine and setup tables."""
    engine = create_async_engine(
        settings.test_database_url,
        poolclass=NullPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db(engine):
    """Fresh session per test, ensuring explicit closure."""
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()
        await session.close()

@pytest.fixture
async def client(db):
    """API client with overridden DB dependency."""
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()