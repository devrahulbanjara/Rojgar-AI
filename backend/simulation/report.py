"""JSON + Markdown report writers."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

REPORT_DIR = Path(__file__).resolve().parent / "reports"


def _table(headers: list[str], rows: list[list]) -> str:
    out = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    for r in rows:
        out.append("| " + " | ".join("" if v is None else str(v) for v in r) + " |")
    return "\n".join(out)


def _fairness_md(res: dict) -> str:
    lines = [
        "# Counterfactual fairness audit",
        "",
        (
            "Each base resume is re-scored with exactly one attribute changed. A fair scorer gives "
            "identical results across groups; *impact ratio* < 0.8 fails the four-fifths rule "
            "(NYC Local Law 144 style). `input identical` = share of variants whose scorer input "
            "was byte-identical to the reference (the attribute never reached the model)."
        ),
        "",
        "## Base cases",
        _table(
            ["case", "candidate", "job", "seed score"],
            [
                [c["case"], c["candidate"], c["job"], c["seed_score"]]
                for c in res["cases"]
            ],
        ),
        "",
        "## Stage 1 — ML bouncer (decides shortlist/reject)",
    ]
    for axis, groups in res["ml_summary"].items():
        lines += [
            f"### {axis}",
            _table(
                [
                    "group",
                    "n",
                    "mean score",
                    "mean Δ pts",
                    "selection rate",
                    "impact ratio",
                    "≥0.4 cohort rate",
                    "flip vs ref",
                    "ML input identical",
                ],
                [
                    [
                        g,
                        s["n"],
                        s["mean_score"],
                        s["mean_delta_pts"],
                        s["selection_rate"],
                        f"{s['impact_ratio']}{' ❌' if s['fails_four_fifths'] else ''}",
                        s["llm_cohort_rate"],
                        s["flip_vs_reference"],
                        s["ml_input_identical_share"],
                    ]
                    for g, s in groups.items()
                ],
            ),
            "",
        ]
    lines.append("### Per-case reference scores")
    refs = [r for r in res["ml_rows"] if r["axis"] == "reference"]
    lines.append(
        _table(
            ["case", "job", "threshold", "ML score", "features"],
            [
                [r["case"], r["job"][:40], r["threshold"], r["score"], r["features"]]
                for r in refs
            ],
        )
    )
    if res.get("yoe_curve"):
        points = list(res["yoe_curve"][0]["scores"].keys())
        lines += [
            "",
            "## ML score vs self-reported years of experience (content unchanged)",
            "",
            _table(
                ["case", "true yoe", "threshold", *[f"{p}y" for p in points]],
                [
                    [c["case"], c["true_yoe"], c["threshold"], *c["scores"].values()]
                    for c in res["yoe_curve"]
                ],
            ),
        ]
    if res.get("gap_llm_rows"):
        s = res["gap_llm_summary"]
        lines += [
            "",
            "## Resume-gap LLM (`overall_score_estimate`, Groq)",
            "",
            f"Reference noise (same input repeated): `{s['reference_noise']}`",
            "",
        ]
        for axis, groups in s.items():
            if axis in ("reference_noise", "errors"):
                continue
            lines += [
                f"### {axis}",
                _table(
                    ["group", "n", "mean score", "mean Δ vs own reference"],
                    [
                        [g, v["n"], v["mean_score"], v["mean_delta_vs_reference"]]
                        for g, v in groups.items()
                    ],
                ),
                "",
            ]
        lines.append(f"Errors: {s['errors']}")
    if res.get("review_rows"):
        lines += ["", "## Stage 2 — LangGraph CTO/HR review (Bedrock)", ""]
        lines.append(
            _table(
                [
                    "case",
                    "variant",
                    "#strengths",
                    "#weaknesses",
                    "gap/tenure concerns",
                    "weaknesses",
                    "usd",
                    "error",
                ],
                [
                    [
                        r["case"],
                        f"{r['axis']}:{r['group']}",
                        r.get("n_strengths"),
                        r.get("n_weaknesses"),
                        "; ".join(r.get("gap_or_tenure_concerns") or []),
                        "; ".join(r.get("weaknesses") or [])[:400],
                        r.get("usd"),
                        r.get("error"),
                    ]
                    for r in res["review_rows"]
                ],
            )
        )
    return "\n".join(lines)


def _redteam_md(res: dict) -> str:
    rows = res["rows"]
    return "\n".join(
        [
            "# Red-team audit",
            "",
            (
                f"Base: {res['config']['base_case']} → {res['config']['job']}. Guardrail = production "
                "`guardrails_service.check_input` on `resume_text_for_guardrails` (the apply-time rail); "
                f"each case run {res['config']['repeats']}×."
            ),
            "",
            _table(
                [
                    "attack",
                    "kind",
                    "expected",
                    "result",
                    "guardrail blocked",
                    "guardrail scores",
                    "ML score",
                    "ML Δ",
                    "apply outcome",
                    "gap LLM score",
                    "reason",
                ],
                [
                    [
                        r["attack"],
                        r["kind"],
                        r["expected"],
                        r["result"],
                        r["guardrail_blocked_runs"],
                        r["guardrail_scores"],
                        r["ml_score"],
                        r["ml_delta_pts"],
                        r["apply_outcome"],
                        r.get("gap_score_estimate", ""),
                        (r.get("guardrail_reason") or "")[:120],
                    ]
                    for r in rows
                ],
            ),
        ]
    )


def _load_md(res: dict) -> str:
    o = res["overall"]
    cfg = res["config"]
    return "\n".join(
        [
            f"# Load test — {cfg['personas']} personas",
            "",
            f"Config: `{cfg}`",
            "",
            (
                f"**{o['requests']} requests in {o['wall_seconds']}s ({o['throughput_rps']} rps), "
                f"p50 {o['p50_ms']} ms, p95 {o['p95_ms']} ms, 5xx/transport errors {o['server_errors']} "
                f"({o['error_rate']}), 429s {o['rate_limited_429']}.**"
            ),
            "",
            _table(
                ["endpoint", "n", "p50 ms", "p95 ms", "max ms", "codes", "error rate"],
                [
                    [
                        k,
                        v["n"],
                        v["p50_ms"],
                        v["p95_ms"],
                        v["max_ms"],
                        v["status_codes"],
                        v["error_rate"],
                    ]
                    for k, v in res["endpoints"].items()
                ],
            ),
            "",
            "## 5xx samples",
            "```json",
            json.dumps(res["samples_5xx"], indent=2)[:4000],
            "```",
        ]
    )


def _limiter_md(res: dict) -> str:
    return "\n".join(
        [
            "# Login rate-limiter keying check",
            "",
            f"Target: `{res['config']}`  Verdict: `{res['verdict']}`",
            "",
            _table(
                ["attempt", "X-Forwarded-For", "status"],
                [
                    [r["attempt"], r["x_forwarded_for"] or "(none)", r["status"]]
                    for r in res["rows"]
                ],
            ),
        ]
    )


def write(result: dict, *, tag: str = "") -> tuple[Path, Path]:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    stem = f"{result['mode']}{'-' + tag if tag else ''}-{stamp}"
    jpath = REPORT_DIR / f"{stem}.json"
    mpath = REPORT_DIR / f"{stem}.md"
    jpath.write_text(json.dumps(result, indent=2, default=str))
    md = {
        "fairness": _fairness_md,
        "redteam": _redteam_md,
        "load": _load_md,
        "limiter": _limiter_md,
    }[result["mode"]](result)
    if "spend" in result:
        md += f"\n\n---\nEstimated spend: `{result['spend']}`\n"
    mpath.write_text(md)
    return jpath, mpath
