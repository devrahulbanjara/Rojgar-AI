"""The cross-job applicant list (one row per person) for business members."""

from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)


async def test_members_list_their_applicants_across_jobs(client, db):
    candidate, resume = await make_candidate_with_resume(
        db, email="cand_rlist@test.com"
    )
    admin, company = await make_recruiter_admin(db, email="admin_rlist@test.com")
    job = await make_active_job(db, company.id)
    await make_application(
        db,
        candidate.id,
        job.id,
        resume.id,
        shared_email_value="cand_rlist@test.com",
    )

    resp = await client.get(
        "/applications/company/me/candidates", headers=auth_headers(admin.id)
    )

    assert resp.status_code == 200
    assert [r["applicant_email"] for r in resp.json()["data"]] == [
        "cand_rlist@test.com"
    ]


async def test_other_business_sees_none_of_them(client, db):
    candidate, resume = await make_candidate_with_resume(db, email="c2@test.com")
    _, company = await make_recruiter_admin(db, email="owner_a@test.com")
    other, _ = await make_recruiter_admin(
        db, email="owner_b@test.com", company_name="Other"
    )
    job = await make_active_job(db, company.id)
    await make_application(db, candidate.id, job.id, resume.id)

    resp = await client.get(
        "/applications/company/me/candidates", headers=auth_headers(other.id)
    )
    assert resp.json()["data"] == []
