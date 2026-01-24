import os
from functools import lru_cache

from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings

from app.core.config import settings
from app.core.logging_config import logger

os.environ["TOKENIZERS_PARALLELISM"] = "false"


@lru_cache(maxsize=1)
def get_embedding_model():
    logger.info("Loading Embedding Model...")
    return HuggingFaceEmbeddings(
        model_name=f"sentence-transformers/{settings.EMBEDDING_MODEL}"
    )


def get_llm(model: str):
    return ChatGroq(
        temperature=settings.LLM_TEMPERATURE,
        model=model,
        max_retries=settings.LLM_MAX_RETRIES,
        api_key=settings.GROQ_API_KEY,
    )
