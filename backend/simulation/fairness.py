"""Counterfactual fairness audit over the real review paths.

Each base application is re-reviewed with exactly one identity/proxy attribute
changed. What a recruiter sees is the fit bucket (strong / possible / weak);
the order inside a bucket is rank_score (rubric points + ML tie-break).

Per axis/group we report:
  * reviewer input identical: the blind text the reviewer reads is byte-identical
    to the reference (the attribute provably never reached the model);
  * deterministic fit (FakeReviewer through the production triage + rubric):
    distribution, flips vs reference, selection rate (fit strong or possible)
    and the four-fifths impact ratio;
  * rank_score and ML tie-break deltas;
  * the ML tie-break vs self-reported years curve (should be flat now).
With --with-llm, the live Groq reviewer runs on the reference (repeated, for
the noise floor) and on each variant whose reviewer input differs.
"""

from __future__ import annotations

import asyncio
import statistics
from collections import Counter, defaultdict

from simulation import scoring
from simulation.corpus import (
    application_ns,
    job_ns,
    load_base_cases,
    load_nontech_cases,
    resume_ns,
)
from simulation.safety import EST, Budget, confirm_estimate
from simulation.variants import build_variants

YOE_POINTS = [0, 1, 3, 5, 8, 12, 20, 30]
SELECTED_FITS = {"strong", "possible"}


def _estimate(n_cases: int, with_llm: bool, llm_bases: int, repeats: int) -> float:
    est = n_cases * 12 * EST["embedding"]
    if with_llm:
        est += llm_bases * (repeats + 1 + 8) * EST["review"]
    return est


async def run(
    *,
    bases: int,
    cross: bool,
    nontech: int,
    curve_cases: int = 4,
    with_llm: bool,
    llm_bases: int,
    repeats: int,
    yes: bool,
    max_cost: float,
    seed: int,
) -> dict:
    from app.core.config import settings

    cases = load_base_cases(bases, cross=cross) + load_nontech_cases(nontech)
    confirm_estimate(
        _estimate(len(cases), with_llm, llm_bases, repeats), yes=yes, max_cost=max_cost
    )
    budget = Budget(max_cost=max_cost)
    inst = scoring.Instrumented(budget)

    rows: list[dict] = []
    llm_rows: list[dict] = []
    yoe_curve: list[dict] = []
    for case_index, case in enumerate(cases):
        job = job_ns(case.job)
        await scoring.embed_job(job)

        # Self-reported years, content unchanged. The tie-break model gets a
        # fixed neutral value, so this must be flat.
        if case_index < curve_cases and case.resume is not None:
            curve_apps = []
            for yoe in YOE_POINTS:
                data = {**case.resume, "years_of_experience": yoe}
                curve_apps.append(
                    application_ns(resume_ns(data), case.candidate_name, case.answers)
                )
            for a in curve_apps:
                await scoring.embed_application(a, inst)
            probs, _ = scoring.ml_score(job, curve_apps)
            reviews = [
                await scoring.deterministic_review(job, a, p)
                for a, p in zip(curve_apps, probs, strict=True)
            ]
            yoe_curve.append(
                {
                    "case": case.case_id,
                    "true_yoe": case.resume.get("years_of_experience"),
                    "ml_points": {
                        y: None if p is None else round(p * 100)
                        for y, p in zip(YOE_POINTS, probs, strict=True)
                    },
                    "fit": {
                        y: r["fit"] for y, r in zip(YOE_POINTS, reviews, strict=True)
                    },
                }
            )

        variants = build_variants(case.resume, case.candidate_name, seed=seed)
        apps = [
            application_ns(resume_ns(v.resume), v.applicant_name, case.answers)
            for v in variants
        ]
        embed_hashes = [await scoring.embed_application(a, inst) for a in apps]
        probs, feats = scoring.ml_score(job, apps)
        reviews = [
            await scoring.deterministic_review(job, a, p)
            for a, p in zip(apps, probs, strict=True)
        ]
        blind = [scoring.text_hash(scoring.blind_text(job, a)) for a in apps]
        ml_hashes = [
            scoring.ml_input_hash(a, h) for a, h in zip(apps, embed_hashes, strict=True)
        ]
        ref_prob, ref_review = probs[0], reviews[0]
        for i, v in enumerate(variants):
            prob = probs[i]
            rows.append(
                {
                    "case": case.case_id,
                    "kind": case.kind,
                    "job": job.title,
                    "axis": v.axis,
                    "group": v.group,
                    "label": v.label,
                    "applicant_name": v.applicant_name,
                    "fit": reviews[i]["fit"],
                    "triage": reviews[i]["triage"],
                    "rank_score": reviews[i]["rank_score"],
                    "rank_delta": round(
                        (reviews[i]["rank_score"] or 0)
                        - (ref_review["rank_score"] or 0),
                        4,
                    ),
                    "selected": reviews[i]["fit"] in SELECTED_FITS,
                    "ml_points": None if prob is None else round(prob * 100, 1),
                    "ml_delta_pts": None
                    if prob is None or ref_prob is None
                    else round((prob - ref_prob) * 100, 1),
                    "reviewer_input_identical": blind[i] == blind[0],
                    "ml_input_identical": ml_hashes[i] == ml_hashes[0],
                    "features": None
                    if feats[i] is None
                    else dict(
                        zip(
                            [
                                "tfidf_sim",
                                "semantic_sim",
                                "years(neutral)",
                                "num_companies",
                                "num_educations",
                                "num_skills",
                            ],
                            [round(x, 4) for x in feats[i]],
                            strict=True,
                        )
                    ),
                }
            )

        if with_llm and case_index < llm_bases:
            picked = [(variants[0], apps[0], probs[0])] * (repeats + 1)
            seen = {blind[0]}
            for v, a, p, h in zip(variants, apps, probs, blind, strict=True):
                if v.is_reference or h in seen:
                    continue
                seen.add(h)
                picked.append((v, a, p))
            for v, a, p in picked:
                try:
                    res = await scoring.live_review(job, a, p, inst)
                    err = None
                except Exception as exc:  # noqa: BLE001 - audit records failures
                    res, err = {}, repr(exc)
                llm_rows.append(
                    {
                        "case": case.case_id,
                        "axis": v.axis,
                        "group": v.group,
                        "label": v.label,
                        "error": err,
                        **{
                            k: res.get(k)
                            for k in (
                                "fit",
                                "rank_score",
                                "triage",
                                "summary",
                                "tokens_in",
                                "tokens_out",
                                "cost_npr",
                            )
                        },
                        "checks": [
                            (c["result"], (c.get("evidence") or "")[:60])
                            for c in res.get("checks") or []
                        ],
                    }
                )
            # Keep under the provider's tokens-per-minute cap between cases.
            await asyncio.sleep(1)

    inst.flush()
    return {
        "mode": "fairness",
        "config": {
            "tech_bases": bases,
            "nontech_bases": nontech,
            "cross_pairings": cross,
            "with_llm": with_llm,
            "llm_bases": llm_bases if with_llm else 0,
            "repeats": repeats,
            "seed": seed,
            "review_model": settings.review_model,
            "review_cheap_model": settings.review_cheap_model,
        },
        "cases": [
            {
                "case": c.case_id,
                "kind": c.kind,
                "candidate": c.candidate_name,
                "job": c.job["title"],
                "cv": c.resume is not None,
                "answers": bool(c.answers),
            }
            for c in cases
        ],
        "rows": rows,
        "summary": summarize(rows),
        "reference": [r for r in rows if r["axis"] == "reference"],
        "yoe_curve": yoe_curve,
        "llm_rows": llm_rows,
        "llm_summary": summarize_llm(llm_rows),
        "spend": budget.summary(),
        "provider_events": {
            "review_429_retries": inst.review_retries,
            "gemini_429_retries": inst.embed_rate_limited,
        },
    }


