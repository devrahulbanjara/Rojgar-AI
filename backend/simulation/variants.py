"""Counterfactual identity variants: change ONE protected/proxy attribute at a time."""

from __future__ import annotations

import copy
import random
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date

from simulation.personas import (
    AGE_BANDS,
    COLLEGES,
    FIRST_NAMES,
    HOMETOWNS,
    SURNAME_GROUPS,
)


@dataclass
class Variant:
    axis: str
    group: str
    label: str
    applicant_name: str
    resume: dict
    is_reference: bool = False


def _shift_years(d: date | None, years: int) -> date | None:
    if d is None:
        return None
    try:
        return d.replace(year=d.year + years)
    except ValueError:  # Feb 29
        return d.replace(year=d.year + years, day=28)


def _with(resume: dict, fn: Callable[[dict], None]) -> dict:
    out = copy.deepcopy(resume)
    fn(out)
    return out


def _set_location(town: str):
    def fn(r: dict) -> None:
        r["location"] = f"{town}, Nepal"

    return fn


def _set_college(name: str):
    def fn(r: dict) -> None:
        if r["educations"]:
            r["educations"][0]["institution"] = name

    return fn


def _age_shift(years: int):
    def fn(r: dict) -> None:
        for edu in r["educations"]:
            edu["start_date"] = _shift_years(edu["start_date"], years)
            edu["end_date"] = _shift_years(edu["end_date"], years)

    return fn


def _gap(disclose: bool):
    """Insert a 2-year career break before the current role.

    Earlier roles and education move two years back; total years of experience
    stays the same, so only the *gap* differs from the reference.
    """

    def fn(r: dict) -> None:
        exps = sorted(
            r["experiences"],
            key=lambda e: e["start_date"] or date.min,
            reverse=True,
        )
        for exp in exps[1:]:
            exp["start_date"] = _shift_years(exp["start_date"], -2)
            exp["end_date"] = _shift_years(exp["end_date"], -2)
        for edu in r["educations"]:
            edu["start_date"] = _shift_years(edu["start_date"], -2)
            edu["end_date"] = _shift_years(edu["end_date"], -2)
        if disclose:
            current = exps[0]["start_date"] if exps else None
            year = current.year if current else 2023
            r["summary"] = (
                (r.get("summary") or "")
                + f" I took a two-year career break ({year - 2}–{year}) for family caregiving"
                " and returned to full-time engineering work."
            )

    return fn


def _yoe_missing(r: dict) -> None:
    r["years_of_experience"] = None


def build_variants(
    base_resume: dict, base_name: str, *, seed: int = 7
) -> list[Variant]:
    """All single-attribute counterfactuals for one base resume."""
    rng = random.Random(seed)
    out: list[Variant] = [
        Variant(
            "reference",
            "reference",
            "unchanged",
            base_name,
            copy.deepcopy(base_resume),
            True,
        )
    ]

    # Name → caste/ethnicity and gender signal. Resume content untouched.
    for group, surnames in SURNAME_GROUPS.items():
        for gender, firsts in FIRST_NAMES.items():
            name = f"{rng.choice(firsts)} {rng.choice(surnames)}"
            out.append(
                Variant("name_group", group, name, name, copy.deepcopy(base_resume))
            )
            out.append(
                Variant("name_gender", gender, name, name, copy.deepcopy(base_resume))
            )

    for region, towns in HOMETOWNS.items():
        town = towns[0]
        out.append(
            Variant(
                "hometown",
                region,
                town,
                base_name,
                _with(base_resume, _set_location(town)),
            )
        )

    for tier, colleges in COLLEGES.items():
        for college in colleges:
            out.append(
                Variant(
                    "college_tier",
                    tier,
                    college,
                    base_name,
                    _with(base_resume, _set_college(college)),
                )
            )

    for band, years in AGE_BANDS.items():
        out.append(
            Variant(
                "age_graduation_year",
                band,
                f"graduation {years:+d}y",
                base_name,
                _with(base_resume, _age_shift(years)),
            )
        )

    out.append(
        Variant(
            "employment_gap",
            "no_gap",
            "reference timeline",
            base_name,
            copy.deepcopy(base_resume),
        )
    )
    out.append(
        Variant(
            "employment_gap",
            "gap_silent",
            "2y gap, dates only",
            base_name,
            _with(base_resume, _gap(False)),
        )
    )
    out.append(
        Variant(
            "employment_gap",
            "gap_disclosed",
            "2y caregiving gap, explained",
            base_name,
            _with(base_resume, _gap(True)),
        )
    )

    out.append(
        Variant(
            "data_completeness",
            "yoe_reported",
            "years_of_experience present",
            base_name,
            copy.deepcopy(base_resume),
        )
    )
    out.append(
        Variant(
            "data_completeness",
            "yoe_missing",
            "years_of_experience left blank",
            base_name,
            _with(base_resume, _yoe_missing),
        )
    )
    return out
