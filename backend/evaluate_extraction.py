from __future__ import annotations

import argparse
import asyncio
import json
import os
from dataclasses import dataclass
from pathlib import Path
from statistics import mean
from typing import Any, Callable

import httpx
from rapidfuzz import fuzz
from rich.console import Console

from app.modules.profiles.ai_import_schemas import (
    ImportedCandidateDocument,
    ImportedEducationInput,
    ImportedExperienceInput,
)

console = Console()

DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_DATASET_DIR = Path("golden_dataset")
DEFAULT_TIMEOUT_SECONDS = 300.0
MATCH_THRESHOLD = 0.72
SCALAR_FIELDS = (
    "full_name",
    "headline",
    "phone",
    "location",
    "linkedin_url",
    "github_url",
    "portfolio_url",
    "years_of_experience",
)


@dataclass(slots=True)
class ResumeFixture:
    resume_id: str
    pdf_path: Path
    ground_truth_path: Path
    meta_path: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate /profiles/me/ai-import/preview against the golden dataset."
    )
    parser.add_argument(
        "--base-url", default=os.getenv("EVAL_BASE_URL", DEFAULT_BASE_URL)
    )
    parser.add_argument("--dataset-dir", type=Path, default=DEFAULT_DATASET_DIR)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--token", default=os.getenv("EVAL_ACCESS_TOKEN"))
    parser.add_argument("--email", default=os.getenv("EVAL_EMAIL"))
    parser.add_argument("--password", default=os.getenv("EVAL_PASSWORD"))
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=DEFAULT_TIMEOUT_SECONDS,
    )
    return parser.parse_args()


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.strip().lower().split())
    return normalized or None