def _mean(values: list[float]) -> float | None:
    values = [v for v in values if v is not None]
    return round(statistics.mean(values), 2) if values else None


def summarize(rows: list[dict]) -> dict:
    by_axis: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    ref = {r["case"]: r for r in rows if r["axis"] == "reference"}
    for r in rows:
        if r["axis"] != "reference":
            by_axis[r["axis"]][r["group"]].append(r)
    out: dict[str, dict] = {}
    for axis, groups in by_axis.items():
        stats = {}
        for group, items in groups.items():
            stats[group] = {
                "n": len(items),
                "reviewer_input_identical": round(
                    statistics.mean(
                        1.0 if i["reviewer_input_identical"] else 0.0 for i in items
                    ),
                    3,
                ),
                "ml_input_identical": round(
                    statistics.mean(
                        1.0 if i["ml_input_identical"] else 0.0 for i in items
                    ),
                    3,
                ),
                "fit": dict(Counter(i["fit"] or "none" for i in items)),
                "selection_rate": round(
                    statistics.mean(1.0 if i["selected"] else 0.0 for i in items), 3
                ),
                "fit_flip_vs_reference": round(
                    statistics.mean(
                        1.0 if i["fit"] != ref[i["case"]]["fit"] else 0.0 for i in items
                    ),
                    3,
                ),
                "mean_rank_delta": _mean([i["rank_delta"] for i in items]),
                "mean_ml_delta_pts": _mean([i["ml_delta_pts"] for i in items]),
                "max_abs_ml_delta_pts": max(
                    (
                        abs(i["ml_delta_pts"])
                        for i in items
                        if i["ml_delta_pts"] is not None
                    ),
                    default=None,
                ),
            }
        best = max(s["selection_rate"] for s in stats.values())
        for s in stats.values():
            s["impact_ratio"] = (
                round(s["selection_rate"] / best, 3) if best > 0 else None
            )
            s["fails_four_fifths"] = (
                s["impact_ratio"] is not None and s["impact_ratio"] < 0.8
            )
        out[axis] = stats
    return out


def summarize_llm(rows: list[dict]) -> dict:
    ok = [r for r in rows if not r.get("error")]
    out: dict = {"errors": len(rows) - len(ok)}
    noise: dict[str, list] = defaultdict(list)
    for r in ok:
        if r["axis"] == "reference":
            noise[r["case"]].append(r["fit"])
    out["reference_fits"] = dict(noise)
    flips: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))
    for r in ok:
        if r["axis"] == "reference" or not noise.get(r["case"]):
            continue
        ref_fit = Counter(noise[r["case"]]).most_common(1)[0][0]
        flips[r["axis"]][r["group"]].append(r["fit"] != ref_fit)
    out["flips"] = {
        axis: {g: f"{sum(v)}/{len(v)}" for g, v in groups.items()}
        for axis, groups in flips.items()
    }
    costs = [r["cost_npr"] for r in ok if r.get("cost_npr") is not None]
    out["mean_cost_npr_per_review"] = _mean(costs)
    out["max_cost_npr_per_review"] = max(costs) if costs else None
    out["triage"] = dict(Counter(r["triage"] for r in ok))
    return out
