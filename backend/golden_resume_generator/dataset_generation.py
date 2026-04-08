from __future__ import annotations

import json
import sys
import time
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types

try:
    from google.api_core import exceptions as google_api_exceptions
except ImportError:  # pragma: no cover - optional dependency
    google_api_exceptions = None

from dataset_models import GeneratedResumePayload, ResumeSpec
from dataset_personas import build_resume_specs
from dataset_prompts import SYSTEM_PROMPT, build_user_prompt
from dataset_rendering import render_pdf, sanitize_render_plan
from dataset_settings import (
    GEMINI_MODELS,
    MAX_ATTEMPTS_PER_RESUME,
    OUTPUT_DIR,
    REQUEST_DELAY_SECONDS,
    RETRY_DELAY_SECONDS,
    STYLE_TARGET_COUNT,
    TOTAL_RESUMES,
    get_configured_gemini_api_keys,
)


@dataclass(frozen=True)
class GenerationResult:
    payload: GeneratedResumePayload
    model_name: str
    api_key_slot: int


class GeminiRuntimePool:
    def __init__(self, api_keys: list[str], model_names: list[str]) -> None:
        if not api_keys:
            raise ValueError("At least one Gemini API key must be configured.")
        if not model_names:
            raise ValueError("At least one Gemini model must be configured.")

        self._api_keys = api_keys
        self._model_names = model_names
        self._key_index = 0
        self._model_index = 0
        self._client: genai.Client | None = None
        self._client_key_index: int | None = None

    @property
    def current_model_name(self) -> str:
        return self._model_names[self._model_index]

    @property
    def current_api_key_slot(self) -> int:
        return self._key_index + 1

    def get_client(self) -> genai.Client:
        if self._client is None or self._client_key_index != self._key_index:
            self._client = genai.Client(api_key=self._api_keys[self._key_index])
            self._client_key_index = self._key_index
        return self._client

    def advance(self) -> bool:
        next_model_index = self._model_index + 1
        if next_model_index < len(self._model_names):
            self._model_index = next_model_index
            return True

        next_key_index = self._key_index + 1
        if next_key_index < len(self._api_keys):
            self._key_index = next_key_index
            self._model_index = 0
            self._client = None
            self._client_key_index = None
            return True

        return False


def is_rate_limit_error(exc: Exception) -> bool:
    if google_api_exceptions is not None and isinstance(
        exc, google_api_exceptions.ResourceExhausted
    ):
        return True

    message = str(exc).casefold()
    return any(
        marker in message
        for marker in {
            "rate limit",
            "quota",
            "resource exhausted",
            "rate_limit_exceeded",
            "too many requests",
            "429",
        }
    )


def save_json(payload: dict[str, Any], output_path: Path) -> None:
    output_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def verify_dataset_inventory(output_dir: Path, expected_count: int) -> None:
    pdf_count = len(list(output_dir.glob("resume_*.pdf")))
    ground_truth_count = len(list(output_dir.glob("resume_*_ground_truth.json")))
    meta_count = len(list(output_dir.glob("resume_*_meta.json")))

    if pdf_count != expected_count:
        raise RuntimeError(
            f"Expected {expected_count} PDF files, found {pdf_count} in {output_dir}."
        )
    if ground_truth_count != expected_count:
        raise RuntimeError(
            f"Expected {expected_count} ground-truth JSON files, found {ground_truth_count}."
        )
    if meta_count != expected_count:
        raise RuntimeError(
            f"Expected {expected_count} metadata JSON files, found {meta_count}."
        )


def generate_resume_payload(
    runtime_pool: GeminiRuntimePool,
    spec: ResumeSpec,
    *,
    seed: int,
) -> GenerationResult:
    while True:
        client = runtime_pool.get_client()
        model_name = runtime_pool.current_model_name
        api_key_slot = runtime_pool.current_api_key_slot

        try:
            response = client.models.generate_content(
                model=model_name,
                contents=build_user_prompt(spec),
                config=types.GenerateContentConfig(
                    systemInstruction=SYSTEM_PROMPT,
                    responseMimeType="application/json",
                    responseSchema=GeneratedResumePayload,
                    temperature=0.9,
                    maxOutputTokens=4096,
                    seed=seed,
                ),
            )
            parsed = response.parsed
            if not isinstance(parsed, GeneratedResumePayload):
                raise ValueError("Gemini did not return parsed structured output.")
            return GenerationResult(
                payload=parsed,
                model_name=model_name,
                api_key_slot=api_key_slot,
            )
        except Exception as exc:
            if not is_rate_limit_error(exc):
                raise
            if not runtime_pool.advance():
                raise RuntimeError(
                    "Exhausted all configured Gemini API keys and models after rate-limit errors."
                ) from exc


def normalize_generated_document(
    payload: GeneratedResumePayload,
) -> GeneratedResumePayload:
    normalized_document = payload.document.model_copy(update={"target_roles": []})
    return payload.model_copy(update={"document": normalized_document})


