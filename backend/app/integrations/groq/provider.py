from langchain_groq import ChatGroq

from app.core.config import settings


def get_llm(model: str):
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is required but not configured")

    return ChatGroq(
        temperature=settings.LLM_TEMPERATURE,
        model=model,
        max_retries=settings.LLM_MAX_RETRIES,
        api_key=settings.GROQ_API_KEY,
    )
