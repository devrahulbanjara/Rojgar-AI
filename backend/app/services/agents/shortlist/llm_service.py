from langchain_groq import ChatGroq
from app.core.config import settings
from app.core.config import settings


def get_llm() -> ChatGroq:
    return ChatGroq(
        temperature=settings.LLM_TEMPERATURE,
        model_name=settings.FAST_LLM,
        max_tokens=settings.LLM_MAX_TOKENS,
        max_retries=settings.LLM_MAX_RETRIES,
        api_key=settings.GROQ_API_KEY,
    )
