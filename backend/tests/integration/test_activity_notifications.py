from datetime import datetime, timedelta, timezone

import pytest

from app.modules.activity.service import create_activity_event
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


async def _set_timestamp(db, model, *, created_at=None, updated_at=None):
    if created_at is not None:
        model.created_at = created_at
    if updated_at is not None and hasattr(model, "updated_at"):
        model.updated_at = updated_at
    await db.commit()
    await db.refresh(model)


class TestActivityAndNotifications:
    @pytest.mark.asyncio
    async def test_apply_flow_creates_candidate_and_recruiter_activity(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "activity.recruiter@test.com",
            role="recruiter_admin",
            full_name="Riley Recruiter",
        )
        candidate = await make_user(
            db,
            "activity.candidate@test.com",
            full_name="Casey Candidate",
        )
        company = await make_company(db, "Activity Co", "activityco.com")
        await make_membership(db, recruiter, company)
        await make_profile(db, candidate)
        resume = await make_resume(db, candidate, name="Candidate Resume")
        job = await make_job(
            db, company, recruiter, title="Backend Engineer", status="active"
        )

        resp = await client.post(
            "/applications/",
            json={
                "job_id": str(job.id),
                "resume_id": str(resume.id),
                "share_profile_all": True,
            },
            headers=auth_headers(candidate),
        )

        assert resp.status_code == 201
        application_id = resp.json()["data"]["id"]

        candidate_activity_resp = await client.get(
            "/activity/me",
            headers=auth_headers(candidate),
        )
        recruiter_activity_resp = await client.get(
            "/activity/company",
            headers=auth_headers(recruiter),
        )
        candidate_notifications_resp = await client.get(
            "/notifications",
            headers=auth_headers(candidate),
        )
        recruiter_notifications_resp = await client.get(
            "/notifications",
            headers=auth_headers(recruiter),
        )
        candidate_audit_resp = await client.get(
            f"/audit/entity/application/{application_id}",
            headers=auth_headers(candidate),
        )
        company_audit_resp = await client.get(
            "/audit/company",
            headers=auth_headers(recruiter),
        )

        assert candidate_activity_resp.status_code == 200
        assert recruiter_activity_resp.status_code == 200
        assert candidate_notifications_resp.status_code == 200
        assert recruiter_notifications_resp.status_code == 200
        assert candidate_audit_resp.status_code == 200
        assert company_audit_resp.status_code == 200

        candidate_events = candidate_activity_resp.json()["data"]
        recruiter_events = recruiter_activity_resp.json()["data"]
        candidate_notifications = candidate_notifications_resp.json()["data"]
        recruiter_notifications = recruiter_notifications_resp.json()["data"]
        candidate_audit = candidate_audit_resp.json()["data"]
        company_audit = company_audit_resp.json()["data"]

        assert candidate_events[0]["event_type"] == "application_applied"
        assert candidate_events[0]["application_id"] == application_id
        assert any(
            event["event_type"] == "application_received" for event in recruiter_events
        )
        assert candidate_notifications[0]["kind"] == "application_applied"
        assert any(
            notification["kind"] == "application_received"
            for notification in recruiter_notifications
        )
        assert any(
            item["entity_type"] == "application"
            and item["action_type"] == "create"
            and item["entity_id"] == application_id
            for item in candidate_audit
        )
        assert any(
            item["entity_type"] == "application" and item["entity_id"] == application_id
            for item in company_audit
        )

    @pytest.mark.asyncio
    async def test_application_detail_and_timeline_include_events_and_outreach_audit(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "timeline.recruiter@test.com",
            role="recruiter_admin",
            full_name="Riley Recruiter",
        )
        candidate = await make_user(
            db,
            "timeline.candidate@test.com",
            full_name="Casey Candidate",
        )
        company = await make_company(db, "Timeline Co", "timelineco.com")
        await make_membership(db, recruiter, company)
        await make_profile(db, candidate)
        resume = await make_resume(db, candidate, name="Timeline Resume")
        job = await make_job(
            db, company, recruiter, title="Platform Engineer", status="active"
        )
        application = await make_application(
            db,
            candidate,
            job,
            resume,
            status=ApplicationStatus.interview_booked,
        )
        now = datetime.now(timezone.utc)
        await _set_timestamp(
            db,
            application,
            created_at=now - timedelta(days=5),
            updated_at=now - timedelta(days=1),
        )
        interview = await make_interview(
            db,
            application,
            candidate_name=candidate.full_name,
            candidate_email=candidate.email,
            start_time=now + timedelta(days=2),
            title="Technical Interview",
        )
        await _set_timestamp(db, interview, created_at=now - timedelta(days=1))

        draft = EmailDraft(
            application_id=application.id,
            subject="Interview next steps",
            body="Please confirm your interview slot.",
            is_approved=True,
            is_sent=True,
            generated_by_user_id=recruiter.id,
            approved_by_user_id=recruiter.id,
            sent_by_user_id=recruiter.id,
            approved_at=now - timedelta(days=1, hours=2),
            sent_at=now - timedelta(days=1, hours=1),
        )
        db.add(draft)
        await db.commit()
        await db.refresh(draft)

        applied_event = await create_activity_event(
            db,
            event_type="application_applied",
            audience="candidate",
            title="Applied to Platform Engineer",
            description="You submitted your application.",
            href=f"/candidate/applications/{application.id}",
            user_id=candidate.id,
            company_id=company.id,
            application_id=application.id,
            job_id=job.id,
            actor_user_id=recruiter.id,
        )
        applied_event.created_at = now - timedelta(days=5)
        interview_event = await create_activity_event(
            db,
            event_type="interview_booked",
            audience="candidate",
            title="Interview booked for Platform Engineer",
            description="Your interview has been scheduled.",
            href=f"/candidate/applications/{application.id}",
            user_id=candidate.id,
            company_id=company.id,
            application_id=application.id,
            job_id=job.id,
            interview_id=interview.id,
            actor_user_id=recruiter.id,
        )
        interview_event.created_at = now - timedelta(days=1)
        await db.commit()

        candidate_detail_resp = await client.get(
            f"/applications/{application.id}",
            headers=auth_headers(candidate),
        )
        timeline_resp = await client.get(
            f"/applications/{application.id}/timeline",
            headers=auth_headers(candidate),
        )
        recruiter_detail_resp = await client.get(
            f"/applications/company/me/candidates/{application.id}",
            headers=auth_headers(recruiter),
        )

        assert candidate_detail_resp.status_code == 200
        assert timeline_resp.status_code == 200
        assert recruiter_detail_resp.status_code == 200

        candidate_detail = candidate_detail_resp.json()["data"]
        recruiter_detail = recruiter_detail_resp.json()["data"]
        timeline = timeline_resp.json()["data"]

        assert candidate_detail["interview"]["title"] == "Technical Interview"
        assert candidate_detail["resume"]["resume_name"] == "Timeline Resume"
        assert candidate_detail["next_step_hint"] is not None
        assert len(candidate_detail["timeline"]) >= 2
        assert [event["event_type"] for event in timeline] == [
            "application_applied",
            "interview_booked",
        ]
        assert recruiter_detail["timeline"][0]["event_type"] == "application_applied"
        assert recruiter_detail["outreach_audit"][0]["draft_id"] == str(draft.id)
        assert recruiter_detail["outreach_audit"][0]["sent_by_user_id"] == str(
            recruiter.id
        )

    @pytest.mark.asyncio
    async def test_recruiter_preferences_and_notification_read_endpoints(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "preferences.recruiter@test.com",
            role="recruiter_admin",
            full_name="Riley Recruiter",
        )
        company = await make_company(db, "Preferences Co", "preferencesco.com")
        await make_membership(db, recruiter, company)

        preference_resp = await client.get(
            "/recruiter/preferences",
            headers=auth_headers(recruiter),
        )
        assert preference_resp.status_code == 200
        assert (
            preference_resp.json()["data"]["default_interview_duration_minutes"] == 45
        )

        patch_resp = await client.patch(
            "/recruiter/preferences",
            json={
                "timezone": "Asia/Katmandu",
                "notification_in_app_enabled": False,
                "chat_default_scope": "candidates",
                "default_interview_buffer_minutes": 5,
            },
            headers=auth_headers(recruiter),
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["data"]["notification_in_app_enabled"] is False
        assert patch_resp.json()["data"]["chat_default_scope"] == "candidates"

        await create_activity_event(
            db,
            event_type="candidate_shortlisted",
            audience="candidate",
            title="Shortlisted for Backend Engineer",
            description="You moved to the shortlist stage.",
            user_id=recruiter.id,
            company_id=company.id,
        )
        await db.commit()

        notifications_resp = await client.get(
            "/notifications",
            headers=auth_headers(recruiter),
        )
        assert notifications_resp.status_code == 200
        notifications = notifications_resp.json()["data"]
        assert notifications == []

        patch_enable_resp = await client.patch(
            "/recruiter/preferences",
            json={"notification_in_app_enabled": True},
            headers=auth_headers(recruiter),
        )
        assert patch_enable_resp.status_code == 200

        await create_activity_event(
            db,
            event_type="candidate_shortlisted",
            audience="candidate",
            title="Shortlisted for Backend Engineer",
            description="You moved to the shortlist stage.",
            user_id=recruiter.id,
            company_id=company.id,
        )
        await db.commit()

        notifications_resp = await client.get(
            "/notifications",
            headers=auth_headers(recruiter),
        )
        assert notifications_resp.status_code == 200
        notifications = notifications_resp.json()["data"]
        assert len(notifications) == 1

        read_resp = await client.post(
            f"/notifications/{notifications[0]['id']}/read",
            headers=auth_headers(recruiter),
        )
        assert read_resp.status_code == 200
        assert read_resp.json()["data"]["is_read"] is True

        await create_activity_event(
            db,
            event_type="application_review_ready",
            audience="candidate",
            title="Review updated",
            description="A recruiter added new review notes.",
            user_id=recruiter.id,
            company_id=company.id,
        )
        await db.commit()

        mark_all_resp = await client.post(
            "/notifications/read-all",
            headers=auth_headers(recruiter),
        )
        assert mark_all_resp.status_code == 200
        assert mark_all_resp.json()["data"]["updated"] >= 1

    @pytest.mark.asyncio
    async def test_auth_and_company_audit_filters(self, client, db):
        recruiter = await make_user(
            db,
            "audit-login.recruiter@test.com",
            role="recruiter_admin",
            full_name="Audit Recruiter",
            password="Password@123",
        )
        company = await make_company(db, "Audit Console Co", "auditconsoleco.com")
        await make_membership(db, recruiter, company)
        recruiter_member = await make_user(
            db,
            "audit-member.recruiter@test.com",
            role="recruiter",
            full_name="Scoped Recruiter",
        )
        await make_membership(db, recruiter_member, company, role="recruiter")

        login_resp = await client.post(
            "/auth/login",
            json={"email": recruiter.email, "password": "Password@123"},
        )
        assert login_resp.status_code == 200

        company_audit_resp = await client.get(
            "/audit/company",
            params={"action_type": "create", "entity_type": "membership"},
            headers=auth_headers(recruiter),
        )
        assert company_audit_resp.status_code == 200
        company_audit = company_audit_resp.json()["data"]
        assert any(
            item["entity_type"] == "membership" and item["action_type"] == "create"
            for item in company_audit
        )

        my_audit_resp = await client.get(
            "/audit/me",
            params={"action_type": "login"},
            headers=auth_headers(recruiter),
        )
        assert my_audit_resp.status_code == 200
        my_audit = my_audit_resp.json()["data"]
        assert any(item["action_type"] == "login" for item in my_audit)

        recruiter_company_audit_resp = await client.get(
            "/audit/company",
            headers=auth_headers(recruiter_member),
        )
        assert recruiter_company_audit_resp.status_code == 403
