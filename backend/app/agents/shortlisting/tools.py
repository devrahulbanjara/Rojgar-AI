from langchain_core.tools import tool

from app.core.config import settings
from app.infrastructures.search.service import search_service


@tool("web_search")
async def web_search(query: str) -> list[dict]:
    """Search the web for missing technical, company, or market context."""
    return await search_service.query(
        query=query,
        max_results=settings.shortlisting_web_search_max_results,
    )
