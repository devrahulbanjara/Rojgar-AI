from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq

from app.core.config import settings


def get_embedding_model():
    return GoogleGenerativeAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        api_key=settings.GOOGLE_API_KEY,
        output_dimensionality=settings.EMBEDDING_DIM,
    )


def get_llm(model: str):
    return ChatGroq(
        temperature=settings.LLM_TEMPERATURE,
        model=model,
        max_retries=settings.LLM_MAX_RETRIES,
        api_key=settings.GROQ_API_KEY,
    )
