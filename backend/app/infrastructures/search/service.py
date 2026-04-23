from typing import Any

from langchain_tavily import TavilySearch
from loguru import logger

from app.core.config import settings


class SearchService:
    """
    Small wrapper around Tavily so the rest of the app can stay provider-agnostic.
    """

    def __init__(self) -> None:
        self._base_tool = TavilySearch(
            tavily_api_key=settings.tavily_api_key,
            max_results=6,
            search_depth="advanced",
            include_raw_content=True,
            country=None,
        )

    async def query(
        self,
        query: str,
        max_results: int = 6,
        search_depth: str = "advanced",
        country: str | None = None,
        **kwargs,
    ) -> list[dict[str, Any]]:
        """Execute a Tavily search and return standardised result dictionaries."""
        try:
            full_query = query.strip()
            if (
                country
                and country.strip()
                and country.lower() not in full_query.lower()
            ):
                full_query = f"{full_query} {country.strip()}"

            tool = TavilySearch(
                tavily_api_key=settings.tavily_api_key,
                max_results=max_results or 6,
                search_depth=search_depth or "advanced",
                include_raw_content=True,
                country=country or None,
            )

            result = await tool.ainvoke({"query": full_query})
            raw_results = result.get("results", []) if isinstance(result, dict) else []

            standardized: list[dict[str, Any]] = []
            for row in raw_results:
                standardized.append(
                    {
                        "title": row.get("title"),
                        "url": row.get("url"),
                        "content": row.get("content"),
                        "raw_content": row.get("raw_content"),
                        "relevance_score": row.get("score"),
                    }
                )

            return standardized[:max_results]
        except Exception as exc:
            logger.error("Search integration error: {}", exc)
            return []


search_service = SearchService()
