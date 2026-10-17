from __future__ import annotations

import asyncio
import hashlib
import json
import os
import threading
from array import array
from collections import OrderedDict
from typing import Any, Literal, Protocol

from loguru import logger

from app.core.config import settings

# In-process embedding cache entries (float32, 1.5 KB each at 384 dims).
_EMBEDDING_LRU_SIZE = 1024
# Texts per ONNX run when many are embedded at once (reindex, batches).
_EMBEDDING_BATCH_SIZE = 16

# Local multilingual embedding model (Hugging Face, ONNX, CPU; no API, no quota).
# multilingual-e5-small covers ~100 languages including Nepali, and maps English,
# Devanagari Nepali and romanized Nepali with the same meaning close together.
# Xenova's int8 export: 118 MB, same quality as fp32 at a third of the RAM.
EMBEDDING_MODEL = "Xenova/multilingual-e5-small"
EMBEDDING_MODEL_FILE = "onnx/model_quantized.onnx"
EMBEDDING_DIM = 384
# e5 was trained with these prefixes; leaving them out hurts retrieval.
_E5_PREFIX = {"query": "query: ", "passage": "passage: "}

EmbeddingKind = Literal["query", "passage"]


class _EmbeddingClient(Protocol):
    def embed(self, texts: list[str], kind: EmbeddingKind) -> list[list[float]]: ...


