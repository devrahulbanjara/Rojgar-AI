import asyncio
import uuid
from urllib.parse import urlparse

import boto3
from botocore.client import BaseClient
from fastapi import HTTPException, UploadFile, status
from loguru import logger

from app.core.config import settings


# Magic-byte signatures -> (canonical extension, content type). The client's
# filename and Content-Type are never trusted: a text/html payload stored as
# ".png" in a public bucket would be served as HTML.
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


def _sniff_audio(head: bytes) -> tuple[str, str] | None:
    if head.startswith(b"\x1a\x45\xdf\xa3"):
        return "webm", "audio/webm"
    if head.startswith(b"OggS"):
        return "ogg", "audio/ogg"
    if head[:4] == b"RIFF" and head[8:12] == b"WAVE":
        return "wav", "audio/wav"
    if head[4:8] == b"ftyp":
        return "m4a", "audio/mp4"
    if head.startswith(b"ID3") or (
        len(head) > 1 and head[0] == 0xFF and (head[1] & 0xE0) == 0xE0
    ):
        return "mp3", "audio/mpeg"
    if head.startswith(b"fLaC"):
        return "flac", "audio/flac"
    return None


async def _read_head(file: UploadFile, size: int = 16) -> bytes:
    await file.seek(0)
    head = await file.read(size)
    await file.seek(0)
    return head


class StorageService:
    def __init__(self) -> None:
        self.bucket = settings.s3_bucket_name
        self._client: BaseClient | None = None

    @property
    def client(self) -> BaseClient:
        """Lazy initialization of S3 client."""
        if self._client is None:
            self._client = boto3.client(
                "s3",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region,
            )
        return self._client

    async def upload_image(self, file: UploadFile, folder: str) -> str:
        """
        Upload image without ACLs. Public access handled by bucket policy.
        """
        sniffed = _sniff_image(await _read_head(file))
        allowed_extensions = {
            ext.lower() for ext in settings.s3_allowed_image_extensions
        }
        if sniffed is None or sniffed[0] not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported image format.",
            )
        extension, content_type = sniffed

        file_size = self._get_file_size(file)
        if file_size > settings.s3_max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image exceeds the {settings.s3_max_upload_bytes // (1024 * 1024)}MB limit.",
            )

        file_key = f"{folder}/{uuid.uuid4()}.{extension}"
        await file.seek(0)

        try:
            await asyncio.to_thread(
                self.client.upload_fileobj,
                file.file,
                self.bucket,
                file_key,
                ExtraArgs={"ContentType": content_type},
            )
        except Exception as exc:
            logger.exception("Storage upload failed for key {}: {}", file_key, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Upload failed. Please try again later.",
            ) from exc

        url = f"{settings.s3_base_url}/{file_key}"
        logger.info("Storage: Uploaded {}", url)
        return url

    async def delete_image(self, image_url: str | None) -> None:
        """
        Delete image from storage. Logs errors but doesn't raise.
        """
        if not image_url:
            return

        file_key = self._extract_key(image_url)
        if not file_key:
            return

        try:
            await asyncio.to_thread(
                self.client.delete_object,
                Bucket=self.bucket,
                Key=file_key,
            )
            logger.info("Storage: Deleted {}", file_key)
        except Exception as exc:
            logger.error("Storage delete failed for key {}: {}", file_key, exc)

    def _extract_key(self, image_url: str) -> str | None:
        """Extract S3 key from full URL."""
        parsed = urlparse(image_url)
        key = parsed.path.lstrip("/")
        return key or None

    def _extract_extension(self, filename: str | None) -> str:
        """Extract file extension from filename."""
        if filename and "." in filename:
            return filename.rsplit(".", 1)[-1].lower()
        return "jpg"

    def _get_file_size(self, file: UploadFile) -> int:
        """Get file size without consuming the stream."""
        current_position = file.file.tell()
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(current_position)
        return size

    async def upload_audio(self, file: UploadFile, folder: str) -> tuple[str, str]:
        """
        Upload audio file. Returns (public_url, s3_key).
        Accepts webm, ogg, wav, mp4/m4a, mp3 and flac, detected from the file
        content. Max 200MB.
        """
        sniffed = _sniff_audio(await _read_head(file))
        if sniffed is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported audio format.",
            )
        extension, content_type = sniffed

        max_bytes = 200 * 1024 * 1024
        file_size = self._get_file_size(file)
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file exceeds 200MB limit.",
            )

        file_key = f"{folder}/{uuid.uuid4()}.{extension}"
        await file.seek(0)

        try:
            await asyncio.to_thread(
                self.client.upload_fileobj,
                file.file,
                self.bucket,
                file_key,
                ExtraArgs={"ContentType": content_type},
            )
        except Exception as exc:
            logger.exception("Audio upload failed for key {}: {}", file_key, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Upload failed. Please try again later.",
            ) from exc

        url = f"{settings.s3_base_url}/{file_key}"
        logger.info("Storage: Uploaded audio {}", url)
        return url, file_key

    async def generate_presigned_url(
        self, file_key: str, expires_in: int = 3600
    ) -> str:
        """Generate a presigned URL for an S3 object."""
        try:
            url = await asyncio.to_thread(
                self.client.generate_presigned_url,
                "get_object",
                Params={"Bucket": self.bucket, "Key": file_key},
                ExpiresIn=expires_in,
            )
            return url
        except Exception as exc:
            logger.error("Failed to generate presigned URL for {}: {}", file_key, exc)
            # Fallback to the public URL pattern just in case
            return f"{settings.s3_base_url}/{file_key}"


storage_service = StorageService()
