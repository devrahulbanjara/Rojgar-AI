from __future__ import annotations

import re

_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")
_SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
_PHONE_RE = re.compile(
    r"(?<!\w)(?:\+?\d{1,3}[\s\-.])?(?:\(?\d{2,4}\)?[\s\-.]?){2,4}\d{2,4}(?!\w)"
)


def redact_pii(text: str) -> str:
    """Redact emails, phones, and SSN-like patterns from free-text.

    Use before sending recruiter free-text to external services (e.g. Tavily)
    where the query string is logged or shipped outside the tenant boundary.
    """
    if not text:
        return text
    text = _EMAIL_RE.sub("[email redacted]", text)
    text = _SSN_RE.sub("[id redacted]", text)
    text = _PHONE_RE.sub("[phone redacted]", text)
    return text


_BIAS_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "age",
        re.compile(
            r"\b(too\s+old|too\s+young|elderly|over\s*the\s*hill|young\s*blood|fresh\s*blood|millennial\s*only|gen[\s\-]?z\s*only|boomer)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "gender",
        re.compile(
            r"\b(male\s+only|female\s+only|men\s+only|women\s+only|girl\s+for\s+the\s+role|guy\s+for\s+the\s+role|she'?s\s+too\s+(aggressive|emotional)|he'?s\s+too\s+(passive|emotional))\b",
            re.IGNORECASE,
        ),
    ),
    (
        "family_status",
        re.compile(
            r"\b(pregnant|pregnancy|planning\s+(a\s+)?family|no\s+kids|married|unmarried|single\s+mother|single\s+father|childless)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "disability",
        re.compile(
            r"\b(disabled|handicapped|crippled|able[\s\-]?bodied\s+only|mentally\s+ill)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "national_origin",
        re.compile(
            r"\b(only\s+native\s+speakers?|no\s+foreigners?|no\s+immigrants?|locals?\s+only|non[\s\-]?native\s+speakers?\s+rejected)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "religion",
        re.compile(
            r"\b(must\s+be\s+(christian|muslim|hindu|jewish|buddhist|catholic|protestant)|no\s+(christians?|muslims?|hindus?|jews?|buddhists?))\b",
            re.IGNORECASE,
        ),
    ),
    (
        "race",
        re.compile(
            r"\b(whites?\s+only|blacks?\s+only|asians?\s+only|no\s+(whites?|blacks?|asians?|hispanics?|latinos?))\b",
            re.IGNORECASE,
        ),
    ),
)


def flag_bias(text: str) -> list[str]:
    """Return categories of protected-class language detected in `text`.

    Heuristic, not exhaustive. Catches obvious explicit-bias phrasing in
    recruiter-facing drafts (rejection emails, screening notes). Empty list
    means no categories matched — not a guarantee that the text is unbiased.
    """
    if not text:
        return []
    hits: list[str] = []
    for category, pattern in _BIAS_PATTERNS:
        if pattern.search(text):
            hits.append(category)
    return hits
