from tests.integration.helpers import (
    TEST_PASSWORD,
    auth_headers,
    make_candidate,
)


class TestSignup:
    async def test_candidate_signup_201(self, client):
        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Alice",
                "email": "alice@example.com",
                "password": "Password@123",
                "primary_role": "candidate",
            },
        )
        assert resp.status_code == 201
        assert "verify" in resp.json()["message"].lower()

    async def test_duplicate_email_409(self, client, db):
        await make_candidate(db, email="dup@example.com")

        resp = await client.post(
            "/auth/signup",
            json={
                "full_name": "Bob",
                "email": "dup@example.com",
                "password": "Password@123",
                "primary_role": "candidate",
            },
        )
        assert resp.status_code == 409


class TestLogin:
    async def test_login_success(self, client, db):
        user = await make_candidate(db, email="login_ok@example.com")

        resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": TEST_PASSWORD},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body["data"]["tokens"]

    async def test_wrong_password_401(self, client, db):
        user = await make_candidate(db, email="wrong_pw@example.com")

        resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": "WrongPassword!1"},
        )
        assert resp.status_code == 401

    async def test_unverified_email_403(self, client, db):
        from app.modules.auth.enums import UserRole
        from app.modules.auth.models import User
        from app.core.security import hash_password

        user = User(
            email="unverified@example.com",
            full_name="Unverified",
            password_hash=hash_password(TEST_PASSWORD),
            primary_role=UserRole.candidate,
            is_email_verified=False,
        )
        db.add(user)
        await db.flush()

        resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": TEST_PASSWORD},
        )
        assert resp.status_code == 403

    async def test_deleted_account_401(self, client, db):
        from datetime import datetime, timezone

        user = await make_candidate(db, email="deleted@example.com")
        user.is_deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        await db.flush()

        resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": TEST_PASSWORD},
        )
        assert resp.status_code == 401


class TestGetMe:
    async def test_get_me_returns_profile(self, client, db):
        user = await make_candidate(db, email="getme@example.com")
        resp = await client.get("/auth/me", headers=auth_headers(user.id))

        assert resp.status_code == 200
        body = resp.json()
        assert body["data"]["email"] == user.email

    async def test_get_me_no_token_401(self, client):
        resp = await client.get("/auth/me")
        assert resp.status_code == 401


class TestTokenRotation:
    async def test_refresh_token_returns_new_access_token(self, client, db):
        user = await make_candidate(db, email="refresh@example.com")

        login_resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": TEST_PASSWORD},
        )
        assert login_resp.status_code == 200
        refresh_token = login_resp.cookies.get("refresh_token")
        assert refresh_token, "No refresh_token cookie set"

        client.cookies.set("refresh_token", refresh_token)
        refresh_resp = await client.post("/auth/refresh")
        client.cookies.clear()
        assert refresh_resp.status_code == 200
        assert "access_token" in refresh_resp.json()["data"]

    async def test_refresh_with_invalid_token_401(self, client):
        client.cookies.set("refresh_token", "not.a.valid.token")
        resp = await client.post("/auth/refresh")
        client.cookies.clear()
        assert resp.status_code == 401

    async def test_logout_clears_refresh_cookie(self, client, db):
        user = await make_candidate(db, email="logout@example.com")

        login_resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": TEST_PASSWORD},
        )
        refresh_token = login_resp.cookies.get("refresh_token")

        client.cookies.set("refresh_token", refresh_token)
        logout_resp = await client.post("/auth/logout")
        assert logout_resp.status_code == 200

        # Token should be revoked — refresh must fail now
        refresh_resp = await client.post("/auth/refresh")
        client.cookies.clear()
        assert refresh_resp.status_code == 401


class TestChangePassword:
    async def test_change_password_success(self, client, db):
        user = await make_candidate(db, email="chpw@example.com")

        resp = await client.patch(
            "/auth/me/password",
            json={
                "current_password": TEST_PASSWORD,
                "new_password": "NewPassword@456",
            },
            headers=auth_headers(user.id),
        )
        assert resp.status_code == 200

        # Old password no longer works
        login_resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": TEST_PASSWORD},
        )
        assert login_resp.status_code == 401

    async def test_change_password_wrong_current_400(self, client, db):
        user = await make_candidate(db, email="chpw_bad@example.com")

        resp = await client.patch(
            "/auth/me/password",
            json={
                "current_password": "WrongCurrent!1",
                "new_password": "NewPassword@456",
            },
            headers=auth_headers(user.id),
        )
        assert resp.status_code == 400
