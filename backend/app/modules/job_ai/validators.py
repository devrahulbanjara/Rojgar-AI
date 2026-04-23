from collections import Counter

from app.modules.job_ai.schemas import JobDraft


BANNED_PHRASES = {
    "young and energetic",
    "digital native",
    "he will",
    "she will",
    "recent graduate only",
    "native english speaker",
}


def validate_job_draft(draft: JobDraft) -> list[str]:
    """Return validation warnings for a generated job draft."""
    errors: list[str] = []

    if not draft.title.strip():
        errors.append("Title is required")

    if len(draft.responsibilities) == 0:
        errors.append("At least one responsibility is required")

    if len(draft.requirements) == 0:
        errors.append("At least one requirement is required")

    if draft.salary_min is not None and draft.salary_min < 0:
        errors.append("salary_min must be >= 0")

    if draft.salary_max is not None and draft.salary_max < 0:
        errors.append("salary_max must be >= 0")

    if (
        draft.salary_min is not None
        and draft.salary_max is not None
        and draft.salary_min > draft.salary_max
    ):
        errors.append("salary_min cannot exceed salary_max")

    all_bullets = (
        draft.responsibilities
        + draft.requirements
        + draft.preferred_qualifications
        + draft.benefits
    )
    counts = Counter(item.strip().lower() for item in all_bullets if item.strip())
    duplicates = [text for text, count in counts.items() if count > 1]
    if duplicates:
        errors.append(f"Duplicate bullet points detected: {duplicates[:5]}")

    haystack = " ".join(
        [draft.title, draft.overview]
        + draft.responsibilities
        + draft.requirements
        + draft.preferred_qualifications
    ).lower()
    for phrase in BANNED_PHRASES:
        if phrase in haystack:
            errors.append(f"Potentially problematic phrasing detected: '{phrase}'")

    return errors
