"""Counterfactual fairness audit over the real scoring paths."""

from __future__ import annotations

import asyncio
import re
import statistics
from collections import defaultdict

from simulation import scoring
from simulation.corpus import application_ns, job_ns, load_base_cases, resume_ns
from simulation.safety import EST, Budget, confirm_estimate
from simulation.variants import build_variants

YOE_POINTS = [0, 1, 3, 5, 8, 12, 20, 30]
GAP_WORDS = re.compile(
    r"\b(gap|break|tenure|progression|hiatus|career break|caregiv)", re.IGNORECASE
)
PRESTIGE_WORDS = re.compile(
    r"\b(university|campus|college|ioe|pulchowk|prestig|institution)", re.IGNORECASE
)


async def _bounded(sem: asyncio.Semaphore, coro):
    async with sem:
        return await coro


def _estimate(n_bases: int, with_llm: bool, llm_bases: int, review_bases: int) -> float:
    est = n_bases * 12 * EST["embedding"]
    if with_llm:
        est += llm_bases * 15 * 2 * EST["gap_analysis"]
        est += review_bases * 6 * (EST["shortlisting"] + 2 * EST["guardrail"])
    return est


async def run(
    *,
    bases: int,
    cross: bool,
    curve_cases: int = 4,
    with_llm: bool,
    llm_bases: int,
    review_bases: int,
    repeats: int,
    yes: bool,
    max_cost: float,
    seed: int,
) -> dict:
    from app.core.config import settings

    confirm_estimate(
        _estimate(bases, with_llm, llm_bases, review_bases), yes=yes, max_cost=max_cost
    )
    budget = Budget(max_cost=max_cost)
    inst = scoring.Instrumented(budget)
    sem = asyncio.Semaphore(4)

    cases = load_base_cases(bases, cross=cross)
    rows: list[dict] = []
    llm_rows: list[dict] = []
    review_rows: list[dict] = []

    yoe_curve: list[dict] = []
    for case_index, case in enumerate(cases):
        job = job_ns(case.job)
        await scoring.embed_job(job)
        # Self-reported years of experience, content unchanged: shows whether the
        # model is monotonic in experience or penalises senior (≈ older) people.
        curve_apps = []
        for yoe in YOE_POINTS if case_index < curve_cases else []:
            data = {**case.resume, "years_of_experience": yoe}
            curve_apps.append(application_ns(resume_ns(data), case.candidate_name))
        for a in curve_apps:
            await scoring.embed_application(a, inst)
        curve_probs, _ = scoring.ml_score(job, curve_apps) if curve_apps else ([], [])
        if curve_apps:
            yoe_curve.append(
                {
                    "case": case.case_id,
                    "true_yoe": case.resume["years_of_experience"],
                    "threshold": job.shortlist_threshold,
                    "scores": {
                        y: round(p * 100)
                        for y, p in zip(YOE_POINTS, curve_probs, strict=True)
                    },
                }
            )
        variants = build_variants(case.resume, case.candidate_name, seed=seed)
        apps = [application_ns(resume_ns(v.resume), v.applicant_name) for v in variants]
        # Sequential embedding keeps "last embedded hash" attribution exact.
        embed_hashes = [await scoring.embed_application(a, inst) for a in apps]
        probs, feats = scoring.ml_score(job, apps)
        threshold = job.shortlist_threshold
        ref_prob = probs[0]
        ref_ml_hash = scoring.ml_input_hash(job, apps[0], embed_hashes[0])
        ref_gap_hash = scoring.gap_payload_hash(apps[0].resume)
        ref_sl_hash = scoring.shortlisting_payload_hash(job, apps[0])
        for v, app, eh, prob, feat in zip(
            variants, apps, embed_hashes, probs, feats, strict=True
        ):
            rows.append(
                {
                    "case": case.case_id,
                    "job": job.title,
                    "threshold": threshold,
                    "axis": v.axis,
                    "group": v.group,
                    "label": v.label,
                    "applicant_name": v.applicant_name,
                    "prob": round(prob, 4),
                    "score": round(prob * 100),
                    "delta_vs_reference": round(prob - ref_prob, 4),
                    "selected": round(prob * 100) >= threshold,
                    "llm_cohort_eligible": prob >= settings.ml_bouncer_min_score,
                    "ml_input_identical": scoring.ml_input_hash(job, app, eh)
                    == ref_ml_hash,
                    "gap_llm_input_identical": scoring.gap_payload_hash(app.resume)
                    == ref_gap_hash,
                    "review_llm_input_identical": scoring.shortlisting_payload_hash(
                        job, app
                    )
                    == ref_sl_hash,
                    "features": dict(
                        zip(
                            [
                                "tfidf_sim",
                                "semantic_sim",
                                "yoe",
                                "num_companies",
                                "num_educations",
                                "num_skills",
                            ],
                            [round(x, 4) for x in feat],
                            strict=True,
                        )
                    ),
                }
            )

        if with_llm and case_index < llm_bases:
            # Noise floor: the unchanged reference, `repeats` times.
            # One variant per (axis, group) whose LLM input actually differs;
            # the reference gets an extra run so the noise floor is visible.
            picked = [(variants[0], apps[0])] * (repeats + 1)
            seen_hash = {ref_gap_hash}
            seen_group: set[tuple[str, str]] = set()
            for v, app in zip(variants, apps, strict=True):
                h = scoring.gap_payload_hash(app.resume)
                if v.is_reference or h in seen_hash or (v.axis, v.group) in seen_group:
                    continue
                seen_hash.add(h)
                seen_group.add((v.axis, v.group))
                picked.extend([(v, app)] * repeats)
            results = await asyncio.gather(
                *(
                    _bounded(sem, scoring.gap_analysis(job, app.resume, inst))
                    for _, app in picked
                ),
                return_exceptions=True,
            )
            for (v, _), res in zip(picked, results, strict=True):
                llm_rows.append(
                    {
                        "case": case.case_id,
                        "axis": v.axis,
                        "group": v.group,
                        "label": v.label,
                        "error": repr(res) if isinstance(res, Exception) else None,
                        **({} if isinstance(res, Exception) else res),
                    }
                )

        if with_llm and case_index < review_bases:
            # Reference twice (noise floor) plus the variants whose review input differs.
            picked = [(variants[0], apps[0]), (variants[0], apps[0])]
            for wanted in ("gap_silent", "gap_disclosed", "yoe_missing", "tier3"):
                match = next(
                    (
                        (v, a)
                        for v, a in zip(variants, apps, strict=True)
                        if v.group == wanted
                    ),
                    None,
                )
                if match:
                    picked.append(match)
            for v, app in picked:
                try:
                    res = await scoring.shortlisting_review(
                        job, app, v.applicant_name, inst
                    )
                    err = None
                except Exception as exc:  # noqa: BLE001 - audit records failures
                    res, err = {}, repr(exc)
                weaknesses = res.get("weaknesses") or []
                review_rows.append(
                    {
                        "case": case.case_id,
                        "axis": v.axis,
                        "group": v.group,
                        "label": v.label,
                        "error": err,
                        "n_strengths": len(res.get("strengths") or []),
                        "n_weaknesses": len(weaknesses),
                        "gap_or_tenure_concerns": [
                            w for w in weaknesses if GAP_WORDS.search(w)
                        ],
                        "institution_mentions": [
                            w
                            for w in (res.get("strengths") or []) + weaknesses
                            if PRESTIGE_WORDS.search(w)
                        ],
                        **res,
                    }
                )

    inst.flush()
    return {
        "mode": "fairness",
        "config": {
            "bases": len(cases),
            "cross_pairings": cross,
            "with_llm": with_llm,
            "llm_bases": llm_bases if with_llm else 0,
            "review_bases": review_bases if with_llm else 0,
            "repeats": repeats,
            "seed": seed,
            "ml_bouncer_min_score": settings.ml_bouncer_min_score,
            "bedrock_model": settings.aws_bedrock_shortlisting_model_id,
        },
        "cases": [
            {
                "case": c.case_id,
                "candidate": c.candidate_name,
                "job": c.job["title"],
                "seed_score": c.seed_score,
            }
            for c in cases
        ],
        "ml_rows": rows,
        "yoe_curve": yoe_curve,
        "ml_summary": summarize_ml(rows),
        "gap_llm_rows": llm_rows,
        "gap_llm_summary": summarize_llm(llm_rows),
        "review_rows": review_rows,
        "spend": budget.summary(),
        "provider_events": {
            "groq_429_retries": inst.rate_limited,
            "gemini_429_retries": inst.embed_rate_limited,
            "guardrail_fail_open_events": inst.fail_open,
            "fail_open_samples": scoring.fail_open_events()[:3],
        },
    }


