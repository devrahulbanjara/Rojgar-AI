from __future__ import annotations

from pathlib import Path


GENERATOR_DIR = Path(__file__).resolve().parent
BACKEND_DIR = GENERATOR_DIR.parent
TEMPLATES_DIR = GENERATOR_DIR / "templates"
OUTPUT_DIR = BACKEND_DIR / "golden_dataset"

GEMINI_API_KEYS = [
    "AIzaSyC5NraF_p_TYYgKXwJETw4ZzId7tvgbYeE", #convexhire
    "AIzaSyBIejZ9p2BS4Wf7sgqkHGFuRTiGbasMKMQ", #codefortanke
    "AIzaSyC6cz-JcUwPXiPbHJe0i_ypQtamgqTcbZA", #rahulbunn
    "AIzaSyA_H957pY3Cqz6rNu24jUw_vV1_T4XKJZQ", #rahulbanjara9843
    "AIzaSyB6iGEohvSnafwZ0WNRxkaIxT8FI4zbe7k", #sudeep
    "AIzaSyBfFJnoUPhC5f2Zqyo7xyCBFQstMWLgiis", #asiya
    "AIzaSyDZvjZW9ACAJ_US1zyU9aV6SElAStAO4NU", #simaralover
    "AIzaSyCQhqO_Nbkfyy2c9vKJgzdbeVsPaHJTfw4", #adex
    "AIzaSyBqbsyR2nZ6WBZe3NnkoNntSaEyhgLMdxQ", #herald
]

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
