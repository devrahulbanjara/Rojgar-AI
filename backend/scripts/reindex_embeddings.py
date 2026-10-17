"""Rebuild applicant search with the local embedding model. Idempotent, local only.

1. The applicant collection is recreated if it was built for another size.
2. Every application is upserted to Qdrant; points whose application is gone
   are deleted.
3. Application outbox events queued before the run are marked done (this run
   covers them), so the sync daemon stops retrying them.

    uv run python scripts/reindex_embeddings.py
"""

import asyncio
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.core.destructive_guard import assert_local_target
from app.infrastructures.ai.service import EMBEDDING_DIM, EMBEDDING_MODEL
from app.infrastructures.qdrant.service import qdrant_service
from app.modules.applications.models import Application, ApplicationSyncEvent, Review
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume
from app.shared.enums import SyncStatus

CHUNK = 32


async def _all_point_ids(collection: str) -> set[str]:
    ids: set[str] = set()
    offset = None
    while True:
        points, offset = await qdrant_service.client.scroll(
            collection_name=collection,
            limit=256,
            offset=offset,
            with_payload=False,
            with_vectors=False,
        )
        ids.update(str(p.id) for p in points)
        if offset is None:
            return ids


async def _delete_points(collection: str, ids: set[str]) -> None:
    if ids:
        await qdrant_service.client.delete(
            collection_name=collection, points_selector=sorted(ids)
        )


async def reindex_applications() -> tuple[int, set[str]]:
    indexed = 0
    seen: set[str] = set()
    last_id = None
    while True:
        async with AsyncSessionLocal() as db:
            stmt = (
                select(Application, Job, Review)
                .join(Job, Job.id == Application.job_id)
                .outerjoin(Review, Review.application_id == Application.id)
                .options(
                    selectinload(Application.resume).selectinload(Resume.experiences),
                    selectinload(Application.resume).selectinload(Resume.educations),
                    selectinload(Application.resume).selectinload(Resume.skills),
                )
                .order_by(Application.id)
                .limit(CHUNK)
            )
            if last_id is not None:
                stmt = stmt.where(Application.id > last_id)
            rows = [tuple(r) for r in (await db.execute(stmt)).all()]
            await db.commit()
            if not rows:
                return indexed, seen
            last_id = rows[-1][0].id

            indexed += await qdrant_service.upsert_applications(rows)
            seen.update(str(app.id) for app, _job, _review in rows)


async def settle_outbox(before: datetime) -> int:
    """Events queued before this run are covered by it."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            update(ApplicationSyncEvent)
            .where(
                ApplicationSyncEvent.status.in_([SyncStatus.PENDING, SyncStatus.FAILED])
            )
            .where(ApplicationSyncEvent.created_at < before)
            .values(status=SyncStatus.COMPLETED, error_message=None)
        )
        await db.commit()
    return result.rowcount


async def main() -> None:
    started = datetime.now(UTC)
    t0 = time.monotonic()
    print(f"Embedding model: {EMBEDDING_MODEL} ({EMBEDDING_DIM} dims)")
    if await qdrant_service.initialize():
        print(f"Recreated Qdrant collection {qdrant_service.candidate_collection_name}")

    apps_indexed, app_ids = await reindex_applications()
    collection = qdrant_service.candidate_collection_name
    stale_apps = await _all_point_ids(collection) - app_ids
    await _delete_points(collection, stale_apps)
    print(
        f"Applications: {apps_indexed} indexed, "
        f"{len(stale_apps)} stale point(s) removed"
    )
    settled = await settle_outbox(started)
    print(f"Outbox: {settled} event(s) settled. Done in {time.monotonic() - t0:.1f}s.")


if __name__ == "__main__":
    assert_local_target("reindex_embeddings.py", check_qdrant=True)
    asyncio.run(main())
