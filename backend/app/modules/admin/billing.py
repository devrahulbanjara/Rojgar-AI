"""Bank-transfer payments: an owner asks to pay, staff confirm, the purchase applies.

Prices come from entitlements (they exclude VAT; the amount due adds 13%).
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import ManualPayment
from app.modules.companies.models import Company
from app.modules.entitlements import service as entitlements
from app.modules.entitlements.plans import (
    PASSES,
    PLANS,
    TOP_UP_PRICE_NPR,
    TOP_UP_REVIEWS,
    VAT_PERCENT,
    PassKind,
    PlanId,
)
from app.modules.jobs.models import Job


@dataclass(frozen=True)
class Purchase:
    label: str
    price_npr: int
    for_job: bool


PURCHASES: dict[str, Purchase] = {
    PassKind.job_pass.value: Purchase(
        PASSES[PassKind.job_pass].name, PASSES[PassKind.job_pass].price_npr, True
    ),
    PassKind.job_pass_plus.value: Purchase(
        PASSES[PassKind.job_pass_plus].name,
        PASSES[PassKind.job_pass_plus].price_npr,
        True,
    ),
    PlanId.team.value: Purchase(
        f"{PLANS[PlanId.team].name} plan, 1 month",
        PLANS[PlanId.team].price_npr_per_month,
        False,
    ),
    PlanId.business.value: Purchase(
        f"{PLANS[PlanId.business].name} plan, 1 month",
        PLANS[PlanId.business].price_npr_per_month,
        False,
    ),
    "top_up": Purchase(f"{TOP_UP_REVIEWS} extra reviews", TOP_UP_PRICE_NPR, False),
}


def amount_due(kind: str) -> int:
    return round(PURCHASES[kind].price_npr * (100 + VAT_PERCENT) / 100)


async def request_transfer(
    db: AsyncSession, company: Company, kind: str, job_id: uuid.UUID | None
) -> ManualPayment:
    purchase = PURCHASES[kind]
    if purchase.for_job:
        job = (
            await db.scalar(
                select(Job).where(Job.id == job_id, Job.company_id == company.id)
            )
            if job_id
            else None
        )
        if job is None:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, detail="Choose the job this pass is for."
            )
    payment = ManualPayment(
        company_id=company.id,
        kind=kind,
        job_id=job_id if purchase.for_job else None,
        amount_npr=amount_due(kind),
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


async def apply(db: AsyncSession, payment: ManualPayment) -> None:
    """Give the business what it paid for."""
    if payment.kind in (PassKind.job_pass.value, PassKind.job_pass_plus.value):
        if payment.job_id is None:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail="The job for this pass was deleted. Refund or add it by hand.",
            )
        await entitlements.grant_job_pass(
            db, payment.company_id, payment.job_id, PassKind(payment.kind)
        )
    elif payment.kind in (PlanId.team.value, PlanId.business.value):
        await entitlements.set_plan(db, payment.company_id, PlanId(payment.kind))
    elif payment.kind == "top_up":
        await entitlements.add_extra_reviews(db, payment.company_id, TOP_UP_REVIEWS)
    payment.status = "received"
    payment.received_at = datetime.now(timezone.utc)
