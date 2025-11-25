from langchain_groq import ChatGroq
from settings import LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS, LLM_MAX_RETRIES


def get_llm() -> ChatGroq:
    return ChatGroq(
        temperature=LLM_TEMPERATURE,
        model_name=LLM_MODEL,
        max_tokens=LLM_MAX_TOKENS,
        max_retries=LLM_MAX_RETRIES,
    )