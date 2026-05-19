"""Offline retrieval evaluation for the recruiter-chat candidate search and the
public job search.

Spins up an in-memory Qdrant instance, seeds it with synthetic candidates and
jobs from `evaluation/datasets/`, fires labeled queries through
`qdrant_service.search_applications` and `qdrant_service.search_jobs`, then
reports Precision@10 and Recall@10.
"""

from __future__ import annotations

import asyncio
import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from qdrant_client import AsyncQdrantClient, models

from app.core.config import settings
from app.infrastructures.ai.service import ai_service
from app.infrastructures.qdrant.service import (
    CANDIDATE_DENSE_NAME,
    CANDIDATE_SPARSE_NAME,
    DENSE_VECTOR_NAME,
    SPARSE_VECTOR_NAME,
    qdrant_service,
)
from app.infrastructures.redis import service as redis_module

DATASETS_DIR = Path(__file__).parent / "datasets"
CACHE_DIR = Path(__file__).parent / ".embed_cache"
COMPANY_ID = uuid.UUID("99999999-0000-0000-0000-000000000001")
EVAL_COLLECTION_JOBS = "eval_jobs"
EVAL_COLLECTION_CANDIDATES = "eval_candidates"
K = 10


class _DiskRedis:
    """Redis stand-in backed by a JSON file per key so embeddings persist across runs."""

    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        safe = re.sub(r"[^A-Za-z0-9_.-]", "_", key)
        return self.root / f"{safe}.json"

    async def get(self, key: str) -> str | None:
        p = self._path(key)
        if p.exists():
            return p.read_text()
        return None

    async def set(self, key: str, value: str, ttl_seconds: int | None = None) -> None:
        self._path(key).write_text(value)

    async def set_nx(self, *args: Any, **kwargs: Any) -> bool:
        return True


def _build_candidate_text(c: dict) -> str:
    return "\n\n".join(
        [
            f"CANDIDATE: {c['candidate_name']}",
            f"APPLIED FOR JOB TITLE: {c['applied_for']}",
            f"RESUME HEADLINE: {c['headline']}",
            f"RESUME SUMMARY: {c['summary']}",
            f"SKILLS: {', '.join(c['skills'])}",
            f"EXPERIENCE: {', '.join(c['experiences'])}",
        ]
    )


def _build_job_text(j: dict) -> str:
    return "\n\n".join(
        [
            f"TITLE: {j['title']}",
            f"OVERVIEW: {j['overview']}",
            f"RESPONSIBILITIES: {', '.join(j['responsibilities'])}",
            f"REQUIREMENTS: {', '.join(j['requirements'])}",
            f"PREFERRED QUALIFICATIONS: {', '.join(j['preferred_qualifications'])}",
            f"BENEFITS: {', '.join(j['benefits'])}",
        ]
    )


async def _embed_with_retry(text: str, retries: int = 5) -> list[float]:
    for attempt in range(retries):
        try:
            return await ai_service.get_embeddings(text)
        except Exception as exc:
            msg = str(exc)
            if "RESOURCE_EXHAUSTED" in msg or "429" in msg:
                wait = 25 * (attempt + 1)
                print(f"  quota hit, waiting {wait}s...")
                await asyncio.sleep(wait)
                continue
            raise
    raise RuntimeError(f"Embedding failed after {retries} retries")


async def _seed_candidates(client: AsyncQdrantClient, candidates: list[dict]) -> None:
    points: list[models.PointStruct] = []
    for c in candidates:
        text = _build_candidate_text(c)
        dense = await _embed_with_retry(text)
        sparse = qdrant_service._build_sparse_vector(text)
        points.append(
            models.PointStruct(
                id=c["id"],
                vector={
                    CANDIDATE_DENSE_NAME: dense,
                    CANDIDATE_SPARSE_NAME: sparse,
                },
                payload={
                    "company_id": str(COMPANY_ID),
                    "job_id": str(uuid.uuid4()),
                    "user_id": str(uuid.uuid4()),
                    "application_status": "applied",
                    "score": None,
                    "updated_at_ts": int(datetime.now(timezone.utc).timestamp()),
                },
            )
        )
    await client.upsert(collection_name=EVAL_COLLECTION_CANDIDATES, points=points)


async def _seed_jobs(client: AsyncQdrantClient, jobs: list[dict]) -> None:
    future_ts = int((datetime.now(timezone.utc) + timedelta(days=30)).timestamp())
    points: list[models.PointStruct] = []
    for j in jobs:
        text = _build_job_text(j)
        dense = await _embed_with_retry(text)
        sparse = qdrant_service._build_sparse_vector(text)
        points.append(
            models.PointStruct(
                id=j["id"],
                vector={
                    DENSE_VECTOR_NAME: dense,
                    SPARSE_VECTOR_NAME: sparse,
                },
                payload={
                    "company_id": str(COMPANY_ID),
                    "status": "active",
                    "location": "Remote",
                    "location_type": "remote",
                    "salary_min": 100000,
                    "salary_max": 200000,
                    "expires_at_ts": future_ts,
                },
            )
        )
    await client.upsert(collection_name=EVAL_COLLECTION_JOBS, points=points)


