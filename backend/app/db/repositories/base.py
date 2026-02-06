from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.inspection import inspect

from app.db.base import Base


class BaseRepository[ModelType: Base]:
    def __init__(self, model: type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db
        self._pk_column = inspect(model).primary_key[0]

    async def get(self, id: UUID) -> ModelType | None:
        query = select(self.model).where(self._pk_column == id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_all(self, skip: int = 0, limit: int = 100) -> Sequence[ModelType]:
        query = select(self.model).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create(self, obj_in: ModelType) -> ModelType:
        self.db.add(obj_in)
        await self.db.flush()
        return obj_in

    async def _handle_db_error(self, e: Exception, custom_msg: str | None = None):
        """Internal helper to translate DB errors to User-friendly ValueErrors"""
        await self.db.rollback()
        error_msg = str(e.orig) if hasattr(e, "orig") else str(e)

        if "foreign key" in error_msg.lower() or "constraint" in error_msg.lower():
            raise ValueError(
                custom_msg
                or "This record cannot be deleted because it is being used by other parts of the system."
            ) from e
        raise ValueError(f"Database error: {error_msg}") from e

    async def delete(self, id: UUID) -> ModelType | None:
        """Delete an object by ID

        Raises:
            ValueError: If deletion fails due to foreign key constraints or other database errors
        """
        obj = await self.get(id)
        if obj:
            try:
                await self.db.delete(obj)
                await self.db.flush()
            except (IntegrityError, SQLAlchemyError) as e:
                await self._handle_db_error(e)
        return obj

    async def update(self, id: UUID, **kwargs) -> ModelType | None:
        query = update(self.model).where(self._pk_column == id).values(**kwargs)
        await self.db.execute(query)
        await self.db.flush()
        return await self.get(id)