def generate_one_resume(
    runtime_pool: GeminiRuntimePool,
    spec: ResumeSpec,
    *,
    seed: int,
    pdf_path: Path,
    gt_path: Path,
    meta_path: Path,
) -> None:
    last_error: Exception | None = None
    last_attempt = 0

    for attempt in range(1, MAX_ATTEMPTS_PER_RESUME + 1):
        last_attempt = attempt
        try:
            generation_result = generate_resume_payload(
                runtime_pool,
                spec,
                seed=seed + attempt - 1,
            )
            payload = normalize_generated_document(generation_result.payload)
            render_context = sanitize_render_plan(
                payload.document,
                spec,
                payload.render_plan,
            )
            render_pdf(payload.document, spec, render_context, pdf_path)
            save_json(payload.document.model_dump(mode="json"), gt_path)
            save_json(
                {
                    "resume_id": pdf_path.stem,
                    "model": generation_result.model_name,
                    "api_key_slot": generation_result.api_key_slot,
                    "seed": seed,
                    "attempts_used": attempt,
                    "style_key": spec.style_key,
                    "style_label": spec.style_label,
                    "style_bucket_index": spec.style_bucket_index,
                    "date_style": spec.date_style,
                    "render_plan": payload.render_plan.model_dump(mode="json"),
                    "spec": {
                        "career_level": spec.career_level,
                        "domain": spec.domain,
                        "edge_case": spec.edge_case,
                        "company_hint": spec.company_hint,
                        "education_hint": spec.education_hint,
                        "location_hint": spec.location_hint,
                    },
                },
                meta_path,
            )
            return
        except Exception as exc:  # pragma: no cover - runtime/API behavior
            last_error = exc
            if attempt < MAX_ATTEMPTS_PER_RESUME:
                time.sleep(RETRY_DELAY_SECONDS * attempt)

    raise RuntimeError(
        "Failed after "
        f"{MAX_ATTEMPTS_PER_RESUME} attempts "
        f"(last attempt {last_attempt}, {type(last_error).__name__}): {last_error}"
    ) from last_error


def main() -> None:
    api_keys = get_configured_gemini_api_keys()
    if not api_keys:
        print(
            "ERROR: No Gemini API keys are configured in "
            "'golden_resume_generator/dataset_settings.py'."
        )
        sys.exit(1)

    specs = build_resume_specs()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    runtime_pool = GeminiRuntimePool(api_keys=api_keys, model_names=GEMINI_MODELS)
    failed: list[dict[str, Any]] = []

    print(
        f"Generating exactly {len(specs)} golden dataset triplets into '{OUTPUT_DIR}/'."
    )
    print(
        f"Contract: {STYLE_TARGET_COUNT} simple + {STYLE_TARGET_COUNT} double-column + "
        f"{STYLE_TARGET_COUNT} professional."
    )
    print(
        f"Configured Gemini key slots: {len(api_keys)} | models per key: {len(GEMINI_MODELS)}"
    )

    for spec in specs:
        seed = 10_000 + spec.index
        file_stem = f"resume_{spec.index:03d}"
        pdf_path = OUTPUT_DIR / f"{file_stem}.pdf"
        gt_path = OUTPUT_DIR / f"{file_stem}_ground_truth.json"
        meta_path = OUTPUT_DIR / f"{file_stem}_meta.json"

        label = (
            f"[{spec.index:02d}/{len(specs):02d}] "
            f"{spec.style_key}#{spec.style_bucket_index:02d} | "
            f"{spec.career_level} | {spec.domain}"
        )
        print(f"{label} ... ", end="", flush=True)

        try:
            generate_one_resume(
                runtime_pool,
                spec,
                seed=seed,
                pdf_path=pdf_path,
                gt_path=gt_path,
                meta_path=meta_path,
            )
            print("OK")
        except Exception as exc:
            print(f"FAILED: {exc}")
            failed.append(
                {
                    "resume_id": file_stem,
                    "style_key": spec.style_key,
                    "style_bucket_index": spec.style_bucket_index,
                    "spec": {
                        "career_level": spec.career_level,
                        "domain": spec.domain,
                        "edge_case": spec.edge_case,
                    },
                    "error": str(exc),
                }
            )

        time.sleep(REQUEST_DELAY_SECONDS)

    succeeded = len(specs) - len(failed)
    print(f"\nGeneration finished. {succeeded}/{len(specs)} resumes generated.")

    summary_payload = {
        "expected_total": TOTAL_RESUMES,
        "expected_per_style": STYLE_TARGET_COUNT,
        "generated_total": succeeded,
        "failed_total": len(failed),
        "styles": dict(Counter(spec.style_key for spec in specs)),
    }
    save_json(summary_payload, OUTPUT_DIR / "generation_summary.json")

    if failed:
        failed_path = OUTPUT_DIR / "failed_runs.json"
        save_json({"failed": failed}, failed_path)
        print(f"Failure details written to: {failed_path}")
        print(
            "Dataset is incomplete. The script exits non-zero so you do not accept fewer than 45 resumes."
        )
        sys.exit(1)

    verify_dataset_inventory(OUTPUT_DIR, expected_count=TOTAL_RESUMES)
    print(
        "Done. Dataset verified with exactly 45 PDFs, 45 ground-truth JSON files, and 45 metadata JSON files."
    )
