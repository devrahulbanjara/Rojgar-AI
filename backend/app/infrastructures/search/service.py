from typing import Any

from langchain_tavily import TavilySearch
from langchain_tavily._utilities import TavilySearchAPIWrapper
from loguru import logger
from pydantic import SecretStr

from app.core.config import settings


class SearchService:
    """
    Abstraction for web search. Currently backed by Tavily,
    but can be swapped for any provider (Perplexity, Google, etc.).
    """

    def __init__(self):
        api_wrapper = TavilySearchAPIWrapper(
            tavily_api_key=SecretStr(settings.tavily_api_key)
        )
        self._tool = TavilySearch(
            max_results=6,
            search_depth="advanced",
            include_raw_content=True,
            api_wrapper=api_wrapper,
        )

    async def query(
        self,
        query: str,
        max_results: int = 6,
        search_depth: str = "advanced",
        country: str | None = None,
        **kwargs,
    ) -> list[dict[str, Any]]:
        """
        Generic search method that returns a standardized list of results.

        Args:
            query: Search query string
            max_results: Maximum number of results to return
            search_depth: Search depth ("basic" or "advanced")
            country: Optional country filter
            **kwargs: Additional provider-specific parameters

        Returns:
            List of standardized search results with keys:
            - title: Result title
            - url: Result URL
            - content: Short content snippet
            - raw_content: Full content if available
            - relevance_score: Relevance score (0-1)
        """
        try:
            full_query = query.strip()
            if (
                country
                and country.strip()
                and country.lower() not in full_query.lower()
            ):
                full_query = f"{full_query} {country.strip()}"
            search_params: dict[str, Any] = {"query": full_query}
            if search_depth:
                search_params["search_depth"] = search_depth
            if max_results:
                search_params["max_results"] = max_results

            result = await self._tool.ainvoke(search_params)
            raw_results = result.get("results", []) if isinstance(result, dict) else []

            standardized = []
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

        except Exception as e:
            logger.error(f"Search integration error: {e}")
            return []


search_service = SearchService()
