from langchain_tavily import TavilySearch

from app.core.config import settings


def get_tavily_search(max_results: int = 3):
    return TavilySearch(max_results=max_results, tavily_api_key=settings.TAVILY_API_KEY)
