from functools import lru_cache
from langchain_huggingface import HuggingFaceEmbeddings
from app.core.config import settings
from app.core.logging_config import logger
import os

os.environ["TOKENIZERS_PARALLELISM"] = "false"

@lru_cache(maxsize=1)
def get_embedding_model():
    logger.info("Loading Embedding Model...")
    return HuggingFaceEmbeddings(model_name=f"sentence-transformers/{settings.EMBEDDING_MODEL}")
