from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from sqlalchemy.orm import Session, selectinload

from app.core import settings
from app.core.logging_config import logger
from app.core.ml import get_embedding_model
from app.models.job import JobPosting


class JobVectorService:
    def __init__(self):
        self.embedding_model = get_embedding_model()
        self.client = QdrantClient(
            url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY
        )
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
            f"Role Overview: {jd.role_overview}",
        ]

        if isinstance(jd.required_skills_experience, dict):
            skills = jd.required_skills_experience.get("required_skills_experience", [])
            if skills:
                parts.append("Required Skills and Experience:")
                parts.extend(f"- {s}" for s in skills)

        if isinstance(jd.nice_to_have, dict):
            nice = jd.nice_to_have.get("nice_to_have", [])
            if nice:
                parts.append("Nice to Have:")
                parts.extend(f"- {n}" for n in nice)

        if isinstance(jd.offers, dict):
            benefits = jd.offers.get("benefits", [])
            if benefits:
                parts.append("Benefits:")
                parts.extend(f"- {b}" for b in benefits)

        return "\n".join(parts)

    def _get_organization_name(self, job: JobPosting) -> str:
        if not job.organization:
            return "Unknown Organization"
        return job.organization.name

    def index_all_pending_jobs(self, db: Session):
        if not self.qdrant:
            return

        pending_jobs = (
            db.query(JobPosting)
            .options(
                selectinload(JobPosting.job_description),
                selectinload(JobPosting.organization),
            )
            .filter(JobPosting.is_indexed == False)
            .all()
        )

        if not pending_jobs:
            logger.debug("No new jobs to index.")
            return

        logger.info(f"Indexing {len(pending_jobs)} new jobs...")

        for job in pending_jobs:
            try:
                text_content = self._construct_job_text(job)
                org_name = self._get_organization_name(job)

                metadata = {
                    "job_id": job.job_id,
                    "organization_id": job.organization_id,
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
                    "posted_date": job.posted_date.isoformat()
                    if job.posted_date
                    else None,
                }

                doc = Document(page_content=text_content, metadata=metadata)

                self.qdrant.add_documents([doc], ids=[job.job_id])

                job.is_indexed = True

            except Exception as e:
                logger.error(f"Failed to index job {job.job_id}: {e}")

        db.commit()
        logger.success(f"Indexed {len(pending_jobs)} new jobs.")

    def search_jobs(self, query: str, limit: int) -> list[int]:
        results = self.qdrant.similarity_search(query, k=limit)
        return [res.metadata["job_id"] for res in results]

    def recommend_jobs_by_skills(self, skills: list[str], limit: int) -> list[int]:
        if not skills:
            return []

        query_text = f"Job suitable for someone with skills: {', '.join(skills)}"
        return self.search_jobs(query_text, limit)
