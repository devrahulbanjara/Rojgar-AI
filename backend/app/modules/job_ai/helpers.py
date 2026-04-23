from typing import Any


MAX_SALARY_SEARCH_RESULTS = 5
MAX_SALARY_CONTENT_CHARS = 500
MAX_SALARY_TITLE_CHARS = 160


def truncate_text(value: Any, max_chars: int) -> str | None:
    """Trim text to a bounded character count for prompts and summaries."""
    if not value:
        return None

    text = " ".join(str(value).split())
    if len(text) <= max_chars:
        return text
    return f"{text[: max_chars - 1].rstrip()}…"
