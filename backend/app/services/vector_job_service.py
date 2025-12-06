from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer

from app.core import logger, settings
from app.models import Job


class VectorJobService:
    def __init__(self):
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)

        qdrant_url = settings.QDRANT_URL
        qdrant_api_key = settings.QDRANT_API_KEY
        collection_name = settings.QDRANT_COLLECTION_JOBS

        logger.info(f"Connecting to Qdrant at: {qdrant_url}")

        self.client = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key,
        )
        self.collection_name = collection_name
        self._ensure_collection_exists()

    def _ensure_collection_exists(self):
        try:
            collection_exists = self.client.collection_exists(self.collection_name)
            logger.info(
                f"Collection '{self.collection_name}' exists: {collection_exists}"
            )

            if not collection_exists:
                logger.info(f"Creating collection: {self.collection_name}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.model.get_sentence_embedding_dimension(),
                        distance=Distance.COSINE,
                    ),
                )
                logger.info(f"Created collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Error ensuring collection exists: {str(e)}")
            raise

    def _create_job_text(self, job: Job) -> str:
        skills_text = ", ".join(job.skills) if job.skills else ""
        return f"{job.title}. {job.description}. {skills_text}"

    def _create_job_payload(self, job: Job) -> dict:
        return {
            "job_id": job.id,
            "title": job.title,
            "department": job.department,
            "level": job.level,
            "location": job.location,
            "location_type": job.location_type,
            "employment_type": job.employment_type,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "salary_currency": job.salary_currency,
            "company_id": job.company_id,
            "posted_date": job.posted_date.isoformat(),
            "status": job.status,
        }

    def add_job_to_vector_db(self, job: Job) -> bool:
        try:
            text = self._create_job_text(job)
            payload = self._create_job_payload(job)

            vector = self.model.encode([text])[0]

            point = PointStruct(id=job.id, vector=vector.tolist(), payload=payload)

            self.client.upsert(collection_name=self.collection_name, points=[point])

            logger.info(f"Added job {job.id} to vector database")
            return True

        except Exception as e:
            logger.error(f"Error adding job {job.id} to vector database: {str(e)}")
            return False

    def search_similar_jobs(self, query: str, limit: int = 5) -> list[dict]:
        try:
            query_vector = self.model.encode([query])[0]

            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector.tolist(),
                limit=limit,
            )

            results = []
            for hit in search_results:
                results.append(
                    {
                        "job_id": hit.payload.get("job_id"),
                        "title": hit.payload.get("title"),
                        "score": hit.score,
                        "payload": hit.payload,
                    }
                )

            return results

        except Exception as e:
            logger.error(f"Error searching similar jobs: {str(e)}")
            return []

    def delete_job_from_vector_db(self, job_id: int) -> bool:
        try:
            self.client.delete(
                collection_name=self.collection_name, points_selector=[job_id]
            )
            logger.info(f"Deleted job {job_id} from vector database")
            return True

        except Exception as e:
            logger.error(f"Error deleting job {job_id} from vector database: {str(e)}")
            return False

    def get_personalized_job_recommendations(
        self, user_skills: list[str], page: int = 1, limit: int = 10
    ) -> list[dict]:
        try:
            skills_text = ", ".join(user_skills)

            query_vector = self.model.encode([skills_text])[0]

            if page == 1:
                vector_limit = 10
            else:
                vector_limit = 20

            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector.tolist(),
                limit=vector_limit,
            )

            results = []
            for hit in search_results:
                results.append(
                    {
                        "job_id": hit.payload.get("job_id"),
                        "score": hit.score,
                        "payload": hit.payload,
                    }
                )

            if page == 1:
                return results[:10]
            else:
                start_idx = 10
                end_idx = start_idx + limit
                return results[start_idx:end_idx]

        except Exception as e:
            logger.error(f"Error getting personalized recommendations: {str(e)}")
            return []
