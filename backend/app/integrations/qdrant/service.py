import uuid
from datetime import datetime, timezone

from loguru import logger
from qdrant_client import AsyncQdrantClient, models
from qdrant_client.http.exceptions import UnexpectedResponse

from app.core.config import settings
from app.integrations.ai.service import ai_service

QDRANT_NO_EXPIRY_TS = 32503680000  # year 3000, good enough for human nonsense


def _expires_at_to_ts(value: datetime | None) -> int:
    if value is None:
        return QDRANT_NO_EXPIRY_TS
    return int(value.timestamp())


class QdrantService:
    def __init__(self) -> None:
        self.collection_name = settings.qdrant_collection_name
        self.client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )

    async def initialize(self) -> None:
        """Robust initialization: create the collection and payload indexes."""
        try:
            exists = await self.client.collection_exists(self.collection_name)
            if not exists:
                await self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=settings.embedding_output_dimensionality,
                        distance=models.Distance.COSINE,
                    ),
                )
                logger.info(f"Qdrant collection '{self.collection_name}' created.")
            await self._ensure_indexes()
        except Exception as exc:
            logger.error(f"Qdrant robust init failed: {exc}")

    async def _ensure_indexes(self) -> None:
        keywords = ["status", "location_type", "company_id"]
        integers = ["salary_min", "salary_max", "expires_at_ts"]

        for field in keywords:
            try:
                await self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )
            except UnexpectedResponse as e:
                if "already exists" not in str(e).lower():
                    logger.warning(f"Could not create keyword index on {field}: {e}")

        for field in integers:
            try:
                await self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema=models.PayloadSchemaType.INTEGER,
                )
            except UnexpectedResponse as e:
                if "already exists" not in str(e).lower():
                    logger.warning(f"Could not create integer index on {field}: {e}")

        logger.info("Qdrant payload indexes verified.")

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
            vector = await ai_service.get_embeddings(text_content)
            await self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    models.PointStruct(
                        id=str(job.id),
                        vector=vector,
                        payload={
                            "company_id": str(job.company_id),
                            "status": job.status.value,
                            "location_type": job.location_type.value
                            if job.location_type
                            else None,
                            "salary_min": job.salary_min,
                            "salary_max": job.salary_max,
                            "expires_at_ts": _expires_at_to_ts(job.expires_at),
                        },
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

    async def search_jobs(
        self,
        query: str,
        location_type: str | None = None,
        salary_min: int | None = None,
        salary_max: int | None = None,
        page: int = 1,
        size: int = 10,
    ) -> tuple[list[dict], int]:
        """
        Perform semantic search with simple filter parameters.

        This method accepts standard Python types instead of Qdrant-specific models,
        making it easy to swap vector DB providers without changing business logic.

        Args:
            query: Semantic search query string
            location_type: Filter by location type (e.g., "remote", "onsite", "hybrid")
            salary_min: Minimum salary filter (job's max salary must be >= this)
            salary_max: Maximum salary filter (job's min salary must be <= this)
            page: Page number (1-indexed)
            size: Results per page

        Returns:
            Tuple of (results list, total count)
        """
        vector = await ai_service.get_embeddings(query)
        now_ts = int(datetime.now(timezone.utc).timestamp())

        active_condition = models.FieldCondition(
            key="status", match=models.MatchValue(value="active")
        )
        expires_condition = models.FieldCondition(
            key="expires_at_ts",
            range=models.Range(gt=now_ts),
        )
        base_must = [active_condition, expires_condition]

        filters: list[models.Condition] = []
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

        strict_response = await self.client.query_points(
            collection_name=self.collection_name,
            query=vector,
            query_filter=strict_filter,
            limit=size,
            offset=(page - 1) * size,
            with_payload=False,
        )

        results = [
            {"job_id": uuid.UUID(hit.id), "score": hit.score, "is_fallback": False}
            for hit in strict_response.points
        ]

        count_res = await self.client.count(
            collection_name=self.collection_name,
            count_filter=strict_filter,
        )
        strict_count = count_res.count

        if filters and len(results) < size:
            shortfall = size - len(results)
            fallback_offset = max(0, ((page - 1) * size) - strict_count)

            fallback_filter = models.Filter(
                must=base_must,
                must_not=filters,
            )

            fallback_response = await self.client.query_points(
                collection_name=self.collection_name,
                query=vector,
                query_filter=fallback_filter,
                limit=shortfall,
                offset=fallback_offset,
                with_payload=False,
            )

            results.extend(
                {"job_id": uuid.UUID(hit.id), "score": hit.score, "is_fallback": True}
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


qdrant_service = QdrantService()
