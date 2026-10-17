"""Plan limits, job passes and review counters for companies.

Guards used by other modules (see docs in the final report for call sites):
- ``ensure_can_open_job`` / ``on_job_opened``  when a job becomes open
- ``ensure_can_add_member``                     when a recruiter becomes active
- ``claim_review`` / ``release_review``         around each AI review
- ``job_features``                              e.g. whether a job sends SMS

Reviews are taken from, in order: an active pass on the job, the company's
monthly allowance, then extra (top-up / volume) reviews. With none left the
application is kept and listed, its review waits (``REVIEW_WAITING_FOR_QUOTA``)
and runs when reviews are available again. Applications are never blocked.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import exists, func, or_, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.applications.models import Application, Review
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import Company, CompanyMembership
from app.modules.entitlements.models import (
    CompanyMonthlyUsage,
    CompanyReviewCredits,
    JobPass,
)
from app.modules.entitlements.plans import (
    PASSES,
    TOP_UP_PRICE_NPR,
    TOP_UP_REVIEWS,
    VAT_PERCENT,
    VOLUME_MINIMUM_NPR,
    VOLUME_PRICE_PER_REVIEW_NPR,
    PassKind,
    Plan,
    PlanId,
    plan_for,
)
from app.modules.entitlements.schemas import (
    Catalog,
    CompanyPlanResponse,
    JobPassView,
    PlanLimits,
    PlanUsage,
    PriceItem,
)
from app.modules.jobs.models import Job
from app.shared.enums import JobStatus

# Billing months follow Nepal time.
BILLING_TZ = ZoneInfo("Asia/Kathmandu")
# Review.state while the company is out of reviews.
REVIEW_WAITING_FOR_QUOTA = "waiting_for_quota"

ReviewClaim = Literal["pass", "plan", "extra"]


def _now() -> datetime:
    return datetime.now(UTC)


def current_month(now: datetime | None = None) -> date:
    """First day of the current billing month."""
    return (now or _now()).astimezone(BILLING_TZ).date().replace(day=1)


async def company_plan(db: AsyncSession, company_id: uuid.UUID) -> Plan:
    return plan_for(
        await db.scalar(select(Company.plan).where(Company.id == company_id))
    )


def _open_job_filter():
    """Jobs that are open to applicants."""
    return (
        Job.status == JobStatus.open,
        or_(Job.closes_at.is_(None), Job.closes_at > func.now()),
    )


def _active_pass(job_id_column, now: datetime):
    return exists().where(
        JobPass.job_id == job_id_column,
        JobPass.starts_at <= now,
        JobPass.expires_at > now,
    )


async def job_has_active_pass(db: AsyncSession, job_id: uuid.UUID) -> bool:
    return bool(await db.scalar(select(_active_pass(job_id, _now()))))


async def count_open_jobs(
    db: AsyncSession, company_id: uuid.UUID, exclude_job_id: uuid.UUID | None = None
) -> int:
    """Open jobs counted against the plan (jobs with an active pass are not)."""
    stmt = select(func.count(Job.id)).where(
        Job.company_id == company_id,
        *_open_job_filter(),
        ~_active_pass(Job.id, _now()),
    )
    if exclude_job_id is not None:
        stmt = stmt.where(Job.id != exclude_job_id)
    return await db.scalar(stmt) or 0


async def count_active_members(db: AsyncSession, company_id: uuid.UUID) -> int:
    """Team seats in use: every member, whichever business they're working in now."""
    return (
        await db.scalar(
            select(func.count(CompanyMembership.id)).where(
                CompanyMembership.company_id == company_id
            )
        )
        or 0
    )


async def _first_job_pass_used(db: AsyncSession, company_id: uuid.UUID) -> bool:
    return bool(
        await db.scalar(
            select(
                exists().where(
                    JobPass.company_id == company_id,
                    JobPass.kind == PassKind.first_job.value,
                )
            )
        )
    )


def _limit_reached(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=message)


def _plural(n: int, word: str) -> str:
    return f"{n} {word}" if n == 1 else f"{n} {word}s"


async def ensure_can_open_job(
    db: AsyncSession, company_id: uuid.UUID, job_id: uuid.UUID | None = None
) -> None:
    """Raise 402 when opening this job would exceed the plan.

    A job with an active pass is always allowed, and a Free company's first
    job is free (it gets a First job pass in ``on_job_opened``).
    """
    if job_id is not None and await job_has_active_pass(db, job_id):
        return
    plan = await company_plan(db, company_id)
    if plan.active_jobs is None:
        return
    if plan.id == PlanId.free and not await _first_job_pass_used(db, company_id):
        return
    if await count_open_jobs(db, company_id, exclude_job_id=job_id) >= plan.active_jobs:
        raise _limit_reached(
            f"The {plan.name} plan allows {_plural(plan.active_jobs, 'active job')}. "
            "Close a job, buy a Job Pass for this one, or upgrade."
        )


