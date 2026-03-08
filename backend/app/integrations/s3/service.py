from __future__ import annotations

import asyncio
import uuid
from urllib.parse import urlparse

import boto3
from botocore.client import BaseClient
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status
from loguru import logger

from app.core.config import settings


GENERIC_UPLOAD_ERROR = (
    "Image upload is temporarily unavailable. Please try again later."
)
GENERIC_DELETE_ERROR = "Image deletion failed in storage."


class S3Service:
    def __init__(self) -> None:
        self.bucket = settings.s3_bucket_name
        self._client: BaseClient | None = None

    @property
    def client(self) -> BaseClient:
        if self._client is None:
            if not settings.aws_access_key_id or not settings.aws_secret_access_key:
                logger.error(
                    "S3 client initialization failed: credentials are not configured"
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=GENERIC_UPLOAD_ERROR,
                )
            if not self.bucket:
                logger.error(
                    "S3 client initialization failed: bucket is not configured"
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=GENERIC_UPLOAD_ERROR,
                )

            self._client = boto3.client(
                "s3",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region,
            )
        return self._client

    async def upload_image(self, file: UploadFile, folder: str) -> str:
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
        extra_args = {"ContentType": file.content_type}
        if settings.s3_upload_acl:
            extra_args["ACL"] = settings.s3_upload_acl

        try:
            await asyncio.to_thread(
                self.client.upload_fileobj,
                file.file,
                self.bucket,
                file_key,
                ExtraArgs=extra_args,
            )
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if error_code in {"AccessControlListNotSupported", "AccessDenied"}:
                logger.exception(
                    "S3 upload rejected bucket access for key %s (code=%s)",
                    file_key,
                    error_code,
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=GENERIC_UPLOAD_ERROR,
                ) from exc
            logger.exception("S3 upload failed for key %s", file_key)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=GENERIC_UPLOAD_ERROR,
            ) from exc
        except Exception as exc:  # pragma: no cover - boto3 exception types vary
            logger.exception("S3 upload failed for key %s", file_key)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=GENERIC_UPLOAD_ERROR,
            ) from exc

        url = f"{settings.s3_base_url}/{file_key}"
        logger.info("Uploaded image to S3: %s", url)
        return url

    async def delete_image(self, image_url: str | None) -> None:
        file_key = self._extract_key(image_url)
        if not file_key:
            return

        try:
            await asyncio.to_thread(
                self.client.delete_object,
                Bucket=self.bucket,
                Key=file_key,
            )
            logger.info("Deleted image from S3: %s", file_key)
        except Exception:  # pragma: no cover - boto3 exception types vary
            logger.exception("S3 delete failed for key %s", file_key)

    def _extract_key(self, image_url: str | None) -> str | None:
        if not image_url:
            return None

        base_url = settings.s3_base_url
        if base_url and image_url.startswith(f"{base_url}/"):
            return image_url.replace(f"{base_url}/", "", 1)

        parsed = urlparse(image_url)
        key = parsed.path.lstrip("/")
        return key or None

    def _extract_extension(self, filename: str | None) -> str:
        if filename and "." in filename:
            return filename.rsplit(".", 1)[-1].lower()
        return ""

    def _get_file_size(self, file: UploadFile) -> int:
        current_position = file.file.tell()
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(current_position)
        return size
