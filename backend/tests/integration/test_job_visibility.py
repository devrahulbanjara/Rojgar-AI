from app.shared.enums import JobStatus
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_candidate,
    make_recruiter_admin,
)


class TestDraftJobVisibility:
    async def test_draft_hidden_from_public_and_candidates(self, client, db):
        _, company = await make_recruiter_admin(db, email="draft_admin@example.com")
        job = await make_active_job(db, company.id, status=JobStatus.draft)
        candidate = await make_candidate(db, email="draft_cand@example.com")

        anonymous = await client.get(f"/jobs/{job.id}")
        as_candidate = await client.get(
            f"/jobs/{job.id}", headers=auth_headers(candidate.id)
        )

        assert anonymous.status_code == 404
        assert as_candidate.status_code == 404

    async def test_draft_visible_to_own_company(self, client, db):
        admin, company = await make_recruiter_admin(
            db, email="draft_owner@example.com", company_name="Draft Co"
        )
        job = await make_active_job(db, company.id, status=JobStatus.draft)

        resp = await client.get(f"/jobs/{job.id}", headers=auth_headers(admin.id))

        assert resp.status_code == 200

    async def test_draft_hidden_from_other_company(self, client, db):
        _, company = await make_recruiter_admin(
            db, email="draft_a@example.com", company_name="Draft A"
        )
        other, _ = await make_recruiter_admin(
            db, email="draft_b@example.com", company_name="Draft B"
        )
        job = await make_active_job(db, company.id, status=JobStatus.draft)

        resp = await client.get(f"/jobs/{job.id}", headers=auth_headers(other.id))

        assert resp.status_code == 404

    async def test_active_job_public(self, client, db):
        _, company = await make_recruiter_admin(db, email="pub_admin@example.com")
        job = await make_active_job(db, company.id)

        resp = await client.get(f"/jobs/{job.id}")

        assert resp.status_code == 200
