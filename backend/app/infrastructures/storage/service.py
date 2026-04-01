import asyncio
import uuid
from urllib.parse import urlparse

import boto3
from botocore.client import BaseClient
from fastapi import HTTPException, UploadFile, status
from loguru import logger

from app.core.config import settings


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
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image type.",
            )

        extension = self._extract_extension(file.filename)
        allowed_extensions = {
            ext.lower() for ext in settings.s3_allowed_image_extensions
        }
        if extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported image format.",
            )

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
                ExtraArgs={"ContentType": file.content_type},
            )
        except Exception as exc:
            logger.exception("Storage upload failed for key %s: %s", file_key, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Upload failed. Please try again later.",
            ) from exc

        url = f"{settings.s3_base_url}/{file_key}"
        logger.info("Storage: Uploaded %s", url)
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
            logger.info("Storage: Deleted %s", file_key)
        except Exception as exc:
            logger.error("Storage delete failed for key %s: %s", file_key, exc)

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
        Accepts webm, mp4, ogg, wav, m4a, mpeg, mpga.
        Max 200MB.
        """
        allowed = {"webm", "mp4", "ogg", "wav", "m4a", "mpeg", "mpga"}
        extension = self._extract_extension(file.filename) or "webm"
        if extension not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported audio format.",
            )

        max_bytes = 200 * 1024 * 1024
        file_size = self._get_file_size(file)
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file exceeds 200MB limit.",
            )

        file_key = f"{folder}/{uuid.uuid4()}.{extension}"
        await file.seek(0)

        content_type = file.content_type or f"audio/{extension}"

        try:
            await asyncio.to_thread(
                self.client.upload_fileobj,
                file.file,
                self.bucket,
                file_key,
                ExtraArgs={"ContentType": content_type},
            )
        except Exception as exc:
            logger.exception("Audio upload failed for key %s: %s", file_key, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Upload failed. Please try again later.",
            ) from exc

        url = f"{settings.s3_base_url}/{file_key}"
        logger.info("Storage: Uploaded audio %s", url)
        return url, file_key

    async def generate_presigned_url(self, file_key: str, expires_in: int = 3600) -> str:
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
            logger.error("Failed to generate presigned URL for %s: %s", file_key, exc)
            # Fallback to the public URL pattern just in case
            return f"{settings.s3_base_url}/{file_key}"


storage_service = StorageService()
