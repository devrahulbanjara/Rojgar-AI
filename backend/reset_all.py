"""
Wipe both PostgreSQL database and Qdrant collections for local/demo development.

Usage:
    uv run python reset_all.py

This script runs both reset_database.py and reset_qdrant.py in sequence.
After running, you can either:
    uv run alembic upgrade head
or:
    uv run python seed_data.py
"""

import asyncio

from reset_database import wipe_database
from reset_qdrant import wipe_qdrant


async def reset_all() -> None:
    """Wipe PostgreSQL and Qdrant in sequence."""
    print("=== Resetting PostgreSQL ===")
    await wipe_database()

    print("\n=== Resetting Qdrant ===")
    await wipe_qdrant()

    print("\n=== All systems reset ===")
    print("Run `uv run alembic upgrade head` for an empty schema.")
    print("Run `uv run python seed_data.py` to recreate tables and load demo data.")


if __name__ == "__main__":
    from app.core.destructive_guard import assert_local_target

    assert_local_target("reset_all.py", check_qdrant=True)
    asyncio.run(reset_all())
