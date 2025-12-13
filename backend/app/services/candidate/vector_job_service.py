from typing import List, Optional
from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.ml import get_embedding_model
from app.models.job import JobPosting
import logging

logger = logging.getLogger(__name__)

class JobVectorService:
    def __init__(self):
        self.embedding_model = get_embedding_model()
        self.collection_name = settings.QDRANT_COLLECTION_JOBS
        self.vector_store: Optional[QdrantVectorStore] = None
        
        try:
            self.client = QdrantClient(
                url=settings.QDRANT_URL, 
                api_key=settings.QDRANT_API_KEY
            )
            self._ensure_collection_exists()
            
            self.vector_store = QdrantVectorStore(
                client=self.client,
                collection_name=self.collection_name,
                embedding=self.embedding_model,
            )
        except Exception as e:
            logger.error(f"Qdrant Connection Failed: {e}")
            self.vector_store = None

    def _get_embedding_dimension(self) -> int:
        test_embedding = self.embedding_model.embed_query("test")
        return len(test_embedding)

    def _ensure_collection_exists(self):
        embedding_dim = self._get_embedding_dimension()
        
        if self.client.collection_exists(self.collection_name):
            collection_info = self.client.get_collection(self.collection_name)
            existing_dim = collection_info.config.params.vectors.size
            
            if existing_dim != embedding_dim:
                logger.warning(
                    f"Collection dimension mismatch: existing={existing_dim}, model={embedding_dim}. "
                    f"Recreating collection..."
                )
                self.client.delete_collection(self.collection_name)
            else:
                logger.info(f"Using existing Qdrant collection: {self.collection_name} (dim={existing_dim})")
                return
        
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=models.VectorParams(size=embedding_dim, distance=models.Distance.COSINE)
        )
        logger.info(f"Created Qdrant collection: {self.collection_name} (dim={embedding_dim})")

    def _construct_job_text(self, job: JobPosting) -> str:
        skills_txt = ""
        benefits_txt = ""
        role_overview = ""

        if job.job_description:
            role_overview = job.job_description.role_overview or ""
            
            req = job.job_description.required_skills_experience
            if isinstance(req, dict):
                flat_skills = []
                for v in req.values():
                    if isinstance(v, list): flat_skills.extend(v)
                    elif isinstance(v, str): flat_skills.append(v)
                skills_txt = ", ".join(flat_skills)
            elif isinstance(req, list):
                skills_txt = ", ".join(req)

            offers = job.job_description.offers
            if isinstance(offers, dict) and "benefits" in offers:
                benefits_txt = ", ".join(offers["benefits"])

        return (
            f"Title: {job.title}. "
            f"Location: {job.location_city}, {job.location_country}. "
            f"Type: {job.employment_type}, Remote: {job.is_remote}. "
            f"Description: {role_overview}. "
            f"Skills: {skills_txt}. "
            f"Benefits: {benefits_txt}."
        )

    def index_all_pending_jobs(self, db: Session):
        if not self.vector_store:
            return

        pending_jobs = db.query(JobPosting).filter(JobPosting.is_indexed == False).all()
        if not pending_jobs:
            logger.info("No new jobs to index.")
            return

        logger.info(f"Indexing {len(pending_jobs)} new jobs...")

        for job in pending_jobs:
            try:
                text_content = self._construct_job_text(job)
                
                metadata = {
                    "job_id": job.job_id,
                    "company_id": job.company_id,
                    "title": job.title
                }
                
                doc = Document(page_content=text_content, metadata=metadata)
                
                self.vector_store.add_documents([doc], ids=[job.job_id])
                
                job.is_indexed = True
                
            except Exception as e:
                logger.error(f"Failed to index job {job.job_id}: {e}")

        db.commit()
        logger.info("Indexing complete.")

    def search_jobs(self, query: str, limit: int = 10) -> List[str]:
        if not self.vector_store or not query:
            return []
        
        results = self.vector_store.similarity_search(query, k=limit)
        return [res.metadata["job_id"] for res in results]

    def recommend_jobs_by_skills(self, skills: List[str], limit: int = 10) -> List[str]:
        if not skills:
            return []
        
        query_text = f"Job suitable for someone with skills: {', '.join(skills)}"
        return self.search_jobs(query_text, limit)