async def on_job_opened(
    db: AsyncSession, company_id: uuid.UUID, job_id: uuid.UUID
) -> None:
    """Give a Free company's first opened job its free pass."""
    plan = await company_plan(db, company_id)
    if plan.id == PlanId.free and not await _first_job_pass_used(db, company_id):
        await grant_job_pass(db, company_id, job_id, PassKind.first_job)


async def grant_job_pass(
    db: AsyncSession,
    company_id: uuid.UUID,
    job_id: uuid.UUID,
    kind: PassKind,
    now: datetime | None = None,
) -> JobPass:
    """Attach a pass to a job (call from the payment confirmation)."""
    pass_type = PASSES[kind]
    starts_at = now or _now()
    job_pass = JobPass(
        company_id=company_id,
        job_id=job_id,
        kind=kind.value,
        reviews_included=pass_type.reviews,
        price_npr=pass_type.price_npr,
        starts_at=starts_at,
        expires_at=starts_at + timedelta(days=pass_type.days),
    )
    db.add(job_pass)
    await db.flush()
    return job_pass


async def ensure_can_add_member(db: AsyncSession, company_id: uuid.UUID) -> None:
    """Raise 402 when one more active recruiter would exceed the plan."""
    plan = await company_plan(db, company_id)
    if await count_active_members(db, company_id) >= plan.recruiters:
        raise _limit_reached(
            f"The {plan.name} plan allows {_plural(plan.recruiters, 'recruiter')}. "
            "Remove someone or upgrade to add more."
        )


async def job_features(db: AsyncSession, job_id: uuid.UUID) -> frozenset[str]:
    """Features for a job: the company plan's plus any active pass's."""
    company_id = await db.scalar(select(Job.company_id).where(Job.id == job_id))
    if company_id is None:
        return frozenset()
    features = set((await company_plan(db, company_id)).features)
    now = _now()
    kinds = await db.scalars(
        select(JobPass.kind).where(
            JobPass.job_id == job_id, JobPass.starts_at <= now, JobPass.expires_at > now
        )
    )
    for kind in kinds:
        features |= PASSES[PassKind(kind)].features
    return frozenset(features)


async def claim_review(db: AsyncSession, job_id: uuid.UUID) -> ReviewClaim | None:
    """Count one AI review for an application on ``job_id``.

    Returns where it was counted, or None when no reviews are left: then mark
    the application ``REVIEW_WAITING_FOR_QUOTA`` and review it later. Each
    counter changes in one atomic statement, so parallel reviews never
    overspend. Rows stay locked until the caller commits: commit before the
    LLM call.
    """
    now = _now()
    pass_id = (
        select(JobPass.id)
        .where(
            JobPass.job_id == job_id,
            JobPass.starts_at <= now,
            JobPass.expires_at > now,
            JobPass.reviews_used < JobPass.reviews_included,
        )
        .order_by(JobPass.expires_at)
        .limit(1)
        .scalar_subquery()
    )
    from_pass = await db.execute(
        update(JobPass)
        .where(JobPass.id == pass_id, JobPass.reviews_used < JobPass.reviews_included)
        .values(reviews_used=JobPass.reviews_used + 1)
        .returning(JobPass.id)
    )
    if from_pass.first() is not None:
        return "pass"

    company_id = await db.scalar(select(Job.company_id).where(Job.id == job_id))
    if company_id is None:
        return None
    plan = await company_plan(db, company_id)
    month = current_month(now)
    usage = CompanyMonthlyUsage.__table__
    from_plan = await db.execute(
        pg_insert(usage)
        .values(company_id=company_id, month=month, reviews_used=1)
        .on_conflict_do_update(
            index_elements=[usage.c.company_id, usage.c.month],
            set_={"reviews_used": usage.c.reviews_used + 1},
            where=usage.c.reviews_used < plan.reviews_per_month,
        )
        .returning(usage.c.reviews_used)
    )
    if from_plan.first() is not None:
        return "plan"

    from_credits = await db.execute(
        update(CompanyReviewCredits)
        .where(
            CompanyReviewCredits.company_id == company_id,
            CompanyReviewCredits.remaining > 0,
        )
        .values(remaining=CompanyReviewCredits.remaining - 1)
        .returning(CompanyReviewCredits.remaining)
    )
    if from_credits.first() is None:
        return None
    await db.execute(
        update(CompanyMonthlyUsage)
        .where(
            CompanyMonthlyUsage.company_id == company_id,
            CompanyMonthlyUsage.month == month,
        )
        .values(extra_reviews_used=CompanyMonthlyUsage.extra_reviews_used + 1)
    )
    return "extra"


