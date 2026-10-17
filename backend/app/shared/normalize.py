"""Canonical forms for identifiers compared case-insensitively."""

import re


def normalize_email(email: str) -> str:
    return email.strip().lower()


_DEVANAGARI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")


def normalize_phone(phone: str | None) -> str | None:
    """E.164 form with Nepal (+977) as the default country; None if not a phone.

    Accepts local mobiles (98XXXXXXXX), landlines with area code (01-4XXXXXX),
    00/+ international prefixes and Devanagari digits.
    """
    if not phone:
        return None
    raw = phone.strip().translate(_DEVANAGARI_DIGITS)
    plus = raw.startswith("+")
    digits = "".join(ch for ch in raw if ch.isdigit())
    if not digits:
        return None
    if not plus and digits.startswith("00"):
        digits, plus = digits[2:], True
    if plus or digits.startswith("977") and len(digits) >= 11:
        number = digits
    else:
        number = "977" + digits.lstrip("0")
    if not 8 <= len(number) <= 15:
        return None
    return "+" + number


_NP_MOBILE = re.compile(r"9[678]\d{8}")


def normalize_mobile(phone: str | None) -> str | None:
    """E.164 for a number that can get an SMS; None when it is not one.

    A Nepali mobile (98XXXXXXXX, with or without +977) or an explicit
    international number (+ or 00 prefix). Devanagari digits are accepted.
    """
    if not phone:
        return None
    cleaned = re.sub(r"[\s().-]", "", phone.strip().translate(_DEVANAGARI_DIGITS))
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
