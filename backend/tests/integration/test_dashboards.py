import pytest
from app.shared.enums import ApplicationStatus

from tests.integration.helpers import (
    auth_headers,
    make_application,
    make_company,
    make_job,
    make_membership,
    make_profile,
    make_resume,
    make_user,
)


class TestDashboard:
    @pytest.mark.asyncio
    async def test_candidate_dashboard_returns_real_stats(self, client, db):
        candidate = await make_user(db, "candidate_dashboard@test.com")
        recruiter = await make_user(
            db, "recruiter_dashboard@test.com", role="recruiter_admin"
        )
        company = await make_company(db, "Acme", "acme.test")
        await make_membership(db, recruiter, company, role="admin", status="active")

        resume_a = await make_resume(db, candidate, name="Base Resume")
        await make_resume(db, candidate, name="Frontend Resume")
        await make_profile(db, candidate, with_children=True)

        job_a = await make_job(db, company, recruiter, title="Backend Engineer")
        job_b = await make_job(db, company, recruiter, title="Platform Engineer")
        job_c = await make_job(db, company, recruiter, title="ML Engineer")

        await make_application(
            db,
            candidate,
            job_a,
            resume_a,
            status=ApplicationStatus.interview,
        )
        await make_application(
            db,
            candidate,
            job_b,
            resume_a,
            status=ApplicationStatus.offered,
        )
        await make_application(
            db,
            candidate,
            job_c,
            resume_a,
            status=ApplicationStatus.submitted,
        )

        resp = await client.get(
            "/dashboards/candidate", headers=auth_headers(candidate)
        )

        assert resp.status_code == 200
        payload = resp.json()["data"]
        assert payload["user_name"] == candidate.full_name
        assert payload["stats"] == {
            "total_applications": 3,
            "active_interviews": 1,
            "offers_received": 1,
            "total_resumes": 2,
            "profile_completion": 100,
        }
        assert len(payload["recent_applications"]) == 3
        assert len(payload["recent_activity"]) == 3
        assert len(payload["recommended_jobs"]) == 3
        assert payload["recent_applications"][0]["company_name"] == "Acme"
        assert [job["title"] for job in payload["recommended_jobs"]] == [
            "ML Engineer",
            "Platform Engineer",
            "Backend Engineer",
        ]
        assert payload["recent_applications"][0]["job_title"] in {
            "Backend Engineer",
            "Platform Engineer",
            "ML Engineer",
        }

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
