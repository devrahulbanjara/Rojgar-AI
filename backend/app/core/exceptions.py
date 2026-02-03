# This file is kept minimal - all exception handling now uses FastAPI's HTTPException directly
# Exception metrics tracking (kept for backward compatibility with metrics endpoint)
_exception_counts: dict[str, int] = {}


def get_exception_metrics() -> dict[str, int]:
    """Get current exception metrics"""
    return _exception_counts.copy()
