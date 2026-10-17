from app.modules.profiles.models import Profile
from tests.integration.helpers import (
    auth_headers,
    make_active_job,
    make_application,
    make_candidate,
    make_candidate_with_resume,
    make_recruiter_admin,
)

CONTACT = dict(
    phone="+977-9800000000",
    location="Kathmandu",
    linkedin_url="https://linkedin.com/in/private",
    github_url="https://github.com/private",
    portfolio_url="https://private.dev",
)


async def _candidate_with_profile(db, email: str):
    user, resume = await make_candidate_with_resume(db, email=email)
    db.add(Profile(user_id=user.id, headline="Engineer", **CONTACT))
    for field, value in CONTACT.items():
        setattr(resume, field, value)
    await db.flush()
    return user, resume


class TestProfileAccess:
    async def test_other_candidate_cannot_read_profile(self, client, db):
        victim, _ = await _candidate_with_profile(db, "victim@example.com")
        snoop = await make_candidate(db, email="snoop@example.com")

        resp = await client.get(
            f"/profiles/{victim.id}", headers=auth_headers(snoop.id)
        )

        assert resp.status_code == 404

    async def test_recruiter_without_application_cannot_read(self, client, db):
        victim, _ = await _candidate_with_profile(db, "victim2@example.com")
        recruiter, _ = await make_recruiter_admin(db, email="rec_none@example.com")

        resp = await client.get(
            f"/profiles/{victim.id}", headers=auth_headers(recruiter.id)
        )

        assert resp.status_code == 404

    async def test_owner_reads_full_profile(self, client, db):
        owner, _ = await _candidate_with_profile(db, "owner@example.com")

        resp = await client.get(f"/profiles/{owner.id}", headers=auth_headers(owner.id))

        assert resp.status_code == 200
        assert resp.json()["data"]["phone"] == CONTACT["phone"]

    async def test_recruiter_sees_only_shared_contact(self, client, db):
        cand, resume = await _candidate_with_profile(db, "applicant@example.com")
        recruiter, company = await make_recruiter_admin(
            db, email="rec_ok@example.com", company_name="Share Co"
        )
        job = await make_active_job(db, company.id)
        application = await make_application(db, cand.id, job.id, resume.id)
        application.share_phone = False
        application.share_links = False
        await db.flush()

        resp = await client.get(
            f"/profiles/{cand.id}", headers=auth_headers(recruiter.id)
        )

        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["phone"] is None
        assert data["linkedin_url"] is None and data["github_url"] is None
        assert data["location"] == CONTACT["location"]

    async def test_recruiter_resume_view_honours_share_flags(self, client, db):
        cand, resume = await _candidate_with_profile(db, "applicant2@example.com")
        recruiter, company = await make_recruiter_admin(
            db, email="rec_resume@example.com", company_name="Resume Co"
        )
        job = await make_active_job(db, company.id)
        application = await make_application(db, cand.id, job.id, resume.id)
        application.share_phone = False
        application.share_location = False
        await db.flush()

        resp = await client.get(
            f"/applications/company/me/candidates/{application.id}",
            headers=auth_headers(recruiter.id),
        )

        assert resp.status_code == 200
        shown = resp.json()["data"]["resume"]
        assert shown["phone"] is None and shown["location"] is None
        assert shown["linkedin_url"] == CONTACT["linkedin_url"]
