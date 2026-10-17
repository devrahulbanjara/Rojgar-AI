"""What companies can buy. Candidates never pay; applying is always free.

Applications are never blocked. Only the AI review is capped: an application
over the cap is stored and listed as usual and is reviewed once reviews are
available again. A review costs about NPR 2-9 in model fees plus ~NPR 2-3 of
SMS per applicant, so every cap below keeps a margin at worst-case cost.
All prices exclude 13% VAT.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

VAT_PERCENT = 13

# Feature flags.
SMS = "sms"
BULK_INVITES = "bulk_invites"
BRANCHES = "branches"


class PlanId(str, Enum):
    free = "free"
    team = "team"
    business = "business"


class PassKind(str, Enum):
    first_job = "first_job"  # the company's first job, free
    job_pass = "job_pass"
    job_pass_plus = "job_pass_plus"


@dataclass(frozen=True)
class Plan:
    id: PlanId
    name: str
    price_npr_per_month: int
    price_npr_per_year: int | None
    active_jobs: int | None  # None = unlimited
    reviews_per_month: int
    recruiters: int  # people on the team, the owner included
    features: frozenset[str] = field(default_factory=frozenset)


@dataclass(frozen=True)
class PassType:
    kind: PassKind
    name: str
    price_npr: int
    days: int
    reviews: int
    features: frozenset[str] = field(default_factory=frozenset)


PLANS: dict[PlanId, Plan] = {
    # Free: the owner and one more person (e.g. a manager).
    PlanId.free: Plan(PlanId.free, "Free", 0, None, 1, 25, 2),
    PlanId.team: Plan(
        PlanId.team, "Team", 3_499, 34_990, 5, 400, 5, frozenset({SMS, BULK_INVITES})
    ),
    PlanId.business: Plan(
        PlanId.business,
        "Business",
        9_999,
        None,
        None,
        1_200,
        15,
        frozenset({SMS, BULK_INVITES, BRANCHES}),
    ),
}

PASSES: dict[PassKind, PassType] = {
    PassKind.first_job: PassType(
        PassKind.first_job, "First job", 0, 45, 100, frozenset({SMS})
    ),
    PassKind.job_pass: PassType(
        PassKind.job_pass, "Job Pass", 999, 45, 100, frozenset({SMS})
    ),
    PassKind.job_pass_plus: PassType(
        PassKind.job_pass_plus,
        "Job Pass Plus",
        2_499,
        60,
        300,
        frozenset({SMS, BULK_INVITES}),
    ),
}

# Extra reviews never expire.
TOP_UP_REVIEWS = 100
TOP_UP_PRICE_NPR = 1_000
# Hiring drives: invoiced, added as extra reviews.
VOLUME_PRICE_PER_REVIEW_NPR = 8
VOLUME_MINIMUM_NPR = 10_000


def plan_for(plan_id: str | None) -> Plan:
    """Plan for a stored id; unknown values fall back to Free."""
    try:
        return PLANS[PlanId(plan_id or PlanId.free)]
    except ValueError:
        return PLANS[PlanId.free]
