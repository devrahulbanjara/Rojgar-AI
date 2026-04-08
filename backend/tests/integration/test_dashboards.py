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


async def _set_timestamps(db, model, *, created_at=None, updated_at=None):
    if created_at is not None:
        model.created_at = created_at
    if updated_at is not None and hasattr(model, "updated_at"):
        model.updated_at = updated_at
    await db.commit()
    await db.refresh(model)


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

    @pytest.mark.asyncio
    async def test_candidate_dashboard_analytics_returns_funnel_timeseries_and_velocity(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "candidate.analytics.recruiter@test.com",
            role="recruiter_admin",
        )
        candidate = await make_user(
            db,
            "candidate.analytics.user@test.com",
            full_name="Casey Candidate",
        )
        company = await make_company(
            db, "Candidate Analytics Co", "candanalyticsco.com"
        )
        await make_membership(db, recruiter, company)
        await make_profile(db, candidate)

        shortlisted_job = await make_job(
            db, company, recruiter, title="Backend Engineer"
        )
        interview_job = await make_job(db, company, recruiter, title="Data Engineer")
        rejected_job = await make_job(db, company, recruiter, title="Platform Engineer")
        resume = await make_resume(db, candidate, name="Candidate Analytics Resume")

        shortlisted_application = await make_application(
            db,
            candidate,
            shortlisted_job,
            resume,
            status=ApplicationStatus.shortlisted,
        )
        interview_application = await make_application(
            db,
            candidate,
            interview_job,
            resume,
            status=ApplicationStatus.interview_booked,
        )
        rejected_application = await make_application(
            db,
            candidate,
            rejected_job,
            resume,
            status=ApplicationStatus.rejected,
        )

        now = datetime.now(timezone.utc)
        await _set_timestamps(
            db,
            shortlisted_application,
            created_at=now - timedelta(days=12),
            updated_at=now - timedelta(days=4),
        )
        await _set_timestamps(
            db,
            interview_application,
            created_at=now - timedelta(days=10),
            updated_at=now - timedelta(days=2),
        )
        await _set_timestamps(
            db,
            rejected_application,
            created_at=now - timedelta(days=8),
            updated_at=now - timedelta(days=1),
        )

        resp = await client.get(
            "/dashboards/candidate/analytics?range_key=30d",
            headers=auth_headers(candidate),
        )

        assert resp.status_code == 200
        payload = resp.json()["data"]
        assert payload["range_key"] == "30d"
        assert payload["stats"] == {
            "total_applications": 3,
            "screening": 0,
            "shortlisted": 1,
            "interviews": 1,
            "offers": 0,
            "rejected": 1,
        }
        funnel = {item["stage"]: item["count"] for item in payload["funnel"]}
        assert funnel == {
            "applied": 3,
            "screening": 0,
            "shortlisted": 1,
            "interview": 1,
            "offer": 0,
            "rejected": 1,
        }
        assert len(payload["timeseries"]) == 30
        assert sum(point["applications"] for point in payload["timeseries"]) == 3
        assert sum(point["shortlisted"] for point in payload["timeseries"]) == 1
        assert sum(point["interviews"] for point in payload["timeseries"]) == 1
        assert sum(point["rejected"] for point in payload["timeseries"]) == 1
        assert payload["velocity"]["avg_days_to_shortlist"] is not None
        assert payload["velocity"]["avg_days_to_interview"] is not None


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
    async def test_recruiter_dashboard_analytics_returns_operational_charts(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "recruiter.analytics@test.com",
            role="recruiter_admin",
            full_name="Riley Recruiter",
        )
        company = await make_company(db, "Recruiter Analytics Co", "recanalyticsco.com")
        await make_membership(db, recruiter, company)

        job = await make_job(
            db,
            company,
            recruiter,
            title="Senior Backend Engineer",
            status="active",
        )

        candidate_one = await make_user(db, "candidate.one.analytics@test.com")
        candidate_two = await make_user(db, "candidate.two.analytics@test.com")
        candidate_three = await make_user(db, "candidate.three.analytics@test.com")
        resume_one = await make_resume(db, candidate_one, name="Resume One")
        resume_two = await make_resume(db, candidate_two, name="Resume Two")
        resume_three = await make_resume(db, candidate_three, name="Resume Three")

        reviewed_application = await make_application(
            db,
            candidate_one,
            job,
            resume_one,
            status=ApplicationStatus.shortlisted,
        )
        reviewed_application.score = 82
        reviewed_application.feedback = "Strong backend depth"

        interview_application = await make_application(
            db,
            candidate_two,
            job,
            resume_two,
            status=ApplicationStatus.interview_booked,
        )
        interview_application.score = 74
        interview_application.feedback = "Meets threshold"

        offer_application = await make_application(
            db,
            candidate_three,
            job,
            resume_three,
            status=ApplicationStatus.offer,
        )

        draft = EmailDraft(
            application_id=reviewed_application.id, subject="Shortlist update"
        )
        db.add(draft)
        await db.commit()
        await db.refresh(draft)

        now = datetime.now(timezone.utc)
        await _set_timestamps(
            db,
            reviewed_application,
            created_at=now - timedelta(days=10),
            updated_at=now - timedelta(days=3),
        )
        await _set_timestamps(
            db,
            interview_application,
            created_at=now - timedelta(days=6),
            updated_at=now - timedelta(days=2),
        )
        await _set_timestamps(
            db,
            offer_application,
            created_at=now - timedelta(days=4),
            updated_at=now - timedelta(days=1),
        )
        await _set_timestamps(
            db,
            draft,
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(days=1),
        )

        interview = await make_interview(
            db,
            interview_application,
            candidate_name="Candidate Two",
            candidate_email=candidate_two.email,
            start_time=now + timedelta(days=2),
            title="Final Interview",
        )
        await _set_timestamps(
            db,
            interview,
            created_at=now - timedelta(days=2),
        )

        resp = await client.get(
            "/dashboards/recruiter/analytics?range_key=30d",
            headers=auth_headers(recruiter),
        )

        assert resp.status_code == 200
        payload = resp.json()["data"]
        assert payload["range_key"] == "30d"
        assert payload["stats"] == {
            "active_jobs": 1,
            "applications": 3,
            "screening": 0,
            "shortlisted": 1,
            "interview_booked": 1,
            "interview_completed": 0,
            "offers": 1,
            "pending_drafts": 1,
        }
        funnel = {item["stage"]: item["count"] for item in payload["funnel"]}
        assert funnel["applied"] == 3
        assert funnel["shortlisted"] == 1
        assert funnel["interview_booked"] == 1
        assert funnel["offer"] == 1
        assert len(payload["applications_timeseries"]) == 30
        assert (
            sum(point["new_applicants"] for point in payload["applications_timeseries"])
            == 3
        )
        assert (
            sum(
                point["completed_reviews"]
                for point in payload["applications_timeseries"]
            )
            == 2
        )
        assert (
            sum(
                point["interviews_scheduled"]
                for point in payload["applications_timeseries"]
            )
            == 1
        )
        assert len(payload["interview_load"]) == 14
        assert any(point["count"] == 1 for point in payload["interview_load"])
        score_buckets = {
            item["label"]: item["count"]
            for item in payload["score_distribution"]["buckets"]
        }
        assert score_buckets["70-84"] == 2
        assert payload["outreach"]["shortlist"]["drafted"] == 1
        assert payload["velocity"]["avg_days_to_review"] is not None

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

        admin_job = await make_job(
            db,
            company,
            admin,
            title="Admin Owned Role",
            status="active",
        )
        recruiter_job = await make_job(
            db,
            company,
            active_recruiter,
            title="Recruiter Owned Role",
            status="active",
        )
        admin_candidate = await make_user(db, "admin.job.candidate@test.com")
        recruiter_candidate = await make_user(db, "recruiter.job.candidate@test.com")
        admin_resume = await make_resume(db, admin_candidate, name="Admin Resume")
        recruiter_resume = await make_resume(
            db, recruiter_candidate, name="Recruiter Resume"
        )
        admin_application = await make_application(
            db,
            admin_candidate,
            admin_job,
            admin_resume,
            status=ApplicationStatus.interview_booked,
        )
        recruiter_application = await make_application(
            db,
            recruiter_candidate,
            recruiter_job,
            recruiter_resume,
            status=ApplicationStatus.shortlisted,
        )
        now = datetime.now(timezone.utc)
        await _set_timestamps(
            db,
            recruiter_application,
            created_at=now - timedelta(days=5),
            updated_at=now - timedelta(days=1),
        )
        interview = await make_interview(
            db,
            admin_application,
            candidate_name="Admin Candidate",
            candidate_email=admin_candidate.email,
            start_time=now + timedelta(days=1),
        )
        await _set_timestamps(db, interview, created_at=now - timedelta(days=1))

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
        team_activity = {row["recruiter_name"]: row for row in payload["team_activity"]}
        assert team_activity["Ada Admin"]["active_jobs"] == 1
        assert team_activity["Ada Admin"]["interviews_this_month"] == 1
        assert team_activity["Ada Admin"]["shortlisted_this_month"] == 0
        assert team_activity["Riya Recruiter"]["active_jobs"] == 1
        assert team_activity["Riya Recruiter"]["shortlisted_this_month"] == 1
        assert team_activity["Riya Recruiter"]["interviews_this_month"] == 0
        assert team_activity["Peter Pending"]["active_jobs"] == 0
        assert team_activity["Peter Pending"]["shortlisted_this_month"] == 0
        assert team_activity["Peter Pending"]["interviews_this_month"] == 0

    @pytest.mark.asyncio
    async def test_recruiter_admin_dashboard_analytics_includes_team_activity(
        self, client, db
    ):
        admin = await make_user(
            db,
            "admin.analytics@test.com",
            role="recruiter_admin",
            full_name="Ada Admin",
        )
        active_recruiter = await make_user(
            db,
            "active.analytics@test.com",
            role="recruiter",
            full_name="Riya Recruiter",
        )
        pending_recruiter = await make_user(
            db,
            "pending.analytics@test.com",
            role="recruiter",
            full_name="Peter Pending",
        )
        company = await make_company(db, "Admin Analytics Co", "adminanalyticsco.com")
        await make_membership(db, admin, company, role="admin")
        await make_membership(db, active_recruiter, company, role="recruiter")
        await make_membership(
            db,
            pending_recruiter,
            company,
            role="recruiter",
            status="pending",
        )

        admin_job = await make_job(
            db, company, admin, title="Admin Owned Role", status="active"
        )
        recruiter_job = await make_job(
            db,
            company,
            active_recruiter,
            title="Recruiter Owned Role",
            status="active",
        )
        recruiter_candidate = await make_user(db, "active.analytics.candidate@test.com")
        recruiter_resume = await make_resume(
            db, recruiter_candidate, name="Analytics Resume"
        )
        recruiter_application = await make_application(
            db,
            recruiter_candidate,
            recruiter_job,
            recruiter_resume,
            status=ApplicationStatus.shortlisted,
        )
        now = datetime.now(timezone.utc)
        await _set_timestamps(
            db,
            recruiter_application,
            created_at=now - timedelta(days=7),
            updated_at=now - timedelta(days=2),
        )
        admin_candidate = await make_user(db, "admin.analytics.candidate@test.com")
        admin_resume = await make_resume(
            db, admin_candidate, name="Admin Analytics Resume"
        )
        admin_application = await make_application(
            db,
            admin_candidate,
            admin_job,
            admin_resume,
            status=ApplicationStatus.interview_booked,
        )
        interview = await make_interview(
            db,
            admin_application,
            candidate_name="Admin Candidate",
            candidate_email=admin_candidate.email,
            start_time=now + timedelta(days=3),
        )
        await _set_timestamps(db, interview, created_at=now - timedelta(days=1))

        resp = await client.get(
            "/dashboards/recruiter-admin/analytics?range_key=30d",
            headers=auth_headers(admin),
        )

        assert resp.status_code == 200
        payload = resp.json()["data"]
        assert payload["stats"]["active_recruiters"] == 2
        assert payload["stats"]["pending_join_requests"] == 1
        assert len(payload["join_request_timeseries"]) == 30
        team_activity = {row["recruiter_name"]: row for row in payload["team_activity"]}
        assert team_activity["Ada Admin"]["active_jobs"] == 1
        assert team_activity["Ada Admin"]["interviews_this_month"] == 1
        assert team_activity["Riya Recruiter"]["active_jobs"] == 1
        assert team_activity["Riya Recruiter"]["shortlisted_this_month"] == 1
        assert team_activity["Peter Pending"]["active_jobs"] == 0
