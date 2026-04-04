from datetime import datetime, timedelta, timezone

import pytest

from app.modules.outreach.models import EmailDraft
from app.shared.enums import ApplicationStatus
from tests.integration.helpers import (
    auth_headers,
    make_application,
    make_company,
    make_interview,
    make_job,
    make_membership,
    make_profile,
    make_resume,
    make_user,
)


class TestDashboardAccess:
    @pytest.mark.asyncio
    async def test_recruiter_cannot_access_candidate_dashboard(self, client, db):
        recruiter = await make_user(
            db,
            "recruiter.only.dashboard@test.com",
            role="recruiter",
        )

        resp = await client.get(
            "/dashboards/candidate",
            headers=auth_headers(recruiter),
        )

        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_candidate_dashboard_requires_authentication(self, client):
        resp = await client.get("/dashboards/candidate")

        assert resp.status_code == 401


class TestCandidateDashboard:
    @pytest.mark.asyncio
    async def test_candidate_dashboard_returns_stats_pipeline_and_interviews(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "candidate.dashboard.recruiter@test.com",
            role="recruiter_admin",
        )
        candidate = await make_user(
            db,
            "candidate.dashboard.user@test.com",
            full_name="Casey Candidate",
        )
        company = await make_company(db, "Candidate Dashboard Co", "canddashco.com")
        await make_membership(db, recruiter, company)
        await make_profile(db, candidate)

        profile_resp = await client.put(
            "/profiles/me",
            json={"is_open_to_work": True},
            headers=auth_headers(candidate),
        )
        assert profile_resp.status_code == 200

        interview_job = await make_job(
            db,
            company,
            recruiter,
            title="Backend Engineer",
        )
        rejected_job = await make_job(
            db,
            company,
            recruiter,
            title="Data Engineer",
        )

        resume = await make_resume(db, candidate, name="Candidate Dashboard Resume")
        interview_application = await make_application(
            db,
            candidate,
            interview_job,
            resume,
            status=ApplicationStatus.interview_booked,
        )
        await make_application(
            db,
            candidate,
            rejected_job,
            resume,
            status=ApplicationStatus.rejected,
        )
        await make_interview(
            db,
            interview_application,
            candidate_name="Casey Candidate",
            candidate_email=candidate.email,
            start_time=datetime.now(timezone.utc) + timedelta(days=1),
            title="Technical Screen",
        )

        resp = await client.get(
            "/dashboards/candidate",
            headers=auth_headers(candidate),
        )

        assert resp.status_code == 200
        payload = resp.json()["data"]
        assert payload["user_name"] == "Casey Candidate"
        assert payload["is_open_to_work"] is True
        assert payload["stats"] == {
            "total_applications": 2,
            "shortlisted": 0,
            "interviews_booked": 1,
            "offers": 0,
            "rejected": 1,
        }
        assert len(payload["applications"]) == 2
        assert payload["applications"][0]["pipeline_step"] in {None, 4}
        assert payload["interviews"][0]["title"] == "Technical Screen"
        assert payload["interviews"][0]["job_title"] == "Backend Engineer"


class TestRecruiterDashboards:
    @pytest.mark.asyncio
    async def test_recruiter_dashboard_returns_operational_summary(self, client, db):
        recruiter = await make_user(
            db,
            "recruiter.dashboard@test.com",
            role="recruiter_admin",
            full_name="Riley Recruiter",
        )
        company = await make_company(db, "Recruiter Dashboard Co", "recdashco.com")
        await make_membership(db, recruiter, company)

        active_job = await make_job(
            db,
            company,
            recruiter,
            title="Senior Backend Engineer",
            status="active",
        )
        expired_job = await make_job(
            db,
            company,
            recruiter,
            title="Expired Role",
            status="expired",
        )

        shortlisted_candidate = await make_user(db, "shortlisted.candidate@test.com")
        interviewed_candidate = await make_user(db, "interviewed.candidate@test.com")
        shortlisted_resume = await make_resume(
            db,
            shortlisted_candidate,
            name="Shortlisted Resume",
        )
        interviewed_resume = await make_resume(
            db,
            interviewed_candidate,
            name="Interview Resume",
        )

        shortlisted_application = await make_application(
            db,
            shortlisted_candidate,
            active_job,
            shortlisted_resume,
            status=ApplicationStatus.shortlisted,
        )
        interviewed_application = await make_application(
            db,
            interviewed_candidate,
            active_job,
            interviewed_resume,
            status=ApplicationStatus.interview_booked,
        )
        await make_application(
            db,
            shortlisted_candidate,
            expired_job,
            shortlisted_resume,
            status=ApplicationStatus.rejected,
        )

        await make_interview(
            db,
            interviewed_application,
            candidate_name="Interviewed Candidate",
            candidate_email=interviewed_candidate.email,
            start_time=datetime.now(timezone.utc) + timedelta(hours=2),
            title="Final Interview",
        )

        db.add(
            EmailDraft(
                application_id=shortlisted_application.id,
                subject="Shortlist update",
            )
        )
        await db.commit()

        resp = await client.get(
            "/dashboards/recruiter",
            headers=auth_headers(recruiter),
        )

        assert resp.status_code == 200
        payload = resp.json()["data"]
        assert payload["company_name"] == "Recruiter Dashboard Co"
        assert payload["recruiter_name"] == "Riley Recruiter"
        assert payload["stats"] == {
            "active_jobs": 1,
            "total_applications": 3,
            "shortlisted": 1,
            "interviews_today": 1,
            "pending_drafts": 1,
        }
        assert [job["title"] for job in payload["active_jobs"]] == [
            "Senior Backend Engineer"
        ]
        assert payload["todays_interviews"][0]["job_title"] == "Senior Backend Engineer"
        assert payload["pending_drafts"][0]["subject"] == "Shortlist update"

    @pytest.mark.asyncio
    async def test_recruiter_admin_dashboard_includes_join_requests_and_team_activity(
        self, client, db
    ):
        admin = await make_user(
            db,
            "admin.dashboard@test.com",
            role="recruiter_admin",
            full_name="Ada Admin",
        )
        pending_recruiter = await make_user(
            db,
            "pending.dashboard@test.com",
            role="recruiter",
            full_name="Peter Pending",
        )
        active_recruiter = await make_user(
            db,
            "active.dashboard@test.com",
            role="recruiter",
            full_name="Riya Recruiter",
        )

        company = await make_company(db, "Admin Dashboard Co", "admindashco.com")
        await make_membership(db, admin, company, role="admin")
        await make_membership(db, active_recruiter, company, role="recruiter")
        pending_membership = await make_membership(
            db,
            pending_recruiter,
            company,
            role="recruiter",
            status="pending",
        )

        resp = await client.get(
            "/dashboards/recruiter-admin",
            headers=auth_headers(admin),
        )

        assert resp.status_code == 200
        payload = resp.json()["data"]
        assert payload["company_name"] == "Admin Dashboard Co"
        assert payload["stats"]["pending_join_requests"] == 1
        assert payload["join_requests"] == [
            {
                "membership_id": str(pending_membership.id),
                "recruiter_name": "Peter Pending",
                "recruiter_email": "pending.dashboard@test.com",
                "requested_at": payload["join_requests"][0]["requested_at"],
            }
        ]
        activity_names = {row["recruiter_name"] for row in payload["team_activity"]}
        assert activity_names == {"Ada Admin", "Riya Recruiter", "Peter Pending"}
