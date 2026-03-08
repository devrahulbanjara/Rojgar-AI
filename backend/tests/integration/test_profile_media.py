import pytest
from sqlalchemy import select

from app.modules.auth.models import User
from tests.integration.helpers import auth_headers, make_user


class TestProfileAvatarCrud:
    @pytest.mark.asyncio
    async def test_candidate_can_upload_avatar(self, client, db, monkeypatch):
        user = await make_user(db, "avatar_upload@test.com")

        async def fake_upload(_file, folder: str):
            assert folder == "avatars"
            return "https://bucket.s3.us-east-1.amazonaws.com/avatars/avatar.png"

        deleted_urls: list[str] = []

        async def fake_delete(url: str | None):
            if url:
                deleted_urls.append(url)

        monkeypatch.setattr(
            "app.modules.profiles.router.s3_service.upload_image",
            fake_upload,
        )
        monkeypatch.setattr(
            "app.modules.profiles.router.s3_service.delete_image",
            fake_delete,
        )

        resp = await client.patch(
            "/profiles/me/avatar",
            headers=auth_headers(user),
            files={"file": ("avatar.png", b"fake-image", "image/png")},
        )

        assert resp.status_code == 200
        assert resp.json()["data"]["avatar_url"].endswith("/avatars/avatar.png")
        db_user = await db.scalar(select(User).where(User.id == user.id))
        assert db_user is not None
        assert db_user.avatar_url == (
            "https://bucket.s3.us-east-1.amazonaws.com/avatars/avatar.png"
        )
        assert deleted_urls == []

    @pytest.mark.asyncio
    async def test_candidate_can_replace_existing_avatar(self, client, db, monkeypatch):
        user = await make_user(db, "avatar_replace@test.com")
        user.avatar_url = (
            "https://bucket.s3.us-east-1.amazonaws.com/avatars/old-avatar.png"
        )
        await db.commit()

        async def fake_upload(_file, folder: str):
            assert folder == "avatars"
            return "https://bucket.s3.us-east-1.amazonaws.com/avatars/new-avatar.png"

        deleted_urls: list[str] = []

        async def fake_delete(url: str | None):
            if url:
                deleted_urls.append(url)

        monkeypatch.setattr(
            "app.modules.profiles.router.s3_service.upload_image",
            fake_upload,
        )
        monkeypatch.setattr(
            "app.modules.profiles.router.s3_service.delete_image",
            fake_delete,
        )

        resp = await client.patch(
            "/profiles/me/avatar",
            headers=auth_headers(user),
            files={"file": ("avatar.png", b"fake-image", "image/png")},
        )

        assert resp.status_code == 200
        assert deleted_urls == [
            "https://bucket.s3.us-east-1.amazonaws.com/avatars/old-avatar.png"
        ]

    @pytest.mark.asyncio
    async def test_candidate_can_delete_avatar(self, client, db, monkeypatch):
        user = await make_user(db, "avatar_delete@test.com")
        user.avatar_url = (
            "https://bucket.s3.us-east-1.amazonaws.com/avatars/remove-me.png"
        )
        await db.commit()

        deleted_urls: list[str] = []

        async def fake_delete(url: str | None):
            if url:
                deleted_urls.append(url)

        monkeypatch.setattr(
            "app.modules.profiles.router.s3_service.delete_image",
            fake_delete,
        )

        resp = await client.delete(
            "/profiles/me/avatar",
            headers=auth_headers(user),
        )

        assert resp.status_code == 200
        assert deleted_urls == [
            "https://bucket.s3.us-east-1.amazonaws.com/avatars/remove-me.png"
        ]
        db_user = await db.scalar(select(User).where(User.id == user.id))
        assert db_user is not None
        assert db_user.avatar_url is None

    @pytest.mark.asyncio
    async def test_avatar_upload_rejects_unsupported_extension(self, client, db):
        user = await make_user(db, "avatar_extension@test.com")

        resp = await client.patch(
            "/profiles/me/avatar",
            headers=auth_headers(user),
            files={"file": ("avatar.bmp", b"fake-image", "image/bmp")},
        )

        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_avatar_upload_rejects_oversized_file(self, client, db, monkeypatch):
        user = await make_user(db, "avatar_oversize@test.com")
        monkeypatch.setattr(
            "app.integrations.s3.service.settings.s3_max_upload_bytes",
            8,
        )

        resp = await client.patch(
            "/profiles/me/avatar",
            headers=auth_headers(user),
            files={"file": ("avatar.png", b"0123456789", "image/png")},
        )

        assert resp.status_code == 400
