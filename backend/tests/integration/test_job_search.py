"""Public job search: browse needs no embedding, failures degrade to keywords."""

import asyncio

import pytest

import app.infrastructures.qdrant.service as qdrant_mod
from app.infrastructures.ai.service import AIService
from app.modules.jobs.service import normalize_search_query
from app.shared.enums import JobStatus
from tests.integration.helpers import make_active_job, make_recruiter_admin


@pytest.fixture
def qdrant_down(monkeypatch):
    calls = []

    async def _boom(**kwargs):
        calls.append(kwargs)
        raise RuntimeError("429 RESOURCE_EXHAUSTED embedding quota")

    monkeypatch.setattr(qdrant_mod.qdrant_service, "search_jobs", _boom)
    return calls


async def _jobs(db):
    _, company = await make_recruiter_admin(db, email="search@test.dev")
    await make_active_job(db, company.id, title="Python Backend Engineer")
    await make_active_job(db, company.id, title="Graphic Designer")
    await make_active_job(db, company.id, title="Draft role", status=JobStatus.draft)


async def test_browse_lists_open_jobs_without_vector_search(client, db, qdrant_down):
    await _jobs(db)

    resp = await client.get("/jobs/")

    assert resp.status_code == 200
    titles = {item["title"] for item in resp.json()["data"]["items"]}
    assert titles == {"Python Backend Engineer", "Graphic Designer"}
    assert qdrant_down == []


async def test_query_falls_back_to_keywords_on_embedding_errors(
    client, db, qdrant_down
):
    await _jobs(db)

    resp = await client.get("/jobs/", params={"q": "  PYTHON   backend "})

    assert resp.status_code == 200
    data = resp.json()["data"]
    assert [item["title"] for item in data["items"]] == ["Python Backend Engineer"]
    assert data["pagination"]["total"] == 1
    assert qdrant_down[0]["query"] == "python backend"


def test_normalize_search_query():
    assert normalize_search_query("  Data\tEngineer  ") == "data engineer"
    assert normalize_search_query("   ") is None
    assert normalize_search_query(None) is None


class _CountingEmbeddings:
    def __init__(self):
        self.calls = 0

    async def aembed_query(self, text):
        self.calls += 1
        await asyncio.sleep(0.01)
        return [float(len(text))] * 4


async def test_embeddings_cached_and_single_flight(monkeypatch):
    service = AIService()
    fake = _CountingEmbeddings()
    monkeypatch.setattr(service, "_get_embeddings_client", lambda: fake)

    results = await asyncio.gather(
        *[AIService.get_embeddings(service, "python jobs") for _ in range(5)]
    )
    again = await AIService.get_embeddings(service, "python jobs")

    assert fake.calls == 1
    assert all(r == [11.0] * 4 for r in results)
    assert again == [11.0] * 4
