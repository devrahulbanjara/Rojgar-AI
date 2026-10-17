"""Plans and job passes: active jobs, seats and AI reviews per company."""

import asyncio

from sqlalchemy import select

from app.modules.entitlements import service as entitlements
from app.modules.entitlements.models import JobPass
from app.modules.entitlements.plans import SMS, PassKind, PlanId
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_recruiter_admin,
)


async def test_plan_endpoint_shows_limits_usage_and_catalog(client, db):
    admin, company = await make_recruiter_admin(db, email="plan@test.dev")
    job = await make_active_job(db, company.id)
    await entitlements.grant_job_pass(db, company.id, job.id, PassKind.job_pass)

    resp = await client.get("/company/plan", headers=auth_headers(admin.id))

    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["plan"] == "free"
    assert data["limits"] == {
        "active_jobs": 1,
        "reviews_per_month": 25,
        "recruiters": 1,
    }
    assert data["usage"]["active_jobs"] == 0  # the pass job is not counted
    assert data["reviews_left_this_month"] == 25
    assert data["passes"][0]["kind"] == "job_pass"
    assert data["passes"][0]["reviews_included"] == 100
    assert data["catalog"]["vat_percent"] == 13
    assert data["catalog"]["job_pass"]["price_npr"] == 999
    assert data["catalog"]["top_up"] == {
        "name": "Extra reviews",
        "price_npr": 1000,
        "days": None,
        "reviews": 100,
    }


async def test_free_plan_first_job_free_then_one_active_job(client, db):
    admin, company = await make_recruiter_admin(db, email="jobs@test.dev")
    headers = auth_headers(admin.id)

    def post(status):
        return client.post(
            "/jobs/",
            json={
                "title": "Dev",
                "location_type": "remote",
                "status": status,
                "description": "x",
            },
            headers=headers,
        )

    first = await post("open")
    assert first.status_code == 201
    first_pass = await db.scalar(
        select(JobPass).where(JobPass.company_id == company.id)
    )
    assert first_pass.kind == "first_job"
    assert SMS in await entitlements.job_features(db, first_pass.job_id)

    assert (await post("open")).status_code == 201  # the plan's 1 active job
    third = await post("open")
    assert third.status_code == 402
    assert "Free plan allows 1 active job" in third.json()["message"]

    draft = await post("draft")
    draft_id = draft.json()["data"]["id"]
    publish = await client.patch(
        f"/jobs/{draft_id}", json={"status": "open"}, headers=headers
    )
    assert publish.status_code == 402

    # A Job Pass lets that job open regardless of the plan.
    await entitlements.grant_job_pass(db, company.id, draft_id, PassKind.job_pass)
    publish = await client.patch(
        f"/jobs/{draft_id}", json={"status": "open"}, headers=headers
    )
    assert publish.status_code == 200


async def test_seat_limit_on_invites(client, db):
    admin, company = await make_recruiter_admin(db, email="seats@test.dev")
    url = f"/businesses/{company.id}/invites"

    blocked = await client.post(
        url, json={"role": "manager"}, headers=auth_headers(admin.id)
    )
    assert blocked.status_code == 402

    await entitlements.set_plan(db, company.id, PlanId.team)
    ok = await client.post(
        url, json={"role": "manager"}, headers=auth_headers(admin.id)
    )
    assert ok.status_code == 201


async def test_reviews_use_pass_then_plan_then_extra_then_wait(db):
    _, company = await make_recruiter_admin(db, email="reviews@test.dev")
    job = await make_active_job(db, company.id)
    job_pass = await entitlements.grant_job_pass(
        db, company.id, job.id, PassKind.job_pass
    )
    job_pass.reviews_included = 2

    claims = [await entitlements.claim_review(db, job.id) for _ in range(27)]
    assert claims == ["pass"] * 2 + ["plan"] * 25
    assert await entitlements.claim_review(db, job.id) is None

    await entitlements.add_extra_reviews(db, company.id, 2)
    assert await entitlements.claim_review(db, job.id) == "extra"
    await entitlements.release_review(db, job.id, "extra")
    assert await entitlements.claim_review(db, job.id) == "extra"
    assert await entitlements.claim_review(db, job.id) == "extra"
    assert await entitlements.claim_review(db, job.id) is None


async def test_concurrent_claims_never_overspend(committed):
    async with committed() as s:
        _, company = await make_recruiter_admin(s, email="race@test.dev")
        job = await make_active_job(s, company.id)
        await s.commit()

    async def claim():
        async with committed() as s:
            result = await entitlements.claim_review(s, job.id)
            await s.commit()
            return result

    results = await asyncio.gather(*[claim() for _ in range(40)])
    assert results.count("plan") == 25
    assert results.count(None) == 15
