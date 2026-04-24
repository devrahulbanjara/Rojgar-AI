from tests.integration.helpers import (
    auth_headers,
    make_candidate,
    make_pending_recruiter,
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

    async def test_pending_recruiter_blocked_403(self, client, db):
        admin, company = await make_recruiter_admin(db, email="admin_pend@test.com")
        pending = await make_pending_recruiter(db, company.id)

        resp = await client.get("/companies/me", headers=auth_headers(pending.id))
        assert resp.status_code == 403

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

    async def test_non_admin_cannot_update_company_403(self, client, db):
        admin, company = await make_recruiter_admin(db, email="admin_notupd@test.com")
        pending = await make_pending_recruiter(
            db, company.id, email="recruiter_notupd@test.com"
        )

        resp = await client.patch(
            "/companies/me",
            json={"name": "Hacked Corp"},
            headers=auth_headers(pending.id),
        )
        assert resp.status_code == 403


class TestRecruiterManagement:
    async def test_admin_lists_recruiters(self, client, db):
        admin, company = await make_recruiter_admin(db, email="admin_recs@test.com")
        await make_pending_recruiter(db, company.id, email="rec1@test.com")

        resp = await client.get(
            "/companies/me/recruiters", headers=auth_headers(admin.id)
        )

        assert resp.status_code == 200
        members = resp.json()["data"]
        # admin + pending recruiter
        assert len(members) >= 1
