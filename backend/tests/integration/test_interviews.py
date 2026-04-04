from datetime import datetime, timedelta, timezone

import pytest

from app.shared.enums import ApplicationStatus
from tests.integration.helpers import (
    auth_headers,
    make_application,
    make_company,
    make_interview,
    make_job,
    make_membership,
    make_resume,
    make_user,
)


class TestInterviewList:
    @pytest.mark.asyncio
    async def test_recruiter_can_list_company_interviews_and_filter_by_job(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "interview.list.recruiter@test.com",
            role="recruiter_admin",
        )
        company = await make_company(db, "Interview Co", "interviewco.com")
        await make_membership(db, recruiter, company)

        first_job = await make_job(db, company, recruiter, title="Backend Engineer")
        second_job = await make_job(db, company, recruiter, title="Frontend Engineer")

        first_candidate = await make_user(db, "interview.list.first@test.com")
        second_candidate = await make_user(db, "interview.list.second@test.com")
        first_resume = await make_resume(db, first_candidate, name="First Resume")
        second_resume = await make_resume(db, second_candidate, name="Second Resume")

        first_application = await make_application(
            db,
            first_candidate,
            first_job,
            first_resume,
            status=ApplicationStatus.interview_booked,
        )
        second_application = await make_application(
            db,
            second_candidate,
            second_job,
            second_resume,
            status=ApplicationStatus.interview_booked,
        )

        first_start = datetime.now(timezone.utc) + timedelta(days=1)
        second_start = datetime.now(timezone.utc) + timedelta(days=2)
        await make_interview(
            db,
            first_application,
            candidate_name="First Candidate",
            candidate_email=first_candidate.email,
            start_time=first_start,
            title="Backend Round",
        )
        await make_interview(
            db,
            second_application,
            candidate_name="Second Candidate",
            candidate_email=second_candidate.email,
            start_time=second_start,
            title="Frontend Round",
        )

        all_resp = await client.get(
            "/interviews/",
            headers=auth_headers(recruiter),
        )
        filtered_resp = await client.get(
            f"/interviews/?job_id={first_job.id}",
            headers=auth_headers(recruiter),
        )

        assert all_resp.status_code == 200
        assert len(all_resp.json()["data"]) == 2

        assert filtered_resp.status_code == 200
        assert len(filtered_resp.json()["data"]) == 1
        assert filtered_resp.json()["data"][0]["job_id"] == str(first_job.id)
        assert filtered_resp.json()["data"][0]["title"] == "Backend Round"


class TestInterviewCompletion:
    @pytest.mark.asyncio
    async def test_recruiter_can_mark_interview_complete(self, client, db):
        recruiter = await make_user(
            db,
            "interview.complete.recruiter@test.com",
            role="recruiter_admin",
        )
        candidate = await make_user(db, "interview.complete.candidate@test.com")
        company = await make_company(db, "Complete Co", "completeco.com")
        await make_membership(db, recruiter, company)
        job = await make_job(db, company, recruiter, title="Infra Engineer")
        resume = await make_resume(db, candidate, name="Infra Resume")
        application = await make_application(
            db,
            candidate,
            job,
            resume,
            status=ApplicationStatus.interview_booked,
        )
        interview = await make_interview(
            db,
            application,
            candidate_name="Candidate Complete",
            candidate_email=candidate.email,
            title="Completion Round",
        )

        resp = await client.post(
            f"/interviews/{interview.id}/complete",
            headers=auth_headers(recruiter),
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["application_status"] == "interview_completed"

        await db.refresh(application)
        assert application.status == ApplicationStatus.interview_completed

    @pytest.mark.asyncio
    async def test_cannot_mark_interview_complete_from_non_booked_status(
        self, client, db
    ):
        recruiter = await make_user(
            db,
            "interview.invalid.recruiter@test.com",
            role="recruiter_admin",
        )
        candidate = await make_user(db, "interview.invalid.candidate@test.com")
        company = await make_company(db, "Invalid Co", "invalidco.com")
        await make_membership(db, recruiter, company)
        job = await make_job(db, company, recruiter, title="Site Reliability Engineer")
        resume = await make_resume(db, candidate, name="SRE Resume")
        application = await make_application(
            db,
            candidate,
            job,
            resume,
            status=ApplicationStatus.shortlisted,
        )
        interview = await make_interview(
            db,
            application,
            candidate_name="Candidate Invalid",
            candidate_email=candidate.email,
        )

        resp = await client.post(
            f"/interviews/{interview.id}/complete",
            headers=auth_headers(recruiter),
        )

        assert resp.status_code == 400
