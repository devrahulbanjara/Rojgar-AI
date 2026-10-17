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
        "# Counterfactual fairness audit (review v2)",
        "",
        (
            "Each base application is re-reviewed with exactly one identity/proxy attribute "
            "changed. The recruiter sees only the fit bucket; `selection rate` = share with fit "
            "strong or possible; *impact ratio* < 0.8 fails the four-fifths rule. "
            "`reviewer input identical` = share of variants whose blind review text was "
            "byte-identical to the reference (the attribute never reached the reviewer). "
            "Fit comes from the production triage + rubric with the deterministic reviewer; "
            "the ML model is only a tie-break inside a bucket (`ML Δ` in points of 100)."
        ),
        "",
        "## Base cases",
        _table(
            ["case", "kind", "candidate", "job", "CV", "answers"],
            [
                [c["case"], c["kind"], c["candidate"], c["job"], c["cv"], c["answers"]]
                for c in res["cases"]
            ],
        ),
        "",
        "## Reference outcome per case",
        _table(
            ["case", "job", "fit", "triage", "rank score", "ML tie-break pts"],
            [
                [
                    r["case"],
                    r["job"][:40],
                    r["fit"],
                    r["triage"],
                    r["rank_score"],
                    r["ml_points"],
                ]
                for r in res["reference"]
            ],
        ),
        "",
    ]
    for axis, groups in res["summary"].items():
        lines += [
            f"### {axis}",
            _table(
                [
                    "group",
                    "n",
                    "reviewer input identical",
                    "fit",
                    "selection rate",
                    "impact ratio",
                    "fit flip vs ref",
                    "mean rank Δ",
                    "ML input identical",
                    "mean ML Δ pts",
                    "max |ML Δ| pts",
                ],
                [
                    [
                        g,
                        s["n"],
                        s["reviewer_input_identical"],
                        s["fit"],
                        s["selection_rate"],
                        f"{s['impact_ratio']}{' ❌' if s['fails_four_fifths'] else ''}",
                        s["fit_flip_vs_reference"],
                        s["mean_rank_delta"],
                        s["ml_input_identical"],
                        s["mean_ml_delta_pts"],
                        s["max_abs_ml_delta_pts"],
                    ]
                    for g, s in groups.items()
                ],
            ),
            "",
        ]
    if res.get("yoe_curve"):
        points = list(res["yoe_curve"][0]["ml_points"].keys())
        lines += [
            "## Self-reported years of experience (content unchanged)",
            "",
            "ML tie-break points / fit at each reported value:",
            "",
            _table(
                ["case", "true yoe", *[f"{p}y" for p in points]],
                [
                    [
                        c["case"],
                        c["true_yoe"],
                        *[
                            f"{c['ml_points'][p]} / {c['fit'][p]}"
                            for p in c["ml_points"]
                        ],
                    ]
                    for c in res["yoe_curve"]
                ],
            ),
            "",
        ]
    if res.get("llm_rows"):
        s = res["llm_summary"]
        lines += [
            "## Live review (Groq, temperature 0)",
            "",
            f"Reference fits (noise floor, same input repeated): `{s['reference_fits']}`",
            "",
            f"Fit flips vs reference: `{s['flips']}`",
            "",
            f"Triage: `{s['triage']}` · mean cost per review NPR "
            f"{s['mean_cost_npr_per_review']} (max {s['max_cost_npr_per_review']}) · "
            f"errors {s['errors']}",
            "",
            _table(
                [
                    "case",
                    "variant",
                    "fit",
                    "triage",
                    "tokens in/out",
                    "NPR",
                    "summary",
                    "error",
                ],
                [
                    [
                        r["case"],
                        f"{r['axis']}:{r['group']}",
                        r.get("fit"),
                        r.get("triage"),
                        f"{r.get('tokens_in')}/{r.get('tokens_out')}",
                        r.get("cost_npr"),
                        (r.get("summary") or "")[:90],
                        r.get("error"),
                    ]
                    for r in res["llm_rows"]
                ],
            ),
        ]
    lines += ["", f"Provider events: `{res.get('provider_events')}`"]
    return "\n".join(lines)


def _redteam_md(res: dict) -> str:
    rows = res["rows"]
    return "\n".join(
        [
            "# Red-team audit (review v2)",
            "",
            (
                f"Base: {res['config']['base_case']} → {res['config']['job']}. Rail = production "
                "`guardrails_service.check_input(..., fail_closed=True)` on the normalised "
                "candidate text (NFKC, zero-width/bidi removed); each case run "
                f"{res['config']['repeats']}×. Nobody is blocked at apply: a flagged or unchecked "
                "CV goes to a person with no fit shown. Classifier errors are retried and never "
                "count as SAFE."
            ),
            "",
            _table(
                [
                    "attack",
                    "kind",
                    "expected",
                    "result",
                    "rail flagged",
                    "unavailable",
                    "scores",
                    "outcome",
                    "fit shown",
                    "det. fit",
                    "rank Δ",
                    "ML Δ pts",
                    "live fit",
                    "reason",
                ],
                [
                    [
                        r["attack"],
                        r["kind"],
                        r["expected"],
                        r["result"],
                        r["guardrail_blocked_runs"],
                        r["classifier_unavailable_runs"],
                        r["guardrail_scores"],
                        r["apply_outcome"],
                        r["review_fit"],
                        r["deterministic_fit"],
                        r["rank_delta"],
                        r["ml_delta_pts"],
                        r.get("live_fit", ""),
                        (r.get("guardrail_reason") or "")[:100],
                    ]
                    for r in rows
                ],
            ),
            "",
            f"Provider events: `{res.get('provider_events')}`",
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