def normalize_scalar(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return normalize_text(value)
    return normalize_text(str(value))


def safe_divide(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator


def precision_score(
    matches: int, extracted_total: int, ground_truth_total: int
) -> float:
    if extracted_total == 0:
        return 1.0 if ground_truth_total == 0 else 0.0
    return matches / extracted_total


def recall_score(matches: int, extracted_total: int, ground_truth_total: int) -> float:
    if ground_truth_total == 0:
        return 1.0
    return matches / ground_truth_total


def f1_score(precision: float, recall: float) -> float:
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def token_overlap_ratio(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    return fuzz.token_set_ratio(left, right) / 100.0


def load_dataset(dataset_dir: Path, limit: int | None) -> list[ResumeFixture]:
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory not found: {dataset_dir}")

    fixtures: list[ResumeFixture] = []
    for pdf_path in sorted(dataset_dir.glob("resume_*.pdf")):
        resume_id = pdf_path.stem
        ground_truth_path = dataset_dir / f"{resume_id}_ground_truth.json"
        meta_path = dataset_dir / f"{resume_id}_meta.json"
        if not ground_truth_path.exists() or not meta_path.exists():
            raise FileNotFoundError(
                f"Missing triplet member for {resume_id}: "
                f"{ground_truth_path.name}, {meta_path.name}"
            )
        fixtures.append(
            ResumeFixture(
                resume_id=resume_id,
                pdf_path=pdf_path,
                ground_truth_path=ground_truth_path,
                meta_path=meta_path,
            )
        )

    if limit is not None:
        return fixtures[:limit]
    return fixtures


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def stringify_experience(item: ImportedExperienceInput) -> str:
    return normalize_text(f"{item.title} {item.company_name}") or ""


def stringify_education(item: ImportedEducationInput) -> str:
    parts = [item.degree, item.field_of_study, item.institution]
    return normalize_text(" ".join(part for part in parts if part)) or ""


def evaluate_scalar_fields(
    ground_truth: ImportedCandidateDocument,
    extracted: ImportedCandidateDocument,
) -> dict[str, Any]:
    fields: dict[str, Any] = {}
    correct = 0
    wrong = 0
    omissions = 0
    hallucinations = 0

    for field_name in SCALAR_FIELDS:
        ground_truth_value = getattr(ground_truth, field_name)
        extracted_value = getattr(extracted, field_name)
        normalized_ground_truth = normalize_scalar(ground_truth_value)
        normalized_extracted = normalize_scalar(extracted_value)

        if normalized_ground_truth is None and normalized_extracted is None:
            outcome = "correct"
            correct += 1
        elif normalized_ground_truth is None and normalized_extracted is not None:
            outcome = "hallucination"
            hallucinations += 1
        elif normalized_ground_truth is not None and normalized_extracted is None:
            outcome = "omission"
            omissions += 1
        elif normalized_ground_truth == normalized_extracted:
            outcome = "correct"
            correct += 1
        else:
            outcome = "wrong"
            wrong += 1

        fields[field_name] = {
            "outcome": outcome,
            "ground_truth": ground_truth_value,
            "extracted": extracted_value,
        }

    total = len(SCALAR_FIELDS)
    return {
        "fields": fields,
        "counts": {
            "correct": correct,
            "wrong": wrong,
            "omission": omissions,
            "hallucination": hallucinations,
            "total": total,
        },
        "accuracy": safe_divide(correct, total),
    }


def greedy_match(
    ground_truth_items: list[Any],
    extracted_items: list[Any],
    stringify: Callable[[Any], str],
    *,
    threshold: float,
) -> tuple[list[dict[str, Any]], list[int], list[int]]:
    scored_pairs: list[tuple[float, int, int]] = []
    ground_truth_texts = [stringify(item) for item in ground_truth_items]
    extracted_texts = [stringify(item) for item in extracted_items]

    for ground_truth_index, ground_truth_text in enumerate(ground_truth_texts):
        for extracted_index, extracted_text in enumerate(extracted_texts):
            score = token_overlap_ratio(ground_truth_text, extracted_text)
            if score >= threshold:
                scored_pairs.append((score, ground_truth_index, extracted_index))

    scored_pairs.sort(reverse=True)

    matched_ground_truth: set[int] = set()
    matched_extracted: set[int] = set()
    matches: list[dict[str, Any]] = []

    for score, ground_truth_index, extracted_index in scored_pairs:
        if ground_truth_index in matched_ground_truth:
            continue
        if extracted_index in matched_extracted:
            continue

        matched_ground_truth.add(ground_truth_index)
        matched_extracted.add(extracted_index)
        matches.append(
            {
                "ground_truth_index": ground_truth_index,
                "extracted_index": extracted_index,
                "score": round(score, 4),
                "ground_truth_text": ground_truth_texts[ground_truth_index],
                "extracted_text": extracted_texts[extracted_index],
            }
        )

    missing_ground_truth_indices = [
        index
        for index in range(len(ground_truth_items))
        if index not in matched_ground_truth
    ]
    extra_extracted_indices = [
        index for index in range(len(extracted_items)) if index not in matched_extracted
    ]
    return matches, missing_ground_truth_indices, extra_extracted_indices


def evaluate_list_section(
    ground_truth_items: list[Any],
    extracted_items: list[Any],
    stringify: Callable[[Any], str],
    *,
    threshold: float = MATCH_THRESHOLD,
) -> dict[str, Any]:
    matches, missing_ground_truth_indices, extra_extracted_indices = greedy_match(
        ground_truth_items,
        extracted_items,
        stringify,
        threshold=threshold,
    )

    matched_count = len(matches)
    extracted_total = len(extracted_items)
    ground_truth_total = len(ground_truth_items)
    precision = precision_score(matched_count, extracted_total, ground_truth_total)
    recall = recall_score(matched_count, extracted_total, ground_truth_total)

    return {
        "ground_truth_count": ground_truth_total,
        "extracted_count": extracted_total,
        "matched_count": matched_count,
        "precision": precision,
        "recall": recall,
        "f1": f1_score(precision, recall),
        "matches": matches,
        "missed_ground_truth": [
            stringify(ground_truth_items[index])
            for index in missing_ground_truth_indices
        ],
        "extra_extracted": [
            stringify(extracted_items[index]) for index in extra_extracted_indices
        ],
    }


def compute_overall_score(
    scalar_result: dict[str, Any] | None,
    list_result: dict[str, Any] | None,
    *,
    status: str,
) -> float:
    if status != "ok" or scalar_result is None or list_result is None:
        return 0.0

    components = [
        scalar_result["accuracy"],
        list_result["experiences"]["f1"],
        list_result["educations"]["f1"],
    ]

    return round(mean(components), 4)


def failed_scalar_result() -> dict[str, Any]:
    empty_fields = {
        field_name: {
            "outcome": "error",
            "ground_truth": None,
            "extracted": None,
        }
        for field_name in SCALAR_FIELDS
    }
    return {
        "fields": empty_fields,
        "counts": {
            "correct": 0,
            "wrong": 0,
            "omission": 0,
            "hallucination": 0,
            "total": len(SCALAR_FIELDS),
        },
        "accuracy": 0.0,
    }


def failed_list_result() -> dict[str, Any]:
    section = {
        "ground_truth_count": 0,
        "extracted_count": 0,
        "matched_count": 0,
        "precision": 0.0,
        "recall": 0.0,
        "f1": 0.0,
        "matches": [],
        "missed_ground_truth": [],
        "extra_extracted": [],
    }
    return {
        "experiences": dict(section),
        "educations": dict(section),
        "overall_macro_f1": 0.0,
    }


def evaluate_lists(
    ground_truth: ImportedCandidateDocument,
    extracted: ImportedCandidateDocument,
) -> dict[str, Any]:
    experiences = evaluate_list_section(
        ground_truth.experiences,
        extracted.experiences,
        stringify_experience,
    )
    educations = evaluate_list_section(
        ground_truth.educations,
        extracted.educations,
        stringify_education,
    )
    overall_macro_f1 = mean([experiences["f1"], educations["f1"]])
    return {
        "experiences": experiences,
        "educations": educations,
        "overall_macro_f1": overall_macro_f1,
    }


def extract_failure_fields(scalar_result: dict[str, Any]) -> list[str]:
    failed_fields: list[str] = []
    for field_name, details in scalar_result["fields"].items():
        if details["outcome"] != "correct":
            failed_fields.append(f"{field_name}:{details['outcome']}")
    return failed_fields


async def resolve_access_token(
    client: httpx.AsyncClient,
    *,
    token: str | None,
    email: str | None,
    password: str | None,
) -> str:
    if token:
        return token

    if email and password:
        response = await client.post(
            "/auth/login",
            json={
                "email": email,
                "password": password,
                "remember_me": False,
            },
        )
        response.raise_for_status()
        payload = response.json()
        return payload["data"]["tokens"]["access_token"]

    raise SystemExit(
        "Provide --token or EVAL_ACCESS_TOKEN, or pass --email and --password "
        "for a candidate account."
    )


async def call_preview_endpoint(
    client: httpx.AsyncClient,
    access_token: str,
    fixture: ResumeFixture,
) -> ImportedCandidateDocument:
    with fixture.pdf_path.open("rb") as pdf_file:
        response = await client.post(
            "/profiles/me/ai-import/preview",
            headers={"Authorization": f"Bearer {access_token}"},
            files={"file": (fixture.pdf_path.name, pdf_file, "application/pdf")},
        )

    response.raise_for_status()
    payload = response.json()
    return ImportedCandidateDocument.model_validate(
        payload["data"]["extracted_profile"]
    )


async def evaluate_resume(
    client: httpx.AsyncClient,
    access_token: str,
    fixture: ResumeFixture,
) -> dict[str, Any]:
    meta = read_json(fixture.meta_path)
    ground_truth = ImportedCandidateDocument.model_validate(
        read_json(fixture.ground_truth_path)
    )

    try:
        extracted = await call_preview_endpoint(client, access_token, fixture)
    except Exception as exc:
        scalar_result = failed_scalar_result()
        list_result = failed_list_result()
        return {
            "resume_id": fixture.resume_id,
            "status": "failed",
            "error": f"{type(exc).__name__}: {exc}",
            "style_key": meta["style_key"],
            "career_level": meta["spec"]["career_level"],
            "scalar_test": scalar_result,
            "list_test": list_result,
            "overall_score": 0.0,
        }

    scalar_result = evaluate_scalar_fields(ground_truth, extracted)
    list_result = evaluate_lists(ground_truth, extracted)

    return {
        "resume_id": fixture.resume_id,
        "status": "ok",
        "error": None,
        "style_key": meta["style_key"],
        "career_level": meta["spec"]["career_level"],
        "source_pdf": str(fixture.pdf_path),
        "scalar_test": scalar_result,
        "list_test": list_result,
        "overall_score": compute_overall_score(
            scalar_result,
            list_result,
            status="ok",
        ),
    }


def aggregate_section(section_results: list[dict[str, Any]]) -> dict[str, Any]:
    matched_total = sum(section["matched_count"] for section in section_results)
    extracted_total = sum(section["extracted_count"] for section in section_results)
    ground_truth_total = sum(
        section["ground_truth_count"] for section in section_results
    )
    micro_precision = precision_score(
        matched_total,
        extracted_total,
        ground_truth_total,
    )
    micro_recall = recall_score(
        matched_total,
        extracted_total,
        ground_truth_total,
    )

    return {
        "micro_precision": micro_precision,
        "micro_recall": micro_recall,
        "micro_f1": f1_score(
            micro_precision,
            micro_recall,
        ),
        "macro_precision": mean(section["precision"] for section in section_results),
        "macro_recall": mean(section["recall"] for section in section_results),
        "macro_f1": mean(section["f1"] for section in section_results),
        "matched_total": matched_total,
        "extracted_total": extracted_total,
        "ground_truth_total": ground_truth_total,
    }


def group_breakdown(
    results: list[dict[str, Any]],
    key_name: str,
) -> dict[str, dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    for result in results:
        group_key = result[key_name]
        groups.setdefault(group_key, []).append(result)

    breakdown: dict[str, dict[str, Any]] = {}
    for group_key, group_results in sorted(groups.items()):
        successful = [result for result in group_results if result["status"] == "ok"]
        if not successful:
            breakdown[group_key] = {
                "count": len(group_results),
                "failed_count": len(group_results),
                "scalar_accuracy": 0.0,
                "overall_score": 0.0,
                "experiences_f1": 0.0,
                "educations_f1": 0.0,
            }
            continue

        breakdown[group_key] = {
            "count": len(group_results),
            "failed_count": len(group_results) - len(successful),
            "scalar_accuracy": mean(
                result["scalar_test"]["accuracy"] for result in successful
            ),
            "overall_score": mean(result["overall_score"] for result in successful),
            "experiences_f1": mean(
                result["list_test"]["experiences"]["f1"] for result in successful
            ),
            "educations_f1": mean(
                result["list_test"]["educations"]["f1"] for result in successful
            ),
        }

    return breakdown


def build_report(results: list[dict[str, Any]]) -> dict[str, Any]:
    successful = [result for result in results if result["status"] == "ok"]
    failed = [result for result in results if result["status"] != "ok"]

    if not successful:
        return {
            "total_resumes": len(results),
            "evaluated_resumes": 0,
            "failed_resumes": len(failed),
            "failures": failed,
        }

    scalar_counts = {
        metric: sum(result["scalar_test"]["counts"][metric] for result in successful)
        for metric in ("correct", "wrong", "omission", "hallucination", "total")
    }

    experience_results = [result["list_test"]["experiences"] for result in successful]
    education_results = [result["list_test"]["educations"] for result in successful]

    worst_resumes = sorted(results, key=lambda item: item["overall_score"])[:5]

    return {
        "total_resumes": len(results),
        "evaluated_resumes": len(successful),
        "failed_resumes": len(failed),
        "scalar_accuracy": {
            "counts": scalar_counts,
            "accuracy": safe_divide(scalar_counts["correct"], scalar_counts["total"]),
        },
        "list_fidelity": {
            "experiences": aggregate_section(experience_results),
            "educations": aggregate_section(education_results),
        },
        "degradation_breakdown": {
            "by_style_key": group_breakdown(results, "style_key"),
            "by_career_level": group_breakdown(results, "career_level"),
        },
        "worst_resumes": [
            {
                "resume_id": result["resume_id"],
                "status": result["status"],
                "style_key": result["style_key"],
                "career_level": result["career_level"],
                "overall_score": result["overall_score"],
                "failed_scalar_fields": extract_failure_fields(result["scalar_test"]),
                "error": result["error"],
            }
            for result in worst_resumes
        ],
    }


def format_pct(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:.1%}"


def render_summary(report: dict[str, Any], results: list[dict[str, Any]]) -> None:
    console.print("\nEvaluation complete.")
    console.print(
        f"- Resumes: {report['evaluated_resumes']}/{report['total_resumes']} successful"
    )
    console.print(f"- Failed requests: {report['failed_resumes']}")

    if report["evaluated_resumes"] <= 0:
        return

    scalar = report["scalar_accuracy"]
    console.print(f"- Scalar accuracy: {format_pct(scalar['accuracy'])}")
    console.print(f"- Scalar hallucinations: {scalar['counts']['hallucination']}")
    console.print(
        f"- Experience list F1: "
        f"{format_pct(report['list_fidelity']['experiences']['macro_f1'])}"
    )
    console.print(
        f"- Education list F1: "
        f"{format_pct(report['list_fidelity']['educations']['macro_f1'])}"
    )

    worst = sorted(results, key=lambda item: item["overall_score"])[:3]
    console.print("- Lowest scoring resumes:")
    for result in worst:
        failure_summary = (
            ", ".join(extract_failure_fields(result["scalar_test"])) or "-"
        )
        if result["error"]:
            failure_summary = result["error"]
        console.print(
            f"  {result['resume_id']} | {format_pct(result['overall_score'])} | "
            f"{result['style_key']} | {result['career_level']} | {failure_summary}"
        )


def build_markdown_report(report: dict[str, Any], results: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    lines.append("# Resume Extraction Evaluation Report")
    lines.append("")
    lines.append("## Scope")
    lines.append("")
    lines.append(
        "This report evaluates the live `/profiles/me/ai-import/preview` extraction "
        "endpoint against the generated golden dataset."
    )
    lines.append("")
    lines.append("Included checks:")
    lines.append("- Scalar field accuracy for top-level profile fields")
    lines.append("- Fuzzy list fidelity for experiences")
    lines.append("- Fuzzy list fidelity for educations")
    lines.append("")
    lines.append("Excluded checks:")
    lines.append("- Skills extraction scoring")
    lines.append("- Date extraction scoring")
    lines.append("")
    lines.append("## Overall Summary")
    lines.append("")
    lines.append(f"- Total resumes considered: {report['total_resumes']}")
    lines.append(f"- Successfully evaluated: {report['evaluated_resumes']}")
    lines.append(f"- Failed requests: {report['failed_resumes']}")

    if report["evaluated_resumes"] > 0:
        scalar = report["scalar_accuracy"]
        lines.append(f"- Scalar accuracy: {format_pct(scalar['accuracy'])}")
        lines.append(f"- Scalar wrong fields: {scalar['counts']['wrong']}")
        lines.append(f"- Scalar omissions: {scalar['counts']['omission']}")
        lines.append(f"- Scalar hallucinations: {scalar['counts']['hallucination']}")
        lines.append(
            "- Experience list fidelity (macro F1): "
            f"{format_pct(report['list_fidelity']['experiences']['macro_f1'])}"
        )
        lines.append(
            "- Education list fidelity (macro F1): "
            f"{format_pct(report['list_fidelity']['educations']['macro_f1'])}"
        )

    lines.append("")
    lines.append("## Degradation Breakdown By Style")
    lines.append("")
    for group_name, metrics in (
        report.get("degradation_breakdown", {}).get("by_style_key", {}).items()
    ):
        lines.append(
            f"- `{group_name}`: overall {format_pct(metrics['overall_score'])}, "
            f"scalar {format_pct(metrics['scalar_accuracy'])}, "
            f"experience F1 {format_pct(metrics['experiences_f1'])}, "
            f"education F1 {format_pct(metrics['educations_f1'])}, "
            f"failed {metrics['failed_count']}/{metrics['count']}"
        )

    lines.append("")
    lines.append("## Degradation Breakdown By Career Level")
    lines.append("")
    for group_name, metrics in (
        report.get("degradation_breakdown", {}).get("by_career_level", {}).items()
    ):
        lines.append(
            f"- `{group_name}`: overall {format_pct(metrics['overall_score'])}, "
            f"scalar {format_pct(metrics['scalar_accuracy'])}, "
            f"experience F1 {format_pct(metrics['experiences_f1'])}, "
            f"education F1 {format_pct(metrics['educations_f1'])}, "
            f"failed {metrics['failed_count']}/{metrics['count']}"
        )

    lines.append("")
    lines.append("## Lowest Scoring Resumes")
    lines.append("")
    for result in sorted(results, key=lambda item: item["overall_score"])[:5]:
        failure_summary = (
            ", ".join(extract_failure_fields(result["scalar_test"])) or "-"
        )
        if result["error"]:
            failure_summary = result["error"]
        lines.append(
            f"- `{result['resume_id']}`: overall {format_pct(result['overall_score'])}, "
            f"style `{result['style_key']}`, career `{result['career_level']}`, "
            f"issues: {failure_summary}"
        )

    failed_results = [result for result in results if result["status"] != "ok"]
    if failed_results:
        lines.append("")
        lines.append("## Failed Requests")
        lines.append("")
        for result in failed_results:
            lines.append(f"- `{result['resume_id']}`: {result['error']}")

    return "\n".join(lines) + "\n"


async def async_main() -> None:
    args = parse_args()
    fixtures = load_dataset(args.dataset_dir, args.limit)
    results_path = args.dataset_dir / "eval_results.json"
    report_path = args.dataset_dir / "eval_report.json"
    markdown_report_path = args.dataset_dir / "eval_report.md"

    timeout = httpx.Timeout(args.timeout_seconds, connect=30.0)
    async with httpx.AsyncClient(
        base_url=args.base_url.rstrip("/"),
        timeout=timeout,
    ) as client:
        access_token = await resolve_access_token(
            client,
            token=args.token,
            email=args.email,
            password=args.password,
        )

        results: list[dict[str, Any]] = []
        for index, fixture in enumerate(fixtures, start=1):
            console.print(
                f"[{index}/{len(fixtures)}] Evaluating {fixture.resume_id} ..."
            )
            result = await evaluate_resume(client, access_token, fixture)
            results.append(result)

    report = build_report(results)
    results_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    markdown_report_path.write_text(
        build_markdown_report(report, results),
        encoding="utf-8",
    )

    render_summary(report, results)
    console.print(f"\nSaved detailed results to {results_path}")
    console.print(f"Saved summary report to {report_path}")
    console.print(f"Saved Markdown report to {markdown_report_path}")


def main() -> None:
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
