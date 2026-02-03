from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select, update
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

    async def delete(self, id: UUID) -> ModelType | None:
        obj = await self.get(id)
        if obj:
            await self.db.delete(obj)
            await self.db.flush()
        return obj

    async def update(self, id: UUID, **kwargs) -> ModelType | None:
        query = update(self.model).where(self._pk_column == id).values(**kwargs)
        await self.db.execute(query)
        await self.db.flush()
        return await self.get(id)
