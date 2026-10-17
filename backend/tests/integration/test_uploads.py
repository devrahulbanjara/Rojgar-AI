from unittest.mock import MagicMock

import pytest

from app.infrastructures.storage.service import storage_service
from tests.integration.helpers import auth_headers, make_candidate

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


@pytest.fixture
def fake_s3(monkeypatch):
    client = MagicMock()
    monkeypatch.setattr(storage_service, "_client", client)
    return client


async def test_html_disguised_as_png_rejected(client, db, fake_s3):
    user = await make_candidate(db, email="upload_html@example.com")

    resp = await client.patch(
        "/auth/me/avatar",
        files={"file": ("avatar.png", b"<html><script>x</script></html>", "image/png")},
        headers=auth_headers(user.id),
    )

    assert resp.status_code == 400
    fake_s3.upload_fileobj.assert_not_called()


async def test_content_type_set_from_bytes_not_client(client, db, fake_s3):
    user = await make_candidate(db, email="upload_png@example.com")

    resp = await client.patch(
        "/auth/me/avatar",
        files={"file": ("avatar.gif", PNG, "text/html")},
        headers=auth_headers(user.id),
    )

    assert resp.status_code == 200
    _, _, key = fake_s3.upload_fileobj.call_args.args
    extra = fake_s3.upload_fileobj.call_args.kwargs["ExtraArgs"]
    assert extra["ContentType"] == "image/png"
    assert key.endswith(".png")


async def test_oversized_body_rejected_before_handler(client, db, fake_s3):
    user = await make_candidate(db, email="upload_big@example.com")
    big = PNG + b"\x00" * (16 * 1024 * 1024)

    resp = await client.patch(
        "/auth/me/avatar",
        files={"file": ("avatar.png", big, "image/png")},
        headers=auth_headers(user.id),
    )

    assert resp.status_code == 413
    fake_s3.upload_fileobj.assert_not_called()
