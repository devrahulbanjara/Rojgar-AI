"""Human-readable URL slugs for public job and company pages."""

import re
import secrets
import string
import unicodedata

_ALPHABET = string.ascii_lowercase + string.digits
# Legal suffixes that add length but no meaning to a URL.
_COMPANY_NOISE = re.compile(
    r"\b(pvt|private|ltd|limited|inc|llc|corp|corporation)\b\.?", re.IGNORECASE
)


def slugify(value: str, max_length: int = 60) -> str:
    """Lowercase ASCII words joined by hyphens: "Sr. Backend (Python)" -> "sr-backend-python"."""
    ascii_text = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    )
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    # Cut at a word boundary so slugs never end in half a word.
    match = re.match(rf"^(.{{1,{max_length}}})(?:-|$)", slug)
    return match.group(1) if match else slug[:max_length]


def random_suffix(length: int = 4) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(length))


def company_slug_base(name: str, max_length: int = 60) -> str:
    """Company slug without legal suffixes: "F1Soft International Pvt. Ltd." -> "f1soft-international"."""
    return slugify(_COMPANY_NOISE.sub(" ", name), max_length)


def job_slug(title: str, company_name: str | None) -> str:
    """e.g. "senior-backend-engineer-f1soft-3k9x"; the suffix keeps reposts distinct."""
    parts = [slugify(title, 40) or "job"]
    if company_name:
        company = company_slug_base(company_name, 20)
        if company:
            parts.append(company)
    parts.append(random_suffix())
    return "-".join(parts)
