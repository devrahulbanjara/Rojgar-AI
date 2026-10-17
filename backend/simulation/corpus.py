"""Base resumes and jobs, built as lightweight stand-ins for the ORM objects.

The code under test (blind review text, ML tie-break, rubric, guardrail text
flattening) only reads attributes, so plain namespaces let us call the *real*
functions without writing rows to Postgres.

Cases cover tech roles (seed_data.APPLICATIONS) and non-tech roles from
seed_data.NONTECH_COMPANIES (bank teller, staff nurse, cashier, driver, cook),
including an answers-only applicant who wrote in Nepali.
"""

from __future__ import annotations

import copy
import uuid
from dataclasses import dataclass
from datetime import date
from types import SimpleNamespace

from app.shared.enums import JobCategory, LocationType

# Non-tech applicants from seed_data.NONTECH_COMPANIES used as base cases.
NONTECH_CASES = (
    "Sabina Rai",  # staff nurse, English CV
    "Rojina Shrestha",  # cashier, English CV
    "Krishna Bhandari",  # delivery driver, English CV
    "Prakriti Shrestha",  # bank teller, English CV
    "Ram Bahadur Magar",  # cook, no CV, answers in Nepali
)


@dataclass
class BaseCase:
    case_id: str
    candidate_name: str
    resume: dict | None  # plain data, transformed by variants; None = no CV
    job: dict
    seed_score: int  # score the seed author assigned the pairing (context only)
    answers: list[dict] | None = None
    kind: str = "tech"


def _as_date(value) -> date | None:
    if value is None or isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


def load_base_cases(limit: int, *, cross: bool = False) -> list[BaseCase]:
    """Pick the strongest distinct candidate→job pairings from the seed data.

    Borderline pairings are kept on purpose: identity flips matter most near
    the shortlist threshold.
    """
    import seed_data as seed

    ordered = sorted(seed.APPLICATIONS, key=lambda row: -row[4])
    cases: list[BaseCase] = []
    seen: set[int] = set()
    for row in ordered:
        cand_idx, company_idx, job_idx, _variant, seed_score = row[:5]
        if cand_idx in seen:
            continue
        jobs = seed.COMPANIES[company_idx]["jobs"]
        if job_idx >= len(jobs):
            continue
        seen.add(cand_idx)
        cand = seed.CANDIDATES[cand_idx]
        job = jobs[job_idx]
        resume = {
            "headline": cand["headline"],
            "summary": cand["summary"],
            "years_of_experience": cand["years_of_experience"],
            "location": cand.get("location"),
            "phone": cand.get("phone"),
            "linkedin_url": cand.get("linkedin_url"),
            "github_url": cand.get("github_url"),
            "portfolio_url": cand.get("portfolio_url"),
            "skills": list(cand["skills"]),
            "experiences": [
                {
                    "title": e["title"],
                    "company_name": e["company_name"],
                    "start_date": _as_date(e.get("start_date")),
                    "end_date": _as_date(e.get("end_date")),
                    "description": list(e.get("description") or []),
                }
                for e in cand["experiences"]
            ],
            "educations": [
                {
                    "institution": e["institution"],
                    "degree": e.get("degree"),
                    "field_of_study": e.get("field_of_study"),
                    "start_date": _as_date(e.get("start_date")),
                    "end_date": _as_date(e.get("end_date")),
                }
                for e in cand["educations"]
            ],
        }
        cases.append(
            BaseCase(
                case_id=f"case{len(cases) + 1:02d}",
                candidate_name=cand["full_name"],
                resume=resume,
                job=copy.deepcopy(job),
                seed_score=seed_score,
            )
        )
        if len(cases) >= limit:
            break
    if cross and len(cases) > 1:
        # Off-target pairings (candidate i -> job of candidate i+1) land near the
        # decision boundary, where a small identity-driven shift can flip outcomes.
        n = len(cases)
        for i in range(n):
            src, other = cases[i], cases[(i + 1) % n]
            if src.job["title"] == other.job["title"]:
                continue
            cases.append(
                BaseCase(
                    case_id=f"x{i + 1:02d}",
                    candidate_name=src.candidate_name,
                    resume=copy.deepcopy(src.resume),
                    job=copy.deepcopy(other.job),
                    seed_score=-1,
                )
            )
    return cases


