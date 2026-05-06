"""
Quick sanity check for hybrid job search ranking.

Seeds a small job corpus into a **local Qdrant** (docker-compose `qdrant-test`),
fires a handful of labeled queries, and asserts the expected job lands at
rank 1. Prints the top-5 hits per query so you can eyeball the rest.

Opt-in. Run from `backend/`:

    docker compose -f ../docker-compose.yml up -d qdrant-test postgres-test
    RUN_HYBRID_EVAL=1 uv run pytest -m hybrid_eval -s

`-s` keeps the printed table visible. Override the local Qdrant URL by
setting `test_qdrant_url` (env: `TEST_QDRANT_URL`) in your `.env`.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from loguru import logger
from qdrant_client import AsyncQdrantClient

from app.core.config import settings
from app.infrastructures.qdrant.service import QdrantService, qdrant_service
from app.modules.jobs.models import Job
from app.shared.enums import JobStatus, LocationType
from tests.integration.helpers import make_recruiter_admin


# 10 jobs, designed so each query has one obvious right answer.
JOBS: list[dict] = [
    dict(
        label="py_senior",
        title="Senior Python Backend Engineer",
        overview="Build production Python services on FastAPI and PostgreSQL.",
        skills=["Python", "FastAPI", "PostgreSQL", "Redis"],
    ),
    dict(
        label="py_trainer",
        title="Senior Python Trainer and Curriculum Lead",
        overview="Author Python training material. Instructor role, not engineering.",
        skills=["Python", "Teaching", "Curriculum design"],
    ),
    dict(
        label="frontend_react",
        title="Senior Frontend React Engineer",
        overview="Lead the design system and user-facing UX.",
        skills=["React", "TypeScript", "Next.js", "CSS"],
    ),
    dict(
        label="sre_k8s",
        title="Site Reliability Engineer",
        overview="Operate K8s clusters, gRPC service mesh, Terraform infra.",
        skills=["K8s", "Terraform", "gRPC", "Prometheus"],
    ),
    dict(
        label="mlops",
        title="Senior MLOps Engineer",
        overview="Productionise model training and inference. Kubeflow, Ray, Vertex AI.",
        skills=["MLOps", "Kubeflow", "Python", "Inference"],
    ),
    dict(
        label="data_eng",
        title="Data Engineer",
        overview="Build batch and streaming pipelines on Spark and Airflow.",
        skills=["Spark", "Airflow", "dbt"],
    ),
    dict(
        label="ios",
        title="iOS Engineer",
        overview="Ship Swift and SwiftUI features for our consumer mobile app.",
        skills=["Swift", "SwiftUI", "iOS"],
    ),
    dict(
        label="security",
        title="Security Engineer",
        overview="Drive FedRAMP and PCI-DSS compliance, OAuth2 hardening.",
        skills=["FedRAMP", "PCI-DSS", "OAuth2"],
    ),
    dict(
        label="sales_engineer",
        title="Sales Engineer",
        overview="Pre-sales technical role, customer demos. Not an engineering position.",
        skills=["Pre-sales", "Demos"],
    ),
    dict(
        label="tech_writer",
        title="Senior Technical Writer",
        overview="Author developer documentation for our SDK and API.",
        skills=["Technical writing", "Markdown"],
    ),
]


# --------------------------------------------------------------------------- #
# Queries — each maps to the label expected at rank 1.
# --------------------------------------------------------------------------- #


QUERIES: list[tuple[str, str]] = [
    ("Senior Python backend engineer for production APIs", "py_senior"),
    ("kubernetes container orchestration and gRPC service mesh", "sre_k8s"),
    ("deploy and serve machine learning models in production", "mlops"),
    ("Spark Airflow data pipelines", "data_eng"),
    ("FedRAMP PCI-DSS OAuth2 compliance", "security"),
    ("iOS mobile developer Swift SwiftUI", "ios"),
    ("React frontend engineer building user interfaces", "frontend_react"),
]


# Test
@pytest.fixture
async def real_qdrant(monkeypatch):
    """
    Point `qdrant_service` at the local docker-compose Qdrant on a fresh
    collection, restore the real `search_jobs` method (conftest mocks it),
    and drop the collection on teardown.
    """
    test_client = AsyncQdrantClient(
        url=settings.test_qdrant_url,
        api_key=settings.test_qdrant_api_key,
    )
    try:
        await test_client.get_collections()
    except Exception as exc:
        await test_client.close()
        pytest.skip(
            f"No local Qdrant at {settings.test_qdrant_url} ({exc}). "
            f"Start it with: docker compose up -d qdrant-test"
        )

    collection = settings.test_qdrant_collection_name
    if await test_client.collection_exists(collection):
        await test_client.delete_collection(collection)

    monkeypatch.setattr(qdrant_service, "client", test_client)
    monkeypatch.setattr(qdrant_service, "collection_name", collection)
    real_search = QdrantService.search_jobs.__get__(qdrant_service, QdrantService)
    monkeypatch.setattr(qdrant_service, "search_jobs", real_search)

    await qdrant_service.initialize()
    try:
        yield qdrant_service
    finally:
        try:
            await test_client.delete_collection(collection)
        except Exception as exc:
            logger.warning(f"Test collection drop failed: {exc}")
        await test_client.close()


async def _seed(
    db, company_id: uuid.UUID, posted_by: uuid.UUID
) -> dict[str, uuid.UUID]:
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    label_to_id: dict[str, uuid.UUID] = {}
    for spec in JOBS:
        job = Job(
            company_id=company_id,
            posted_by=posted_by,
            title=spec["title"],
            overview=spec["overview"],
            responsibilities=[],
            requirements=spec["skills"],
            preferred_qualifications=[],
            benefits=[],
            location="Remote - US",
            location_type=LocationType.remote,
            salary_min=100000,
            salary_max=200000,
            currency="USD",
            status=JobStatus.active,
            expires_at=expires_at,
        )
        db.add(job)
        await db.flush()
        label_to_id[spec["label"]] = job.id

    for job_id in label_to_id.values():
        await qdrant_service.upsert_job(await db.get(Job, job_id))

    return label_to_id


@pytest.mark.hybrid_eval
@pytest.mark.skipif(
    not os.getenv("RUN_HYBRID_EVAL"),
    reason="Set RUN_HYBRID_EVAL=1 to run (hits real Qdrant + Gemini).",
)
@pytest.mark.asyncio
async def test_search_ranks_expected_job_first(db, real_qdrant, capsys):
    user, company = await make_recruiter_admin(
        db, email="eval-harness@convexhire.test", company_name="EvalHarness Co"
    )
    label_to_id = await _seed(db, company.id, user.id)
    id_to_label = {v: k for k, v in label_to_id.items()}
    logger.info(f"Seeded {len(label_to_id)} jobs.")

    failures: list[str] = []
    lines = ["", f"{'#':<3}{'EXPECTED':<18}{'TOP-5 HITS':<60}RESULT"]
    lines.append("-" * 95)

    for i, (query, expected_label) in enumerate(QUERIES, start=1):
        hits, _ = await qdrant_service.search_jobs(query=query, page=1, size=5)
        top5 = [id_to_label.get(h["job_id"], "?") for h in hits]
        ok = bool(top5) and top5[0] == expected_label
        verdict = "PASS" if ok else "FAIL"
        if not ok:
            failures.append(
                f"#{i} '{query}' — expected {expected_label}, got {top5[0] if top5 else '(empty)'}"
            )
        lines.append(f"{i:<3}{expected_label:<18}{', '.join(top5):<60}{verdict}")
        lines.append(f"   query: {query}")

    passed = len(QUERIES) - len(failures)
    lines.append("-" * 95)
    lines.append(
        f"{passed}/{len(QUERIES)} queries returned the expected job at rank 1."
    )
    with capsys.disabled():
        print("\n".join(lines))

    assert not failures, "Ranking failures:\n  " + "\n  ".join(failures)
