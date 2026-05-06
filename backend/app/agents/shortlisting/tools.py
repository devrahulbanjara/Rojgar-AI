from langchain_core.tools import tool

from app.core.config import settings
from app.infrastructures.search.service import search_service

_SEARCH_CACHE: dict[tuple[str, str, str], list[dict]] = {}


def _summarize_results(rows: list[dict]) -> list[dict]:
    """Strip raw HTML and trim content so observations stay small."""
    summary: list[dict] = []
    for row in rows:
        content = row.get("content") or ""
        summary.append(
            {
                "title": row.get("title"),
                "url": row.get("url"),
                "content": content[:300],
            }
        )
    return summary


def make_web_search_tool(role: str, applicant_name: str):
    """Return a budgeted, cached web_search tool scoped to one persona run."""
    budget = {"left": settings.shortlisting_web_search_budget_per_persona}

    @tool("web_search")
    async def web_search(query: str) -> list[dict]:
        """Search the web for missing technical, company, or market context."""
        key = (applicant_name, role, query.strip().lower())
        if key in _SEARCH_CACHE:
            return _SEARCH_CACHE[key]
        if budget["left"] <= 0:
            return [{"note": "search budget exhausted; rely on resume+JD evidence"}]
        budget["left"] -= 1
        raw = await search_service.query(
            query=query,
            max_results=settings.shortlisting_web_search_max_results,
        )
        compact = _summarize_results(raw)
        _SEARCH_CACHE[key] = compact
        return compact

    return web_search
