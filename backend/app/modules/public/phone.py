"""Applicant phone numbers. Stored as E.164; Nepal (+977) is the default."""

import re

_NP_MOBILE = re.compile(r"9[678]\d{8}")


def normalize_phone(raw: str | None) -> str | None:
    """E.164 for a Nepali mobile (98XXXXXXXX, with or without +977) or a
    +<country code> number; None when it is neither."""
    if not raw:
        return None
    cleaned = re.sub(r"[\s().-]", "", raw.strip())
    if cleaned.startswith("00"):
        cleaned = f"+{cleaned[2:]}"
    if cleaned.startswith("+"):
        rest = cleaned[1:]
        if not rest.isdigit():
            return None
        if rest.startswith("977"):
            return f"+{rest}" if _NP_MOBILE.fullmatch(rest[3:]) else None
        return f"+{rest}" if 8 <= len(rest) <= 15 else None
    if cleaned.startswith("977") and len(cleaned) == 13:
        cleaned = cleaned[3:]
    return f"+977{cleaned}" if _NP_MOBILE.fullmatch(cleaned) else None
