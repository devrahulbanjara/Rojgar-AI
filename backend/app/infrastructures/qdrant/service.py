import uuid
from datetime import datetime, timezone
from typing import Any

from loguru import logger
from qdrant_client import AsyncQdrantClient, models
from qdrant_client.http.exceptions import UnexpectedResponse

from app.core.config import settings
from app.infrastructures.ai.service import ai_service

QDRANT_NO_EXPIRY_TS = 32503680000  # year 3000, good enough for human nonsense

# Named vector keys shared by both hybrid collections (jobs + candidates).
# Server-side IDF on `sparse` (`Modifier.IDF`) means we upload raw TF; Qdrant
# computes IDF at query time.
DENSE_VECTOR_NAME = "dense"
SPARSE_VECTOR_NAME = "sparse"

# Backwards-compatible aliases (other modules import the candidate-specific names).
CANDIDATE_DENSE_NAME = DENSE_VECTOR_NAME
CANDIDATE_SPARSE_NAME = SPARSE_VECTOR_NAME


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
            api_key=settings.qdrant_api_key,
        )
        self._sparse_embedder: Any | None = None

    def _get_sparse_embedder(self) -> Any:
        """Lazily build the BM25 sparse embedder used for candidate hybrid search.

        `fastembed` downloads the BM25 vocab on first use and caches it locally.
        Initialising at import time would slow boot and surprise the test suite
        when no model directory exists yet.
        """
        if self._sparse_embedder is None:
            from fastembed import SparseTextEmbedding

            self._sparse_embedder = SparseTextEmbedding(
                model_name=settings.candidate_sparse_model
            )
        return self._sparse_embedder

    def _build_sparse_vector(self, text: str) -> models.SparseVector:
        """Return a `SparseVector` of raw term frequencies for `text`.

        With `Modifier.IDF` set on the collection's sparse config, Qdrant scales
        these TFs by document-frequency-derived IDF at query time, giving us
        proper BM25 ranking without manual corpus statistics.
        """
        embedder = self._get_sparse_embedder()
        embedding = next(iter(embedder.embed([text])))
        return models.SparseVector(
            indices=embedding.indices.tolist(),
            values=embedding.values.tolist(),
        )

    async def initialize(self) -> None:
        """Robust initialization: create collections and payload indexes."""
        try:
            await self._ensure_job_collection()
            await self._ensure_candidate_collection()
            await self._ensure_job_indexes()
            await self._ensure_candidate_indexes()
        except Exception as exc:
            logger.error(f"Qdrant robust init failed: {exc}")

    async def _ensure_collection(self, collection_name: str) -> None:
        """Create a collection if it does not already exist (jobs / unnamed-vector)."""
        exists = await self.client.collection_exists(collection_name)
        if exists:
            return

        await self.client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(
                size=settings.embedding_output_dimensionality,
                distance=models.Distance.COSINE,
            ),
        )
        logger.info("Qdrant collection '{}' created.", collection_name)

    async def _ensure_job_collection(self) -> None:
        """Create or migrate the jobs collection to named-vectors hybrid schema.

        Mirrors `_ensure_candidate_collection` — if hybrid search is enabled but
        the existing collection still uses a single unnamed dense vector, drop +
        recreate it. After recreation the caller must run
        `reconcile_vectors.py --force` so every active job is re-indexed.
        """
        name = self.collection_name
        exists = await self.client.collection_exists(name)

        if exists and settings.jobs_hybrid_search_enabled:
            info = await self.client.get_collection(name)
            vectors = getattr(info.config.params, "vectors", None)
            sparse = getattr(info.config.params, "sparse_vectors", None) or {}
            has_named_dense = isinstance(vectors, dict) and DENSE_VECTOR_NAME in vectors
            has_sparse = SPARSE_VECTOR_NAME in sparse
            if not (has_named_dense and has_sparse):
                logger.warning(
                    "Migrating jobs collection '{}' to hybrid schema (drop + recreate). "
                    "Run `reconcile_vectors.py --force` to repopulate.",
                    name,
                )
                await self.client.delete_collection(name)
                exists = False

        if exists:
            return

        if settings.jobs_hybrid_search_enabled:
            await self.client.create_collection(
                collection_name=name,
                vectors_config={
                    DENSE_VECTOR_NAME: models.VectorParams(
                        size=settings.embedding_output_dimensionality,
                        distance=models.Distance.COSINE,
                    ),
                },
                sparse_vectors_config={
                    SPARSE_VECTOR_NAME: models.SparseVectorParams(
                        modifier=models.Modifier.IDF,
                    ),
                },
            )
            logger.info(
                "Qdrant hybrid jobs collection '{}' created (dense + BM25 sparse).",
                name,
            )
        else:
            await self.client.create_collection(
                collection_name=name,
                vectors_config=models.VectorParams(
                    size=settings.embedding_output_dimensionality,
                    distance=models.Distance.COSINE,
                ),
            )
            logger.info("Qdrant dense-only jobs collection '{}' created.", name)

    async def _ensure_candidate_collection(self) -> None:
        """Create or migrate the candidate collection to named-vectors hybrid schema.

        On first run with hybrid enabled, the collection already exists with a
        single unnamed dense vector. We recreate it with `dense` + `sparse`
        named vectors. Existing data is dropped.
        """
        name = self.candidate_collection_name
        exists = await self.client.collection_exists(name)

        if exists and settings.recruiter_chat_hybrid_search_enabled:
            info = await self.client.get_collection(name)
            vectors = getattr(info.config.params, "vectors", None)
            sparse = getattr(info.config.params, "sparse_vectors", None) or {}
            has_named_dense = (
                isinstance(vectors, dict) and CANDIDATE_DENSE_NAME in vectors
            )
            has_sparse = CANDIDATE_SPARSE_NAME in sparse
            if not (has_named_dense and has_sparse):
                logger.warning(
                    "Migrating candidate collection '{}' to hybrid schema (drop + recreate). "
                    "Existing data is dropped.",
                    name,
                )
                await self.client.delete_collection(name)
                exists = False

        if exists:
            return

        if settings.recruiter_chat_hybrid_search_enabled:
            await self.client.create_collection(
                collection_name=name,
                vectors_config={
                    CANDIDATE_DENSE_NAME: models.VectorParams(
                        size=settings.embedding_output_dimensionality,
                        distance=models.Distance.COSINE,
                    ),
                },
                sparse_vectors_config={
                    CANDIDATE_SPARSE_NAME: models.SparseVectorParams(
                        modifier=models.Modifier.IDF,
                    ),
                },
            )
            logger.info(
                "Qdrant hybrid candidate collection '{}' created (dense + BM25 sparse).",
                name,
            )
        else:
            await self.client.create_collection(
                collection_name=name,
                vectors_config=models.VectorParams(
                    size=settings.embedding_output_dimensionality,
                    distance=models.Distance.COSINE,
                ),
            )
            logger.info("Qdrant dense-only candidate collection '{}' created.", name)

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
        keywords = ["company_id", "job_id", "user_id", "application_status"]
        integers = ["score", "updated_at_ts"]
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
            f"OVERVIEW: {job.overview or ''}",
            f"RESPONSIBILITIES: {', '.join(job.responsibilities or [])}",
            f"REQUIREMENTS: {', '.join(job.requirements or [])}",
            f"PREFERRED QUALIFICATIONS: {', '.join(job.preferred_qualifications or [])}",
            f"BENEFITS: {', '.join(job.benefits or [])}",
        ]
        return "\n\n".join(parts)

    def _build_application_document(self, application, job) -> str:
        """Serialise an application and its resume into searchable plain text."""
        resume = application.resume
        user = application.user
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

        parts = [
            f"CANDIDATE: {user.full_name}",
            f"EMAIL: {user.email}",
            f"JOB TITLE: {job.title}",
            f"APPLICATION STATUS: {application.status.value}",
            f"SCORE: {application.score if application.score is not None else 'unknown'}",
            f"STRENGTHS: {', '.join(application.strengths) if application.strengths else 'none'}",
            f"WEAKNESSES: {', '.join(application.weaknesses) if application.weaknesses else 'none'}",
            f"RESUME HEADLINE: {resume.headline if resume else ''}",
            f"RESUME SUMMARY: {resume.summary if resume else ''}",
            f"YEARS OF EXPERIENCE: {resume.years_of_experience if resume and resume.years_of_experience is not None else 'unknown'}",
            f"SKILLS: {', '.join(resume_skills)}",
            f"EXPERIENCE: {', '.join(resume_experiences)}",
            f"EDUCATION: {', '.join(resume_educations)}",
        ]
        return "\n\n".join(parts)

    async def upsert_job(self, job) -> None:
        """
        Embed a job and store it in Qdrant with filterable metadata.

        Only upserts jobs that are:
        1. Status is 'active' (not expired or draft)
        2. expires_at is either None or in the future

        This ensures the vector DB only contains truly searchable jobs.
        """
        from app.shared.enums import JobStatus

        try:
            # Guard: Only upsert if job is active and not expired
            now = datetime.now(timezone.utc)

            if job.status != JobStatus.active:
                logger.info(
                    f"Skipping Qdrant upsert for job {job.id}: status is {job.status.value}, not active"
                )
                return

            if job.expires_at is not None and job.expires_at <= now:
                logger.info(
                    f"Skipping Qdrant upsert for job {job.id}: expired at {job.expires_at}"
                )
                return

            # Job is valid for search - proceed with upsert
            text_content = self._build_job_document(job)
            dense_vector = await ai_service.get_embeddings(text_content)
            payload = {
                "company_id": str(job.company_id),
                "status": job.status.value,
                "location": job.location or "",
                "location_type": job.location_type.value if job.location_type else None,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "expires_at_ts": _expires_at_to_ts(job.expires_at),
            }

            if settings.jobs_hybrid_search_enabled:
                sparse_vector = self._build_sparse_vector(text_content)
                vector_payload: dict[str, Any] = {
                    DENSE_VECTOR_NAME: dense_vector,
                    SPARSE_VECTOR_NAME: sparse_vector,
                }
            else:
                vector_payload = dense_vector  # type: ignore[assignment]

            await self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    models.PointStruct(
                        id=str(job.id),
                        vector=vector_payload,
                        payload=payload,
                    )
                ],
            )
            logger.info(f"Job {job.id} ({job.title}) upserted to Qdrant successfully")
        except Exception as exc:
            logger.error(f"Qdrant upsert failed for job {job.id}: {exc}")
            raise  # Re-raise so the outbox processor can mark the event FAILED

    async def delete_job(self, job_id: uuid.UUID) -> None:
        """Remove a job vector from Qdrant."""
        try:
            await self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.PointIdsList(points=[str(job_id)]),
            )
            logger.info(f"Job {job_id} deleted from Qdrant.")
        except Exception as exc:
            logger.error(f"Qdrant delete failed for job {job_id}: {exc}")
            raise  # Re-raise so the outbox processor can mark the event FAILED

    async def upsert_application(self, application, job) -> None:
        """Embed and upsert one application into the candidate collection.

        With hybrid search enabled the point carries a named `dense` vector
        plus a `sparse` BM25 vector. With the flag off, falls back to the
        legacy single-vector schema so dev environments without fastembed work.
        """
        try:
            text_content = self._build_application_document(application, job)
            dense_vector = await ai_service.get_embeddings(text_content)
            updated_at = application.updated_at or application.created_at
            updated_at_ts = int(updated_at.timestamp()) if updated_at else 0
            payload = {
                "company_id": str(job.company_id),
                "job_id": str(job.id),
                "user_id": str(application.user_id),
                "application_status": application.status.value,
                "score": application.score,
                "updated_at_ts": updated_at_ts,
            }

            if settings.recruiter_chat_hybrid_search_enabled:
                sparse_vector = self._build_sparse_vector(text_content)
                vector_payload: dict[str, Any] = {
                    CANDIDATE_DENSE_NAME: dense_vector,
                    CANDIDATE_SPARSE_NAME: sparse_vector,
                }
            else:
                vector_payload = dense_vector  # type: ignore[assignment]

            await self.client.upsert(
                collection_name=self.candidate_collection_name,
                points=[
                    models.PointStruct(
                        id=str(application.id),
                        vector=vector_payload,
                        payload=payload,
                    )
                ],
            )
            logger.info(
                "Application {} for job {} upserted to candidate Qdrant successfully",
                application.id,
                job.id,
            )
        except Exception as exc:
            logger.error(
                "Qdrant application upsert failed for application {}: {}",
                application.id,
                exc,
            )
            raise

    async def delete_application(self, application_id: uuid.UUID) -> None:
        """Delete one application vector from the candidate collection."""
        try:
            await self.client.delete(
                collection_name=self.candidate_collection_name,
                points_selector=models.PointIdsList(points=[str(application_id)]),
            )
            logger.info("Application {} deleted from candidate Qdrant.", application_id)
        except Exception as exc:
            logger.error(
                "Qdrant application delete failed for application {}: {}",
                application_id,
                exc,
            )
            raise

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
        now_ts = int(datetime.now(timezone.utc).timestamp())

        active_condition = models.FieldCondition(
            key="status", match=models.MatchValue(value="active")
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
        dense_vector = await ai_service.get_embeddings(query)
        sparse_vector = self._build_sparse_vector(query)

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
        vector = await ai_service.get_embeddings(query)

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
        min_score: float | None = None,
    ) -> list[dict]:
        """Run hybrid candidate search (dense + BM25 sparse fused via RRF).

        Hybrid path catches exact-token queries ("tech lead", "K8s") that pure
        Gemini dense embeddings collapse against semantically-close roles. With
        the flag off, runs the legacy dense-only path. RRF score values are tiny
        (≤ ~0.033 with `k=60`) so `min_score` is treated as a dense-cosine
        threshold only and skipped on the hybrid path.
        """
        must_conditions: list[models.Condition] = [
            models.FieldCondition(
                key="company_id",
                match=models.MatchValue(value=str(company_id)),
            )
        ]
        if statuses:
            if len(statuses) == 1:
                must_conditions.append(
                    models.FieldCondition(
                        key="application_status",
                        match=models.MatchValue(value=statuses[0]),
                    )
                )
            else:
                must_conditions.append(
                    models.FieldCondition(
                        key="application_status",
                        match=models.MatchAny(any=statuses),
                    )
                )

        must_not_conditions: list[models.Condition] = []
        if excluded_statuses:
            must_not_conditions.append(
                models.FieldCondition(
                    key="application_status",
                    match=models.MatchAny(any=excluded_statuses),
                )
            )

        query_filter = models.Filter(
            must=must_conditions,
            must_not=must_not_conditions or None,
        )

        if settings.recruiter_chat_hybrid_search_enabled:
            return await self._search_applications_hybrid(
                query=query,
                query_filter=query_filter,
                limit=limit,
            )

        return await self._search_applications_dense_only(
            query=query,
            query_filter=query_filter,
            limit=limit,
            min_score=min_score,
        )

    async def _search_applications_hybrid(
        self,
        *,
        query: str,
        query_filter: models.Filter,
        limit: int,
    ) -> list[dict]:
        """Dense + BM25 prefetch fused server-side via Reciprocal Rank Fusion.

        Tags each hit with `relevance: "high" | "low"` based on a two-pass
        threshold:
          1. Hard cut-off (`recruiter_chat_hard_min_score`) — anything below
             is dropped entirely and never sent to the frontend.
          2. Absolute floor (`recruiter_chat_hybrid_min_score`) — anything
             below (but above the hard cut-off) is treated as low-relevance.
          3. Relative floor (`top_score * recruiter_chat_hybrid_relative_floor`)
             — keeps the front-of-list cluster as "high", everything past the
             gap as "low".
        Frontend renders `high` by default and reveals `low` behind a
        "Show more" toggle.
        """
        dense_vector = await ai_service.get_embeddings(query)
        sparse_vector = self._build_sparse_vector(query)
        prefetch_limit = settings.candidate_hybrid_prefetch_limit
        # Pull `prefetch_limit` so the relevance filter has a healthy candidate
        # pool to truncate, even though the caller only wants `limit` final hits.
        fused_limit = max(limit, prefetch_limit)

        response = await self.client.query_points(
            collection_name=self.candidate_collection_name,
            prefetch=[
                models.Prefetch(
                    query=dense_vector,
                    using=CANDIDATE_DENSE_NAME,
                    filter=query_filter,
                    limit=prefetch_limit,
                ),
                models.Prefetch(
                    query=sparse_vector,
                    using=CANDIDATE_SPARSE_NAME,
                    filter=query_filter,
                    limit=prefetch_limit,
                ),
            ],
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=fused_limit,
            with_payload=False,
        )
        all_hits = [
            {"application_id": uuid.UUID(str(hit.id)), "score": hit.score}
            for hit in response.points
        ]
        if not all_hits:
            return []

        # Hard cut-off: drop anything below the absolute floor so the frontend
        # never has to render completely irrelevant matches.
        hard_floor = settings.recruiter_chat_hard_min_score
        all_hits = [h for h in all_hits if h["score"] >= hard_floor]
        if not all_hits:
            return []

        absolute_floor = settings.recruiter_chat_hybrid_min_score
        relative_floor = (
            all_hits[0]["score"] * settings.recruiter_chat_hybrid_relative_floor
        )
        threshold = max(absolute_floor, relative_floor)
        for hit in all_hits:
            hit["relevance"] = "high" if hit["score"] >= threshold else "low"
        return all_hits[:limit]

    async def _search_applications_dense_only(
        self,
        *,
        query: str,
        query_filter: models.Filter,
        limit: int,
        min_score: float | None,
    ) -> list[dict]:
        """Legacy dense-only search path used when hybrid is disabled."""
        vector = await ai_service.get_embeddings(query)
        response = await self.client.query_points(
            collection_name=self.candidate_collection_name,
            query=vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=False,
        )
        hits = [
            {"application_id": uuid.UUID(str(hit.id)), "score": hit.score}
            for hit in response.points
        ]
        if min_score is not None:
            hits = [h for h in hits if h["score"] >= min_score]
        return hits


qdrant_service = QdrantService()
