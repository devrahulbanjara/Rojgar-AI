"""Re-embed everything with the local embedding model. Idempotent, local only.

1. Qdrant collections built for another vector size are recreated.
2. jobs.jd_embedding and applications.resume_embedding are filled where they
   are missing or come from another model (``--force``: every row).
3. Every open job and every application is upserted to Qdrant; points whose
   job or application is gone (or no longer open) are deleted.
4. Outbox events queued before the run are marked done (this run covers them),
   so the sync daemon stops retrying them.

    uv run python scripts/reindex_embeddings.py [--force]
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
from app.infrastructures.ai.service import EMBEDDING_DIM, EMBEDDING_MODEL, ai_service
from app.infrastructures.qdrant.service import qdrant_service
from app.modules.applications.models import Application, ApplicationSyncEvent, Review
from app.modules.jobs.models import Job, JobSyncEvent
from app.modules.resumes.models import Resume
from app.modules.review.ml_rank import blind_resume_text
from app.shared.enums import SyncStatus

CHUNK = 32


def _stale(vector: list[float] | None, force: bool) -> bool:
    return force or not vector or len(vector) != EMBEDDING_DIM


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


async def save_vectors(db, model, column: str, rows: list, vectors: list) -> None:
    """Write vectors without bumping updated_at (that drives "last activity")."""
    for row, vector in zip(rows, vectors, strict=True):
        await db.execute(
            update(model)
            .where(model.id == row.id)
            .values({column: vector, "updated_at": model.updated_at})
        )
    await db.commit()


async def reindex_jobs(force: bool) -> tuple[int, int, set[str]]:
    embedded = indexed = 0
    searchable: set[str] = set()
    last_id = None
    while True:
        async with AsyncSessionLocal() as db:
            stmt = select(Job).order_by(Job.id).limit(CHUNK)
            if last_id is not None:
                stmt = stmt.where(Job.id > last_id)
            jobs = list((await db.scalars(stmt)).all())
            await db.commit()  # no transaction open while the model runs
            if not jobs:
                return embedded, indexed, searchable
            last_id = jobs[-1].id

            open_jobs = [j for j in jobs if qdrant_service._job_is_searchable(j)]
            indexed += await qdrant_service.upsert_jobs(open_jobs)
            searchable.update(str(j.id) for j in open_jobs)

            stale = [j for j in jobs if _stale(j.jd_embedding, force)]
            if stale:
                vectors = await ai_service.embed_many(
                    [qdrant_service._build_job_document(j) for j in stale]
                )
                await save_vectors(db, Job, "jd_embedding", stale, vectors)
                embedded += len(stale)


async def reindex_applications(force: bool) -> tuple[int, int, set[str]]:
    embedded = indexed = 0
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
                return embedded, indexed, seen
            last_id = rows[-1][0].id

            indexed += await qdrant_service.upsert_applications(rows)
            seen.update(str(app.id) for app, _job, _review in rows)

            stale = [
                app
                for app, _job, _review in rows
                if app.resume is not None
                and blind_resume_text(app.resume).strip()
                and _stale(app.resume_embedding, force)
            ]
            if stale:
                vectors = await ai_service.embed_many(
                    [blind_resume_text(app.resume) for app in stale]
                )
                await save_vectors(db, Application, "resume_embedding", stale, vectors)
                embedded += len(stale)


async def settle_outbox(before: datetime) -> tuple[int, int]:
    """Events queued before this run are covered by it."""
    open_states = [SyncStatus.PENDING, SyncStatus.FAILED]
    async with AsyncSessionLocal() as db:
        jobs = await db.execute(
            update(JobSyncEvent)
            .where(JobSyncEvent.status.in_(open_states))
            .where(JobSyncEvent.created_at < before)
            .values(status=SyncStatus.COMPLETED, error_message=None)
        )
        apps = await db.execute(
            update(ApplicationSyncEvent)
            .where(ApplicationSyncEvent.status.in_(open_states))
            .where(ApplicationSyncEvent.created_at < before)
            .values(status=SyncStatus.COMPLETED, error_message=None)
        )
        await db.commit()
    return jobs.rowcount, apps.rowcount


async def main(force: bool) -> None:
    started = datetime.now(UTC)
    t0 = time.monotonic()
    print(f"Embedding model: {EMBEDDING_MODEL} ({EMBEDDING_DIM} dims)")
    recreated = await qdrant_service.initialize()
    if recreated:
        print(f"Recreated Qdrant collections: {', '.join(recreated)}")

    job_vectors, jobs_indexed, open_ids = await reindex_jobs(force)
    stale_jobs = await _all_point_ids(qdrant_service.collection_name) - open_ids
    await _delete_points(qdrant_service.collection_name, stale_jobs)
    print(
        f"Jobs: {job_vectors} vector(s) written, {jobs_indexed} indexed, "
        f"{len(stale_jobs)} stale point(s) removed"
    )

    app_vectors, apps_indexed, app_ids = await reindex_applications(force)
    collection = qdrant_service.candidate_collection_name
    stale_apps = await _all_point_ids(collection) - app_ids
    await _delete_points(collection, stale_apps)
    print(
        f"Applications: {app_vectors} CV vector(s) written, {apps_indexed} indexed, "
        f"{len(stale_apps)} stale point(s) removed"
    )

    job_events, app_events = await settle_outbox(started)
    print(
        f"Outbox: {job_events} job and {app_events} application event(s) settled. "
        f"Done in {time.monotonic() - t0:.1f}s."
    )


if __name__ == "__main__":
    assert_local_target("reindex_embeddings.py", check_qdrant=True)
    asyncio.run(main(force="--force" in sys.argv))
