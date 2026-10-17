"""Fast, local CV reading for the public apply form.

Prefill must answer while the candidate is still on the form, so it never
calls a paid extraction API: pypdf text + a few regexes. Structured parsing
(experience, skills) happens later in the background.
"""

import asyncio
import io
import re

from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from app.core.config import settings

PDF_MAGIC = b"%PDF-"
MAX_PAGES = 6

_EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
_PHONE = re.compile(
    r"(?:\+?977[\s-]?)?(?:9[678]\d{8}|0\d{1,2}[\s-]?\d{6,7})|\+\d[\d\s-]{8,14}\d"
)
_URL = re.compile(r"(?:https?://)?(?:www\.)?[A-Za-z0-9.-]+\.[a-z]{2,}(?:/[^\s,;)]*)?")
_NAME_LINE = re.compile(r"^[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){1,3}$")
_NOT_A_NAME = re.compile(
    r"\b(resume|curriculum|vitae|cv|profile|summary|contact|email|phone|address)\b",
    re.IGNORECASE,
)


async def read_cv_upload(file: UploadFile) -> bytes:
    """Read an uploaded CV, enforcing size and real-PDF content (not the filename)."""
    data = await file.read()
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="The CV file is empty.")
    if len(data) > settings.resume_import_max_upload_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The CV must be 10 MB or smaller.",
        )
    if not data.startswith(PDF_MAGIC):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, detail="Please upload your CV as a PDF."
        )
    return data


def _extract_text_sync(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        pages = reader.pages[:MAX_PAGES]
        return "\n".join((page.extract_text() or "") for page in pages)
    except (PdfReadError, ValueError, KeyError, TypeError):
        return ""


async def extract_text(data: bytes) -> str:
    """PDF text, parsed off the event loop."""
    return await asyncio.to_thread(_extract_text_sync, data)


def _clean_url(url: str) -> str:
    url = url.rstrip(".")
    return url if url.startswith("http") else f"https://{url}"


def prefill_from_text(text: str) -> dict[str, str | None]:
    """Best-effort contact details from CV text; every field may be None."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    full_name = None
    for line in lines[:8]:
        if _NAME_LINE.match(line) and not _NOT_A_NAME.search(line):
            full_name = line.title() if line.isupper() else line
            break

    email_match = _EMAIL.search(text)
    phone_match = _PHONE.search(text)

    linkedin = github = portfolio = None
    for raw in _URL.findall(text):
        if "@" in raw:
            continue
        lowered = raw.lower()
        if "linkedin.com/" in lowered and not linkedin:
            linkedin = _clean_url(raw)
        elif "github.com/" in lowered and not github:
            github = _clean_url(raw)
        elif (
            not portfolio
            and "/" in raw
            and not any(host in lowered for host in ("linkedin.com", "github.com"))
        ):
            portfolio = _clean_url(raw)

    return {
        "full_name": full_name,
        "email": email_match.group(0).lower() if email_match else None,
        "phone": re.sub(r"[\s-]", "", phone_match.group(0)) if phone_match else None,
        "linkedin_url": linkedin,
        "github_url": github,
        "portfolio_url": portfolio,
    }
