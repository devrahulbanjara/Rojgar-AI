from io import BytesIO

import pytest
from botocore.exceptions import ClientError
from fastapi import HTTPException
from fastapi import UploadFile
from starlette.datastructures import Headers

from app.integrations.s3.service import GENERIC_UPLOAD_ERROR, S3Service


class DummyS3Client:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    def upload_fileobj(self, file_obj, bucket, key, ExtraArgs):
        self.calls.append(
            {
                "file_obj": file_obj,
                "bucket": bucket,
                "key": key,
                "extra_args": ExtraArgs,
            }
        )


class FailingS3Client:
    def upload_fileobj(self, file_obj, bucket, key, ExtraArgs):
        raise ClientError(
            {
                "Error": {
                    "Code": "AccessDenied",
                    "Message": "ACLs are disabled for this bucket",
                }
            },
            "PutObject",
        )


async def test_upload_image_marks_objects_public(monkeypatch):
    service = S3Service()
    fake_client = DummyS3Client()

    monkeypatch.setattr("app.integrations.s3.service.settings.s3_bucket_name", "bucket")
    monkeypatch.setattr("app.integrations.s3.service.settings.aws_region", "us-east-1")
    monkeypatch.setattr(
        "app.integrations.s3.service.settings.s3_upload_acl", "public-read"
    )
    monkeypatch.setattr(service, "_client", fake_client)

    upload = UploadFile(
        filename="avatar.png",
        file=BytesIO(b"fake-image-data"),
        headers=Headers({"content-type": "image/png"}),
    )

    url = await service.upload_image(upload, folder="avatars")

    assert url.startswith("https://bucket.s3.us-east-1.amazonaws.com/avatars/")
    assert fake_client.calls[0]["extra_args"] == {
        "ContentType": "image/png",
        "ACL": "public-read",
    }


async def test_upload_image_returns_generic_message_for_acl_failures(monkeypatch):
    service = S3Service()

    monkeypatch.setattr("app.integrations.s3.service.settings.s3_bucket_name", "bucket")
    monkeypatch.setattr("app.integrations.s3.service.settings.aws_region", "us-east-1")
    monkeypatch.setattr(
        "app.integrations.s3.service.settings.s3_upload_acl", "public-read"
    )
    monkeypatch.setattr(service, "_client", FailingS3Client())

    upload = UploadFile(
        filename="avatar.png",
        file=BytesIO(b"fake-image-data"),
        headers=Headers({"content-type": "image/png"}),
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.upload_image(upload, folder="avatars")

    assert exc_info.value.status_code == 500
    assert exc_info.value.detail == GENERIC_UPLOAD_ERROR
