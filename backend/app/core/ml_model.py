from sentence_transformers import SentenceTransformer
import logging

from app.core import settings

logger = logging.getLogger(__name__)

class ModelManager:
    _model = None

    @classmethod
    def initialize(cls):
        """
        Initialize the SentenceTransformer model.
        This should be called once at application startup.
        """
        if cls._model is None:
            logger.info(f"Loading SentenceTransformer model: {settings.EMBEDDING_MODEL}")
            cls._model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("SentenceTransformer model loaded successfully.")
        else:
            logger.warning("SentenceTransformer model already initialized.")

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """
        Get the initialized SentenceTransformer model.
        Raises an error if the model is not initialized.
        """
        if cls._model is None:
            raise RuntimeError("SentenceTransformer model is not initialized. Call initialize() first.")
        return cls._model
