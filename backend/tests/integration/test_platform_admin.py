"""Platform staff: approvals, suspensions, reports and payments, all audited."""

import uuid

from sqlalchemy import select

from app.modules.admin.models import JobReport, ManualPayment
from app.modules.audit.models import AuditLog
from app.modules.auth.enums import BusinessStatus
from app.modules.companies.models import Company
from app.modules.entitlements.models import JobPass
from app.infrastructures.sms.service import get_sms_provider
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_platform_admin,
    make_recruiter_admin,
)


async def _audit(db, action):
    return await db.scalar(select(AuditLog).where(AuditLog.action_type == action))


async def test_approval_queue_and_decisions(client, db):
    staff = await make_platform_admin(db)
    owner, company = await make_recruiter_admin(
        db, business_status=BusinessStatus.pending
    )
    company.phone, company.district = "+9779811111111", "Kaski"
    company.created_by_user_id = owner.id
    await db.flush()
    headers = auth_headers(staff.id)

    queue = (await client.get("/admin/approvals", headers=headers)).json()["data"]
    assert [b["name"] for b in queue] == ["ACME Corp"]
    assert queue[0]["created_by_name"] == "Test Admin"

    asked = await client.post(
        f"/admin/businesses/{company.id}/request-info",
        json={"message": "Please add a photo of your PAN certificate."},
        headers=headers,
    )
    assert asked.status_code == 200
    assert get_sms_provider().sent[-1][0] == "9811111111"
    assert "PAN certificate" in get_sms_provider().sent[-1][1]
    queue = (await client.get("/admin/approvals", headers=headers)).json()["data"]
    assert queue[0]["info_requested"].startswith("Please add")

    approved = await client.post(
        f"/admin/businesses/{company.id}/approve", headers=headers
    )
    assert approved.status_code == 200
    await db.refresh(company)
    assert company.status == BusinessStatus.active and company.verified_at

    row = await _audit(db, "business_approved")
    assert row.actor_user_id == staff.id and row.actor_role == "platform_admin"
    assert row.company_id == company.id
    assert await _audit(db, "business_info_requested")

    # Approval unlocks publishing; it doesn't publish anything by itself.
    job = await make_active_job(db, company.id)
    assert job.id


async def test_reject_needs_a_reason(client, db):
    staff = await make_platform_admin(db)
    _, company = await make_recruiter_admin(db, business_status=BusinessStatus.pending)
    headers = auth_headers(staff.id)
    missing = await client.post(
        f"/admin/businesses/{company.id}/reject", json={}, headers=headers
    )
    assert missing.status_code == 400
    resp = await client.post(
        f"/admin/businesses/{company.id}/reject",
        json={"reason": "We couldn't confirm this business."},
        headers=headers,
    )
    assert resp.status_code == 200
    await db.refresh(company)
    assert company.status == BusinessStatus.rejected
    assert (await _audit(db, "business_rejected")).reason.startswith("We couldn't")


async def test_suspend_hides_public_pages_and_restore_brings_them_back(client, db):
    staff = await make_platform_admin(db)
    _, company = await make_recruiter_admin(db)
    job = await make_active_job(db, company.id)
    headers = auth_headers(staff.id)

    listed = (await client.get("/admin/businesses?q=acme", headers=headers)).json()
    assert listed["data"][0]["jobs"] == 1 and listed["data"][0]["members"] == 1
    assert listed["data"][0]["plan"] == "free"

    await client.post(
        f"/admin/businesses/{company.id}/suspend",
        json={"reason": "Asked applicants for money"},
        headers=headers,
    )
    hidden = await client.get(f"/public/jobs/{job.slug}")
    assert hidden.status_code == 404
    assert hidden.json()["message"] == "This job is no longer available."
    assert (
        await client.get(f"/public/companies/{company.slug}/jobs")
    ).status_code == 404
    suspended = (
        await client.get("/admin/businesses?status=suspended", headers=headers)
    ).json()["data"]
    assert [b["id"] for b in suspended] == [str(company.id)]

    await client.post(f"/admin/businesses/{company.id}/restore", headers=headers)
    assert (await client.get(f"/public/jobs/{job.slug}")).status_code == 200
    assert await _audit(db, "business_suspended")
    assert await _audit(db, "business_restored")


