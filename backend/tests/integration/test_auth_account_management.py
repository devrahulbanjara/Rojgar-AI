from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.core.security import create_pending_signup_token
from app.modules.auth.models import RefreshToken, User
from tests.integration.helpers import auth_headers, make_user


class TestVerifyEmail:
    @pytest.mark.asyncio
    async def test_verify_email_creates_candidate_and_is_idempotent(self, client, db):
        token = create_pending_signup_token(
            {
                "type": "pending_candidate",
                "full_name": "Nina Candidate",
                "email": "nina.verify@test.com",
                "password_hash": "hashed-password-placeholder",
                "primary_role": "candidate",
            }
        )

        first_resp = await client.post("/auth/verify-email", json={"token": token})
        second_resp = await client.post("/auth/verify-email", json={"token": token})

        assert first_resp.status_code == 200
        assert second_resp.status_code == 200

        users = (
            await db.scalars(select(User).where(User.email == "nina.verify@test.com"))
        ).all()
        assert len(users) == 1
        assert users[0].is_email_verified is True
        assert users[0].is_onboarded is False
        assert users[0].primary_role.value == "candidate"


class TestAccountManagement:
    @pytest.mark.asyncio
    async def test_authenticated_user_can_update_me(self, client, db):
        user = await make_user(
            db,
            "update.me@test.com",
            full_name="Old Name",
        )

        resp = await client.patch(
            "/auth/me",
            json={"full_name": "Updated Candidate"},
            headers=auth_headers(user),
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["full_name"] == "Updated Candidate"

        await db.refresh(user)
        assert user.full_name == "Updated Candidate"

    @pytest.mark.asyncio
    async def test_change_password_revokes_existing_refresh_tokens(self, client, db):
        user = await make_user(
            db,
            "password.change@test.com",
            password="OldPassword@123",
        )

        login_resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": "OldPassword@123"},
        )
        assert login_resp.status_code == 200

        change_resp = await client.patch(
            "/auth/me/password",
            json={
                "current_password": "OldPassword@123",
                "new_password": "NewPassword@123",
            },
            headers=auth_headers(user),
        )

        assert change_resp.status_code == 200

        refresh_resp = await client.post("/auth/refresh")
        assert refresh_resp.status_code == 401

        remaining_tokens = (
            await db.scalars(
                select(RefreshToken).where(RefreshToken.user_id == user.id)
            )
        ).all()
        assert remaining_tokens == []

        old_login_resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": "OldPassword@123"},
        )
        new_login_resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": "NewPassword@123"},
        )

        assert old_login_resp.status_code == 401
        assert new_login_resp.status_code == 200

    @pytest.mark.asyncio
    async def test_reset_password_updates_credentials_from_forgot_password_flow(
        self, client, db
    ):
        user = await make_user(
            db,
            "password.reset@test.com",
            password="CurrentPassword@123",
        )

        forgot_resp = await client.post(
            "/auth/forgot-password",
            json={"email": user.email},
        )
        assert forgot_resp.status_code == 200

        await db.refresh(user)
        assert user.password_reset_token is not None

        reset_resp = await client.post(
            "/auth/reset-password",
            json={
                "token": user.password_reset_token,
                "new_password": "ResetPassword@123",
            },
        )

        assert reset_resp.status_code == 200

        old_login_resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": "CurrentPassword@123"},
        )
        new_login_resp = await client.post(
            "/auth/login",
            json={"email": user.email, "password": "ResetPassword@123"},
        )

        assert old_login_resp.status_code == 401
        assert new_login_resp.status_code == 200

    @pytest.mark.asyncio
    async def test_reset_password_rejects_expired_token(self, client, db):
        user = await make_user(
            db,
            "password.expired@test.com",
            password="CurrentPassword@123",
        )
        user.password_reset_token = "expired-token"
        user.password_reset_expires_at = datetime.now(timezone.utc) - timedelta(
            minutes=5
        )
        await db.commit()

        resp = await client.post(
            "/auth/reset-password",
            json={
                "token": "expired-token",
                "new_password": "AnotherPassword@123",
            },
        )

        assert resp.status_code == 400
