import pytest

from tests.integration.helpers import (
    auth_headers,
    make_application,
    make_company,
    make_job,
    make_membership,
    make_resume,
    make_user,
)


class TestShortlisting:
    @pytest.mark.asyncio
    async def test_get_summary_for_own_job(self, client, db):
        recruiter = await make_user(
            db, "shortlist_rec@test.com", role="recruiter_admin"
        )
        company = await make_company(db, "Shortlist Co", "shortlistco.com")
        await make_membership(db, recruiter, company)
        job = await make_job(db, company, recruiter, title="SL Job", status="active")

        resp = await client.get(
            f"/shortlisting/jobs/{job.id}/summary",
            headers=auth_headers(recruiter),
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["shortlist_status"] == "not_started"
        assert data["total_applications"] == 0

    @pytest.mark.asyncio
    async def test_trigger_shortlisting_returns_in_progress(self, client, db):
        recruiter = await make_user(
            db, "shortlist_trigger@test.com", role="recruiter_admin"
        )
        company = await make_company(db, "Trigger Co", "triggerco.com")
        await make_membership(db, recruiter, company)
        job = await make_job(
            db, company, recruiter, title="Trigger Job", status="active"
        )
        candidate = await make_user(db, "trigger_cand@test.com", role="candidate")
        resume = await make_resume(db, candidate, name="Trigger Resume")
        await make_application(db, candidate, job, resume)

        resp = await client.post(
            f"/shortlisting/jobs/{job.id}/trigger",
            headers=auth_headers(recruiter),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["shortlist_status"] == "in_progress"

    @pytest.mark.asyncio
    async def test_candidate_cannot_access_shortlisting(self, client, db):
        recruiter = await make_user(
            db, "shortlist_rec2@test.com", role="recruiter_admin"
        )
        candidate = await make_user(db, "shortlist_cand@test.com", role="candidate")
        company = await make_company(db, "SL2 Co", "sl2co.com")
        await make_membership(db, recruiter, company)
        job = await make_job(db, company, recruiter, title="SL2 Job", status="active")

        resp = await client.get(
            f"/shortlisting/jobs/{job.id}/summary",
            headers=auth_headers(candidate),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_finalize_shortlist_without_ai_marks_completed(self, client, db):
        recruiter = await make_user(
            db, "shortlist_final@test.com", role="recruiter_admin"
        )
        company = await make_company(db, "Final Co", "finalco.com")
        await make_membership(db, recruiter, company)
        job = await make_job(db, company, recruiter, title="Final Job", status="active")

        resp = await client.post(
            f"/shortlisting/jobs/{job.id}/finalize",
            json={"use_ai_recommendations": False},
            headers=auth_headers(recruiter),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["success"] is True
        assert resp.json()["data"]["updated_applications"] == 0
