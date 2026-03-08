import pytest
from sqlalchemy import select

from app.modules.companies.models import Company

from tests.integration.helpers import (
    auth_headers,
    make_company,
    make_membership,
    make_user,
)


class TestCompanyRegister:
    @pytest.mark.asyncio
    async def test_register_company_invalid_token(self, client):
        resp = await client.post(
            "/companies/register",
            json={
                "setup_token": "notavalidtoken",
                "company_name": "Acme",
                "industry": "Tech",
                "company_size": "1-50",
            },
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_register_company_with_candidate_token_fails(self, client):
        from app.core.security import create_pending_signup_token

        token = create_pending_signup_token(
            {
                "type": "setup",
                "full_name": "Bad Actor",
                "email": "badactor@test.com",
                "password_hash": "x",
                "primary_role": "candidate",
            }
        )
        resp = await client.post(
            "/companies/register",
            json={
                "setup_token": token,
                "company_name": "Hack Corp",
                "industry": "Evil",
                "company_size": "1-10",
            },
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_register_company_valid_token_sends_email(self, client):
        from app.core.security import create_pending_signup_token

        token = create_pending_signup_token(
            {
                "type": "setup",
                "full_name": "Admin User",
                "email": "admin_reg@test.com",
                "password_hash": "hashed",
                "primary_role": "recruiter_admin",
            }
        )
        resp = await client.post(
            "/companies/register",
            json={
                "setup_token": token,
                "company_name": "Valid Corp",
                "industry": "Tech",
                "company_size": "50-200",
            },
        )
        assert resp.status_code == 201


class TestJoinCompany:
    @pytest.mark.asyncio
    async def test_join_nonexistent_company_fails(self, client):
        from app.core.security import create_pending_signup_token

        token = create_pending_signup_token(
            {
                "type": "setup",
                "full_name": "Recruiter",
                "email": "recruiter_join@test.com",
                "password_hash": "hashed",
                "primary_role": "recruiter",
            }
        )
        resp = await client.post(
            "/companies/join-request",
            json={
                "setup_token": token,
                "company_name": "Company That Does Not Exist XYZ",
            },
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_join_existing_company_success(self, client, db):
        from app.core.security import create_pending_signup_token

        await make_company(db, "Join Target Corp", "jointarget.com")
        token = create_pending_signup_token(
            {
                "type": "setup",
                "full_name": "New Recruiter",
                "email": "new_recruiter_join@test.com",
                "password_hash": "hashed",
                "primary_role": "recruiter",
            }
        )
        resp = await client.post(
            "/companies/join-request",
            json={
                "setup_token": token,
                "company_name": "Join Target Corp",
            },
        )
        assert resp.status_code == 201


class TestRecruiterManagement:
    @pytest.mark.asyncio
    async def test_list_recruiters_as_admin(self, client, db):
        admin = await make_user(db, "admin_list@test.com", role="recruiter_admin")
        company = await make_company(db, "List Co", "listco.com")
        await make_membership(db, admin, company, role="admin")
        recruiter = await make_user(db, "recruiter_list@test.com", role="recruiter")
        await make_membership(
            db, recruiter, company, role="recruiter", status="pending"
        )

        resp = await client.get("/companies/me/recruiters", headers=auth_headers(admin))
        assert resp.status_code == 200
        assert len(resp.json()["data"]) >= 1

    @pytest.mark.asyncio
    async def test_list_recruiters_as_candidate_fails(self, client, db):
        cand = await make_user(db, "cand_list@test.com")
        resp = await client.get("/companies/me/recruiters", headers=auth_headers(cand))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_approve_recruiter(self, client, db):
        admin = await make_user(db, "admin_approve@test.com", role="recruiter_admin")
        company = await make_company(db, "Approve Co", "approveco.com")
        await make_membership(db, admin, company, role="admin")
        recruiter = await make_user(db, "recruiter_approve@test.com", role="recruiter")
        membership = await make_membership(
            db, recruiter, company, role="recruiter", status="pending"
        )

        resp = await client.patch(
            f"/companies/me/recruiters/{membership.id}/status",
            json={"status": "active"},
            headers=auth_headers(admin),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "active"

    @pytest.mark.asyncio
    async def test_reject_recruiter(self, client, db):
        admin = await make_user(db, "admin_reject@test.com", role="recruiter_admin")
        company = await make_company(db, "Reject Co", "rejectco.com")
        await make_membership(db, admin, company, role="admin")
        recruiter = await make_user(db, "recruiter_reject@test.com", role="recruiter")
        membership = await make_membership(
            db, recruiter, company, role="recruiter", status="pending"
        )

        resp = await client.patch(
            f"/companies/me/recruiters/{membership.id}/status",
            json={"status": "rejected"},
            headers=auth_headers(admin),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "rejected"

    @pytest.mark.asyncio
    async def test_remove_recruiter(self, client, db):
        admin = await make_user(db, "admin_remove@test.com", role="recruiter_admin")
        company = await make_company(db, "Remove Co", "removeco.com")
        await make_membership(db, admin, company, role="admin")
        recruiter = await make_user(db, "recruiter_remove@test.com", role="recruiter")
        membership = await make_membership(db, recruiter, company, role="recruiter")

        resp = await client.delete(
            f"/companies/me/recruiters/{membership.id}",
            headers=auth_headers(admin),
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_approve_nonexistent_membership_fails(self, client, db):
        admin = await make_user(db, "admin_ghost@test.com", role="recruiter_admin")
        company = await make_company(db, "Ghost Co", "ghostco.com")
        await make_membership(db, admin, company, role="admin")

        resp = await client.patch(
            "/companies/me/recruiters/00000000-0000-0000-0000-000000000000/status",
            json={"status": "active"},
            headers=auth_headers(admin),
        )
        assert resp.status_code == 404


class TestCompanyLogoCrud:
    @pytest.mark.asyncio
    async def test_admin_can_upload_company_logo(self, client, db, monkeypatch):
        admin = await make_user(db, "logo_admin@test.com", role="recruiter_admin")
        company = await make_company(db, "Logo Co", "logoco.com")
        await make_membership(db, admin, company, role="admin", status="active")

        async def fake_upload(_file, folder: str):
            assert folder == "logos"
            return "https://bucket.s3.us-east-1.amazonaws.com/logos/company-logo.png"

        deleted_urls: list[str] = []

        async def fake_delete(url: str | None):
            if url:
                deleted_urls.append(url)

        monkeypatch.setattr(
            "app.modules.companies.router.s3_service.upload_image",
            fake_upload,
        )
        monkeypatch.setattr(
            "app.modules.companies.router.s3_service.delete_image",
            fake_delete,
        )

        resp = await client.patch(
            "/companies/me/logo",
            headers=auth_headers(admin),
            files={"file": ("logo.png", b"fake-image", "image/png")},
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["logo_url"].endswith("/logos/company-logo.png")
        assert deleted_urls == []

    @pytest.mark.asyncio
    async def test_admin_can_delete_company_logo(self, client, db, monkeypatch):
        admin = await make_user(
            db, "logo_delete_admin@test.com", role="recruiter_admin"
        )
        company = await make_company(db, "Delete Logo Co", "deletelogoco.com")
        company.logo_url = (
            "https://bucket.s3.us-east-1.amazonaws.com/logos/old-logo.png"
        )
        await db.commit()
        await make_membership(db, admin, company, role="admin", status="active")

        deleted_urls: list[str] = []

        async def fake_delete(url: str | None):
            if url:
                deleted_urls.append(url)

        monkeypatch.setattr(
            "app.modules.companies.router.s3_service.delete_image",
            fake_delete,
        )

        resp = await client.delete(
            "/companies/me/logo",
            headers=auth_headers(admin),
        )

        assert resp.status_code == 200
        assert deleted_urls == [
            "https://bucket.s3.us-east-1.amazonaws.com/logos/old-logo.png"
        ]


class TestCompanyProfile:
    @pytest.mark.asyncio
    async def test_admin_can_get_company_profile(self, client, db):
        admin = await make_user(db, "company_me@test.com", role="recruiter_admin")
        company = await make_company(db, "Profile Co", "profileco.com")
        await make_membership(db, admin, company, role="admin", status="active")

        resp = await client.get("/companies/me", headers=auth_headers(admin))

        assert resp.status_code == 200
        assert resp.json()["data"]["name"] == "Profile Co"

    @pytest.mark.asyncio
    async def test_admin_can_update_company_profile(self, client, db):
        admin = await make_user(db, "company_update@test.com", role="recruiter_admin")
        company = await make_company(db, "Update Co", "updateco.com")
        await make_membership(db, admin, company, role="admin", status="active")

        resp = await client.patch(
            "/companies/me",
            headers=auth_headers(admin),
            json={
                "name": "Updated Co",
                "industry": "Fintech",
                "location": "Kathmandu",
                "website_url": "https://updated.example",
                "description": "Updated company profile",
            },
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["name"] == "Updated Co"
        db_company = await db.scalar(select(Company).where(Company.id == company.id))
        assert db_company is not None
        assert db_company.website_url == "https://updated.example"
