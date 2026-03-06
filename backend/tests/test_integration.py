"""
Full integration test suite for ConvexHire API.

Run:
    pytest tests/test_integration.py -v
"""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_tokens
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume
from app.shared.enums import JobStatus, LocationType
from main import app


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def make_user(
    db: AsyncSession,
    email: str,
    role: str = "candidate",
    verified: bool = True,
) -> User:
    user = User(
        full_name="Test User",
        email=email,
        primary_role=role,
        is_email_verified=verified,
        password_hash=None,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def make_company(db: AsyncSession, name: str, domain: str) -> Company:
    company = Company(name=name, domain=domain, industry="Tech")
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


async def make_membership(
    db: AsyncSession,
    user: User,
    company: Company,
    role: str = "admin",
    status: str = "active",
) -> CompanyMembership:
    m = CompanyMembership(
        user_id=user.id,
        company_id=company.id,
        role=role,
        status=status,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


async def make_job(
    db: AsyncSession,
    company: Company,
    posted_by: User,
    title: str = "Test Job",
    status: str = "open",
    category: str = "backend",
) -> Job:
    job = Job(
        company_id=company.id,
        posted_by=posted_by.id,
        title=title,
        location_type=LocationType.remote,
        currency="NPR",
        status=status,
        category=category,
        responsibilities=[],
        requirements=[],
        preferred_qualifications=[],
        benefits=[],
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def make_resume(db: AsyncSession, user: User, name: str = "My Resume") -> Resume:
    resume = Resume(user_id=user.id, resume_name=name)
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


def auth_headers(user: User) -> dict:
    tokens, _, _ = create_tokens(str(user.id))
    return {"Authorization": f"Bearer {tokens['access_token']}"}


# ---------------------------------------------------------------------------
# ── AUTH TESTS ───────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


class TestSignup:
    @pytest.mark.asyncio
    async def test_candidate_signup_success(self, client):
        resp = await client.post("/auth/signup", json={
            "full_name": "Alice",
            "email": "alice_signup@test.com",
            "password": "password123",
            "primary_role": "candidate",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["setup_token"] is None

    @pytest.mark.asyncio
    async def test_recruiter_admin_signup_returns_setup_token(self, client):
        resp = await client.post("/auth/signup", json={
            "full_name": "Bob Admin",
            "email": "bob_admin_signup@test.com",
            "password": "password123",
            "primary_role": "recruiter_admin",
        })
        assert resp.status_code == 201
        assert resp.json()["data"]["setup_token"] is not None

    @pytest.mark.asyncio
    async def test_recruiter_signup_returns_setup_token(self, client):
        resp = await client.post("/auth/signup", json={
            "full_name": "Carol Recruiter",
            "email": "carol_recruiter_signup@test.com",
            "password": "password123",
            "primary_role": "recruiter",
        })
        assert resp.status_code == 201
        assert resp.json()["data"]["setup_token"] is not None

    @pytest.mark.asyncio
    async def test_duplicate_email_rejected(self, client, db):
        await make_user(db, "dup@test.com")
        resp = await client.post("/auth/signup", json={
            "full_name": "Dup",
            "email": "dup@test.com",
            "password": "password123",
            "primary_role": "candidate",
        })
        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_short_password_rejected(self, client):
        resp = await client.post("/auth/signup", json={
            "full_name": "Short",
            "email": "short@test.com",
            "password": "123",
            "primary_role": "candidate",
        })
        assert resp.status_code == 400
        assert any(e["field"] == "password" for e in resp.json()["errors"])

    @pytest.mark.asyncio
    async def test_invalid_role_rejected(self, client):
        resp = await client.post("/auth/signup", json={
            "full_name": "Bad Role",
            "email": "badrole@test.com",
            "password": "password123",
            "primary_role": "superadmin",
        })
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_missing_fields_rejected(self, client):
        resp = await client.post("/auth/signup", json={"email": "incomplete@test.com"})
        assert resp.status_code == 400


class TestLogin:
    @pytest.mark.asyncio
    async def test_login_unverified_user_blocked(self, client, db):
        from app.core.security import hash_password
        user = User(
            full_name="Unverified",
            email="unverified_login@test.com",
            primary_role="candidate",
            is_email_verified=False,
            password_hash=hash_password("password123"),
        )
        db.add(user)
        await db.commit()

        resp = await client.post("/auth/login", json={
            "email": "unverified_login@test.com",
            "password": "password123",
        })
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client, db):
        from app.core.security import hash_password
        user = User(
            full_name="WrongPass",
            email="wrongpass@test.com",
            primary_role="candidate",
            is_email_verified=True,
            password_hash=hash_password("correctpassword"),
        )
        db.add(user)
        await db.commit()

        resp = await client.post("/auth/login", json={
            "email": "wrongpass@test.com",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client):
        resp = await client.post("/auth/login", json={
            "email": "ghost@test.com",
            "password": "password123",
        })
        assert resp.status_code == 401


class TestGetMe:
    @pytest.mark.asyncio
    async def test_get_me_success(self, client, db):
        user = await make_user(db, "me@test.com")
        resp = await client.get("/auth/me", headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["data"]["email"] == "me@test.com"

    @pytest.mark.asyncio
    async def test_get_me_no_token(self, client):
        resp = await client.get("/auth/me")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_bad_token(self, client):
        resp = await client.get("/auth/me", headers={"Authorization": "Bearer garbage"})
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_recruiter_admin_me_includes_membership_status(self, client, db):
        user = await make_user(db, "admin_me@test.com", role="recruiter_admin")
        company = await make_company(db, "Me Corp", "mecorp.com")
        await make_membership(db, user, company, role="admin", status="active")

        resp = await client.get("/auth/me", headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["data"]["membership_status"] == "active"

    @pytest.mark.asyncio
    async def test_candidate_me_has_no_membership_status(self, client, db):
        user = await make_user(db, "cand_me@test.com")
        resp = await client.get("/auth/me", headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["data"]["membership_status"] is None


class TestTokenRefresh:
    @pytest.mark.asyncio
    async def test_refresh_without_cookie_fails(self, client):
        resp = await client.post("/auth/refresh")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_succeeds(self, client):
        resp = await client.post("/auth/logout")
        assert resp.status_code == 200


class TestForgotPassword:
    @pytest.mark.asyncio
    async def test_forgot_password_always_200(self, client):
        resp = await client.post("/auth/forgot-password", json={
            "email": "doesnotexist@test.com"
        })
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_forgot_password_existing_user(self, client, db):
        from app.core.security import hash_password
        user = User(
            full_name="Forgot",
            email="forgot@test.com",
            primary_role="candidate",
            is_email_verified=True,
            password_hash=hash_password("oldpass"),
        )
        db.add(user)
        await db.commit()
        resp = await client.post("/auth/forgot-password", json={"email": "forgot@test.com"})
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# ── COMPANY TESTS ────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


class TestCompanyRegister:
    @pytest.mark.asyncio
    async def test_register_company_invalid_token(self, client):
        resp = await client.post("/companies/register", json={
            "setup_token": "notavalidtoken",
            "company_name": "Acme",
            "industry": "Tech",
            "company_size": "1-50",
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_register_company_with_candidate_token_fails(self, client):
        from app.core.security import create_pending_signup_token
        token = create_pending_signup_token({
            "type": "setup",
            "full_name": "Bad Actor",
            "email": "badactor@test.com",
            "password_hash": "x",
            "primary_role": "candidate",
        })
        resp = await client.post("/companies/register", json={
            "setup_token": token,
            "company_name": "Hack Corp",
            "industry": "Evil",
            "company_size": "1-10",
        })
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_register_company_valid_token_sends_email(self, client):
        from app.core.security import create_pending_signup_token
        token = create_pending_signup_token({
            "type": "setup",
            "full_name": "Admin User",
            "email": "admin_reg@test.com",
            "password_hash": "hashed",
            "primary_role": "recruiter_admin",
        })
        resp = await client.post("/companies/register", json={
            "setup_token": token,
            "company_name": "Valid Corp",
            "industry": "Tech",
            "company_size": "50-200",
        })
        assert resp.status_code == 201


class TestJoinCompany:
    @pytest.mark.asyncio
    async def test_join_nonexistent_company_fails(self, client):
        from app.core.security import create_pending_signup_token
        token = create_pending_signup_token({
            "type": "setup",
            "full_name": "Recruiter",
            "email": "recruiter_join@test.com",
            "password_hash": "hashed",
            "primary_role": "recruiter",
        })
        resp = await client.post("/companies/join-request", json={
            "setup_token": token,
            "company_name": "Company That Does Not Exist XYZ",
        })
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_join_existing_company_success(self, client, db):
        from app.core.security import create_pending_signup_token
        await make_company(db, "Join Target Corp", "jointarget.com")
        token = create_pending_signup_token({
            "type": "setup",
            "full_name": "New Recruiter",
            "email": "new_recruiter_join@test.com",
            "password_hash": "hashed",
            "primary_role": "recruiter",
        })
        resp = await client.post("/companies/join-request", json={
            "setup_token": token,
            "company_name": "Join Target Corp",
        })
        assert resp.status_code == 201


class TestRecruiterManagement:
    @pytest.mark.asyncio
    async def test_list_recruiters_as_admin(self, client, db):
        admin = await make_user(db, "admin_list@test.com", role="recruiter_admin")
        company = await make_company(db, "List Co", "listco.com")
        await make_membership(db, admin, company, role="admin")
        recruiter = await make_user(db, "recruiter_list@test.com", role="recruiter")
        await make_membership(db, recruiter, company, role="recruiter", status="pending")

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
        membership = await make_membership(db, recruiter, company, role="recruiter", status="pending")

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
        membership = await make_membership(db, recruiter, company, role="recruiter", status="pending")

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


# ---------------------------------------------------------------------------
# ── JOB TESTS ────────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


class TestJobCreate:
    @pytest.mark.asyncio
    async def test_active_recruiter_can_create_job(self, client, db):
        user = await make_user(db, "recruiter_create@test.com", role="recruiter_admin")
        company = await make_company(db, "Create Job Co", "createjobco.com")
        await make_membership(db, user, company)

        resp = await client.post("/jobs/", json={
            "title": "Python Dev",
            "location_type": "remote",
            "currency": "NPR",
            "status": "open",
        }, headers=auth_headers(user))
        assert resp.status_code == 201
        assert resp.json()["data"]["title"] == "Python Dev"

    @pytest.mark.asyncio
    async def test_candidate_cannot_create_job(self, client, db):
        user = await make_user(db, "cand_create_job@test.com")
        resp = await client.post("/jobs/", json={
            "title": "Sneaky Job",
            "location_type": "remote",
        }, headers=auth_headers(user))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_recruiter_without_company_cannot_create_job(self, client, db):
        user = await make_user(db, "orphan_recruiter@test.com", role="recruiter_admin")
        resp = await client.post("/jobs/", json={
            "title": "Orphan Job",
            "location_type": "remote",
        }, headers=auth_headers(user))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_pending_membership_cannot_create_job(self, client, db):
        user = await make_user(db, "pending_recruiter@test.com", role="recruiter_admin")
        company = await make_company(db, "Pending Co", "pendingco.com")
        await make_membership(db, user, company, status="pending")

        resp = await client.post("/jobs/", json={
            "title": "Pending Job",
            "location_type": "remote",
        }, headers=auth_headers(user))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_create_job_invalid_salary_range(self, client, db):
        user = await make_user(db, "salary_recruiter@test.com", role="recruiter_admin")
        company = await make_company(db, "Salary Co", "salaryco.com")
        await make_membership(db, user, company)

        resp = await client.post("/jobs/", json={
            "title": "Bad Salary Job",
            "location_type": "remote",
            "salary_min": 5000000,
            "salary_max": 1000000,
        }, headers=auth_headers(user))
        assert resp.status_code == 400


class TestJobRead:
    @pytest.mark.asyncio
    async def test_anyone_can_list_open_jobs(self, client, db):
        user = await make_user(db, "recruiter_public@test.com", role="recruiter_admin")
        company = await make_company(db, "Public Co", "publicco.com")
        await make_membership(db, user, company)
        # Create via API so it's visible in the same DB connection the app uses
        resp = await client.post("/jobs/", json={
            "title": "Public Open Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(user))
        assert resp.status_code == 201

        resp = await client.get("/jobs/")
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Public Open Job" in titles

    @pytest.mark.asyncio
    async def test_draft_jobs_not_in_public_list(self, client, db):
        user = await make_user(db, "recruiter_draft@test.com", role="recruiter_admin")
        company = await make_company(db, "Draft Co", "draftco.com")
        await make_membership(db, user, company)
        await client.post("/jobs/", json={
            "title": "Hidden Draft Job",
            "location_type": "remote",
            "status": "draft",
        }, headers=auth_headers(user))

        resp = await client.get("/jobs/")
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Hidden Draft Job" not in titles

    @pytest.mark.asyncio
    async def test_get_job_detail(self, client, db):
        user = await make_user(db, "recruiter_detail@test.com", role="recruiter_admin")
        company = await make_company(db, "Detail Co", "detailco.com")
        await make_membership(db, user, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Detailed Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(user))
        job_id = create_resp.json()["data"]["id"]

        resp = await client.get(f"/jobs/{job_id}")
        assert resp.status_code == 200
        assert resp.json()["data"]["title"] == "Detailed Job"

    @pytest.mark.asyncio
    async def test_get_nonexistent_job(self, client):
        resp = await client.get("/jobs/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_search_jobs_by_keyword(self, client, db):
        user = await make_user(db, "recruiter_search@test.com", role="recruiter_admin")
        company = await make_company(db, "Search Co", "searchco.com")
        await make_membership(db, user, company)
        await client.post("/jobs/", json={
            "title": "Blockchain Wizard",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(user))

        resp = await client.get("/jobs/?q=Blockchain")
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Blockchain Wizard" in titles

    @pytest.mark.asyncio
    async def test_search_jobs_by_category(self, client, db):
        user = await make_user(db, "recruiter_cat@test.com", role="recruiter_admin")
        company = await make_company(db, "Cat Co", "catco.com")
        await make_membership(db, user, company)
        # Create via API so the app session sees the committed data
        await client.post("/jobs/", json={
            "title": "Cat Backend Job",
            "location_type": "remote",
            "status": "open",
            "category": "cat_backend_unique",
        }, headers=auth_headers(user))

        resp = await client.get("/jobs/?category=cat_backend_unique")
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Cat Backend Job" in titles

    @pytest.mark.asyncio
    async def test_list_company_jobs_as_recruiter(self, client, db):
        user = await make_user(db, "recruiter_company_jobs@test.com", role="recruiter_admin")
        company = await make_company(db, "Company Jobs Co", "cjco.com")
        await make_membership(db, user, company)
        await client.post("/jobs/", json={
            "title": "Internal Draft",
            "location_type": "remote",
            "status": "draft",
        }, headers=auth_headers(user))

        resp = await client.get("/jobs/company/me", headers=auth_headers(user))
        assert resp.status_code == 200
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Internal Draft" in titles

    @pytest.mark.asyncio
    async def test_list_company_jobs_as_candidate_fails(self, client, db):
        cand = await make_user(db, "cand_company_jobs@test.com")
        resp = await client.get("/jobs/company/me", headers=auth_headers(cand))
        assert resp.status_code == 403


class TestJobUpdate:
    @pytest.mark.asyncio
    async def test_recruiter_can_update_own_company_job(self, client, db):
        user = await make_user(db, "recruiter_update@test.com", role="recruiter_admin")
        company = await make_company(db, "Update Co", "updateco.com")
        await make_membership(db, user, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Old Title",
            "location_type": "remote",
        }, headers=auth_headers(user))
        job_id = create_resp.json()["data"]["id"]

        resp = await client.patch(f"/jobs/{job_id}", json={"title": "New Title"}, headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["data"]["title"] == "New Title"

    @pytest.mark.asyncio
    async def test_recruiter_cannot_update_other_company_job(self, client, db):
        owner = await make_user(db, "owner_update@test.com", role="recruiter_admin")
        intruder = await make_user(db, "intruder_update@test.com", role="recruiter_admin")
        company_a = await make_company(db, "Owner Co", "ownerco.com")
        company_b = await make_company(db, "Intruder Co", "intruderco.com")
        await make_membership(db, owner, company_a)
        await make_membership(db, intruder, company_b)

        create_resp = await client.post("/jobs/", json={
            "title": "Owner Job",
            "location_type": "remote",
        }, headers=auth_headers(owner))
        job_id = create_resp.json()["data"]["id"]

        resp = await client.patch(f"/jobs/{job_id}", json={"title": "Hacked"}, headers=auth_headers(intruder))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_open_job_shows_in_search_after_status_update(self, client, db):
        user = await make_user(db, "recruiter_publish@test.com", role="recruiter_admin")
        company = await make_company(db, "Publish Co", "publishco.com")
        await make_membership(db, user, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Soon Open Job",
            "location_type": "remote",
            "status": "draft",
        }, headers=auth_headers(user))
        job_id = create_resp.json()["data"]["id"]

        await client.patch(f"/jobs/{job_id}", json={"status": "open"}, headers=auth_headers(user))

        resp = await client.get("/jobs/?q=Soon+Open+Job")
        titles = [j["title"] for j in resp.json()["data"]]
        assert "Soon Open Job" in titles


class TestJobDelete:
    @pytest.mark.asyncio
    async def test_recruiter_can_delete_own_job(self, client, db):
        user = await make_user(db, "recruiter_delete@test.com", role="recruiter_admin")
        company = await make_company(db, "Delete Co", "deleteco.com")
        await make_membership(db, user, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Delete Me",
            "location_type": "remote",
        }, headers=auth_headers(user))
        job_id = create_resp.json()["data"]["id"]

        resp = await client.delete(f"/jobs/{job_id}", headers=auth_headers(user))
        assert resp.status_code == 200

        resp = await client.get(f"/jobs/{job_id}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_candidate_cannot_delete_job(self, client, db):
        recruiter = await make_user(db, "recruiter_nodelete@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_nodelete@test.com")
        company = await make_company(db, "No Delete Co", "nodeleteco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Protected Job",
            "location_type": "remote",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]

        resp = await client.delete(f"/jobs/{job_id}", headers=auth_headers(cand))
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# ── PROFILE TESTS ────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


class TestProfile:
    @pytest.mark.asyncio
    async def test_get_my_profile_creates_empty_if_missing(self, client, db):
        user = await make_user(db, "profile_empty@test.com")
        resp = await client.get("/profiles/me", headers=auth_headers(user))
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["experiences"] == []
        assert data["educations"] == []

    @pytest.mark.asyncio
    async def test_recruiter_cannot_access_candidate_profile_route(self, client, db):
        recruiter = await make_user(db, "recruiter_profile@test.com", role="recruiter_admin")
        resp = await client.get("/profiles/me", headers=auth_headers(recruiter))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_update_profile_fields(self, client, db):
        user = await make_user(db, "profile_update@test.com")
        resp = await client.put("/profiles/me", json={
            "headline": "Senior Developer",
            "location": "Kathmandu",
            "years_of_experience": 5,
        }, headers=auth_headers(user))
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["headline"] == "Senior Developer"
        assert data["location"] == "Kathmandu"

    @pytest.mark.asyncio
    async def test_update_profile_with_experiences(self, client, db):
        user = await make_user(db, "profile_exp@test.com")
        # GET first to ensure profile is initialized in the app's DB session
        await client.get("/profiles/me", headers=auth_headers(user))

        resp = await client.put("/profiles/me", json={
            "experiences": [{
                "company_name": "Tech Corp",
                "title": "Engineer",
                "start_date": "2020-01-01",
                "description": ["Built things"],
            }]
        }, headers=auth_headers(user))
        assert resp.status_code == 200
        assert len(resp.json()["data"]["experiences"]) == 1

    @pytest.mark.asyncio
    async def test_update_profile_replaces_experiences(self, client, db):
        """Sending new experiences should wipe old ones."""
        user = await make_user(db, "profile_replace@test.com")
        # Initialize profile first
        await client.get("/profiles/me", headers=auth_headers(user))

        await client.put("/profiles/me", json={
            "experiences": [{"company_name": "Old Corp", "title": "Old Role", "description": []}]
        }, headers=auth_headers(user))

        resp = await client.put("/profiles/me", json={
            "experiences": [{"company_name": "New Corp", "title": "New Role", "description": []}]
        }, headers=auth_headers(user))
        exps = resp.json()["data"]["experiences"]
        assert len(exps) == 1
        assert exps[0]["company_name"] == "New Corp"

    @pytest.mark.asyncio
    async def test_update_profile_with_skills(self, client, db):
        user = await make_user(db, "profile_skills@test.com")
        # Initialize profile first
        await client.get("/profiles/me", headers=auth_headers(user))

        resp = await client.put("/profiles/me", json={
            "skills": [{"skill_name": "Python"}, {"skill_name": "FastAPI"}]
        }, headers=auth_headers(user))
        assert resp.status_code == 200
        skill_names = [s["skill_name"] for s in resp.json()["data"]["skills"]]
        assert "Python" in skill_names

    @pytest.mark.asyncio
    async def test_get_profile_by_user_id(self, client, db):
        user = await make_user(db, "profile_public@test.com")
        caller = await make_user(db, "profile_caller@test.com")
        await client.put("/profiles/me", json={"headline": "Public Dev"}, headers=auth_headers(user))

        resp = await client.get(f"/profiles/{user.id}", headers=auth_headers(caller))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_profile_nonexistent_user(self, client, db):
        caller = await make_user(db, "profile_caller2@test.com")
        resp = await client.get(
            "/profiles/00000000-0000-0000-0000-000000000000",
            headers=auth_headers(caller),
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_unauthenticated_cannot_get_profile(self, client):
        resp = await client.get("/profiles/me")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# ── RESUME TESTS ─────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


class TestResume:
    @pytest.mark.asyncio
    async def test_create_resume_forks_from_profile(self, client, db):
        user = await make_user(db, "resume_fork@test.com")
        # Build profile via API so collections are initialized in the app session
        await client.get("/profiles/me", headers=auth_headers(user))
        await client.put("/profiles/me", json={
            "headline": "Dev",
            "skills": [{"skill_name": "Go"}],
        }, headers=auth_headers(user))

        resp = await client.post("/resumes/", json={"resume_name": "My First Resume"}, headers=auth_headers(user))
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["resume_name"] == "My First Resume"
        assert data["headline"] == "Dev"
        skill_names = [s["skill_name"] for s in data["skills"]]
        assert "Go" in skill_names

    @pytest.mark.asyncio
    async def test_create_resume_without_profile_still_works(self, client, db):
        user = await make_user(db, "resume_no_profile@test.com")
        resp = await client.post("/resumes/", json={"resume_name": "Blank Resume"}, headers=auth_headers(user))
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_list_my_resumes(self, client, db):
        user = await make_user(db, "resume_list@test.com")
        await client.post("/resumes/", json={"resume_name": "Resume A"}, headers=auth_headers(user))
        await client.post("/resumes/", json={"resume_name": "Resume B"}, headers=auth_headers(user))

        resp = await client.get("/resumes/me", headers=auth_headers(user))
        assert resp.status_code == 200
        names = [r["resume_name"] for r in resp.json()["data"]]
        assert "Resume A" in names
        assert "Resume B" in names

    @pytest.mark.asyncio
    async def test_get_specific_resume(self, client, db):
        user = await make_user(db, "resume_get@test.com")
        create_resp = await client.post("/resumes/", json={"resume_name": "Get Me"}, headers=auth_headers(user))
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.get(f"/resumes/{resume_id}", headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["data"]["resume_name"] == "Get Me"

    @pytest.mark.asyncio
    async def test_cannot_get_another_users_resume(self, client, db):
        owner = await make_user(db, "resume_owner@test.com")
        thief = await make_user(db, "resume_thief@test.com")
        create_resp = await client.post("/resumes/", json={"resume_name": "Private"}, headers=auth_headers(owner))
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.get(f"/resumes/{resume_id}", headers=auth_headers(thief))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_update_resume(self, client, db):
        user = await make_user(db, "resume_update@test.com")
        create_resp = await client.post("/resumes/", json={"resume_name": "Old Name"}, headers=auth_headers(user))
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.put(f"/resumes/{resume_id}", json={"resume_name": "New Name"}, headers=auth_headers(user))
        assert resp.status_code == 200
        assert resp.json()["data"]["resume_name"] == "New Name"

    @pytest.mark.asyncio
    async def test_update_resume_skills(self, client, db):
        user = await make_user(db, "resume_skills_update@test.com")
        create_resp = await client.post("/resumes/", json={"resume_name": "Skills Resume"}, headers=auth_headers(user))
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.put(f"/resumes/{resume_id}", json={
            "skills": [{"skill_name": "Rust"}, {"skill_name": "Go"}]
        }, headers=auth_headers(user))
        skill_names = [s["skill_name"] for s in resp.json()["data"]["skills"]]
        assert "Rust" in skill_names

    @pytest.mark.asyncio
    async def test_delete_resume(self, client, db):
        user = await make_user(db, "resume_delete@test.com")
        create_resp = await client.post("/resumes/", json={"resume_name": "Delete Me"}, headers=auth_headers(user))
        resume_id = create_resp.json()["data"]["id"]

        resp = await client.delete(f"/resumes/{resume_id}", headers=auth_headers(user))
        assert resp.status_code == 200

        resp = await client.get(f"/resumes/{resume_id}", headers=auth_headers(user))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_recruiter_cannot_access_resume_routes(self, client, db):
        recruiter = await make_user(db, "recruiter_resume@test.com", role="recruiter_admin")
        resp = await client.get("/resumes/me", headers=auth_headers(recruiter))
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# ── APPLICATION TESTS ────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


class TestApplicationSubmit:
    @pytest.mark.asyncio
    async def test_candidate_can_apply_to_open_job(self, client, db):
        recruiter = await make_user(db, "recruiter_apply@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_apply@test.com")
        company = await make_company(db, "Apply Co", "applyco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Apply Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "Apply Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        resp = await client.post("/applications/", json={
            "job_id": job_id,
            "resume_id": resume_id,
        }, headers=auth_headers(cand))
        assert resp.status_code == 201
        assert resp.json()["data"]["status"] == "submitted"

    @pytest.mark.asyncio
    async def test_cannot_apply_to_closed_job(self, client, db):
        recruiter = await make_user(db, "recruiter_closed@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_closed@test.com")
        company = await make_company(db, "Closed Co", "closedco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Closed Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        # Close the job
        await client.patch(f"/jobs/{job_id}", json={"status": "closed"}, headers=auth_headers(recruiter))
        resume_resp = await client.post("/resumes/", json={"resume_name": "Closed Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        resp = await client.post("/applications/", json={
            "job_id": job_id, "resume_id": resume_id,
        }, headers=auth_headers(cand))
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_cannot_apply_to_draft_job(self, client, db):
        recruiter = await make_user(db, "recruiter_draft_app@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_draft_app@test.com")
        company = await make_company(db, "Draft App Co", "draftappco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Draft App Job",
            "location_type": "remote",
            "status": "draft",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "Draft Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        resp = await client.post("/applications/", json={
            "job_id": job_id, "resume_id": resume_id,
        }, headers=auth_headers(cand))
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_duplicate_application_rejected(self, client, db):
        recruiter = await make_user(db, "recruiter_dup_app@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_dup_app@test.com")
        company = await make_company(db, "Dup App Co", "dupappco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Dup Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "Dup Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]
        payload = {"job_id": job_id, "resume_id": resume_id}

        await client.post("/applications/", json=payload, headers=auth_headers(cand))
        resp = await client.post("/applications/", json=payload, headers=auth_headers(cand))
        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_cannot_apply_with_another_users_resume(self, client, db):
        recruiter = await make_user(db, "recruiter_idor@test.com", role="recruiter_admin")
        cand_a = await make_user(db, "cand_idor_a@test.com")
        cand_b = await make_user(db, "cand_idor_b@test.com")
        company = await make_company(db, "IDOR Co", "idorco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "IDOR Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        # cand_b creates a resume
        resume_resp = await client.post("/resumes/", json={"resume_name": "B Resume"}, headers=auth_headers(cand_b))
        other_resume_id = resume_resp.json()["data"]["id"]

        # cand_a tries to apply with cand_b's resume
        resp = await client.post("/applications/", json={
            "job_id": job_id,
            "resume_id": other_resume_id,
        }, headers=auth_headers(cand_a))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_recruiter_cannot_apply_to_job(self, client, db):
        recruiter = await make_user(db, "recruiter_self_apply@test.com", role="recruiter_admin")
        company = await make_company(db, "Self Apply Co", "selfapplyco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Self Apply Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]

        resp = await client.post("/applications/", json={
            "job_id": job_id,
            "resume_id": "00000000-0000-0000-0000-000000000000",
        }, headers=auth_headers(recruiter))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_apply_to_nonexistent_job(self, client, db):
        cand = await make_user(db, "cand_nojob@test.com")
        resume_resp = await client.post("/resumes/", json={"resume_name": "No Job Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        resp = await client.post("/applications/", json={
            "job_id": "00000000-0000-0000-0000-000000000000",
            "resume_id": resume_id,
        }, headers=auth_headers(cand))
        assert resp.status_code == 404


class TestApplicationRead:
    @pytest.mark.asyncio
    async def test_candidate_can_list_own_applications(self, client, db):
        recruiter = await make_user(db, "recruiter_list_app@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_list_app@test.com")
        company = await make_company(db, "List App Co", "listappco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "List App Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "List Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        await client.post("/applications/", json={"job_id": job_id, "resume_id": resume_id}, headers=auth_headers(cand))

        resp = await client.get("/applications/me", headers=auth_headers(cand))
        assert resp.status_code == 200
        assert len(resp.json()["data"]) >= 1

    @pytest.mark.asyncio
    async def test_recruiter_can_list_applications_for_own_job(self, client, db):
        recruiter = await make_user(db, "recruiter_job_apps@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_job_apps@test.com")
        company = await make_company(db, "Job Apps Co", "jobappsco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Job Apps Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "Job Apps Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        await client.post("/applications/", json={"job_id": job_id, "resume_id": resume_id}, headers=auth_headers(cand))

        resp = await client.get(f"/applications/job/{job_id}", headers=auth_headers(recruiter))
        assert resp.status_code == 200
        assert len(resp.json()["data"]) >= 1

    @pytest.mark.asyncio
    async def test_candidate_cannot_list_applications_for_a_job(self, client, db):
        recruiter = await make_user(db, "recruiter_cand_nolist@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_nolist@test.com")
        company = await make_company(db, "No List Co", "nolistco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "No List Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]

        resp = await client.get(f"/applications/job/{job_id}", headers=auth_headers(cand))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_candidate_can_get_own_application_detail(self, client, db):
        recruiter = await make_user(db, "recruiter_app_detail@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_app_detail@test.com")
        company = await make_company(db, "App Detail Co", "appdetailco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Detail Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "Detail Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post("/applications/", json={"job_id": job_id, "resume_id": resume_id}, headers=auth_headers(cand))
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.get(f"/applications/{app_id}", headers=auth_headers(cand))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_other_candidate_cannot_see_application(self, client, db):
        recruiter = await make_user(db, "recruiter_spy@test.com", role="recruiter_admin")
        cand_a = await make_user(db, "cand_spy_a@test.com")
        cand_b = await make_user(db, "cand_spy_b@test.com")
        company = await make_company(db, "Spy Co", "spyco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Spy Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "Spy Resume"}, headers=auth_headers(cand_a))
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post("/applications/", json={"job_id": job_id, "resume_id": resume_id}, headers=auth_headers(cand_a))
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.get(f"/applications/{app_id}", headers=auth_headers(cand_b))
        assert resp.status_code == 403


class TestApplicationStatusUpdate:
    @pytest.mark.asyncio
    async def test_recruiter_can_update_application_status(self, client, db):
        recruiter = await make_user(db, "recruiter_status@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_status@test.com")
        company = await make_company(db, "Status Co", "statusco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "Status Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "Status Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post("/applications/", json={"job_id": job_id, "resume_id": resume_id}, headers=auth_headers(cand))
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.patch(f"/applications/{app_id}/status",
            json={"status": "interview"},
            headers=auth_headers(recruiter),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "interview"

    @pytest.mark.asyncio
    async def test_candidate_cannot_update_application_status(self, client, db):
        recruiter = await make_user(db, "recruiter_no_status@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_no_status@test.com")
        company = await make_company(db, "No Status Co", "nostatusco.com")
        await make_membership(db, recruiter, company)
        create_resp = await client.post("/jobs/", json={
            "title": "No Status Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "No Status Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post("/applications/", json={"job_id": job_id, "resume_id": resume_id}, headers=auth_headers(cand))
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.patch(f"/applications/{app_id}/status",
            json={"status": "hired"},
            headers=auth_headers(cand),
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_recruiter_from_different_company_cannot_update_status(self, client, db):
        owner_recruiter = await make_user(db, "owner_status@test.com", role="recruiter_admin")
        other_recruiter = await make_user(db, "other_status@test.com", role="recruiter_admin")
        cand = await make_user(db, "cand_other_status@test.com")
        company_a = await make_company(db, "Owner Status Co", "ownerstatusco.com")
        company_b = await make_company(db, "Other Status Co", "otherstatusco.com")
        await make_membership(db, owner_recruiter, company_a)
        await make_membership(db, other_recruiter, company_b)

        create_resp = await client.post("/jobs/", json={
            "title": "Cross Co Job",
            "location_type": "remote",
            "status": "open",
        }, headers=auth_headers(owner_recruiter))
        job_id = create_resp.json()["data"]["id"]
        resume_resp = await client.post("/resumes/", json={"resume_name": "Cross Resume"}, headers=auth_headers(cand))
        resume_id = resume_resp.json()["data"]["id"]

        apply_resp = await client.post("/applications/", json={"job_id": job_id, "resume_id": resume_id}, headers=auth_headers(cand))
        app_id = apply_resp.json()["data"]["id"]

        resp = await client.patch(f"/applications/{app_id}/status",
            json={"status": "rejected"},
            headers=auth_headers(other_recruiter),
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# ── DASHBOARD TESTS ──────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
# The dashboard router in main.py is included with prefix="/dashboards"
# and the router itself has prefix="/dashboards" — making routes mount at
# /dashboards/dashboards/... in older code. Check your main.py:
#   app.include_router(dash_router)   ← no extra prefix here since the
#                                        router already defines its own.


class TestDashboard:
    @pytest.mark.asyncio
    async def test_candidate_dashboard(self, client, db):
        cand = await make_user(db, "cand_dash@test.com")
        resp = await client.get("/dashboards/candidate", headers=auth_headers(cand))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_recruiter_dashboard(self, client, db):
        recruiter = await make_user(db, "recruiter_dash@test.com", role="recruiter_admin")
        resp = await client.get("/dashboards/recruiter", headers=auth_headers(recruiter))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_recruiter_cannot_access_candidate_dashboard(self, client, db):
        recruiter = await make_user(db, "recruiter_cand_dash@test.com", role="recruiter_admin")
        resp = await client.get("/dashboards/candidate", headers=auth_headers(recruiter))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_candidate_cannot_access_recruiter_dashboard(self, client, db):
        cand = await make_user(db, "cand_rec_dash@test.com")
        resp = await client.get("/dashboards/recruiter", headers=auth_headers(cand))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_unauthenticated_dashboard_blocked(self, client):
        resp = await client.get("/dashboards/candidate")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# ── SYSTEM TESTS ─────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------


class TestSystem:
    @pytest.mark.asyncio
    async def test_root_endpoint(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        assert resp.json()["data"]["app"] == "ConvexHire API"

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["data"]["database"] == "connected"