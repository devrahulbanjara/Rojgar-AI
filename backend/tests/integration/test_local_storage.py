"""Local storage backend: dev/test never write to Cloudinary."""

from urllib.parse import parse_qs, urlparse

import pytest

from app.core.config import settings
from app.infrastructures.storage.service import storage_service


@pytest.fixture(autouse=True)
def _local_storage(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "storage_backend", "local")
    monkeypatch.setattr(settings, "local_storage_dir", str(tmp_path))


def test_only_prod_defaults_to_cloudinary(monkeypatch):
    monkeypatch.setattr(settings, "storage_backend", "")
    monkeypatch.setattr(settings, "environment", "dev")
    assert settings.effective_storage_backend == "local"
    monkeypatch.setattr(settings, "environment", "prod")
    assert settings.effective_storage_backend == "cloudinary"


def test_tests_never_use_cloudinary(monkeypatch):
    monkeypatch.setattr(settings, "storage_backend", "cloudinary")
    monkeypatch.setattr(settings, "environment", "test")
    assert settings.effective_storage_backend == "local"


async def test_private_file_needs_a_valid_signature(client):
    key = await storage_service.upload_private_document(
        b"%PDF-1.4 cv", "cvs", extension="pdf", content_type="application/pdf"
    )
    url = urlparse(await storage_service.generate_presigned_url(key, expires_in=60))

    ok = await client.get(f"{url.path}?{url.query}")
    assert ok.status_code == 200 and ok.content == b"%PDF-1.4 cv"

    sig = parse_qs(url.query)["sig"][0]
    tampered = url.query.replace(sig, "0" * len(sig))
    assert (await client.get(f"{url.path}?{tampered}")).status_code == 403
    assert (await client.get(url.path)).status_code == 403

    await storage_service.delete_key(key)
    assert (await client.get(f"{url.path}?{url.query}")).status_code == 404


async def test_rejects_path_traversal(client):
    response = await client.get("/files/..%2F..%2Fetc%2Fpasswd")
    assert response.status_code in (400, 404)
