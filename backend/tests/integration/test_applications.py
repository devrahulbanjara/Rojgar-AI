from app.shared.enums import ApplicationStatus, JobStatus
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate_with_resume,
    make_recruiter_admin,
)


async def _apply(client, candidate, resume, job):
    """Helper: candidate submits an application and returns the response."""
    return await client.post(
        "/applications/",
        json={"job_id": str(job.id), "resume_id": str(resume.id)},
        headers=auth_headers(candidate.id),
    )


class TestApply:
    async def test_candidate_applies_201(self, client, db):
        candidate, resume = await make_candidate_with_resume(db)
        admin, company = await make_recruiter_admin(db)
        job = await make_active_job(db, company.id)

        resp = await _apply(client, candidate, resume, job)

        assert resp.status_code == 201
        assert resp.json()["data"]["status"] == "applied"

    async def test_duplicate_application_409(self, client, db):
        candidate, resume = await make_candidate_with_resume(db)
        admin, company = await make_recruiter_admin(db, email="admin2@test.com")
        job = await make_active_job(db, company.id)

        await _apply(client, candidate, resume, job)
        resp = await _apply(client, candidate, resume, job)

        assert resp.status_code == 409

    async def test_cannot_apply_to_draft_job_400(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="candidate3@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin3@test.com")
        draft_job = await make_active_job(db, company.id, status=JobStatus.draft)

        resp = await _apply(client, candidate, resume, draft_job)

        assert resp.status_code == 400

    async def test_apply_requires_auth_401(self, client, db):
        import uuid

        resp = await client.post(
            "/applications/",
            json={"job_id": str(uuid.uuid4()), "resume_id": str(uuid.uuid4())},
        )
        assert resp.status_code == 401


class TestListApplications:
    async def test_candidate_lists_own_applications(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_list@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_list@test.com")
        job = await make_active_job(db, company.id)
        await _apply(client, candidate, resume, job)

        resp = await client.get("/applications/me", headers=auth_headers(candidate.id))

        assert resp.status_code == 200
        apps = resp.json()["data"]
        assert len(apps) == 1

    async def test_recruiter_lists_company_applications(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_rlist@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_rlist@test.com")
        job = await make_active_job(db, company.id)
        await _apply(client, candidate, resume, job)

        resp = await client.get(
            "/applications/company/me", headers=auth_headers(admin.id)
        )

        assert resp.status_code == 200

    async def test_list_my_applications_requires_candidate_role(self, client, db):
        admin, _ = await make_recruiter_admin(db, email="admin_block@test.com")

        resp = await client.get("/applications/me", headers=auth_headers(admin.id))
        assert resp.status_code == 403


class TestStatusTransitions:
    async def test_recruiter_rejects_application(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_rej@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_rej@test.com")
        # expired job allows shortlist/reject actions from applied state
        job = await make_active_job(db, company.id, status=JobStatus.expired)
        application = await make_application(
            db, candidate.id, job.id, resume.id, ApplicationStatus.applied
        )

        resp = await client.patch(
            f"/applications/{application.id}/status",
            json={"status": "rejected"},
            headers=auth_headers(admin.id),
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "rejected"

    async def test_recruiter_shortlists_application(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_sl@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_sl@test.com")
        job = await make_active_job(db, company.id, status=JobStatus.expired)
        application = await make_application(
            db, candidate.id, job.id, resume.id, ApplicationStatus.applied
        )

        resp = await client.patch(
            f"/applications/{application.id}/status",
            json={"status": "shortlisted"},
            headers=auth_headers(admin.id),
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "shortlisted"

    async def test_recruiter_records_offer(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_offer@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_offer@test.com")
        job = await make_active_job(db, company.id)
        # Skip to interview_completed directly via DB
        application = await make_application(
            db,
            candidate.id,
            job.id,
            resume.id,
            ApplicationStatus.interview_completed,
        )

        resp = await client.patch(
            f"/applications/{application.id}/status",
            json={"status": "offer"},
            headers=auth_headers(admin.id),
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "offer"

    async def test_recruiter_cannot_forge_candidate_offer_answer(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_forge@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_forge@test.com")
        job = await make_active_job(db, company.id)
        application = await make_application(
            db, candidate.id, job.id, resume.id, ApplicationStatus.offer
        )

        for forged in ("offer_accepted", "offer_declined", "applied"):
            resp = await client.patch(
                f"/applications/{application.id}/status",
                json={"status": forged},
                headers=auth_headers(admin.id),
            )
            assert resp.status_code == 400, forged

        await db.refresh(application)
        assert application.status == ApplicationStatus.offer

    async def test_invalid_transition_conflict(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_skip@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_skip@test.com")
        job = await make_active_job(db, company.id)
        application = await make_application(
            db, candidate.id, job.id, resume.id, ApplicationStatus.applied
        )

        resp = await client.patch(
            f"/applications/{application.id}/status",
            json={"status": "offer"},
            headers=auth_headers(admin.id),
        )

        assert resp.status_code == 409

    async def test_candidate_accepts_offer(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_accept@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_accept@test.com")
        job = await make_active_job(db, company.id)
        application = await make_application(
            db, candidate.id, job.id, resume.id, ApplicationStatus.offer
        )

        resp = await client.post(
            f"/applications/{application.id}/offer/respond",
            json={"accepted": True},
            headers=auth_headers(candidate.id),
        )

        assert resp.status_code == 200
