import pytest

from app.modules.auth.models import User
from tests.integration.helpers import (
    auth_headers,
    make_company,
    make_membership,
    make_user,
)


class TestSignup:
    @pytest.mark.asyncio
    async def test_candidate_signup_success(self, client):
        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Rahul Dev Banjara",
                "email": "rahuldevbanjara@test.com",
                "password": "Password@123",
                "primary_role": "candidate",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["setup_token"] is None

    @pytest.mark.asyncio
    async def test_recruiter_admin_signup_returns_setup_token(self, client):
        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Rahul Admin",
                "email": "rahul_admin_signup@test.com",
                "password": "Password@123",
                "primary_role": "recruiter_admin",
            },
        )
        assert resp.status_code == 201
        assert resp.json()["data"]["setup_token"] is not None

    @pytest.mark.asyncio
    async def test_recruiter_signup_returns_setup_token(self, client):
        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Rahul Recruiter",
                "email": "rahul_recruiter_signup@test.com",
                "password": "Password@123",
                "primary_role": "recruiter",
            },
        )
        assert resp.status_code == 201
        assert resp.json()["data"]["setup_token"] is not None

    @pytest.mark.asyncio
    async def test_duplicate_email_rejected(self, client, db):
        await make_user(db, "dup@test.com")
        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Dup",
                "email": "dup@test.com",
                "password": "Password@123",
                "primary_role": "candidate",
            },
        )
        assert resp.status_code == 409

    @pytest.mark.asyncio
    async def test_short_password_rejected(self, client):
        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Rahul Short Password",
                "email": "rahul_short_password@test.com",
                "password": "www",
                "primary_role": "candidate",
            },
        )
        assert resp.status_code == 400
        assert any(e["field"] == "password" for e in resp.json()["errors"])

    @pytest.mark.asyncio
    async def test_invalid_role_rejected(self, client):
        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Bad Role",
                "email": "badrole@test.com",
                "password": "Password@123",
                "primary_role": "super_fancy_role_that_doesnt_exist_huhahahah",
            },
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_missing_fields_rejected(self, client):
        resp = await client.post("/auth/signup", json={"email": "incomplete@test.com"})
        assert resp.status_code == 400


class TestLogin:
    @pytest.mark.asyncio
    async def test_login_sets_refresh_cookie(self, client, db):
        from app.core.security import hash_password

        user = User(
            full_name="Cookie Login",
            email="cookie_login@test.com",
            primary_role="candidate",
            is_email_verified=True,
            is_onboarded=True,
            password_hash=hash_password("Password@123"),
        )
        db.add(user)
        await db.commit()

        resp = await client.post(
            "/auth/login",
            json={
                "email": "cookie_login@test.com",
                "password": "Password@123",
            },
        )

        assert resp.status_code == 200
        assert "refresh_token=" in resp.headers.get("set-cookie", "")

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

        resp = await client.post(
            "/auth/login",
            json={
                "email": "unverified_login@test.com",
                "password": "password123",
            },
        )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client, db):
        from app.core.security import hash_password

        user = User(
            full_name="WrongPass",
            email="wrongpass@test.com",
            primary_role="candidate",
            is_email_verified=True,
            is_onboarded=True,
            password_hash=hash_password("correctpassword"),
        )
        db.add(user)
        await db.commit()

        resp = await client.post(
            "/auth/login",
            json={
                "email": "wrongpass@test.com",
                "password": "wrongpassword",
            },
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client):
        resp = await client.post(
            "/auth/login",
            json={
                "email": "ghost@test.com",
                "password": "password123",
            },
        )
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
    async def test_refresh_with_cookie_rotates_token(self, client, db):
        from app.core.security import hash_password

        user = User(
            full_name="Refresh User",
            email="refresh_user@test.com",
            primary_role="candidate",
            is_email_verified=True,
            is_onboarded=True,
            password_hash=hash_password("Password@123"),
        )
        db.add(user)
        await db.commit()

        login_resp = await client.post(
            "/auth/login",
            json={
                "email": "refresh_user@test.com",
                "password": "Password@123",
            },
        )
        assert login_resp.status_code == 200

        refresh_resp = await client.post("/auth/refresh")
        assert refresh_resp.status_code == 200
        assert refresh_resp.json()["data"]["access_token"]
        assert "refresh_token=" in refresh_resp.headers.get("set-cookie", "")

    @pytest.mark.asyncio
    async def test_refresh_without_cookie_fails(self, client):
        resp = await client.post("/auth/refresh")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_succeeds(self, client):
        resp = await client.post("/auth/logout")
        assert resp.status_code == 200
        assert "refresh_token=" in resp.headers.get("set-cookie", "")


class TestForgotPassword:
    @pytest.mark.asyncio
    async def test_forgot_password_always_200(self, client):
        resp = await client.post(
            "/auth/forgot-password", json={"email": "doesnotexist@test.com"}
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_forgot_password_existing_user(self, client, db):
        from app.core.security import hash_password

        user = User(
            full_name="Forgot",
            email="forgot@test.com",
            primary_role="candidate",
            is_email_verified=True,
            is_onboarded=True,
            password_hash=hash_password("oldpass"),
        )
        db.add(user)
        await db.commit()
        resp = await client.post(
            "/auth/forgot-password", json={"email": "forgot@test.com"}
        )
        assert resp.status_code == 200
