from __future__ import annotations

from pathlib import Path


GENERATOR_DIR = Path(__file__).resolve().parent
BACKEND_DIR = GENERATOR_DIR.parent
TEMPLATES_DIR = GENERATOR_DIR / "templates"
OUTPUT_DIR = BACKEND_DIR / "golden_dataset"

GEMINI_API_KEYS = []

GEMINI_MODELS = [
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
]

REQUEST_DELAY_SECONDS = 2
RETRY_DELAY_SECONDS = 5
MAX_ATTEMPTS_PER_RESUME = 4
TOTAL_RESUMES = 45
STYLE_TARGET_COUNT = 15


def get_configured_gemini_api_keys() -> list[str]:
    return [
        key.strip()
        for key in GEMINI_API_KEYS
        if key.strip() and not key.strip().startswith("REPLACE_WITH_GEMINI_API_KEY_")
    ]