async def release_review(
    db: AsyncSession, job_id: uuid.UUID, claim: ReviewClaim
) -> None:
    """Give back a claimed review that did not happen (e.g. unreadable CV)."""
    now = _now()
    if claim == "pass":
        latest = (
            select(JobPass.id)
            .where(JobPass.job_id == job_id, JobPass.reviews_used > 0)
            .order_by(JobPass.expires_at.desc())
            .limit(1)
            .scalar_subquery()
        )
        await db.execute(
            update(JobPass)
            .where(JobPass.id == latest)
            .values(reviews_used=JobPass.reviews_used - 1)
        )
        return
    company_id = await db.scalar(select(Job.company_id).where(Job.id == job_id))
    where = (
        CompanyMonthlyUsage.company_id == company_id,
        CompanyMonthlyUsage.month == current_month(now),
    )
    if claim == "plan":
        await db.execute(
            update(CompanyMonthlyUsage)
            .where(*where, CompanyMonthlyUsage.reviews_used > 0)
            .values(reviews_used=CompanyMonthlyUsage.reviews_used - 1)
        )
        return
    await db.execute(
        update(CompanyMonthlyUsage)
        .where(*where, CompanyMonthlyUsage.extra_reviews_used > 0)
        .values(extra_reviews_used=CompanyMonthlyUsage.extra_reviews_used - 1)
    )
    await add_extra_reviews(db, company_id, 1)


async def add_extra_reviews(
    db: AsyncSession, company_id: uuid.UUID, reviews: int
) -> None:
    """Add top-up or volume reviews (call from the payment/invoice step)."""
    credits = CompanyReviewCredits.__table__
    await db.execute(
        pg_insert(credits)
        .values(company_id=company_id, remaining=reviews)
        .on_conflict_do_update(
            index_elements=[credits.c.company_id],
            set_={"remaining": credits.c.remaining + reviews},
        )
    )


async def set_plan(db: AsyncSession, company_id: uuid.UUID, plan_id: PlanId) -> None:
    """Change a company's plan (call from billing once payments exist)."""
    await db.execute(
        update(Company).where(Company.id == company_id).values(plan=plan_id.value)
    )


async def _member_company_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
    company_id = await db.scalar(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active company membership required.",
        )
    return company_id


def _catalog() -> Catalog:
    def pass_item(kind: PassKind) -> PriceItem:
        p = PASSES[kind]
        return PriceItem(
            name=p.name, price_npr=p.price_npr, days=p.days, reviews=p.reviews
        )

    return Catalog(
        vat_percent=VAT_PERCENT,
        job_pass=pass_item(PassKind.job_pass),
        job_pass_plus=pass_item(PassKind.job_pass_plus),
        top_up=PriceItem(
            name="Extra reviews", price_npr=TOP_UP_PRICE_NPR, reviews=TOP_UP_REVIEWS
        ),
        volume_price_per_review_npr=VOLUME_PRICE_PER_REVIEW_NPR,
        volume_minimum_npr=VOLUME_MINIMUM_NPR,
    )


async def get_company_plan(db: AsyncSession, user_id: uuid.UUID) -> CompanyPlanResponse:
    company_id = await _member_company_id(db, user_id)
    plan = await company_plan(db, company_id)
    now = _now()
    month = current_month(now)
    usage = await db.get(CompanyMonthlyUsage, (company_id, month))
    credits = await db.get(CompanyReviewCredits, company_id)
    reviews_used = usage.reviews_used if usage else 0
    extra_left = credits.remaining if credits else 0
    waiting = await db.scalar(
        select(func.count(Review.id))
        .join(Application, Application.id == Review.application_id)
        .join(Job, Job.id == Application.job_id)
        .where(
            Job.company_id == company_id,
            Review.state == REVIEW_WAITING_FOR_QUOTA,
        )
    )
    pass_rows = await db.execute(
        select(JobPass, Job.title)
        .join(Job, Job.id == JobPass.job_id)
        .where(
            JobPass.company_id == company_id,
            JobPass.expires_at > now - timedelta(days=30),
        )
        .order_by(JobPass.expires_at.desc())
    )
    passes = [
        JobPassView(
            id=p.id,
            job_id=p.job_id,
            job_title=title,
            kind=PassKind(p.kind),
            name=PASSES[PassKind(p.kind)].name,
            reviews_included=p.reviews_included,
            reviews_used=p.reviews_used,
            expires_at=p.expires_at,
            active=p.starts_at <= now < p.expires_at,
        )
        for p, title in pass_rows.all()
    ]
    return CompanyPlanResponse(
        plan=plan.id,
        name=plan.name,
        price_npr_per_month=plan.price_npr_per_month,
        price_npr_per_year=plan.price_npr_per_year,
        month=month,
        limits=PlanLimits(
            active_jobs=plan.active_jobs,
            reviews_per_month=plan.reviews_per_month,
            recruiters=plan.recruiters,
        ),
        features=sorted(plan.features),
        usage=PlanUsage(
            active_jobs=await count_open_jobs(db, company_id),
            reviews_this_month=reviews_used,
            recruiters=await count_active_members(db, company_id),
            extra_reviews_left=extra_left,
            reviews_waiting=waiting or 0,
        ),
        reviews_left_this_month=max(0, plan.reviews_per_month - reviews_used)
        + extra_left,
        passes=passes,
        catalog=_catalog(),
    )