def _precision_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    top = retrieved[:k]
    if not top:
        return 0.0
    return sum(1 for r in top if r in relevant) / k


def _recall_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    if not relevant:
        return 0.0
    top = retrieved[:k]
    return sum(1 for r in top if r in relevant) / len(relevant)


async def _run_candidate_queries(queries: list[dict]) -> list[dict]:
    results = []
    for q in queries:
        hits = await qdrant_service.search_applications(
            query=q["query"],
            company_id=COMPANY_ID,
            limit=K,
        )
        retrieved = [str(h["application_id"]) for h in hits]
        relevant = set(q["relevant_ids"])
        results.append(
            {
                "query": q["query"],
                "p_at_k": _precision_at_k(retrieved, relevant, K),
                "r_at_k": _recall_at_k(retrieved, relevant, K),
                "retrieved": retrieved,
                "relevant": list(relevant),
            }
        )
    return results


async def _run_job_queries(queries: list[dict]) -> list[dict]:
    results = []
    for q in queries:
        hits, _ = await qdrant_service.search_jobs(query=q["query"], page=1, size=K)
        retrieved = [str(h["job_id"]) for h in hits]
        relevant = set(q["relevant_ids"])
        results.append(
            {
                "query": q["query"],
                "p_at_k": _precision_at_k(retrieved, relevant, K),
                "r_at_k": _recall_at_k(retrieved, relevant, K),
                "retrieved": retrieved,
                "relevant": list(relevant),
            }
        )
    return results


def _print_table(title: str, results: list[dict]) -> None:
    print(f"\n=== {title} ===")
    print(f"{'#':<3}{'P@10':<8}{'R@10':<8}QUERY")
    print("-" * 100)
    for i, r in enumerate(results, 1):
        q = r["query"]
        if len(q) > 80:
            q = q[:77] + "..."
        print(f"{i:<3}{r['p_at_k']:<8.3f}{r['r_at_k']:<8.3f}{q}")
    print("-" * 100)
    mean_p = sum(r["p_at_k"] for r in results) / len(results)
    mean_r = sum(r["r_at_k"] for r in results) / len(results)
    print(f"{'MEAN':<3}{mean_p:<8.3f}{mean_r:<8.3f}({len(results)} queries)")


async def main() -> None:
    settings.qdrant_collection_name = EVAL_COLLECTION_JOBS
    settings.qdrant_candidate_collection_name = EVAL_COLLECTION_CANDIDATES
    settings.recruiter_chat_hard_min_score = 0.0
    settings.recruiter_chat_hybrid_min_score = 0.0
    settings.recruiter_chat_hybrid_relative_floor = 0.0

    disk_redis = _DiskRedis(CACHE_DIR)
    redis_module.redis_service = disk_redis
    import app.infrastructures.ai.service as ai_module

    ai_module.redis_service = disk_redis

    client = AsyncQdrantClient(":memory:")
    qdrant_service.client = client
    qdrant_service.collection_name = EVAL_COLLECTION_JOBS
    qdrant_service.candidate_collection_name = EVAL_COLLECTION_CANDIDATES

    await qdrant_service.initialize()

    candidates = json.loads((DATASETS_DIR / "candidates.json").read_text())
    candidates += json.loads((DATASETS_DIR / "candidates_noise.json").read_text())
    jobs = json.loads((DATASETS_DIR / "jobs.json").read_text())
    jobs += json.loads((DATASETS_DIR / "jobs_noise.json").read_text())
    queries_candidate = json.loads(
        (DATASETS_DIR / "queries_candidate.json").read_text()
    )
    queries_job = json.loads((DATASETS_DIR / "queries_job.json").read_text())

    print(f"Seeding {len(candidates)} candidates and {len(jobs)} jobs...")
    await _seed_candidates(client, candidates)
    await _seed_jobs(client, jobs)

    print(f"Running {len(queries_candidate)} candidate-search queries...")
    cand_results = await _run_candidate_queries(queries_candidate)

    print(f"Running {len(queries_job)} job-search queries...")
    job_results = await _run_job_queries(queries_job)

    _print_table("Surface A: Candidate Rediscovery (recruiter chat)", cand_results)
    _print_table("Surface B: Job Discovery (public search)", job_results)

    summary = {
        "candidate_search": {
            "mean_precision_at_10": sum(r["p_at_k"] for r in cand_results)
            / len(cand_results),
            "mean_recall_at_10": sum(r["r_at_k"] for r in cand_results)
            / len(cand_results),
            "n_queries": len(cand_results),
            "per_query": cand_results,
        },
        "job_search": {
            "mean_precision_at_10": sum(r["p_at_k"] for r in job_results)
            / len(job_results),
            "mean_recall_at_10": sum(r["r_at_k"] for r in job_results)
            / len(job_results),
            "n_queries": len(job_results),
            "per_query": job_results,
        },
    }
    out_path = Path(__file__).parent / "results.json"
    out_path.write_text(json.dumps(summary, indent=2, default=str))
    print(f"\nResults written to {out_path}")

    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
