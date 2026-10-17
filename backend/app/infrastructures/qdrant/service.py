import asyncio
import os
import threading
import uuid
from typing import Any

from loguru import logger
from qdrant_client import AsyncQdrantClient, models
from qdrant_client.http.exceptions import UnexpectedResponse

from app.core.config import settings
from app.infrastructures.ai.service import EmbeddingError, ai_service, short_error

# Named vector keys of the applicant collection.
# Server-side IDF on `sparse` (`Modifier.IDF`) means we upload raw TF; Qdrant
# computes IDF at query time.
DENSE_VECTOR_NAME = "dense"
SPARSE_VECTOR_NAME = "sparse"

# BM25 vocabulary for the sparse half of hybrid search (fastembed).
SPARSE_MODEL = "Qdrant/bm25"
# Hits each half (dense, BM25) contributes before RRF fusion.
PREFETCH_LIMIT = 50

# multilingual-e5 squeezes cosine into a narrow band: a short query against an
# unrelated CV scores ~0.80, a clear match ~0.86-0.92 (measured on the seed
# data). Relevance and match scores use cosine rescaled to 0 at COSINE_UNRELATED
# and 1 at COSINE_STRONG, clipped to [0, 1].
COSINE_UNRELATED = 0.80
COSINE_STRONG = 0.92
# On the rescaled cosine: below HARD_MIN_SCORE a hit is dropped; below
# MIN_SCORE (or RELATIVE_FLOOR x the best hit) it is "low" (behind "Show more").
HARD_MIN_SCORE = 0.20
MIN_SCORE = 0.35
RELATIVE_FLOOR = 0.5


def _rescale_cosine(score: float) -> float:
    scaled = (score - COSINE_UNRELATED) / (COSINE_STRONG - COSINE_UNRELATED)
    return min(1.0, max(0.0, scaled))


