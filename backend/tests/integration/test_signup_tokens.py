import jwt
from sqlalchemy import select

from app.core.config import settings
from app.core.security import (
    create_pending_signup_token,
    decode_pending_signup_token,
    hash_password,
)
from app.modules.auth.models import User


def _claims(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


class TestVerifyEmailBypass:
    async def test_setup_token_cannot_verify_email(self, client, db):
        signup = await client.post(
            "/auth/signup",
            json={
                "full_name": "Mallory",
                "email": "mallory@victim-corp.com",
                "password": "Password@123",
                "primary_role": "recruiter_admin",
            },
        )
        assert signup.status_code == 201
        setup_token = signup.json()["data"]["setup_token"]

        resp = await client.post("/auth/verify-email", json={"token": setup_token})

        assert resp.status_code == 400
        user = await db.scalar(
            select(User).where(User.email == "mallory@victim-corp.com")
        )
        assert user is None

    async def test_pending_candidate_token_still_verifies(self, client, db):
        token = create_pending_signup_token(
            {
                "type": "pending_candidate",
                "full_name": "Real Person",
                "email": "real.person@example.com",
                "password_hash": hash_password("Password@123"),
                "primary_role": "candidate",
            }
        )

        resp = await client.post("/auth/verify-email", json={"token": token})

        assert resp.status_code == 200
        login = await client.post(
            "/auth/login",
            json={"email": "real.person@example.com", "password": "Password@123"},
        )
        assert login.status_code == 200


class TestPendingTokenSecrecy:
    def test_password_hash_not_readable_in_token(self):
        password_hash = hash_password("Password@123")
        token = create_pending_signup_token(
            {
                "type": "pending_candidate",
                "email": "a@b.com",
                "password_hash": password_hash,
            }
        )

        claims = _claims(token)
        assert "password_hash" not in claims
        assert "argon2" not in token
        assert password_hash not in str(claims)
        assert decode_pending_signup_token(token)["password_hash"] == password_hash

    def test_social_signup_without_password_roundtrips(self):
        token = create_pending_signup_token(
            {"type": "setup", "email": "g@b.com", "password_hash": None}
        )
        assert decode_pending_signup_token(token)["password_hash"] is None


class TestSetupTokenRetry:
    async def test_setup_token_can_retry_company_registration(self, client, db):
        signup = await client.post(
            "/auth/signup",
            json={
                "full_name": "Retry Admin",
                "email": "retry.admin@example.com",
                "password": "Password@123",
                "primary_role": "recruiter_admin",
            },
        )
        setup_token = signup.json()["data"]["setup_token"]
        body = {
            "setup_token": setup_token,
            "company_name": "Retry Co",
            "industry": "Software",
            "company_size": "11-50",
        }

        first = await client.post("/companies/register", json=body)
        second = await client.post("/companies/register", json=body)

        assert first.status_code == second.status_code
        assert first.status_code < 300
        user = await db.scalar(
            select(User).where(User.email == "retry.admin@example.com")
        )
        assert user is None
