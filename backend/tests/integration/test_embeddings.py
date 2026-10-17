"""Local embeddings: cached, single-flight, and failures never break callers."""

import asyncio
import time
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from app.infrastructures.ai.service import EMBEDDING_DIM, AIService, EmbeddingError
from app.infrastructures.qdrant import outbox
from app.modules.review.ml_rank import _calibrated_similarity, _semantic_similarity
from app.shared.enums import SyncStatus


class _CountingEmbeddings:
    def __init__(self):
        self.calls = 0

    def embed(self, texts, kind):
        self.calls += 1
        time.sleep(0.01)
        return [[float(len(t))] * 4 for t in texts]


class _BrokenEmbeddings:
    def embed(self, texts, kind):
        raise RuntimeError("model file missing\n" + "x" * 5000)


async def test_embeddings_cached_and_single_flight(monkeypatch):
    service = AIService()
    fake = _CountingEmbeddings()
    monkeypatch.setattr(service, "_embeddings", fake)

    results = await asyncio.gather(*[service.embed("python jobs") for _ in range(5)])
    again = await service.embed("python jobs")

    assert fake.calls == 1
    assert all(r == [11.0] * 4 for r in results)
    assert again == [11.0] * 4
    # Query and passage sides are cached separately (different e5 prefixes).
    await service.embed_query("python jobs")
    assert fake.calls == 2


async def test_embed_many_batches_only_the_misses(monkeypatch):
    service = AIService()
    fake = _CountingEmbeddings()
    monkeypatch.setattr(service, "_embeddings", fake)

    await service.embed("a")
    vectors = await service.embed_many(["a", "bb", "ccc"])

    assert vectors == [[1.0] * 4, [2.0] * 4, [3.0] * 4]
    assert fake.calls == 2  # one call for "a", one batched call for the rest


async def test_embedding_failure_is_short_and_optional(monkeypatch):
    service = AIService()
    monkeypatch.setattr(service, "_embeddings", _BrokenEmbeddings())

    assert await service.get_embeddings("saving a job never fails") is None
    try:
        await service.embed_query("search")
    except EmbeddingError as exc:
        assert str(exc) == "RuntimeError: model file missing"
    else:
        raise AssertionError("expected EmbeddingError")


def test_outbox_backoff_then_parks():
    event = SimpleNamespace(status=SyncStatus.PENDING, error_message=None)
    for attempt in range(1, outbox.MAX_ATTEMPTS):
        assert outbox.record_failure(event, RuntimeError("down")) == (attempt, False)
    assert outbox.record_failure(event, RuntimeError("down")) == (
        outbox.MAX_ATTEMPTS,
        True,
    )
    assert event.error_message.startswith(outbox.PARKED_PREFIX)

    now = datetime.now(UTC)
    retry = SimpleNamespace(status=SyncStatus.FAILED, error_message="attempt 3: x")
    retry.updated_at = now - timedelta(minutes=3)
    assert not outbox.is_due(retry, now)  # third retry waits 4 minutes
    retry.updated_at = now - timedelta(minutes=5)
    assert outbox.is_due(retry, now)


def test_ml_similarity_ignores_vectors_from_another_model():
    old = [0.1] * 3072
    new = [0.1] * EMBEDDING_DIM
    assert _semantic_similarity(old, new) is None
    assert _semantic_similarity(new, new) == 1.0
    assert _calibrated_similarity(0.78) == 0.5
    assert 0.0 <= _calibrated_similarity(0.2) <= _calibrated_similarity(0.99) <= 1.0
