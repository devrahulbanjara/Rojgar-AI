from collections.abc import AsyncGenerator

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncAttrs,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_recycle=180,
    pool_timeout=settings.db_pool_timeout_seconds,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)


class Base(AsyncAttrs, DeclarativeBase):
    """
    AsyncAttrs mixin lets you await lazy-loaded relationships
    without triggering MissingGreenlet errors in async context.
    """

    pass


@event.listens_for(Base, "init", propagate=True)
def _apply_pk_defaults(target, args, kwargs) -> None:
    """Generate Python-side PK defaults at construction time.

    SQLAlchemy applies column defaults during INSERT, so `instance.id` is None
    inside `before_flush` events unless we set it here explicitly.
    """
    for attr in target.__mapper__.column_attrs:
        col = attr.columns[0]
        if (
            col.primary_key
            and col.default is not None
            and col.default.is_callable
            and attr.key not in kwargs
        ):
            kwargs[attr.key] = col.default.arg(None)


# FastAPI dependency — one session per request, always closed
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield one async SQLAlchemy session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def release_connection(db: AsyncSession) -> None:
    """End the current transaction so its pooled connection is returned.

    Call before a slow external call (LLM, embeddings, HTTP, SMTP) that does
    not need the transaction. Loaded objects stay usable because sessions use
    ``expire_on_commit=False``; the next query checks out a connection again.
    """
    if db.in_transaction():
        await db.commit()