def summarize_ml(rows: list[dict]) -> dict:
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
                "mean_score": round(statistics.mean(i["score"] for i in items), 1),
                "mean_delta_pts": round(
                    100 * statistics.mean(i["delta_vs_reference"] for i in items), 1
                ),
                "selection_rate": round(
                    statistics.mean(1.0 if i["selected"] else 0.0 for i in items), 3
                ),
                "llm_cohort_rate": round(
                    statistics.mean(
                        1.0 if i["llm_cohort_eligible"] else 0.0 for i in items
                    ),
                    3,
                ),
                "flip_vs_reference": round(
                    statistics.mean(
                        1.0 if i["selected"] != ref[i["case"]]["selected"] else 0.0
                        for i in items
                    ),
                    3,
                ),
                "ml_input_identical_share": round(
                    statistics.mean(
                        1.0 if i["ml_input_identical"] else 0.0 for i in items
                    ),
                    3,
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
    """Per-case deltas against that case's own reference runs (scores differ across jobs)."""
    ok = [r for r in rows if not r.get("error")]
    ref_by_case: dict[str, list[int]] = defaultdict(list)
    for r in ok:
        if r["axis"] == "reference":
            ref_by_case[r["case"]].append(r["overall_score_estimate"])
    out: dict[str, dict] = {
        "reference_noise": {
            case: {"scores": s, "spread": max(s) - min(s)}
            for case, s in ref_by_case.items()
        }
    }
    grouped: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    raw: dict[str, dict[str, list[int]]] = defaultdict(lambda: defaultdict(list))
    for r in ok:
        if r["axis"] == "reference" or not ref_by_case.get(r["case"]):
            continue
        ref_mean = statistics.mean(ref_by_case[r["case"]])
        grouped[r["axis"]][r["group"]].append(r["overall_score_estimate"] - ref_mean)
        raw[r["axis"]][r["group"]].append(r["overall_score_estimate"])
    for axis, groups in grouped.items():
        out[axis] = {
            g: {
                "n": len(v),
                "mean_score": round(statistics.mean(raw[axis][g]), 1),
                "mean_delta_vs_reference": round(statistics.mean(v), 1),
            }
            for g, v in groups.items()
        }
    out["errors"] = len(rows) - len(ok)
    return out
