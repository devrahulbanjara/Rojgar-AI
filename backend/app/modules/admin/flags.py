"""Spot job posts that ask applicants for money or exclude people unfairly.

Plain patterns, English and Nepali. A match only flags the job for platform
staff to look at; nothing is unpublished automatically.
"""

import re

_FEE = [
    r"\b(registration|processing|application|training|security|joining|interview"
    r"|form|admission|visa|medical)\s+(fee|charge|deposit)s?\b",
    r"\b(you|candidates?|applicants?)\s+(must|should|need to|have to|will)\s+"
    r"(pay|deposit|send)\b",
    r"\bpay\s+(a\s+|the\s+|an\s+)?(fee|deposit|charge|amount)\b",
    r"\brefundable\s+(deposit|amount)\b",
    r"\b(send|transfer|pay)\b[^.\n]{0,30}\b(esewa|khalti|ime\s*pay)\b",
    r"दर्ता\s*शुल्क",
    r"धरौटी",
    r"रकम\s*जम्मा",
]

_GROUPS = (
    r"(male|female|boys?|girls?|men|women|ladies|gents|brahmins?|bahuns?|chhetris?"
    r"|kshetris?|newars?|hindus?|muslims?|christians?|buddhists?|unmarried|married)"
)
_DISCRIMINATORY = [
    rf"\b{_GROUPS}\s+(only|candidates?\s+only|preferred)\b",
    rf"\bonly\s+{_GROUPS}\b",
    r"\b(maximum\s+age|age\s+limit|not\s+older\s+than|younger\s+than)\b",
    r"\b(under|below)\s+\d{2}\s*(years|yrs)\b",
    r"\bage\s*:?\s*\d{2}\s*(-|to)\s*\d{2}\b",
    r"\b(fair\s+(skin|complexion)|good[- ]looking|beautiful\s+(girls?|ladies|women)"
    r"|handsome\s+(boys?|men))\b",
    r"(केटा|केटी|पुरुष|महिला)\s*मात्र",
]

_RULES = [
    ("fee_requested", re.compile("|".join(_FEE), re.IGNORECASE)),
    ("discriminatory", re.compile("|".join(_DISCRIMINATORY), re.IGNORECASE)),
]

# Text fields of a job across model versions (v1 arrays, v2 description + criteria).
_TEXT_FIELDS = (
    "title",
    "description",
    "overview",
    "responsibilities",
    "requirements",
    "preferred_qualifications",
    "benefits",
    "must_haves",
    "nice_to_haves",
    "screening_questions",
    "questions",
)


def _flatten(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        return [str(v) for v in value.values() if isinstance(v, str)]
    if isinstance(value, (list, tuple)):
        return [text for item in value for text in _flatten(item)]
    return []


def job_text(job) -> str:
    return "\n".join(t for f in _TEXT_FIELDS for t in _flatten(getattr(job, f, None)))


def scan(text: str) -> list[tuple[str, str]]:
    """``[(reason, matched phrase)]``, at most one per reason."""
    found = []
    for reason, pattern in _RULES:
        match = pattern.search(text)
        if match:
            found.append((reason, match.group(0)))
    return found
