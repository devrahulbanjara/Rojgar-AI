from app.modules.auth.enums import MembershipRole
from tests.integration.helpers import (
    auth_headers,
    make_candidate,
    make_member,
    make_recruiter_admin,
)


class TestCompanyRead:
    async def test_admin_gets_own_company(self, client, db):
        admin, company = await make_recruiter_admin(db)

        resp = await client.get("/companies/me", headers=auth_headers(admin.id))

        assert resp.status_code == 200
        assert resp.json()["data"]["name"] == company.name

    async def test_candidate_blocked_from_company_403(self, client, db):
        candidate = await make_candidate(db, email="cand_co@test.com")

        resp = await client.get("/companies/me", headers=auth_headers(candidate.id))
        assert resp.status_code == 403

    async def test_interviewer_reads_company(self, client, db):
        _, company = await make_recruiter_admin(db, email="admin_int@test.com")
        interviewer = await make_member(
            db, company.id, email="int@test.com", role=MembershipRole.interviewer
        )

        resp = await client.get("/companies/me", headers=auth_headers(interviewer.id))
        assert resp.status_code == 200
        assert resp.json()["data"]["verified"] is True

    async def test_get_company_no_auth_401(self, client):
        resp = await client.get("/companies/me")
        assert resp.status_code == 401


class TestCompanyUpdate:
    async def test_admin_updates_company(self, client, db):
        admin, _ = await make_recruiter_admin(db, email="admin_upd@test.com")

        resp = await client.patch(
            "/companies/me",
            json={"name": "New Corp Name", "industry": "Tech"},
            headers=auth_headers(admin.id),
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["name"] == "New Corp Name"

    async def test_manager_cannot_update_company_403(self, client, db):
        admin, company = await make_recruiter_admin(db, email="admin_notupd@test.com")
        manager = await make_member(db, company.id, email="manager_notupd@test.com")

        resp = await client.patch(
            "/companies/me",
            json={"name": "Hacked Corp"},
            headers=auth_headers(manager.id),
        )
        assert resp.status_code == 403
        assert resp.json()["message"] == "Only the business owner can do this."
