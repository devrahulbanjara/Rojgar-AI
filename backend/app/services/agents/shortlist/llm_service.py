from langchain_groq import ChatGroq

from app.core import settings


def get_llm() -> ChatGroq:
    return ChatGroq(
        temperature=settings.LLM_TEMPERATURE,
        model=settings.FAST_LLM,
        max_retries=settings.LLM_MAX_RETRIES,
        api_key=settings.GROQ_API_KEY,
    )
