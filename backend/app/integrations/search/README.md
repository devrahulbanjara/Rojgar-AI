# Search Integration

This module provides an abstraction layer for web search functionality, currently backed by Tavily but designed to be easily swappable with other providers.

## Architecture

The `SearchService` class provides a vendor-agnostic interface for web search operations. This allows you to:

1. Switch search providers without changing business logic
2. Standardize search result formats across different providers
3. Implement fallback mechanisms or multi-provider strategies
4. Add caching, rate limiting, or other cross-cutting concerns in one place

## Current Implementation

- **Provider**: Tavily Search API
- **Features**: Advanced search depth, raw content extraction, relevance scoring

## Usage

```python
from app.integrations.search.service import search_service

# Basic search
results = await search_service.query("Python developer salary in USA")

# With parameters
results = await search_service.query(
    query="Senior engineer compensation",
    max_results=10,
    search_depth="advanced",
    country="usa"
)
```

## Result Format

All search results are standardized to the following format:

```python
{
    "title": str,              # Result title
    "url": str,                # Result URL
    "content": str,            # Short content snippet
    "raw_content": str,        # Full content (if available)
    "relevance_score": float,  # Relevance score (0-1)
}
```

## Switching Providers

To switch to a different search provider (e.g., Perplexity, Google, Serper):

1. Update the `SearchService.__init__()` method to initialize the new provider
2. Update the `SearchService.query()` method to call the new provider's API
3. Ensure the output is mapped to the standardized format
4. Update configuration in `app/core/config.py` if needed

**No changes required in business logic files** (`tools.py`, `service.py`, etc.)

## Example: Adding Perplexity as Provider

```python
class SearchService:
    def __init__(self):
        # Switch to Perplexity
        self._client = PerplexityClient(api_key=settings.perplexity_api_key)
    
    async def query(self, query: str, **kwargs) -> list[dict[str, Any]]:
        try:
            # Call Perplexity API
            response = await self._client.search(query)
            
            # Map to standardized format
            return [
                {
                    "title": item.title,
                    "url": item.url,
                    "content": item.snippet,
                    "raw_content": item.full_text,
                    "relevance_score": item.score,
                }
                for item in response.results
            ]
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
```

## Error Handling

The service gracefully handles errors by:
- Logging the error with context
- Returning an empty list instead of raising exceptions
- Allowing the application to continue with degraded functionality

This prevents search failures from breaking critical workflows like job draft generation.
