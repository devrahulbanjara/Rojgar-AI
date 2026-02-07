import uuid

from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core import settings
from app.core.logging_config import logger
from app.db.models.job import JobPosting
from app.integrations.llm.provider import get_embedding_model


class JobVectorService:
    def __init__(self):
        self.embedding_model = get_embedding_model()
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self._ensure_collection_exists()
        self.qdrant = QdrantVectorStore(
            client=self.client,
            collection_name=self.collection_name,
            embedding=self.embedding_model,
            retrieval_mode=RetrievalMode.DENSE,
        )

    def _ensure_collection_exists(self):
        if not self.client.collection_exists(self.collection_name):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_DIM, distance=Distance.COSINE
                ),
            )
            logger.trace(f"Created Qdrant collection: {self.collection_name}")
        else:
            logger.trace(f"Qdrant collection already exists: {self.collection_name}")

    def _construct_job_text(self, job: JobPosting) -> str:
        if not job.job_description:
            org_name = self._get_organization_name(job)
            return f"Title: {job.title}\nOrganization: {org_name}"
        jd = job.job_description
        org_name = self._get_organization_name(job)
        parts = [
            f"Title: {job.title}",
            f"Organization: {org_name}",
            f"Job Summary: {jd.job_summary}",
            f"Job Responsibilities: {jd.job_responsibilities}",
            f"Required Qualifications: {jd.required_qualifications}",
            f"Preferred: {jd.preferred}",
            f"Compensation and Benefits: {jd.compensation_and_benefits}",
        ]
        return "\n".join(parts)

    def _get_organization_name(self, job: JobPosting) -> str:
        if not job.organization:
            return "Unknown Organization"
        return job.organization.name

    async def index_job(self, job: JobPosting, db: AsyncSession | None = None) -> bool:
        if not self.qdrant:
            logger.warning("Qdrant vector store not initialized")
            return False
        if job.status != "active":
            logger.debug(
                f"Skipping indexing for job {job.job_id}: status is not 'active'"
            )
            return False
        try:
            text_content = self._construct_job_text(job)
            org_name = self._get_organization_name(job)
            metadata = {
                "job_id": str(job.job_id),
                "organization_id": str(job.organization_id),
                "organization_name": org_name,
                "title": job.title,
                "city": job.location_city,
                "country": job.location_country,
                "type": job.location_type,
                "employment_type": job.employment_type,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "salary_currency": job.salary_currency,
                "status": job.status,
                "posted_date": job.posted_date.isoformat() if job.posted_date else None,
            }
            doc = Document(page_content=text_content, metadata=metadata)
            await self.qdrant.aadd_documents([doc], ids=[str(job.job_id)])
            job.is_indexed = True
            if db:
                await db.flush()
            logger.info(f"Successfully indexed job {job.job_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to index job {job.job_id}: {e}")
            return False

    async def index_all_pending_jobs(self, db: AsyncSession):
        if not self.qdrant:
            logger.warning("Qdrant vector store not initialized, skipping job indexing")
            return
        stmt = (
            select(JobPosting)
            .options(
                selectinload(JobPosting.job_description),
                selectinload(JobPosting.organization),
            )
            .where(JobPosting.is_indexed == False, JobPosting.status == "active")
        )
        result = await db.execute(stmt)
        pending_jobs = result.scalars().all()
        if not pending_jobs:
            logger.debug(
                "No pending active jobs to index (is_indexed=False, status=active)"
            )
            return
        logger.info(
            f"Found {len(pending_jobs)} pending active jobs to index (is_indexed=False, status=active)"
        )
        successful = 0
        failed = 0
        for job in pending_jobs:
            if await self.index_job(job, db):
                successful += 1
            else:
                failed += 1
        await db.commit()
        logger.success(
            f"Completed indexing: {successful} successful, {failed} failed out of {len(pending_jobs)} total jobs"
        )

    async def search_jobs(self, query: str, limit: int) -> list[uuid.UUID]:
        try:
            if not self.qdrant:
                logger.warning("Qdrant vector store not initialized")
                return []
            results = await self.qdrant.asimilarity_search(query, k=limit)
            if not results:
                return []
            job_ids = []
            for res in results:
                try:
                    job_id_str = res.metadata.get("job_id")
                    if job_id_str:
                        job_ids.append(uuid.UUID(job_id_str))
                except (ValueError, KeyError):
                    continue
            return job_ids
        except Exception as e:
            logger.error(f"Vector search error: {e}")
            return []

    async def recommend_jobs_by_skills(
        self, skills: list[str], limit: int
    ) -> list[uuid.UUID]:
        if not skills:
            return []
        query_text = f"Job suitable for someone with skills: {', '.join(skills)}"
        return await self.search_jobs(query_text, limit)