async def test_report_flow_unpublish_restore_dismiss(client, db):
    staff = await make_platform_admin(db)
    _, company = await make_recruiter_admin(db)
    job = await make_active_job(db, company.id)
    headers = auth_headers(staff.id)

    reported = await client.post(
        f"/public/jobs/{job.slug}/report",
        json={"reason": "fee_requested", "details": "They asked for Rs 5000."},
    )
    assert reported.status_code == 201
    # The same person reporting twice adds nothing.
    await client.post(
        f"/public/jobs/{job.slug}/report", json={"reason": "fee_requested"}
    )
    bad = await client.post(f"/public/jobs/{job.slug}/report", json={"reason": "spam"})
    assert bad.status_code == 400

    flagged = (await client.get("/admin/reports", headers=headers)).json()["data"]
    assert len(flagged) == 1 and len(flagged[0]["reports"]) == 1
    assert flagged[0]["reports"][0]["source"] == "applicant"

    await client.post(f"/admin/jobs/{job.id}/unpublish", json={}, headers=headers)
    assert (await client.get(f"/public/jobs/{job.slug}")).status_code == 404
    assert (await client.get("/admin/reports", headers=headers)).json()["data"] == []
    everything = (
        await client.get("/admin/reports?include_resolved=true", headers=headers)
    ).json()["data"]
    assert everything[0]["unpublished"] is True

    await client.post(f"/admin/jobs/{job.id}/restore", headers=headers)
    assert (await client.get(f"/public/jobs/{job.slug}")).status_code == 200

    await client.post(f"/public/jobs/{job.slug}/report", json={"reason": "fake"})
    await client.post(f"/admin/jobs/{job.id}/dismiss", headers=headers)
    report = await db.scalar(select(JobReport).where(JobReport.reason == "fake"))
    assert report.resolution == "dismissed" and report.resolved_by_user_id == staff.id
    for action in ("job_unpublished", "job_restored", "job_reports_dismissed"):
        row = await _audit(db, action)
        assert row.actor_user_id == staff.id, action


async def test_jobs_asking_for_money_or_unfair_must_haves_are_flagged(db):
    _, company = await make_recruiter_admin(db)
    fee = await make_active_job(
        db,
        company.id,
        title="Sales staff",
        overview="Candidates must pay a registration fee of Rs 2000 before joining.",
    )
    unfair = await make_active_job(
        db, company.id, title="Receptionist", requirements=["Female only, age 20-25"]
    )
    fine = await make_active_job(
        db,
        company.id,
        title="Driver",
        overview="We pay NPR 30,000 a month and an attractive bonus.",
    )
    await make_active_job(
        db, company.id, title="Draft", status="draft", overview="Pay a deposit"
    )
    reasons = {
        (r.job_id, r.reason)
        for r in await db.scalars(select(JobReport).where(JobReport.source == "auto"))
    }
    assert reasons == {(fee.id, "fee_requested"), (unfair.id, "discriminatory")}
    assert all(job_id != fine.id for job_id, _ in reasons)


async def test_bank_transfer_marked_received_applies_the_purchase(client, db):
    staff = await make_platform_admin(db)
    owner, company = await make_recruiter_admin(db)
    job = await make_active_job(db, company.id)
    owner_headers = auth_headers(owner.id)

    no_job = await client.post(
        f"/businesses/{company.id}/bank-transfers",
        json={"kind": "job_pass"},
        headers=owner_headers,
    )
    assert no_job.status_code == 400
    asked = await client.post(
        f"/businesses/{company.id}/bank-transfers",
        json={"kind": "job_pass", "job_id": str(job.id)},
        headers=owner_headers,
    )
    assert asked.status_code == 201
    assert asked.json()["data"]["amount_npr"] == 1129  # 999 + 13% VAT
    plan = await client.post(
        f"/businesses/{company.id}/bank-transfers",
        json={"kind": "team"},
        headers=owner_headers,
    )
    headers = auth_headers(staff.id)

    overview = (await client.get("/admin/payments", headers=headers)).json()["data"]
    assert {t["item"] for t in overview["transfers"]} == {
        "Job Pass",
        "Team plan, 1 month",
    }
    assert overview["paid"] == []

    for payment_id in (asked.json()["data"]["id"], plan.json()["data"]["id"]):
        done = await client.post(
            f"/admin/payments/{payment_id}/received",
            json={"reference": "NIC-778812"},
            headers=headers,
        )
        assert done.status_code == 200
    passes = list(await db.scalars(select(JobPass).where(JobPass.job_id == job.id)))
    assert [p.kind for p in passes] == ["job_pass"]
    await db.refresh(company)
    assert company.plan == "team"

    overview = (await client.get("/admin/payments", headers=headers)).json()["data"]
    assert {t["status"] for t in overview["transfers"]} == {"received"}
    assert overview["paid"][0]["plan"] == "team"
    assert overview["paid"][0]["active_passes"] == 1
    row = await _audit(db, "payment_received")
    assert row.actor_user_id == staff.id
    assert row.metadata_json["reference"] == "NIC-778812"
    payment = await db.get(ManualPayment, uuid.UUID(asked.json()["data"]["id"]))
    assert payment.received_by_user_id == staff.id


async def test_business_owner_cannot_use_admin(client, db):
    owner, company = await make_recruiter_admin(db)
    resp = await client.post(
        f"/admin/businesses/{company.id}/approve", headers=auth_headers(owner.id)
    )
    assert resp.status_code == 403
    assert (await db.get(Company, company.id)).status == BusinessStatus.active
