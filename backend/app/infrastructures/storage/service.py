"""File storage: local disk in dev/test, Cloudinary in prod.

Two kinds of files:
- Public images (logos, avatars): stored as public Cloudinary images and
  returned as a resized ``f_auto,q_auto`` delivery URL that callers save.
- Private documents (CVs, business papers): stored as ``authenticated`` assets
  and returned as a key. They are only ever opened through a signed download
  URL that expires after a few minutes; there is no permanent URL.

A Cloudinary key is ``cld:{resource_type}:{delivery_type}:{public_id}``; an
image key also ends in ``.{format}``. Keys without the prefix are local files.
"""

import asyncio
import hashlib
import hmac
import io
import re
import time
import uuid
from pathlib import Path
from typing import Any, BinaryIO
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import HTTPException, UploadFile, status
from loguru import logger

from app.core.config import settings

CLOUDINARY_PREFIX = "cld:"
UPLOAD_FAILED = "Upload failed. Please try again later."

# Delivery transforms for public images, by caller folder.
_IMAGE_TRANSFORMS: dict[str, dict[str, Any]] = {
    "logos": {"width": 256, "crop": "limit"},
    "avatars": {"width": 128, "height": 128, "crop": "fill", "gravity": "face"},
}
_DEFAULT_TRANSFORM: dict[str, Any] = {"width": 512, "crop": "limit"}


# Magic-byte signatures -> (canonical extension, content type). The client's
# filename and Content-Type are never trusted: a text/html payload stored as
# ".png" would be served as HTML.
def _sniff_image(head: bytes) -> tuple[str, str] | None:
    if head.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    if head[:6] in (b"GIF87a", b"GIF89a"):
        return "gif", "image/gif"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp", "image/webp"
    return None


async def _read_head(file: UploadFile, size: int = 16) -> bytes:
    await file.seek(0)
    head = await file.read(size)
    await file.seek(0)
    return head


def sign_local_file(file_key: str, expires_in: int) -> str:
    """Query string that lets /files serve a private local file until it expires."""
    expires = int(time.time()) + expires_in
    sig = hmac.new(
        settings.secret_key.encode(), f"{file_key}:{expires}".encode(), hashlib.sha256
    ).hexdigest()
    return f"exp={expires}&sig={sig}"


def verify_local_file(file_key: str, exp: int, sig: str) -> bool:
    if exp < time.time():
        return False
    expected = hmac.new(
        settings.secret_key.encode(), f"{file_key}:{exp}".encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, sig)


def _upload_failed(what: str, exc: Exception) -> HTTPException:
    logger.error("Storage: {} failed: {}: {}", what, type(exc).__name__, exc)
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=UPLOAD_FAILED
    )


def _cloudinary_config() -> Any:
    """SDK config, read from CLOUDINARY_URL (loaded from .env by app.core.config)."""
    config = cloudinary.config()
    if not config.cloud_name:
        cloudinary.reset_config()
        config = cloudinary.config(secure=True)
    if not (config.cloud_name and config.api_key and config.api_secret):
        raise RuntimeError("CLOUDINARY_URL is not set")
    return config


def _parse_key(file_key: str) -> tuple[str, str, str, str]:
    """``cld:`` key -> (resource_type, delivery_type, public_id, format)."""
    resource_type, delivery_type, rest = file_key.removeprefix(CLOUDINARY_PREFIX).split(
        ":", 2
    )
    if resource_type == "image":
        public_id, _, fmt = rest.rpartition(".")
        return resource_type, delivery_type, public_id, fmt
    return resource_type, delivery_type, rest, ""