class QdrantService:
    """Qdrant-backed hybrid search over a business's applications."""

    def __init__(self) -> None:
        self.candidate_collection_name = settings.qdrant_candidate_collection_name
        self.client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
        self._sparse_embedder: Any | None = None
        self._sparse_embedder_lock = threading.Lock()

    def _get_sparse_embedder(self) -> Any:
        """Lazily build the BM25 sparse embedder used for applicant search.

        `fastembed` downloads the BM25 vocab on first use and caches it locally.
        Initialising at import time would slow boot and surprise the test suite
        when no model directory exists yet.
        """
        with self._sparse_embedder_lock:
            if self._sparse_embedder is None:
                from fastembed import SparseTextEmbedding

                self._sparse_embedder = SparseTextEmbedding(
                    model_name=SPARSE_MODEL,
                    cache_dir=os.path.expanduser(settings.model_cache_dir),
                )
        return self._sparse_embedder

    def _build_sparse_vectors(self, texts: list[str]) -> list[models.SparseVector]:
        """Return `SparseVector`s of raw term frequencies for `texts`.

        With `Modifier.IDF` set on the collection's sparse config, Qdrant scales
        these TFs by document-frequency-derived IDF at query time, giving us
        proper BM25 ranking without manual corpus statistics.
        """
        embedder = self._get_sparse_embedder()
        return [
            models.SparseVector(
                indices=embedding.indices.tolist(),
                values=embedding.values.tolist(),
            )
            for embedding in embedder.embed(texts)
        ]

    async def _abuild_sparse_vectors(
        self, texts: list[str]
    ) -> list[models.SparseVector]:
        """Non-blocking BM25 vectors: fastembed is CPU-bound and synchronous."""
        return await asyncio.to_thread(self._build_sparse_vectors, texts)

    async def _abuild_sparse_vector(self, text: str) -> models.SparseVector:
        return (await self._abuild_sparse_vectors([text]))[0]

    async def initialize(self) -> bool:
        """Create the collection and payload indexes; preload the local models.

        Returns True when the collection was (re)created empty, e.g. after the
        embedding model changed size: run `scripts/reindex_embeddings.py`.
        """
        try:
            # Load (and on first boot download) the BM25 model off the event
            # loop so the first search request doesn't stall the server.
            await asyncio.to_thread(self._get_sparse_embedder)
        except Exception as exc:
            logger.warning("BM25 model preload failed: {}", short_error(exc))
        try:
            await asyncio.to_thread(ai_service.preload_embeddings)
        except Exception as exc:
            logger.warning("Embedding model preload failed: {}", short_error(exc))
        created = False
        try:
            created = await self._ensure_collection(self.candidate_collection_name)
            await self._ensure_candidate_indexes()
        except Exception as exc:
            logger.warning("Qdrant init failed: {}", short_error(exc))
        if created:
            logger.warning(
                "Qdrant collection '{}' is new and empty. Run "
                "`uv run python scripts/reindex_embeddings.py` to fill it.",
                self.candidate_collection_name,
            )
        return created

    async def _schema_is_current(self, name: str) -> bool:
        """True when the collection has the vector layout and size we write."""
        params = (await self.client.get_collection(name)).config.params
        vectors = getattr(params, "vectors", None)
        sparse = getattr(params, "sparse_vectors", None) or {}
        if not (
            isinstance(vectors, dict)
            and DENSE_VECTOR_NAME in vectors
            and SPARSE_VECTOR_NAME in sparse
        ):
            return False
        return vectors[DENSE_VECTOR_NAME].size == ai_service.embedding_dim

    async def _ensure_collection(self, name: str) -> bool:
        """Create `name` (dense + BM25), or drop and recreate it when its layout
        or vector size no longer matches (e.g. a new embedding model). True
        when (re)created."""
        if await self.client.collection_exists(name):
            if await self._schema_is_current(name):
                return False
            logger.warning(
                "Qdrant collection '{}' was built for another embedding model "
                "or layout; recreating it with {} dims.",
                name,
                ai_service.embedding_dim,
            )
            await self.client.delete_collection(name)
        await self.client.create_collection(
            collection_name=name,
            vectors_config={
                DENSE_VECTOR_NAME: models.VectorParams(
                    size=ai_service.embedding_dim, distance=models.Distance.COSINE
                )
            },
            sparse_vectors_config={
                SPARSE_VECTOR_NAME: models.SparseVectorParams(
                    modifier=models.Modifier.IDF
                )
            },
        )
        logger.info(
            "Qdrant collection '{}' created ({} dims + BM25).",
            name,
            ai_service.embedding_dim,
        )
        return True

    async def _ensure_candidate_indexes(self) -> None:
        """Payload indexes for the filters applicant search uses."""
        name = self.candidate_collection_name
        fields = [
            *(
                (f, models.PayloadSchemaType.KEYWORD)
                for f in (
                    "company_id",
                    "job_id",
                    "user_id",
                    "application_status",
                    "fit",
                )
            ),
            ("updated_at_ts", models.PayloadSchemaType.INTEGER),
        ]
        for field, schema in fields:
            try:
                await self.client.create_payload_index(
                    collection_name=name, field_name=field, field_schema=schema
                )
            except UnexpectedResponse as exc:
                if "already exists" not in str(exc).lower():
                    logger.warning(
                        "Could not index {}.{}: {}", name, field, short_error(exc)
                    )

    def _build_application_document(self, application, job, review=None) -> str:
        """Serialise an application and its resume into searchable plain text."""
        resume = application.resume
        resume_experiences = []
        if resume is not None:
            resume_experiences = [
                f"{exp.title or ''} at {exp.company_name or ''}".strip()
                for exp in (resume.experiences or [])
            ]
        resume_educations = []
        if resume is not None:
            resume_educations = [
                " ".join(
                    part
                    for part in [edu.degree, edu.field_of_study, edu.institution]
                    if part
                )
                for edu in (resume.educations or [])
            ]
        resume_skills = []
        if resume is not None:
            resume_skills = [
                skill.skill_name for skill in (resume.skills or []) if skill.skill_name
            ]

        # Name and email are deliberately not embedded: they would be sent to
        # the embedding provider and let identity (gender/ethnicity-coded
        # names) influence semantic similarity. Filter on payload fields instead.
        parts = [
            f"JOB TITLE: {job.title}",
            f"STAGE: {application.stage.value}",
            f"FIT: {review.fit if review is not None and review.fit else 'unknown'}",
            f"REVIEW: {review.summary if review is not None and review.summary else ''}",
            f"RESUME HEADLINE: {resume.headline if resume else ''}",
            f"RESUME SUMMARY: {resume.summary if resume else ''}",
            "ANSWERS: "
            + "; ".join(
                str(a.get("answer") or "") for a in application.screening_answers or []
            ),
            f"SKILLS: {', '.join(resume_skills)}",
            f"EXPERIENCE: {', '.join(resume_experiences)}",
            f"EDUCATION: {', '.join(resume_educations)}",
        ]
        return "\n\n".join(parts)

    async def _vectors(self, texts: list[str]) -> list[dict[str, Any]]:
        """Dense + BM25 sparse vectors for documents, batched."""
        dense = await ai_service.embed_many(texts, "passage")
        sparse = await self._abuild_sparse_vectors(texts)
        return [
            {DENSE_VECTOR_NAME: d, SPARSE_VECTOR_NAME: sp}
            for d, sp in zip(dense, sparse, strict=True)
        ]

    async def upsert_applications(self, rows: list[tuple]) -> int:
        """Embed and upsert `(application, job, review)` rows, batched.

        Each point carries a named `dense` vector plus a `sparse` BM25 vector.
        Errors propagate to the outbox.
        """
        if not rows:
            return 0
        vectors = await self._vectors(
            [self._build_application_document(a, j, r) for a, j, r in rows]
        )
        points = []
        for (application, job, review), vector in zip(rows, vectors, strict=True):
            updated_at = application.updated_at or application.created_at
            points.append(
                models.PointStruct(
                    id=str(application.id),
                    vector=vector,
                    payload={
                        "company_id": str(job.company_id),
                        "job_id": str(job.id),
                        "user_id": str(application.user_id),
                        # Key kept for existing filters; the value is the stage.
                        "application_status": application.stage.value,
                        "fit": review.fit if review is not None else None,
                        "updated_at_ts": int(updated_at.timestamp())
                        if updated_at
                        else 0,
                    },
                )
            )
        await self.client.upsert(
            collection_name=self.candidate_collection_name, points=points
        )
        return len(points)

    async def upsert_application(self, application, job, review=None) -> None:
        await self.upsert_applications([(application, job, review)])

    async def delete_application(self, application_id: uuid.UUID) -> None:
        """Delete one application vector (errors propagate to the outbox)."""
        await self.client.delete(
            collection_name=self.candidate_collection_name,
            points_selector=models.PointIdsList(points=[str(application_id)]),
        )

    async def search_applications(
        self,
        query: str,
        *,
        company_id: uuid.UUID,
        statuses: list[str] | None = None,
        excluded_statuses: list[str] | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Hybrid applicant search: dense + BM25 sparse, fused via RRF.

        BM25 catches exact-token queries ("tech lead", "K8s") that dense
        embeddings blur into semantically close roles. RRF decides the order;
        relevance tagging uses rescaled dense cosine (see `_tag_relevance`).
        If the embedding model is unavailable it runs on BM25 keywords alone.
        """
        must: list[models.Condition] = [
            models.FieldCondition(
                key="company_id", match=models.MatchValue(value=str(company_id))
            )
        ]
        if statuses:
            must.append(
                models.FieldCondition(
                    key="application_status", match=models.MatchAny(any=statuses)
                )
            )
        must_not: list[models.Condition] = []
        if excluded_statuses:
            must_not.append(
                models.FieldCondition(
                    key="application_status",
                    match=models.MatchAny(any=excluded_statuses),
                )
            )
        query_filter = models.Filter(must=must, must_not=must_not or None)

        sparse_vector = await self._abuild_sparse_vector(query)
        try:
            dense_vector = await ai_service.embed_query(query)
        except EmbeddingError as exc:
            logger.warning("Applicant search on keywords only: {}", exc)
            return await self._search_applications_keywords(
                sparse_vector, query_filter, limit
            )

        response = await self.client.query_points(
            collection_name=self.candidate_collection_name,
            prefetch=[
                models.Prefetch(
                    query=dense_vector,
                    using=DENSE_VECTOR_NAME,
                    filter=query_filter,
                    limit=PREFETCH_LIMIT,
                ),
                models.Prefetch(
                    query=sparse_vector,
                    using=SPARSE_VECTOR_NAME,
                    filter=query_filter,
                    limit=PREFETCH_LIMIT,
                ),
            ],
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            # A healthy pool for the relevance cut, even when `limit` is small.
            limit=max(limit, PREFETCH_LIMIT),
            with_payload=False,
        )
        fused_ids = [str(hit.id) for hit in response.points]
        if not fused_ids:
            return []

        # RRF scores depend only on rank, so thresholds on them cannot tell a
        # relevant hit from an irrelevant one (the top hit is always "high").
        # Re-score the fused hits by dense cosine and threshold that instead.
        cosine_response = await self.client.query_points(
            collection_name=self.candidate_collection_name,
            query=dense_vector,
            using=DENSE_VECTOR_NAME,
            query_filter=models.Filter(must=[models.HasIdCondition(has_id=fused_ids)]),
            limit=len(fused_ids),
            with_payload=False,
        )
        cosine_by_id = {
            str(hit.id): _rescale_cosine(hit.score) for hit in cosine_response.points
        }
        all_hits = [
            {
                "application_id": uuid.UUID(point_id),
                "score": cosine_by_id.get(point_id, 0.0),
            }
            for point_id in fused_ids  # keep the fused (RRF) ordering
        ]
        return self._tag_relevance(all_hits, limit)

    async def _search_applications_keywords(
        self,
        sparse_vector: models.SparseVector,
        query_filter: models.Filter,
        limit: int,
    ) -> list[dict]:
        """BM25-only fallback: keyword hits, all shown, no similarity score."""
        response = await self.client.query_points(
            collection_name=self.candidate_collection_name,
            query=sparse_vector,
            using=SPARSE_VECTOR_NAME,
            query_filter=query_filter,
            limit=limit,
            with_payload=False,
        )
        return [
            {
                "application_id": uuid.UUID(str(hit.id)),
                "score": 0.0,
                "relevance": "high",
            }
            for hit in response.points
        ]

    @staticmethod
    def _tag_relevance(all_hits: list[dict], limit: int) -> list[dict]:
        """Drop irrelevant hits and tag the rest high/low by rescaled cosine.

        1. Below HARD_MIN_SCORE: dropped entirely.
        2. Below MIN_SCORE or RELATIVE_FLOOR x the best hit: "low".
        The frontend shows `high` by default and `low` behind "Show more".
        """
        all_hits = [h for h in all_hits if h["score"] >= HARD_MIN_SCORE]
        if not all_hits:
            return []
        threshold = max(MIN_SCORE, max(h["score"] for h in all_hits) * RELATIVE_FLOOR)
        for hit in all_hits:
            hit["relevance"] = "high" if hit["score"] >= threshold else "low"
        return all_hits[:limit]


qdrant_service = QdrantService()
