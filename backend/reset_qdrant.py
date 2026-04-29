"""
Wipe Qdrant collections for local/demo development.

Usage:
    uv run python reset_qdrant.py

After running this script, collections will be recreated automatically
when the app starts (via qdrant_service.initialize()).
"""

import asyncio

from loguru import logger

from app.core.config import settings
from app.infrastructures.qdrant.service import qdrant_service


async def wipe_qdrant() -> None:
    """Delete both job and candidate collections from Qdrant."""
    job_collection = settings.qdrant_collection_name
    candidate_collection = settings.qdrant_candidate_collection_name

    try:
        # Delete job collection
        job_exists = await qdrant_service.client.collection_exists(job_collection)
        if job_exists:
            await qdrant_service.client.delete_collection(job_collection)
            logger.info(f"Deleted Qdrant collection: {job_collection}")
        else:
            logger.info(f"Collection {job_collection} does not exist, skipping.")

        # Delete candidate collection
        candidate_exists = await qdrant_service.client.collection_exists(
            candidate_collection
        )
        if candidate_exists:
            await qdrant_service.client.delete_collection(candidate_collection)
            logger.info(f"Deleted Qdrant collection: {candidate_collection}")
        else:
            logger.info(f"Collection {candidate_collection} does not exist, skipping.")

        print("\nQdrant collections wiped successfully.")
        print(
            "Collections will be recreated automatically when the app starts next time."
        )

    except Exception as exc:
        logger.error(f"Failed to wipe Qdrant: {exc}")
        raise


if __name__ == "__main__":
    asyncio.run(wipe_qdrant())
