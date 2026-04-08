"""
Wipe the PostgreSQL database for local/demo development.

Usage:
    uv run python reset_database.py

After running this script you can either:
    uv run alembic upgrade head
or:
    uv run python seed_data.py
"""

import asyncio

from sqlalchemy import inspect, text

import app.core.model_registry  # noqa: F401
from app.core.database import engine


def _get_public_tables(sync_connection) -> list[str]:
    inspector = inspect(sync_connection)
    return inspector.get_table_names(schema="public")


async def wipe_database() -> None:
    async with engine.begin() as connection:
        table_names = await connection.run_sync(_get_public_tables)

        if not table_names:
            print("Database is already empty.")
            return

        quoted_table_names = ", ".join(
            f'"public"."{table_name}"' for table_name in table_names
        )
        await connection.execute(
            text(f"DROP TABLE IF EXISTS {quoted_table_names} CASCADE")
        )

    await engine.dispose()
    print("Database wiped successfully.")
    print("Run `uv run alembic upgrade head` for an empty schema.")
    print("Run `uv run python seed_data.py` to recreate tables and load demo data.")


if __name__ == "__main__":
    asyncio.run(wipe_database())
