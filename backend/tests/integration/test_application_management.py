from datetime import datetime, timedelta, timezone

import pytest

from app.modules.applications.models import Application
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


class TestApplicationReview:
    @pytest.mark.asyncio
    async def test_recruiter_can_review_application_with_score_and_feedback(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "review.recruiter@test.com",
            role="recruiter_admin",
            full_name="Rina Reviewer",
        )
        candidate = await make_user(
            db,
            "review.candidate@test.com",
            full_name="Cody Candidate",
        )
        company = await make_company(db, "Review Co", "reviewco.com")
        await make_membership(db, recruiter, company)
        job = await make_job(db, company, recruiter, title="Backend Engineer")
        resume = await make_resume(db, candidate, name="Backend Resume")
        application = await make_application(db, candidate, job, resume)

        resp = await client.patch(
            f"/applications/{application.id}/review",
            json={"score": 87, "feedback": "Strong backend fundamentals."},
            headers=auth_headers(recruiter),
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["score"] == 87
        assert resp.json()["data"]["feedback"] == "Strong backend fundamentals."

    @pytest.mark.asyncio
    async def test_review_requires_score_or_feedback(self, client, db):
        recruiter = await make_user(
            db,
            "review.empty.recruiter@test.com",
            role="recruiter_admin",
        )
        candidate = await make_user(db, "review.empty.candidate@test.com")
        company = await make_company(db, "Review Empty Co", "reviewemptyco.com")
        await make_membership(db, recruiter, company)
        job = await make_job(db, company, recruiter, title="Data Engineer")
        resume = await make_resume(db, candidate, name="Data Resume")
        application = await make_application(db, candidate, job, resume)

        resp = await client.patch(
            f"/applications/{application.id}/review",
            json={},
            headers=auth_headers(recruiter),
        )

        assert resp.status_code == 400


class TestRecruiterCandidateViews:
    @pytest.mark.asyncio
    async def test_recruiter_can_list_company_candidates_grouped_by_candidate(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "grouping.recruiter@test.com",
            role="recruiter_admin",
        )
        company = await make_company(db, "Grouping Co", "groupingco.com")
        await make_membership(db, recruiter, company)

        first_job = await make_job(db, company, recruiter, title="Backend Engineer")
        second_job = await make_job(db, company, recruiter, title="Platform Engineer")

        primary_candidate = await make_user(
            db,
            "grouping.primary@test.com",
            full_name="Priya Platform",
        )
        secondary_candidate = await make_user(
            db,
            "grouping.secondary@test.com",
            full_name="Sam Services",
        )

        primary_resume = await make_resume(db, primary_candidate, name="Priya Resume")
        secondary_resume = await make_resume(
            db,
            secondary_candidate,
            name="Sam Resume",
        )

        await make_application(
            db,
            primary_candidate,
            first_job,
            primary_resume,
            status=ApplicationStatus.screening,
        )
        await make_application(
            db,
            primary_candidate,
            second_job,
            primary_resume,
            status=ApplicationStatus.shortlisted,
        )
        await make_application(
            db,
            secondary_candidate,
            first_job,
            secondary_resume,
            status=ApplicationStatus.applied,
        )

        resp = await client.get(
            "/applications/company/me/candidates",
            headers=auth_headers(recruiter),
        )

        assert resp.status_code == 200
        candidates = resp.json()["data"]
        assert len(candidates) == 2

        grouped_primary = next(
            item
            for item in candidates
            if item["candidate_id"] == str(primary_candidate.id)
        )
        assert grouped_primary["application_count"] == 2
        assert {app["job_title"] for app in grouped_primary["applications"]} == {
            "Backend Engineer",
            "Platform Engineer",
        }

    @pytest.mark.asyncio
    async def test_candidate_detail_respects_share_settings_and_includes_interview(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "detail.recruiter@test.com",
            role="recruiter_admin",
        )
        candidate = await make_user(
            db,
            "detail.candidate@test.com",
            full_name="Diana Detail",
        )
        company = await make_company(db, "Detail Co", "detailco.io")
        await make_membership(db, recruiter, company)
        job = await make_job(db, company, recruiter, title="API Engineer")
        resume = await make_resume(db, candidate, name="API Resume")
        await make_profile(
            db,
            candidate,
            with_children=True,
        )

        application = Application(
            job_id=job.id,
            user_id=candidate.id,
            resume_id=resume.id,
            status=ApplicationStatus.interview_booked,
            share_profile_all=False,
            share_avatar=False,
            share_email=True,
            share_phone=False,
            share_location=False,
            share_links=False,
            share_headline_summary=True,
            shared_full_name="Diana Detail",
            shared_email_value=candidate.email,
            shared_phone_value="9800000000",
            shared_location_value="Kathmandu",
            shared_headline_value="Backend API Specialist",
            shared_summary_value="Builds reliable backend systems.",
            shared_linkedin_url="https://linkedin.com/in/diana-detail",
            shared_github_url="https://github.com/dianadetail",
            shared_portfolio_url="https://dianadetail.dev",
        )
        db.add(application)
        await db.commit()
        await db.refresh(application)

        interview_start = datetime.now(timezone.utc) + timedelta(days=2)
        await make_interview(
            db,
            application,
            candidate_name="Diana Detail",
            candidate_email=candidate.email,
            start_time=interview_start,
            title="Final Round",
        )

        resp = await client.get(
            f"/applications/company/me/candidates/{application.id}",
            headers=auth_headers(recruiter),
        )

        assert resp.status_code == 200
        payload = resp.json()["data"]
        assert payload["applicant_name"] == "Diana Detail"
        assert payload["applicant_email"] == candidate.email
        assert payload["candidate_headline"] == "Backend API Specialist"
        assert payload["candidate_summary"] == "Builds reliable backend systems."
        assert payload["candidate_phone"] is None
        assert payload["candidate_location"] is None
        assert payload["linkedin_url"] is None
        assert payload["github_url"] is None
        assert payload["portfolio_url"] is None
        assert payload["interview"]["title"] == "Final Round"
        assert payload["resume"]["resume_name"] == "API Resume"
