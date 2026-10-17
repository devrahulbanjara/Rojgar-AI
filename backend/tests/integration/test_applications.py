from sqlalchemy import select

from app.modules.applications.models import ApplicationEvent, Review
from app.shared.enums import ApplicationStage, JobStatus
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
        data = resp.json()["data"]
        assert data["stage"] == "new"
        # Candidates never see AI review fields.
        assert "fit" not in data and "score" not in data
        review = await db.scalar(
            select(Review).where(Review.application_id == data["id"])
        )
        assert review is not None and review.state == "pending"
        events = list(
            await db.scalars(
                select(ApplicationEvent.type).where(
                    ApplicationEvent.application_id == data["id"]
                )
            )
        )
        assert events == ["applied"]

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

    async def test_list_my_applications_requires_candidate_role(self, client, db):
        """Business members can also list their own applications."""
        admin, _ = await make_recruiter_admin(db, email="admin_block2@test.com")

        resp = await client.get("/applications/me", headers=auth_headers(admin.id))
        assert resp.status_code == 200

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

    async def test_business_members_are_people_too(self, client, db):
        admin, _ = await make_recruiter_admin(db, email="admin_block@test.com")

        resp = await client.get("/applications/me", headers=auth_headers(admin.id))
        assert resp.status_code == 200


class TestOfferResponse:
    async def test_candidate_accepts_offer_is_hired(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_accept@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_accept@test.com")
        job = await make_active_job(db, company.id)
        application = await make_application(
            db, candidate.id, job.id, resume.id, ApplicationStage.offer
        )

        resp = await client.post(
            f"/applications/{application.id}/offer/respond",
            json={"accepted": True},
            headers=auth_headers(candidate.id),
        )

        assert resp.status_code == 200
        await db.refresh(application)
        assert application.stage == ApplicationStage.hired

    async def test_candidate_declines_offer_is_withdrawn(self, client, db):
        candidate, resume = await make_candidate_with_resume(
            db, email="cand_decline@test.com"
        )
        admin, company = await make_recruiter_admin(db, email="admin_decline@test.com")
        job = await make_active_job(db, company.id)
        application = await make_application(
            db, candidate.id, job.id, resume.id, ApplicationStage.offer
        )

        resp = await client.post(
            f"/applications/{application.id}/offer/respond",
            json={"accepted": False},
            headers=auth_headers(candidate.id),
        )

        assert resp.status_code == 200
        await db.refresh(application)
        assert application.stage == ApplicationStage.withdrawn
        payload = await db.scalar(
            select(ApplicationEvent.payload).where(
                ApplicationEvent.application_id == application.id,
                ApplicationEvent.type == "stage_changed",
            )
        )
        assert payload["note"] == "declined offer"