class StorageService:
    @property
    def local(self) -> bool:
        """Dev and test keep files on disk so they never touch Cloudinary."""
        return settings.effective_storage_backend == "local"

    # ------------------------------------------------------------ local disk

    def _local_path(self, file_key: str) -> Path:
        root = Path(settings.local_storage_dir).resolve()
        path = (root / file_key).resolve()
        if root not in path.parents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Bad file key."
            )
        return path

    async def _local_put(self, body: bytes | BinaryIO, file_key: str) -> None:
        data = body if isinstance(body, bytes) else body.read()
        path = self._local_path(file_key)
        await asyncio.to_thread(path.parent.mkdir, parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, data)

    # ------------------------------------------------------------ cloudinary

    def _public_id(self, folder: str) -> str:
        return f"rojgar/{settings.environment}/{folder}/{uuid.uuid4().hex}"

    async def _cloudinary_upload(self, data: bytes, **options: Any) -> dict:
        _cloudinary_config()
        return await asyncio.to_thread(
            cloudinary.uploader.upload,
            io.BytesIO(data),
            overwrite=False,
            unique_filename=False,
            **options,
        )

    async def _cloudinary_destroy(self, file_key: str) -> None:
        _cloudinary_config()
        resource_type, delivery_type, public_id, _fmt = _parse_key(file_key)
        await asyncio.to_thread(
            cloudinary.uploader.destroy,
            public_id,
            resource_type=resource_type,
            type=delivery_type,
            invalidate=True,
        )

    def _cloudinary_image_key(self, image_url: str) -> str | None:
        """Key of a public image URL this service created, else None."""
        config = _cloudinary_config()
        match = re.fullmatch(
            rf"https://res\.cloudinary\.com/{re.escape(config.cloud_name)}"
            r"/image/upload/(?:[^/]+/)*?v\d+/(rojgar/[^.]+)\.(\w+)",
            image_url,
        )
        if not match:
            return None
        return f"{CLOUDINARY_PREFIX}image:upload:{match[1]}.{match[2]}"

    # ------------------------------------------------------------ public images

    async def upload_image(self, file: UploadFile, folder: str) -> str:
        """Validate and store a public image (logo, avatar); returns its URL."""
        sniffed = _sniff_image(await _read_head(file))
        allowed_extensions = {ext.lower() for ext in settings.image_allowed_extensions}
        if sniffed is None or sniffed[0] not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported image format.",
            )
        extension, _content_type = sniffed

        if self._get_file_size(file) > settings.image_max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image exceeds the {settings.image_max_upload_bytes // (1024 * 1024)}MB limit.",
            )
        await file.seek(0)

        if self.local:
            file_key = f"{folder}/{uuid.uuid4().hex}.{extension}"
            try:
                await self._local_put(file.file, file_key)
            except OSError as exc:
                raise _upload_failed(f"image upload {file_key}", exc) from exc
            return f"{settings.backend_url}/files/{file_key}"

        data = await file.read()
        try:
            result = await self._cloudinary_upload(
                data,
                public_id=self._public_id(folder),
                resource_type="image",
                type="upload",
            )
        except Exception as exc:  # noqa: BLE001 - SDK raises several types
            raise _upload_failed(f"image upload to {folder}", exc) from exc
        transform = _IMAGE_TRANSFORMS.get(folder, _DEFAULT_TRANSFORM)
        url, _ = cloudinary.utils.cloudinary_url(
            result["public_id"],
            resource_type="image",
            type="upload",
            format=result["format"],
            version=result["version"],
            secure=True,
            transformation=[{**transform, "fetch_format": "auto", "quality": "auto"}],
        )
        logger.info("Storage: uploaded image {}", result["public_id"])
        return url

    async def delete_image(self, image_url: str | None) -> None:
        """Best-effort delete of a public image this service stored."""
        if not image_url:
            return
        try:
            if image_url.startswith(f"{settings.backend_url}/files/"):
                key = urlparse(image_url).path.removeprefix("/files/")
                await asyncio.to_thread(self._local_path(key).unlink, missing_ok=True)
            elif image_url.startswith("https://res.cloudinary.com/"):
                key = self._cloudinary_image_key(image_url)
                if key:
                    await self._cloudinary_destroy(key)
        except Exception as exc:  # noqa: BLE001 - never fail the request
            logger.warning(
                "Storage: image delete failed: {}: {}", type(exc).__name__, exc
            )

    def _get_file_size(self, file: UploadFile) -> int:
        """Get file size without consuming the stream."""
        current_position = file.file.tell()
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(current_position)
        return size

    # ------------------------------------------------------------ private documents

    async def upload_private_document(
        self, data: bytes, folder: str, *, extension: str, content_type: str
    ) -> str:
        """Store a validated private document (CV, business paper); returns its key.

        Callers validate the content first. Photos are stored as images, PDFs
        and other documents as raw files; both need a signed URL to open.
        """
        if self.local:
            file_key = f"private/{folder}/{uuid.uuid4().hex}.{extension}"
            try:
                await self._local_put(data, file_key)
            except OSError as exc:
                raise _upload_failed(f"document upload {file_key}", exc) from exc
            return file_key

        is_image = content_type.startswith("image/")
        resource_type = "image" if is_image else "raw"
        public_id = self._public_id(folder)
        if not is_image:
            public_id = f"{public_id}.{extension}"  # raw files keep their extension
        try:
            result = await self._cloudinary_upload(
                data,
                public_id=public_id,
                resource_type=resource_type,
                type="authenticated",
            )
        except Exception as exc:  # noqa: BLE001 - SDK raises several types
            raise _upload_failed(f"document upload to {folder}", exc) from exc
        key = f"{CLOUDINARY_PREFIX}{resource_type}:authenticated:{result['public_id']}"
        if is_image:
            key = f"{key}.{result['format']}"
        logger.info("Storage: uploaded document {}", result["public_id"])
        return key

    async def delete_key(self, file_key: str) -> None:
        """Best-effort delete of one private document by key."""
        try:
            if file_key.startswith(CLOUDINARY_PREFIX):
                await self._cloudinary_destroy(file_key)
            else:
                await asyncio.to_thread(
                    self._local_path(file_key).unlink, missing_ok=True
                )
        except Exception as exc:  # noqa: BLE001 - never fail the request
            logger.warning(
                "Storage: document delete failed: {}: {}", type(exc).__name__, exc
            )

    async def generate_presigned_url(self, file_key: str, expires_in: int = 600) -> str:
        """Short-lived URL for a private document (signing is local, no network)."""
        if not file_key.startswith(CLOUDINARY_PREFIX):
            return f"{settings.backend_url}/files/{file_key}?{sign_local_file(file_key, expires_in)}"
        try:
            _cloudinary_config()
            resource_type, delivery_type, public_id, fmt = _parse_key(file_key)
            return cloudinary.utils.private_download_url(
                public_id,
                fmt,
                resource_type=resource_type,
                type=delivery_type,
                expires_at=int(time.time()) + expires_in,
            )
        except Exception as exc:
            logger.error(
                "Storage: signing failed for a document: {}: {}",
                type(exc).__name__,
                exc,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not open the file. Please try again.",
            ) from exc


storage_service = StorageService()
