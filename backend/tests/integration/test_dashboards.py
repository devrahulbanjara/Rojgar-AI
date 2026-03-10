import pytest

from tests.integration.helpers import (
    make_application,
    auth_headers,
    make_company,
    make_job,
    make_membership,
    make_resume,
    make_user,
)


class TestDashboard:
    @pytest.mark.asyncio
    async def test_recruiter_cannot_access_candidate_dashboard(self, client, db):
        recruiter = await make_user(
            db, "recruiter_only_dashboard@test.com", role="recruiter"
        )

        resp = await client.get(
            "/dashboards/candidate", headers=auth_headers(recruiter)
        )

        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_candidate_dashboard_requires_authentication(self, client):
        resp = await client.get("/dashboards/candidate")

        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_recruiter_dashboard_returns_top_active_jobs(self, client, db):
        recruiter = await make_user(
            db, "recruiter_dashboard@test.com", role="recruiter_admin"
        )
        company = await make_company(db, "Dashboard Co", "dashboardco.com")
        await make_membership(db, recruiter, company)

        jobs = []
        for index in range(8):
            job = await make_job(
                db,
                company,
                recruiter,
                title=f"Active Job {index}",
                status="active",
            )
            jobs.append(job)

            for application_index in range(index):
                candidate = await make_user(
                    db,
                    f"candidate_{index}_{application_index}@test.com",
                    role="candidate",
                )
                resume = await make_resume(
                    db, candidate, name=f"Resume {index}-{application_index}"
                )
                await make_application(db, candidate, job, resume)

        await make_job(
            db,
            company,
            recruiter,
            title="Expired Job",
            status="expired",
        )

        resp = await client.get(
            "/dashboards/recruiter", headers=auth_headers(recruiter)
        )

        assert resp.status_code == 200
        payload = resp.json()["data"]
        assert payload["company_name"] == "Dashboard Co"
        assert len(payload["top_jobs"]) == 7
        assert all(job["status"] == "active" for job in payload["top_jobs"])
        assert payload["top_jobs"][0]["title"] == "Active Job 7"
