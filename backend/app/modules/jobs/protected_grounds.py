"""Warn when hiring criteria ask about protected grounds.

Nepal Labour Act 2074, s.6 forbids discrimination in employment on grounds of
religion, colour, sex, caste, ethnicity, origin, language, region, ideology,
marital status, physical condition, disability, and similar. Recruiters type
must-haves and questions in English, romanized Nepali or Devanagari; this
filter flags the common ways those grounds slip into a job post.

High precision on purpose: genuine requirements (a driving licence, night
shifts, NNC/TSC/NPC registration, "18 years or older", "can lift 20 kg") are
never flagged. The result is a warning list; saving is never blocked.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Literal

from app.core.schemas import BaseSchema

_I = re.IGNORECASE


def _dev(*words: str) -> re.Pattern[str]:
    """Devanagari words with a left word boundary; suffixes (को, हरू) allowed."""
    return re.compile(r"(?<![\u0900-\u097F])(?:" + "|".join(words) + ")")


MESSAGES: dict[str, str] = {
    "gender": "Asking for a gender is not allowed (Labour Act 2074, s.6). Describe the work instead.",
    "caste_ethnicity": "Asking for a caste or ethnic group is not allowed (Labour Act 2074, s.6).",
    "religion": "Asking for a religion is not allowed (Labour Act 2074, s.6).",
    "marital_status": "Asking about marriage is not allowed (Labour Act 2074, s.6).",
    "age": "An age range or upper age limit is not allowed. Ask for the skill or experience instead.",
    "pregnancy_family": "Asking about pregnancy or children is not allowed (Labour Act 2074, s.6).",
    "disability": "Excluding people with a disability is not allowed. Describe the physical task instead.",
    "appearance": "Asking about looks is not allowed. Describe how the person should present the business instead.",
    "origin": "Asking where someone is from is not allowed unless the law requires it.",
}

# Possessive uses that describe the work, not the worker
# ("women's health ward", "men's wear section").
_GENDER_ALLOWED = re.compile(
    r"\b(?:wo)?men'?s\s+(?:health|wear|clothing|garments?|section|department|"
    r"ward|hostel|wing|products|fashion|team)\b",
    _I,
)

_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    "gender": [
        re.compile(
            r"\b(?:male|female|males|females|men|women|man|woman|boys?|girls?|"
            r"ladies|lady|gents|gentlemen|keta|keti|purush|mahila)\b",
            _I,
        ),
        _dev("पुरुष", "पुरूष", "महिला", "केटा", "केटी", "युवती", "युवक"),
    ],
    "caste_ethnicity": [
        re.compile(
            r"\b(?:brahmins?|bahuns?|chhetris?|chettris?|kshetris?|thakuris?|"
            r"newars|newar|tamangs?|gurungs?|magars?|limbus?|tharus?|madhesis?|"
            r"madheshis?|dalits?|janajatis?|caste|castes|jat|jaat|ethnicity|"
            r"ethnic\s+group)\b",
            _I,
        ),
        _dev(
            "ब्राह्मण",
            "बाहुन",
            "क्षेत्री",
            "ठकुरी",
            "नेवार",
            "दलित",
            "जनजाति",
            "मधेसी",
            "मधेशी",
            "जात",
        ),
    ],
    "religion": [
        re.compile(
            r"\b(?:hindus?|hinduism|muslims?|islam|islamic|christians?|"
            r"christianity|buddhists?|buddhism|jains?|sikhs?|religion|religious)\b",
            _I,
        ),
        _dev("हिन्दु", "हिन्दू", "मुस्लिम", "मुसलमान", "इसाई", "क्रिस्चियन", "बौद्ध", "धर्म"),
    ],
    "marital_status": [
        re.compile(
            r"\b(?:married|unmarried|marital|divorced|divorcee|widow|widowed|"
            r"spouse|husband|wife|bachelors?\s+only)\b",
            _I,
        ),
        re.compile(
            r"\bsingle\s+(?:candidates?|women|men|girls?|boys?|only|status)\b", _I
        ),
        re.compile(r"\b(?:be|being)\s+single\b", _I),
        _dev("विवाहित", "अविवाहित", "बिवाहित", "बिहे", "वैवाहिक", "श्रीमती", "श्रीमान"),
    ],
    "age": [
        re.compile(
            r"\bage(?:d)?\s*(?:limit|range|bracket|between|group|[:\-]?\s*\d{2}\s*"
            r"(?:-|–|to)\s*\d{2})",
            _I,
        ),
        re.compile(
            r"\b(?:under|below|less\s+than|not\s+(?:more|older)\s+than|max(?:imum)?|"
            r"up\s*to|upto|younger\s+than)\s+(?:the\s+age\s+of\s+)?\d{2}\s*"
            r"(?:years?|yrs?)?\s*(?:old|of\s+age)",
            _I,
        ),
        re.compile(
            r"\b(?:under|below|less\s+than|max(?:imum)?)\s+age\s*(?:of\s*)?\d{2}\b", _I
        ),
        re.compile(
            r"\b\d{2}\s*(?:-|–|to)\s*\d{2}\s*(?:years?|yrs?)?\s*(?:old|of\s+age)\b",
            _I,
        ),
        re.compile(
            r"\bbetween\s+\d{2}\s+and\s+\d{2}\s*(?:years?|yrs?)?\s*(?:old|of\s+age)\b",
            _I,
        ),
        re.compile(r"\b(?:young|youthful|fresh\s+blood)\b", _I),
        re.compile(r"उमेर.*(?:भन्दा\s*कम|सम्म|ननाघेको|नाघेको|बढी\s*नभएको|\d+\s*[-–]\s*\d+)"),
        re.compile(r"\d+\s*वर्ष\s*(?:भन्दा\s*कम|सम्म)(?:\s*को)?\s*उमेर"),
    ],
    "pregnancy_family": [
        re.compile(
            r"\b(?:pregnant|pregnancy|no\s+(?:kids|children)|childless|"
            r"planning\s+(?:a\s+)?family)\b",
            _I,
        ),
        _dev("गर्भवती", r"बच्चा\s*नभएको"),
    ],
    "disability": [
        re.compile(
            r"\b(?:no\s+|without\s+(?:any\s+)?|free\s+(?:of|from)\s+(?:any\s+)?)"
            r"(?:physical\s+)?disabilit(?:y|ies)\b",
            _I,
        ),
        re.compile(
            r"\b(?:handicap(?:ped)?|able[\s-]bodied|not\s+(?:be\s+)?disabled)\b", _I
        ),
        _dev("अपाङ्ग", "अपांग"),
    ],
    "appearance": [
        re.compile(
            r"\b(?:good[\s-]looking|attractive|beautiful|handsome|pretty|slim|"
            r"fair\s+(?:skin|complexion|colou?r)|smart[\s-]looking|"
            r"pleasing\s+(?:personality|appearance|looks?))\b",
            _I,
        ),
        _dev("राम्री", r"राम्रो\s*देखिने", "गोरो", "गोरी", "आकर्षक"),
    ],
    "origin": [
        re.compile(r"\b(?:only\s+locals?|locals?\s+only)\b", _I),
        re.compile(r"\blocal\s+(?:candidates?|people|residents?)\s+only\b", _I),
        re.compile(
            r"\b(?:only\s+from\s+[A-Za-z]+|from\s+[A-Za-z]+\s+(?:district\s+)?only)\b",
            _I,
        ),
        re.compile(r"\b(?:citizens?|residents?|nationals?)\s+only\b", _I),
        re.compile(
            r"\b(?:pahadi|pahade|madhesi|terai|hill)\s+(?:people|candidates?)\b", _I
        ),
        re.compile(r"स्थानीय\s*(?:बासिन्दा\s*)?मात्र"),
    ],
}


class CriterionWarning(BaseSchema):
    field: Literal["must_haves", "nice_to_haves", "questions"]
    index: int
    text: str
    ground: str
    message: str


def _normalize(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text or "").split())


def protected_grounds_in(text: str) -> list[str]:
    """Return the protected grounds a single criterion touches (in order)."""
    clean = _normalize(text)
    if not clean:
        return []
    found: list[str] = []
    for ground, patterns in _PATTERNS.items():
        haystack = _GENDER_ALLOWED.sub(" ", clean) if ground == "gender" else clean
        if any(p.search(haystack) for p in patterns):
            found.append(ground)
    return found


def check_protected_grounds(
    must_haves: list[str] | None,
    nice_to_haves: list[str] | None,
    questions: list[dict] | None,
) -> list[CriterionWarning]:
    """Warn about must-haves, nice-to-haves and questions that ask about a protected ground."""
    items: list[tuple[str, int, str]] = []
    items += [("must_haves", i, t) for i, t in enumerate(must_haves or [])]
    items += [("nice_to_haves", i, t) for i, t in enumerate(nice_to_haves or [])]
    items += [
        ("questions", i, str((q or {}).get("label") or ""))
        for i, q in enumerate(questions or [])
    ]
    warnings: list[CriterionWarning] = []
    for field, index, text in items:
        for ground in protected_grounds_in(text):
            warnings.append(
                CriterionWarning(
                    field=field,  # type: ignore[arg-type]
                    index=index,
                    text=text,
                    ground=ground,
                    message=MESSAGES[ground],
                )
            )
    return warnings
