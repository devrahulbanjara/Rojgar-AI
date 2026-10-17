import asyncio
import os
import threading
import uuid
from datetime import UTC, datetime
from typing import Any

from loguru import logger
from qdrant_client import AsyncQdrantClient, models
from qdrant_client.http.exceptions import UnexpectedResponse

from app.core.config import settings
from app.infrastructures.ai.service import EmbeddingError, ai_service, short_error

QDRANT_NO_EXPIRY_TS = 32503680000  # year 3000, good enough for human nonsense

# Named vector keys shared by both hybrid collections (jobs + candidates).
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


def _expires_at_to_ts(value: datetime | None) -> int:
    """Convert an optional expiry datetime to an integer timestamp for Qdrant."""
    if value is None:
        return QDRANT_NO_EXPIRY_TS
    return int(value.timestamp())


class QdrantService:
    """Qdrant-backed vector storage for jobs and candidate applications."""

    def __init__(self) -> None:
        self.collection_name = settings.qdrant_collection_name
        self.candidate_collection_name = settings.qdrant_candidate_collection_name
        self.client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
        self._sparse_embedder: Any | None = None
        self._sparse_embedder_lock = threading.Lock()

    def _get_sparse_embedder(self) -> Any:
        """Lazily build the BM25 sparse embedder used for candidate hybrid search.

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

    async def initialize(self) -> list[str]:
        """Create collections and payload indexes; preload the local models.

        Returns the collections that were (re)created empty, e.g. after the
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
        created: list[str] = []
        try:
            if await self._ensure_job_collection():
                created.append(self.collection_name)
            if await self._ensure_candidate_collection():
                created.append(self.candidate_collection_name)
            await self._ensure_job_indexes()
            await self._ensure_candidate_indexes()
        except Exception as exc:
            logger.warning("Qdrant init failed: {}", short_error(exc))
        if created:
            logger.warning(
                "Qdrant collections {} are new and empty. Run "
                "`uv run python scripts/reindex_embeddings.py` to fill them.",
                created,
            )
        return created

    def _dense_params(self) -> models.VectorParams:
        return models.VectorParams(
            size=ai_service.embedding_dim, distance=models.Distance.COSINE
        )

    async def _schema_is_current(self, name: str, hybrid: bool) -> bool:
        """True when the collection has the vector layout and size we write."""
        params = (await self.client.get_collection(name)).config.params
        vectors = getattr(params, "vectors", None)
        sparse = getattr(params, "sparse_vectors", None) or {}
        if hybrid:
            if not (
                isinstance(vectors, dict)
                and DENSE_VECTOR_NAME in vectors
                and SPARSE_VECTOR_NAME in sparse
            ):
                return False
            dense = vectors[DENSE_VECTOR_NAME]
        else:
            if isinstance(vectors, dict):
                return False
            dense = vectors
        return getattr(dense, "size", None) == ai_service.embedding_dim

    async def _ensure_hybrid_collection(self, name: str, *, hybrid: bool) -> bool:
        """Create `name`, or drop and recreate it when its schema or vector size
        no longer matches (e.g. a new embedding model). True when (re)created."""
        if await self.client.collection_exists(name):
            if await self._schema_is_current(name, hybrid):
                return False
            logger.warning(
                "Qdrant collection '{}' was built for another embedding model "
                "or layout; recreating it with {} dims.",
                name,
                ai_service.embedding_dim,
            )
            await self.client.delete_collection(name)

        if hybrid:
            await self.client.create_collection(
                collection_name=name,
                vectors_config={DENSE_VECTOR_NAME: self._dense_params()},
                sparse_vectors_config={
                    SPARSE_VECTOR_NAME: models.SparseVectorParams(
                        modifier=models.Modifier.IDF,
                    ),
                },
            )
        else:
            await self.client.create_collection(
                collection_name=name, vectors_config=self._dense_params()
            )
        logger.info(
            "Qdrant collection '{}' created ({} dims{}).",
            name,
            ai_service.embedding_dim,
            " + BM25" if hybrid else "",
        )
        return True

    async def _ensure_job_collection(self) -> bool:
        return await self._ensure_hybrid_collection(
            self.collection_name, hybrid=settings.jobs_hybrid_search_enabled
        )

    async def _ensure_candidate_collection(self) -> bool:
        return await self._ensure_hybrid_collection(
            self.candidate_collection_name, hybrid=True
        )

    async def _ensure_payload_indexes(
        self,
        collection_name: str,
        *,
        keyword_fields: list[str],
        integer_fields: list[str],
        text_fields: list[str] | None = None,
    ) -> None:
        """Ensure the configured payload indexes exist for a collection."""
        for field in keyword_fields:
            try:
                await self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field,
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )
            except UnexpectedResponse as e:
                if "already exists" not in str(e).lower():
                    logger.warning(
                        "Could not create keyword index on {}.{}: {}",
                        collection_name,
                        field,
                        e,
                    )

        for field in integer_fields:
            try:
                await self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field,
                    field_schema=models.PayloadSchemaType.INTEGER,
                )
            except UnexpectedResponse as e:
                if "already exists" not in str(e).lower():
                    logger.warning(
                        "Could not create integer index on {}.{}: {}",
                        collection_name,
                        field,
                        e,
                    )

        for field in text_fields or []:
            try:
                await self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field,
                    field_schema=models.TextIndexParams(
                        type=models.TextIndexType.TEXT,
                        tokenizer=models.TokenizerType.WORD,
                        min_token_len=2,
                        max_token_len=20,
                        lowercase=True,
                    ),
                )
            except UnexpectedResponse as e:
                if "already exists" not in str(e).lower():
                    logger.warning(
                        "Could not create text index on {}.{}: {}",
                        collection_name,
                        field,
                        e,
                    )

    async def _ensure_job_indexes(self) -> None:
        """Ensure payload indexes exist for the job collection."""
        keywords = ["status", "location_type", "company_id"]
        integers = ["salary_min", "salary_max", "expires_at_ts"]
        texts = ["location"]
        await self._ensure_payload_indexes(
            self.collection_name,
            keyword_fields=keywords,
            integer_fields=integers,
            text_fields=texts,
        )
        logger.info("Qdrant job payload indexes verified.")

    async def _ensure_candidate_indexes(self) -> None:
        """Ensure payload indexes exist for the candidate-application collection."""
        keywords = ["company_id", "job_id", "user_id", "application_status", "fit"]
        integers = ["updated_at_ts"]
        await self._ensure_payload_indexes(
            self.candidate_collection_name,
            keyword_fields=keywords,
            integer_fields=integers,
        )
        logger.info("Qdrant candidate payload indexes verified.")

    def _build_job_document(self, job) -> str:
        """Concatenate all relevant job text for optimal semantic matching."""
        parts = [
            f"TITLE: {job.title}",
            f"DESCRIPTION: {job.description or ''}",
            f"MUST HAVE: {', '.join(job.must_haves or [])}",
            f"NICE TO HAVE: {', '.join(job.nice_to_haves or [])}",
        ]
        return "\n\n".join(parts)

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

    async def _vectors(
        self, texts: list[str], *, hybrid: bool
    ) -> list[dict[str, Any] | list[float]]:
        """Dense (+ BM25 sparse) vectors for documents, batched."""
        dense = await ai_service.embed_many(texts, "passage")
        if not hybrid:
            return list(dense)
        sparse = await self._abuild_sparse_vectors(texts)
        return [
            {DENSE_VECTOR_NAME: d, SPARSE_VECTOR_NAME: sp}
            for d, sp in zip(dense, sparse, strict=True)
        ]

    @staticmethod
    def _job_is_searchable(job) -> bool:
        from app.shared.enums import JobStatus

        return job.status == JobStatus.open and (
            job.closes_at is None or job.closes_at > datetime.now(UTC)
        )

    async def upsert_jobs(self, jobs: list) -> int:
        """Embed open jobs and store them with filterable metadata.

        Jobs that are not open (or already past their closing time) are
        skipped. Errors propagate so the outbox marks the event for retry.
        Returns the number of points written.
        """
        jobs = [job for job in jobs if self._job_is_searchable(job)]
        if not jobs:
            return 0
        vectors = await self._vectors(
            [self._build_job_document(job) for job in jobs],
            hybrid=settings.jobs_hybrid_search_enabled,
        )
        await self.client.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=str(job.id),
                    vector=vector,
                    payload={
                        "company_id": str(job.company_id),
                        "status": job.status.value,
                        "location": job.location or "",
                        "location_type": job.location_type.value
                        if job.location_type
                        else None,
                        "salary_min": job.salary_min,
                        "salary_max": job.salary_max,
                        "expires_at_ts": _expires_at_to_ts(job.closes_at),
                    },
                )
                for job, vector in zip(jobs, vectors, strict=True)
            ],
        )
        return len(jobs)

    async def upsert_job(self, job) -> None:
        await self.upsert_jobs([job])

    async def delete_job(self, job_id: uuid.UUID) -> None:
        """Remove a job vector from Qdrant (errors propagate to the outbox)."""
        await self.client.delete(
            collection_name=self.collection_name,
            points_selector=models.PointIdsList(points=[str(job_id)]),
        )

    async def upsert_applications(self, rows: list[tuple]) -> int:
        """Embed and upsert `(application, job, review)` rows, batched.

        Each point carries a named `dense` vector plus a `sparse` BM25 vector.
        Errors propagate to the outbox.
        """
        if not rows:
            return 0
        vectors = await self._vectors(
            [self._build_application_document(a, j, r) for a, j, r in rows],
            hybrid=True,
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

    async def search_jobs(
        self,
        query: str,
        location: str | None = None,
        location_type: str | None = None,
        salary_min: int | None = None,
        salary_max: int | None = None,
        page: int = 1,
        size: int = 10,
    ) -> tuple[list[dict], int]:
        """
        Perform job search with simple filter parameters.

        Routes to a hybrid (dense + BM25 sparse, RRF) path when
        `jobs_hybrid_search_enabled` is set, otherwise to the legacy dense-only
        path. Both paths preserve the strict→fallback escalation: if filters
        reduce the strict result set below `size`, fill the rest from a
        fallback query that drops the soft filters but keeps active/non-expired
        gates and tags those hits with `is_fallback=True`.

        Args:
            query: Semantic search query string
            location: Free-text location filter (tokenized substring match)
            location_type: Filter by location type (e.g., "remote", "onsite", "hybrid")
            salary_min: Minimum salary filter (job's max salary must be >= this)
            salary_max: Maximum salary filter (job's min salary must be <= this)
            page: Page number (1-indexed)
            size: Results per page

        Returns:
            Tuple of (results list, total count)
        """
        now_ts = int(datetime.now(UTC).timestamp())

        active_condition = models.FieldCondition(
            key="status", match=models.MatchValue(value="open")
        )
        expires_condition = models.FieldCondition(
            key="expires_at_ts",
            range=models.Range(gt=now_ts),
        )
        base_must: list[models.Condition] = [active_condition, expires_condition]

        filters: list[models.Condition] = []
        if location:
            filters.append(
                models.FieldCondition(
                    key="location",
                    match=models.MatchText(text=location),
                )
            )
        if location_type:
            filters.append(
                models.FieldCondition(
                    key="location_type",
                    match=models.MatchValue(value=location_type),
                )
            )
        if salary_min is not None:
            filters.append(
                models.FieldCondition(
                    key="salary_max",
                    range=models.Range(gte=salary_min),
                )
            )
        if salary_max is not None:
            filters.append(
                models.FieldCondition(
                    key="salary_min",
                    range=models.Range(lte=salary_max),
                )
            )

        strict_filter = (
            models.Filter(must=base_must + filters)
            if filters
            else models.Filter(must=base_must)
        )
        fallback_filter = (
            models.Filter(must=base_must, must_not=filters) if filters else None
        )

        offset = (page - 1) * size

        if settings.jobs_hybrid_search_enabled:
            return await self._search_jobs_hybrid(
                query=query,
                strict_filter=strict_filter,
                fallback_filter=fallback_filter,
                size=size,
                offset=offset,
                page=page,
            )
        return await self._search_jobs_dense_only(
            query=query,
            strict_filter=strict_filter,
            fallback_filter=fallback_filter,
            size=size,
            offset=offset,
            page=page,
        )

    def _job_prefetch(
        self,
        *,
        dense_vector: list[float],
        sparse_vector: models.SparseVector,
        query_filter: models.Filter,
    ) -> list[models.Prefetch]:
        """Build the dense + sparse prefetch pair for a hybrid jobs query."""
        prefetch_limit = settings.jobs_hybrid_prefetch_limit
        return [
            models.Prefetch(
                query=dense_vector,
                using=DENSE_VECTOR_NAME,
                filter=query_filter,
                limit=prefetch_limit,
            ),
            models.Prefetch(
                query=sparse_vector,
                using=SPARSE_VECTOR_NAME,
                filter=query_filter,
                limit=prefetch_limit,
            ),
        ]

    async def _search_jobs_hybrid(
        self,
        *,
        query: str,
        strict_filter: models.Filter,
        fallback_filter: models.Filter | None,
        size: int,
        offset: int,
        page: int,
    ) -> tuple[list[dict], int]:
        """Dense + BM25 prefetch fused via RRF, with strict→fallback escalation."""
        dense_vector = await ai_service.embed_query(query)
        sparse_vector = await self._abuild_sparse_vector(query)

        strict_response = await self.client.query_points(
            collection_name=self.collection_name,
            prefetch=self._job_prefetch(
                dense_vector=dense_vector,
                sparse_vector=sparse_vector,
                query_filter=strict_filter,
            ),
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=size,
            offset=offset,
            with_payload=False,
        )

        results = [
            {"job_id": uuid.UUID(str(hit.id)), "score": hit.score, "is_fallback": False}
            for hit in strict_response.points
        ]

        count_res = await self.client.count(
            collection_name=self.collection_name,
            count_filter=strict_filter,
        )
        strict_count = count_res.count

        if fallback_filter is not None and len(results) < size:
            shortfall = size - len(results)
            fallback_offset = max(0, ((page - 1) * size) - strict_count)

            fallback_response = await self.client.query_points(
                collection_name=self.collection_name,
                prefetch=self._job_prefetch(
                    dense_vector=dense_vector,
                    sparse_vector=sparse_vector,
                    query_filter=fallback_filter,
                ),
                query=models.FusionQuery(fusion=models.Fusion.RRF),
                limit=shortfall,
                offset=fallback_offset,
                with_payload=False,
            )
            results.extend(
                {
                    "job_id": uuid.UUID(str(hit.id)),
                    "score": hit.score,
                    "is_fallback": True,
                }
                for hit in fallback_response.points
            )
            fallback_count_res = await self.client.count(
                collection_name=self.collection_name,
                count_filter=fallback_filter,
            )
            total = strict_count + fallback_count_res.count
        else:
            total = strict_count

        return results, total

    async def _search_jobs_dense_only(
        self,
        *,
        query: str,
        strict_filter: models.Filter,
        fallback_filter: models.Filter | None,
        size: int,
        offset: int,
        page: int,
    ) -> tuple[list[dict], int]:
        """Legacy dense-only path used when `jobs_hybrid_search_enabled` is off."""
        vector = await ai_service.embed_query(query)

        strict_response = await self.client.query_points(
            collection_name=self.collection_name,
            query=vector,
            query_filter=strict_filter,
            limit=size,
            offset=offset,
            with_payload=False,
        )
        results = [
            {"job_id": uuid.UUID(str(hit.id)), "score": hit.score, "is_fallback": False}
            for hit in strict_response.points
        ]

        count_res = await self.client.count(
            collection_name=self.collection_name,
            count_filter=strict_filter,
        )
        strict_count = count_res.count

        if fallback_filter is not None and len(results) < size:
            shortfall = size - len(results)
            fallback_offset = max(0, ((page - 1) * size) - strict_count)

            fallback_response = await self.client.query_points(
                collection_name=self.collection_name,
                query=vector,
                query_filter=fallback_filter,
                limit=shortfall,
                offset=fallback_offset,
                with_payload=False,
            )
            results.extend(
                {
                    "job_id": uuid.UUID(str(hit.id)),
                    "score": hit.score,
                    "is_fallback": True,
                }
                for hit in fallback_response.points
            )
            fallback_count_res = await self.client.count(
                collection_name=self.collection_name,
                count_filter=fallback_filter,
            )
            total = strict_count + fallback_count_res.count
        else:
            total = strict_count

        return results, total

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
