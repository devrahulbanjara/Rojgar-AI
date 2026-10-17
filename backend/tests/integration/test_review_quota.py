"""Reviews count against the business's reviews; with none left they wait."""

from sqlalchemy import select

from app.modules.applications.models import Review
from app.modules.entitlements import service as entitlements
from app.modules.entitlements.models import CompanyMonthlyUsage
from app.modules.entitlements.plans import PassKind
from app.modules.review import service as review_service
from app.modules.review.reviewer import FakeReviewer
from tests.integration.helpers import (
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)

CV = "Staff nurse at Bir Hospital for 4 years.\nRegistered with Nepal Nursing Council."


async def _safe(*_args, **_kwargs):
    from app.infrastructures.guardrails.service import GuardrailResult

    return GuardrailResult(safe=True, source="review")


async def _flag(*_args, source, **_kwargs):
    from app.infrastructures.guardrails.service import GuardrailResult

    return GuardrailResult(safe=False, source=source, score=90, reason="x")


async def _business(db, email="quota@t.com"):
    _, company = await make_recruiter_admin(db, email=email)
    job = await make_active_job(db, company.id, must_haves=["Staff nurse"])
    return company, job


async def _applicant(db, job, n: int):
    user, resume = await make_candidate_with_resume(db, email=f"q{n}-{job.id}@t.com")
    resume.summary = CV
    return await make_application(db, user.id, job.id, resume.id)


async def _run(db, application, guardrail=_safe):
    return await review_service.review_application(
        application.id,
        db=db,
        reviewer=FakeReviewer(),
        guardrail=guardrail,
        retry_delay=0,
    )


async def _state(db, application) -> str:
    review = await db.scalar(
        select(Review)
        .where(Review.application_id == application.id)
        .execution_options(populate_existing=True)
    )
    return review.state


async def _use_up_plan(db, company) -> None:
    plan = await entitlements.company_plan(db, company.id)
    db.add(
        CompanyMonthlyUsage(
            company_id=company.id,
            month=entitlements.current_month(),
            reviews_used=plan.reviews_per_month,
        )
    )
    await db.flush()


async def test_review_counts_against_the_monthly_allowance(db):
    company, job = await _business(db)
    application = await _applicant(db, job, 1)

    assert await _run(db, application) == "done"

    usage = await db.get(
        CompanyMonthlyUsage, (company.id, entitlements.current_month())
    )
    assert usage.reviews_used == 1


async def test_no_reviews_left_waits_then_runs_after_a_top_up(db):
    company, job = await _business(db, "topup@t.com")
    await _use_up_plan(db, company)
    application = await _applicant(db, job, 2)

    assert await _run(db, application) == "waiting_for_quota"
    assert await _state(db, application) == "waiting_for_quota"
    # Still nothing left: it goes back to waiting without calling the model.
    kw = {"reviewer": FakeReviewer(), "guardrail": _safe, "retry_delay": 0}
    await review_service.resume_waiting_reviews(company.id, db=db, **kw)
    assert await _state(db, application) == "waiting_for_quota"

    await entitlements.add_extra_reviews(db, company.id, 5)
    await db.commit()
    resumed = await review_service.resume_waiting_reviews(company.id, db=db, **kw)

    assert resumed == [application.id]
    assert await _state(db, application) == "done"


async def test_a_job_pass_is_used_before_the_plan(db):
    company, job = await _business(db, "pass@t.com")
    await entitlements.grant_job_pass(db, company.id, job.id, PassKind.job_pass)
    application = await _applicant(db, job, 3)

    assert await _run(db, application) == "done"

    usage = await db.get(
        CompanyMonthlyUsage, (company.id, entitlements.current_month())
    )
    assert usage is None  # the pass paid for it
    plan = await entitlements.get_company_plan(db, (await _owner(db, company)).id)
    assert plan.passes[0].reviews_used == 1


async def test_flagged_cv_gives_the_review_back(db):
    company, job = await _business(db, "flag@t.com")
    application = await _applicant(db, job, 4)

    assert await _run(db, application, guardrail=_flag) == "needs_person"

    usage = await db.get(
        CompanyMonthlyUsage, (company.id, entitlements.current_month())
    )
    assert usage.reviews_used == 0


async def test_plan_shows_how_many_reviews_wait(client, db):
    from tests.integration.helpers import auth_headers

    company, job = await _business(db, "count@t.com")
    await _use_up_plan(db, company)
    application = await _applicant(db, job, 5)
    await _run(db, application)

    owner = await _owner(db, company)
    resp = await client.get("/company/plan", headers=auth_headers(owner.id))
    assert resp.json()["data"]["usage"]["reviews_waiting"] == 1


async def _owner(db, company):
    from app.modules.auth.models import User
    from app.modules.companies.models import CompanyMembership

    return await db.scalar(
        select(User)
        .join(CompanyMembership, CompanyMembership.user_id == User.id)
        .where(CompanyMembership.company_id == company.id)
    )
