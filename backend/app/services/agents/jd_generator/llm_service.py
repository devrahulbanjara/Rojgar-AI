from langchain_groq import ChatGroq

from app.core import settings
from app.models.agents.jd_generator import JDGenNode


def get_llm():
    """Get a structured LLM instance configured for JD generation."""
    # JD generation requires more tokens than the default (500) to produce
    # complete job descriptions with all required sections

    llm = ChatGroq(
        temperature=settings.LLM_TEMPERATURE,
        model=settings.THINK_LLM,
        max_retries=settings.LLM_MAX_RETRIES,
        api_key=settings.GROQ_API_KEY,
    )

    return llm.with_structured_output(
        JDGenNode,
        method="json_schema",
        strict=True,
        include_raw=False,
    )


# Create the structured LLM instance
structured_llm = get_llm()
