"""Canonical forms for identifiers compared case-insensitively."""


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_company_name(name: str) -> str:
    return " ".join(name.split()).lower()


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
    if plus:
        number = digits
    elif digits.startswith("977") and len(digits) >= 11:
        number = digits
    else:
        number = "977" + digits.lstrip("0")
    if not 8 <= len(number) <= 15:
        return None
    return "+" + number
