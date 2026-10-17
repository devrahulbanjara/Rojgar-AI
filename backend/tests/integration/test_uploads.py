"""Uploads through the Cloudinary backend, with the SDK mocked (no network)."""

from unittest.mock import MagicMock
from urllib.parse import parse_qs, urlparse

import cloudinary
import pytest

from app.core.config import settings
from app.infrastructures.storage import service as storage
from app.infrastructures.storage.service import StorageService, storage_service
from tests.integration.helpers import auth_headers, make_candidate

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


@pytest.fixture
def fake_cloudinary(monkeypatch):
    monkeypatch.setattr(StorageService, "local", property(lambda self: False))
    config = cloudinary.config()
    for name, value in (
        ("cloud_name", "demo-cloud"),
        ("api_key", "123"),
        ("api_secret", "test-secret"),
    ):
        monkeypatch.setattr(config, name, value, raising=False)

    def _upload(file, **options):
        public_id = options["public_id"]
        fmt = "png" if options["resource_type"] == "image" else ""
        return {"public_id": public_id, "format": fmt, "version": 1700000000}

    sdk = MagicMock()
    sdk.upload.side_effect = _upload
    monkeypatch.setattr(storage.cloudinary.uploader, "upload", sdk.upload)
    monkeypatch.setattr(storage.cloudinary.uploader, "destroy", sdk.destroy)
    return sdk


async def test_html_disguised_as_png_rejected(client, db, fake_cloudinary):
    user = await make_candidate(db, email="upload_html@example.com")

    resp = await client.patch(
        "/auth/me/avatar",
        files={"file": ("avatar.png", b"<html><script>x</script></html>", "image/png")},
        headers=auth_headers(user.id),
    )

    assert resp.status_code == 400
    fake_cloudinary.upload.assert_not_called()


async def test_avatar_is_a_public_resized_image(client, db, fake_cloudinary):
    user = await make_candidate(db, email="upload_png@example.com")

    resp = await client.patch(
        "/auth/me/avatar",
        files={"file": ("avatar.gif", PNG, "text/html")},
        headers=auth_headers(user.id),
    )

    assert resp.status_code == 200
    options = fake_cloudinary.upload.call_args.kwargs
    assert options["resource_type"] == "image" and options["type"] == "upload"
    assert options["public_id"].startswith(f"rojgar/{settings.environment}/avatars/")
    url = resp.json()["data"]["avatar_url"]
    assert url.startswith("https://res.cloudinary.com/demo-cloud/image/upload/")
    assert "f_auto" in url and "q_auto" in url and "w_128" in url

    # Replacing the avatar deletes the old one.
    resp = await client.patch(
        "/auth/me/avatar",
        files={"file": ("avatar.png", PNG, "image/png")},
        headers=auth_headers(user.id),
    )
    assert resp.status_code == 200
    public_id = fake_cloudinary.destroy.call_args.args[0]
    assert public_id == options["public_id"]
    assert fake_cloudinary.destroy.call_args.kwargs["type"] == "upload"


async def test_oversized_body_rejected_before_handler(client, db, fake_cloudinary):
    user = await make_candidate(db, email="upload_big@example.com")
    big = PNG + b"\x00" * (16 * 1024 * 1024)

    resp = await client.patch(
        "/auth/me/avatar",
        files={"file": ("avatar.png", big, "image/png")},
        headers=auth_headers(user.id),
    )

    assert resp.status_code == 413
    fake_cloudinary.upload.assert_not_called()


async def test_cv_is_private_and_only_opened_with_an_expiring_link(fake_cloudinary):
    key = await storage_service.upload_private_document(
        b"%PDF-1.4 cv", "cv/biz-1", extension="pdf", content_type="application/pdf"
    )

    options = fake_cloudinary.upload.call_args.kwargs
    assert options["type"] == "authenticated" and options["resource_type"] == "raw"
    assert key.startswith(
        f"cld:raw:authenticated:rojgar/{settings.environment}/cv/biz-1/"
    )
    assert key.endswith(".pdf")

    url = urlparse(await storage_service.generate_presigned_url(key, expires_in=600))
    assert url.netloc == "api.cloudinary.com"
    query = parse_qs(url.query)
    assert query["type"] == ["authenticated"] and "signature" in query
    assert "expires_at" in query

    await storage_service.delete_key(key)
    assert fake_cloudinary.destroy.call_args.kwargs == {
        "resource_type": "raw",
        "type": "authenticated",
        "invalidate": True,
    }


async def test_photo_cv_is_a_private_image(fake_cloudinary):
    key = await storage_service.upload_private_document(
        PNG, "cv/biz-1", extension="png", content_type="image/png"
    )
    assert key.startswith("cld:image:authenticated:") and key.endswith(".png")
    url = await storage_service.generate_presigned_url(key)
    assert "/image/download" in url and "format=png" in url


async def test_upload_error_is_a_plain_message(fake_cloudinary, client, db):
    fake_cloudinary.upload.side_effect = cloudinary.exceptions.Error("boom")
    user = await make_candidate(db, email="upload_fail@example.com")

    resp = await client.patch(
        "/auth/me/avatar",
        files={"file": ("avatar.png", PNG, "image/png")},
        headers=auth_headers(user.id),
    )

    assert resp.status_code == 500
    assert "boom" not in resp.text
