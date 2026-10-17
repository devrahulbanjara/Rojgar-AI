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


class TestVerifyEmail:
    async def test_signup_returns_no_token_and_creates_no_user(self, client, db):
        signup = await client.post(
            "/auth/signup",
            json={
                "full_name": "Mallory",
                "email": "mallory@victim-corp.com",
                "password": "Password@123",
            },
        )

        assert signup.status_code == 201
        assert signup.json()["data"] is None
        user = await db.scalar(
            select(User).where(User.email == "mallory@victim-corp.com")
        )
        assert user is None

    async def test_other_token_types_cannot_verify(self, client, db):
        token = create_pending_signup_token(
            {"type": "setup", "full_name": "X", "email": "x@example.com"}
        )

        resp = await client.post("/auth/verify-email", json={"token": token})

        assert resp.status_code == 400

    async def test_pending_person_token_verifies(self, client, db):
        token = create_pending_signup_token(
            {
                "type": "pending_person",
                "full_name": "Real Person",
                "email": "real.person@example.com",
                "password_hash": hash_password("Password@123"),
            }
        )

        resp = await client.post("/auth/verify-email", json={"token": token})

        assert resp.status_code == 200
        login = await client.post(
            "/auth/login",
            json={"email": "real.person@example.com", "password": "Password@123"},
        )
        assert login.status_code == 200
        user = login.json()["data"]["user"]
        assert user["memberships"] == [] and user["active_business"] is None


class TestPendingTokenSecrecy:
    def test_password_hash_not_readable_in_token(self):
        password_hash = hash_password("Password@123")
        token = create_pending_signup_token(
            {
                "type": "pending_person",
                "email": "a@b.com",
                "password_hash": password_hash,
            }
        )

        claims = _claims(token)
        assert "password_hash" not in claims
        assert "argon2" not in token
        assert password_hash not in str(claims)
        assert decode_pending_signup_token(token)["password_hash"] == password_hash

    def test_signup_without_password_roundtrips(self):
        token = create_pending_signup_token(
            {"type": "pending_person", "email": "g@b.com", "password_hash": None}
        )
        assert decode_pending_signup_token(token)["password_hash"] is None