def load_nontech_cases(limit: int) -> list[BaseCase]:
    """Non-tech applicants (CV text and/or answers) from the seed data."""
    import seed_data as seed

    wanted = list(NONTECH_CASES[:limit])
    found: dict[str, BaseCase] = {}
    for company in seed.NONTECH_COMPANIES:
        for job in company["jobs"]:
            questions = seed.job_questions(job)
            for applicant in job["applicants"]:
                name = applicant["full_name"]
                if name not in wanted:
                    continue
                answers = [
                    {"question": q["label"], "answer": a}
                    for q, a in zip(
                        questions, applicant.get("answers") or [], strict=False
                    )
                ]
                resume = None
                if applicant.get("cv"):
                    resume = {
                        "headline": None,
                        "summary": applicant["cv"],
                        "years_of_experience": None,
                        "location": "Kathmandu, Nepal",
                        "phone": applicant.get("phone"),
                        "linkedin_url": None,
                        "github_url": None,
                        "portfolio_url": None,
                        "skills": [],
                        "experiences": [],
                        "educations": [],
                    }
                found[name] = BaseCase(
                    case_id=f"nt{wanted.index(name) + 1:02d}",
                    candidate_name=name,
                    resume=resume,
                    job=copy.deepcopy(job),
                    seed_score=-1,
                    answers=answers or None,
                    kind="non_tech",
                )
    return [found[n] for n in wanted if n in found]


def resume_ns(
    data: dict | None, *, resume_name: str = "Simulated resume"
) -> SimpleNamespace | None:
    """Build an object shaped like resumes.models.Resume (attributes only)."""
    if data is None:
        return None
    return SimpleNamespace(
        id=uuid.uuid4(),
        resume_name=resume_name,
        headline=data.get("headline"),
        summary=data.get("summary"),
        years_of_experience=data.get("years_of_experience"),
        location=data.get("location"),
        phone=data.get("phone"),
        linkedin_url=data.get("linkedin_url"),
        github_url=data.get("github_url"),
        portfolio_url=data.get("portfolio_url"),
        experiences=[SimpleNamespace(**e) for e in data.get("experiences", [])],
        educations=[SimpleNamespace(**e) for e in data.get("educations", [])],
        skills=[SimpleNamespace(skill_name=s) for s in data.get("skills", [])],
    )


def job_ns(data: dict) -> SimpleNamespace:
    """Build an object shaped like jobs.models.Job (attributes only)."""
    import seed_data as seed

    loc_type = data.get("location_type") or "onsite"
    if not isinstance(loc_type, LocationType):
        loc_type = LocationType(str(loc_type))
    return SimpleNamespace(
        id=uuid.uuid4(),
        title=data["title"],
        location=data.get("location"),
        location_type=loc_type,
        category=data.get("category") or JobCategory.it_software,
        description=seed.job_description(data),
        must_haves=seed.job_must_haves(data),
        nice_to_haves=list(
            data.get("nice_to_haves") or data.get("preferred_qualifications") or []
        )[:6],
        questions=seed.job_questions(data),
        jd_embedding=None,
    )


def application_ns(
    resume: SimpleNamespace | None,
    applicant_name: str,
    answers: list[dict] | None = None,
) -> SimpleNamespace:
    """Build an object shaped like applications.models.Application."""
    return SimpleNamespace(
        id=uuid.uuid4(),
        resume=resume,
        resume_embedding=None,
        screening_answers=answers,
        shared_full_name=applicant_name,
        user=SimpleNamespace(full_name=applicant_name),
    )
