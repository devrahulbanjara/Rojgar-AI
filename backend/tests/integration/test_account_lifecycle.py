from datetime import datetime, timezone
from urllib.parse import parse_qs, urlparse

import pytest

import app.modules.auth.oauth as oauth_mod
from app.core.config import settings
from tests.integration.helpers import TEST_PASSWORD, auth_headers, make_candidate


async def _delete(db, user):
    user.is_deleted = True
    user.deleted_at = datetime.now(timezone.utc)
    await db.flush()


class TestDeletedAccounts:
    async def test_access_token_rejected_after_deletion(self, client, db):
        user = await make_candidate(db, email="gone_token@example.com")
        headers = auth_headers(user.id)
        await _delete(db, user)

        resp = await client.get("/auth/me", headers=headers)

        assert resp.status_code == 401

    async def test_refresh_rejected_after_deletion(self, client, db):
        user = await make_candidate(db, email="gone_refresh@example.com")
        login = await client.post(
            "/auth/login", json={"email": user.email, "password": TEST_PASSWORD}
        )
        assert login.status_code == 200
        await _delete(db, user)

        resp = await client.post("/auth/refresh")
        client.cookies.clear()

        assert resp.status_code == 401

    async def test_refresh_works_with_cookie_only(self, client, db):
        user = await make_candidate(db, email="cookie_only@example.com")
        login = await client.post(
            "/auth/login", json={"email": user.email, "password": TEST_PASSWORD}
        )
        assert login.status_code == 200

        resp = await client.post("/auth/refresh")
        client.cookies.clear()

        assert resp.status_code == 200
        assert resp.json()["data"]["access_token"]


@pytest.fixture
def fake_google(monkeypatch):
    profile = {
        "sub": "google-123",
        "email": "oauth.user@example.com",
        "email_verified": True,
        "name": "OAuth User",
    }

    async def _exchange(code):
        return {"access_token": "google-access"}

    async def _userinfo(token):
        return dict(profile)

    monkeypatch.setattr(oauth_mod, "exchange_google_code", _exchange)
    monkeypatch.setattr(oauth_mod, "get_google_user_info", _userinfo)
    return profile


async def _callback(client):
    client.cookies.set("oauth_state", "csrf-1")
    resp = await client.get(
        "/auth/google/callback",
        params={"code": "abc", "state": "csrf-1"},
        follow_redirects=False,
    )
    return resp


class TestGoogleCallback:
    async def test_login_redirect_carries_no_token(self, client, db, fake_google):
        await make_candidate(db, email=fake_google["email"])

        resp = await _callback(client)

        assert resp.status_code in (302, 307)
        location = resp.headers["location"]
        assert location == f"{settings.frontend_url}/auth/oauth-callback"
        assert "access_token" not in location and "user=" not in location
        assert "refresh_token=" in resp.headers.get("set-cookie", "")
        client.cookies.clear()

    async def test_unverified_google_email_rejected(self, client, db, fake_google):
        await make_candidate(db, email=fake_google["email"])
        fake_google["email_verified"] = False

        resp = await _callback(client)

        query = parse_qs(urlparse(resp.headers["location"]).query)
        assert query.get("error") == ["oauth_failed"]
        assert "refresh_token=" not in resp.headers.get("set-cookie", "")
        client.cookies.clear()

    async def test_deleted_user_cannot_oauth_login(self, client, db, fake_google):
        user = await make_candidate(db, email=fake_google["email"])
        await _delete(db, user)

        resp = await _callback(client)

        query = parse_qs(urlparse(resp.headers["location"]).query)
        assert query.get("error") == ["oauth_failed"]
        client.cookies.clear()


class TestSwaggerLogin:
    async def test_swagger_login_disabled_outside_dev(self, client, db, monkeypatch):
        monkeypatch.setattr(settings, "environment", "prod")
        user = await make_candidate(db, email="swagger@example.com")

        resp = await client.post(
            "/auth/login-swagger",
            data={"username": user.email, "password": TEST_PASSWORD},
        )

        assert resp.status_code == 404
