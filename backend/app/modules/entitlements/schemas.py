import uuid
from datetime import date, datetime

from app.core.schemas import BaseSchema
from app.modules.entitlements.plans import PassKind, PlanId


class PlanLimits(BaseSchema):
    active_jobs: int | None  # null = unlimited
    reviews_per_month: int
    recruiters: int


class PlanUsage(BaseSchema):
    # Open jobs counted against the plan (jobs with a pass are not counted).
    active_jobs: int
    reviews_this_month: int
    recruiters: int
    extra_reviews_left: int
    # Applications waiting for a review because the allowance ran out.
    reviews_waiting: int


class JobPassView(BaseSchema):
    id: uuid.UUID
    job_id: uuid.UUID
    job_title: str
    kind: PassKind
    name: str
    reviews_included: int
    reviews_used: int
    expires_at: datetime
    active: bool


class PriceItem(BaseSchema):
    name: str
    price_npr: int
    days: int | None = None
    reviews: int | None = None


class Catalog(BaseSchema):
    vat_percent: int
    job_pass: PriceItem
    job_pass_plus: PriceItem
    top_up: PriceItem
    volume_price_per_review_npr: int
    volume_minimum_npr: int


class CompanyPlanResponse(BaseSchema):
    plan: PlanId
    name: str
    price_npr_per_month: int
    price_npr_per_year: int | None
    month: date
    limits: PlanLimits
    features: list[str]
    usage: PlanUsage
    reviews_left_this_month: int
    passes: list[JobPassView]
    catalog: Catalog
