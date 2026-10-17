"""Unicode clean-up shared by the injection rail and evidence-quote checks.

Works for English, Nepali (Devanagari) and mixed text.
"""

from __future__ import annotations

import re
import unicodedata

_SPACE_RE = re.compile(r"\s+")
# Typographic variants a model may emit when it re-types a quote.
_PUNCT = str.maketrans(
    {
        "‘": "'",
        "’": "'",
        "‚": "'",
        "‛": "'",
        "“": '"',
        "”": '"',
        "„": '"',
        "‐": "-",
        "‑": "-",
        "‒": "-",
        "–": "-",
        "—": "-",
        "−": "-",
        " ": " ",
        "…": "...",
    }
)


def strip_invisible(text: str) -> str:
    """Drop format characters: zero-width, bidi controls, soft hyphen, BOM.

    Hidden instructions spelled with zero-width joiners between letters, or
    reordered with bidi overrides, become plain readable text.
    """
    return "".join(
        ch
        for ch in text
        if unicodedata.category(ch) != "Cf" and (ch in "\n\t" or ch.isprintable())
    )


def clean_for_classifier(text: str) -> str:
    """NFKC + invisible characters removed + whitespace collapsed."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKC", text)
    return _SPACE_RE.sub(" ", strip_invisible(text)).strip()


def match_key(text: str) -> str:
    """Comparable form for "does this quote appear in the CV" checks.

    NFC on both sides (Devanagari has composed/decomposed forms), invisible
    characters removed, typographic quotes/dashes unified, case folded,
    whitespace collapsed.
    """
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text).translate(_PUNCT)
    text = strip_invisible(text).casefold()
    return _SPACE_RE.sub(" ", text).strip()