class _FakeEmbeddings:
    """Deterministic offline embeddings for tests (ENVIRONMENT=test)."""

    def __init__(self, dim: int) -> None:
        self._dim = dim

    def _vector(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        return [digest[i % len(digest)] / 255.0 for i in range(self._dim)]

    def embed(self, texts: list[str], kind: EmbeddingKind) -> list[list[float]]:
        return [self._vector(text) for text in texts]


class _LocalEmbeddings:
    """fastembed (ONNX Runtime) on CPU. Sync and CPU-bound: call from a thread.

    The model downloads from Hugging Face on first use (then cached on disk)
    and loads once per process; the lock keeps two threads from loading it
    twice.
    """

    def __init__(self) -> None:
        self._model: Any | None = None
        self._lock = threading.Lock()

    def _get_model(self) -> Any:
        with self._lock:
            if self._model is None:
                from fastembed import TextEmbedding
                from fastembed.common.model_description import (
                    ModelSource,
                    PoolingType,
                )

                if EMBEDDING_MODEL not in {
                    m["model"] for m in TextEmbedding.list_supported_models()
                }:
                    TextEmbedding.add_custom_model(
                        model=EMBEDDING_MODEL,
                        pooling=PoolingType.MEAN,
                        normalization=True,
                        sources=ModelSource(hf=EMBEDDING_MODEL),
                        dim=EMBEDDING_DIM,
                        model_file=EMBEDDING_MODEL_FILE,
                    )
                self._model = TextEmbedding(
                    model_name=EMBEDDING_MODEL,
                    cache_dir=os.path.expanduser(settings.model_cache_dir),
                    threads=settings.embedding_threads,
                )
                logger.info("Embedding model {} loaded", EMBEDDING_MODEL)
        return self._model

    def embed(self, texts: list[str], kind: EmbeddingKind) -> list[list[float]]:
        model = self._get_model()
        prefixed = [_E5_PREFIX[kind] + text for text in texts]
        return [
            vector.tolist()
            for vector in model.embed(prefixed, batch_size=_EMBEDDING_BATCH_SIZE)
        ]


class EmbeddingError(Exception):
    """Embedding failed (model missing, download failed). Message is short."""


def short_error(exc: Exception) -> str:
    """One log-friendly line: the type and the first line of the message."""
    lines = str(exc).strip().splitlines()
    return f"{type(exc).__name__}: {lines[0][:160]}" if lines else type(exc).__name__


class AIService:
    """Local embeddings (fastembed). Chat models and agents live in `llm.py`."""

    def __init__(self) -> None:
        self._embeddings: _EmbeddingClient | None = None
        self._embedding_lru: OrderedDict[str, array] = OrderedDict()
        self._embedding_inflight: dict[str, asyncio.Future] = {}
        # One ONNX run at a time: each already uses `embedding_threads` cores,
        # so parallel runs would only fight for the CPU.
        self._embedding_slots = asyncio.Semaphore(1)

    @property
    def embedding_dim(self) -> int:
        """Vector size of the embedding model (Qdrant collections use it)."""
        return EMBEDDING_DIM

    def _get_embeddings_client(self) -> _EmbeddingClient:
        if self._embeddings is None:
            self._embeddings = (
                _FakeEmbeddings(EMBEDDING_DIM)
                if settings.environment == "test"
                else _LocalEmbeddings()
            )
        return self._embeddings

    def preload_embeddings(self) -> None:
        """Download/load the model now (sync; run in a thread at startup)."""
        client = self._get_embeddings_client()
        if isinstance(client, _LocalEmbeddings):
            client._get_model()

    async def _run_embed(
        self, texts: list[str], kind: EmbeddingKind
    ) -> list[list[float]]:
        client = self._get_embeddings_client()
        async with self._embedding_slots:
            try:
                return await asyncio.to_thread(client.embed, texts, kind)
            except Exception as exc:
                raise EmbeddingError(short_error(exc)) from None

    @staticmethod
    def _digest(text: str, kind: EmbeddingKind) -> str:
        key = f"{EMBEDDING_MODEL}|{kind}|{text}"
        return hashlib.sha256(key.encode()).hexdigest()[:32]

    async def _cached(self, digest: str) -> list[float] | None:
        from app.infrastructures.redis.service import redis_service

        local = self._embedding_lru.get(digest)
        if local is not None:
            self._embedding_lru.move_to_end(digest)
            return local.tolist()
        cached = await redis_service.get(f"embedding:{digest}")
        if cached is None:
            return None
        vector = json.loads(cached)
        self._remember_embedding(digest, vector)
        return vector

    async def _store(self, digest: str, vector: list[float]) -> None:
        from app.infrastructures.redis.service import redis_service

        self._remember_embedding(digest, vector)
        await redis_service.set(
            f"embedding:{digest}", json.dumps(vector), ttl_seconds=3600
        )

    async def embed(self, text: str, kind: EmbeddingKind = "passage") -> list[float]:
        """Vector for one text. Raises `EmbeddingError` on failure.

        Cached in Redis (1 hour) and in a small in-process LRU, so the same
        text is embedded once even when Redis is off. Concurrent requests for
        the same uncached text share one model run.
        """
        digest = self._digest(text, kind)
        cached = await self._cached(digest)
        if cached is not None:
            return cached

        pending = self._embedding_inflight.get(digest)
        if pending is not None:
            return list(await asyncio.shield(pending))

        future: asyncio.Future = asyncio.get_running_loop().create_future()
        self._embedding_inflight[digest] = future
        try:
            vector = (await self._run_embed([text], kind))[0]
        except Exception as exc:
            future.set_exception(exc)
            future.exception()  # waiters re-raise it; no "never retrieved" noise
            raise
        else:
            future.set_result(vector)
        finally:
            self._embedding_inflight.pop(digest, None)
            if not future.done():  # caller was cancelled mid-call
                future.cancel()

        await self._store(digest, vector)
        return vector

    async def embed_many(
        self, texts: list[str], kind: EmbeddingKind = "passage"
    ) -> list[list[float]]:
        """Vectors for many texts in batched model runs (cache-aware)."""
        digests = [self._digest(text, kind) for text in texts]
        vectors: list[list[float] | None] = [await self._cached(d) for d in digests]
        missing = [i for i, v in enumerate(vectors) if v is None]
        if missing:
            fresh = await self._run_embed([texts[i] for i in missing], kind)
            for i, vector in zip(missing, fresh, strict=True):
                vectors[i] = vector
                await self._store(digests[i], vector)
        return [v for v in vectors if v is not None]

    async def embed_query(self, text: str) -> list[float]:
        """Vector for a search query (e5 'query:' side). Raises on failure."""
        return await self.embed(text, "query")

    async def get_embeddings(self, text: str) -> list[float] | None:
        """Best-effort document vector: None (one warning line) on failure.

        For callers where a missing vector must never fail the request
        (saving a job, storing a CV); the sync worker fills gaps later.
        """
        try:
            return await self.embed(text, "passage")
        except Exception as exc:
            logger.warning("Embedding unavailable, saved without it: {}", exc)
            return None

    def _remember_embedding(self, digest: str, vector: list[float]) -> None:
        """Keep a float32 copy in the in-process LRU."""
        self._embedding_lru[digest] = array("f", vector)
        self._embedding_lru.move_to_end(digest)
        while len(self._embedding_lru) > _EMBEDDING_LRU_SIZE:
            self._embedding_lru.popitem(last=False)


ai_service = AIService()
