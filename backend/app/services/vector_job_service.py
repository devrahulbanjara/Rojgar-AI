from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer

from app.core import logger, settings
from app.models import Job



class VectorJobService:
    """
    Service for managing vector embeddings and semantic search for jobs.
    Uses Qdrant for vector storage and SentenceTransformer for embedding generation.
    """

    def __init__(self):
        """
        Initialize the VectorJobService.
        Sets up the embedding model (SentenceTransformer) and the Qdrant client.
        Ensures the collection exists.
        """
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
        """
        Check if the Qdrant collection exists and create it if not.
        Configures the vector size and distance metric (Cosine).
        """
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
        """
        Create a text representation of a job for embedding generation.

        Args:
            job: The Job object

        Returns:
            A string combining title, description, and skills
        """
        skills_text = ", ".join(job.skills) if job.skills else ""
        return f"{job.title}. {job.description}. {skills_text}"

    def _create_job_payload(self, job: Job) -> dict:
        """
        Create a metadata payload for storage in Qdrant.

        Args:
            job: The Job object

        Returns:
            Dictionary containing job metadata
        """
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
        """
        Add or update a job in the vector database.
        Generates an embedding for the job and stores it with metadata.

        Args:
            job: The Job object to add

        Returns:
            True if successful, False otherwise
        """
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
        """
        Search for jobs similar to a text query.

        Args:
            query: The search query text
            limit: Maximum number of results to return

        Returns:
            List of dictionaries containing job details and similarity scores
        """
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
        """
        Delete a job from the vector database.

        Args:
            job_id: The ID of the job to delete

        Returns:
            True if successful, False otherwise
        """
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
        """
        Get job recommendations based on user skills.
        Uses the skills list to generate a query vector.

        Args:
            user_skills: List of skill strings
            page: Page number for pagination (simulated)
            limit: Number of items per page

        Returns:
            List of dictionaries containing recommended job details and scores
        """
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

