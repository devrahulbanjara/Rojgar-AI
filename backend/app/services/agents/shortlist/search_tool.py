from ddgs import ddg_api
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field


class SearchInput(BaseModel):
    query: str = Field(description="The search query")


def lite_search(query: str) -> str:
    try:
        return ddg_api.run(query)[:800]
    except Exception as e:
        logger.error(f"Error searching web: {e}")
        return "No results."


search_tool = StructuredTool.from_function(
    func=lite_search,
    name="web_search",
    description="Search web for current information to verify claims, certifications, companies, technologies.",
    args_schema=SearchInput,
)
