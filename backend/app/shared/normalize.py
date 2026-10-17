"""Canonical forms for identifiers compared case-insensitively."""


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_company_name(name: str) -> str:
    return " ".join(name.split()).lower()
