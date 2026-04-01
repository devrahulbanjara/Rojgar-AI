import asyncio
import os
import tempfile

import boto3
import httpx
from loguru import logger

from app.core.config import settings


class WhisperService:
    """
    Calls a Whisper-compatible transcription endpoint.

    Set WHISPER_ENDPOINT_URL in env to point at your hosted model
    (e.g. a SageMaker endpoint, a Replicate deployment, or OpenAI).
    """

    def __init__(self) -> None:
        self.endpoint_url = settings.whisper_endpoint_url
        self.api_key = settings.whisper_api_key

    async def transcribe_from_s3(self, s3_key: str) -> str:
        """Download audio from S3 and send to Whisper endpoint. Returns transcript."""
        audio_bytes = await self._download_from_s3(s3_key)
        transcript = await self._transcribe(audio_bytes, s3_key)
        return transcript

    async def _download_from_s3(self, s3_key: str) -> bytes:
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
        try:
            response = await asyncio.to_thread(
                s3.get_object, Bucket=settings.s3_bucket_name, Key=s3_key
            )
            return await asyncio.to_thread(response["Body"].read)
        except Exception as exc:
            logger.exception(
                "Failed to download audio from S3 key %s: %s", s3_key, exc
            )
            raise

    async def _transcribe(self, audio_bytes: bytes, filename: str) -> str:
        suffix = "." + filename.rsplit(".", 1)[-1] if "." in filename else ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            async with httpx.AsyncClient(timeout=300) as client:
                with open(tmp_path, "rb") as f:
                    response = await client.post(
                        self.endpoint_url,
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        files={"file": (filename, f, "audio/webm")},
                        data={"model": "whisper-1"},
                    )
                response.raise_for_status()
                data = response.json()
                return data.get("text", "")
        finally:
            os.unlink(tmp_path)


whisper_service = WhisperService()
