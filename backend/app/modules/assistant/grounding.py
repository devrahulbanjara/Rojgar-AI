"""Deterministic checks on what the assistant agents return (output guardrails).

Salary numbers must come from the recruiter or a cited source; quotes must
appear word for word in the applicant's data.
"""

import re
from typing import Any

from app.modules.assistant.schemas import JobDraft, Quote

_DEVANAGARI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")
_NUMBER = re.compile(
    r"(\d+(?:[.,]\d+)*)\s*(k|thousand|hajar|hazar|हजार|lakhs?|lacs?|लाख|million)?(?![a-z])"
)
_MULTIPLIERS = {
    "k": 1_000,
    "thousand": 1_000,
    "hajar": 1_000,
    "hazar": 1_000,
    "हजार": 1_000,
    "lakh": 100_000,
    "lac": 100_000,
    "लाख": 100_000,
    "million": 1_000_000,
}


def numbers_in(text: str) -> set[int]:
    """Every amount written in `text`, e.g. "145-215k" -> {145000, 215000, ...}.

    A bare number also counts with any multiplier used in the same text, so a
    range written once with a suffix is understood.
    """
    text = text.translate(_DEVANAGARI_DIGITS).lower()
    values: list[float] = []
    multipliers = {1}
    for match in _NUMBER.finditer(text):
        try:
            value = float(match.group(1).replace(",", ""))
        except ValueError:
            continue
        values.append(value)
        suffix = (match.group(2) or "").rstrip("s")
        multipliers.add(_MULTIPLIERS.get(suffix, 1))
    return {round(v * m) for v in values for m in multipliers}


def draft_language(texts: list[str]) -> str:
    """Nepali when the recruiter mostly writes Devanagari; English for English or
    Romanized Nepali (Romanized Nepali reads badly in a public job post)."""
    letters = [c for t in texts for c in t if c.isalpha()]
    devanagari = sum(1 for c in letters if "\u0900" <= c <= "\u097f")
    return "Nepali" if letters and devanagari * 2 > len(letters) else "English"


def ground_salary(
    draft: JobDraft, recruiter_text: str, cited: list[dict[str, str]]
) -> JobDraft:
    """Drop salary numbers that neither the recruiter nor a cited source wrote."""
    allowed = numbers_in(recruiter_text + " " + " ".join(r["snippet"] for r in cited))
    update: dict[str, Any] = {
        name: None
        for name in ("salary_min", "salary_max")
        if getattr(draft, name) is not None and getattr(draft, name) not in allowed
    }
    draft = draft.model_copy(update=update)
    if draft.salary_min is None and draft.salary_max is None:
        draft = draft.model_copy(update={"currency": None})
    elif not draft.currency:
        draft = draft.model_copy(update={"currency": "NPR"})
    return draft


def _norm(text: str) -> str:
    return " ".join(text.lower().split()).strip(" .…\"'“”‘’")


def verify_quotes(quotes: list[Quote], sections: dict[str, str]) -> list[Quote]:
    """Keep only quotes that appear word for word in the data (source corrected)."""
    normalized = {name: _norm(text) for name, text in sections.items()}
    kept: list[Quote] = []
    for quote in quotes:
        needle = _norm(quote.text)
        if len(needle) < 3:
            continue
        order = [quote.source] + [s for s in normalized if s != quote.source]
        source = next((s for s in order if needle in normalized.get(s, "")), None)
        if source:
            kept.append(Quote(text=quote.text.strip(), source=source))
    return kept[:3]
