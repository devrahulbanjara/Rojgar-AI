from __future__ import annotations

import asyncio
import subprocess

import httpx
from loguru import logger

from app.core.config import settings


class HFSpaceTranscriptionError(Exception):
    """Raised when the HF Space transcription endpoint cannot satisfy a request."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        is_cold_start: bool = False,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.is_cold_start = is_cold_start


_AUDIO_CONTENT_TYPES: dict[str, str] = {
    "webm": "audio/webm",
    "mp3": "audio/mpeg",
    "mpga": "audio/mpeg",
    "mpeg": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "m4a": "audio/mp4",
    "mp4": "audio/mp4",
}


def _content_type_for(filename: str) -> str:
    """Return the content type for an audio filename."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return _AUDIO_CONTENT_TYPES.get(ext, "application/octet-stream")


_HF_NATIVE_EXTS: frozenset[str] = frozenset({"mp3", "wav", "flac"})


async def _transcode_to_wav(audio_bytes: bytes, src_ext: str) -> bytes:
    """Transcode arbitrary audio bytes to 16 kHz mono WAV via ffmpeg."""
    # Windows selector event loops do not support asyncio subprocess APIs.
    proc = await asyncio.to_thread(
        subprocess.run,
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            "pipe:0",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-f",
            "wav",
            "pipe:1",
        ],
        input=audio_bytes,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0 or not proc.stdout:
        raise HFSpaceTranscriptionError(
            f"Audio transcode (ffmpeg, src={src_ext}) failed: "
            f"{proc.stderr.decode(errors='replace')[:300]}"
        )
    return proc.stdout


class HFSpaceWhisperService:
    """
    Transcription service backed by a self-hosted HF Space running a fine-tuned Whisper model.

    The Space is on a free CPU instance and may sleep when idle, returning 503 on first
    request while it warms up. This wrapper retries with exponential backoff so callers
    see a transparent transcription instead of a cold-start failure.
    """

    async def transcribe_from_bytes(self, audio_bytes: bytes, filename: str) -> str:
        """Transcribe audio bytes via the HF Space, retrying on cold-start failures."""
        url = settings.hf_whisper_url
        timeout = httpx.Timeout(settings.hf_whisper_timeout_seconds)
        delays = list(settings.hf_whisper_retry_delays) or [5]
        max_attempts = max(1, settings.hf_whisper_max_retries)

        headers: dict[str, str] = {}
        if settings.hf_whisper_token:
            headers["Authorization"] = f"Bearer {settings.hf_whisper_token}"

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in _HF_NATIVE_EXTS:
            logger.info(
                f"Transcoding {filename} ({len(audio_bytes)} bytes, ext={ext}) to WAV "
                "before HF Space upload."
            )
            audio_bytes = await _transcode_to_wav(audio_bytes, ext or "unknown")
            base = filename.rsplit(".", 1)[0] if "." in filename else filename
            filename = f"{base}.wav"

        last_error: HFSpaceTranscriptionError | None = None

        for attempt in range(max_attempts):
            try:
                async with httpx.AsyncClient(
                    timeout=timeout, headers=headers
                ) as client:
                    files = {
                        "file": (filename, audio_bytes, _content_type_for(filename)),
                    }
                    response = await client.post(url, files=files)

                if response.status_code == 200:
                    payload = response.json()
                    text = payload.get("text") if isinstance(payload, dict) else None
                    if not isinstance(text, str):
                        raise HFSpaceTranscriptionError(
                            f"HF Space returned an unexpected payload: {str(payload)[:300]}",
                            status_code=response.status_code,
                        )
                    logger.info(
                        f"HF Whisper transcribed {len(text)} chars (attempt {attempt + 1})."
                    )
                    return text

                body_preview = response.text[:500] if response.text else "<empty>"
                logger.warning(
                    f"HF Space returned {response.status_code} on attempt {attempt + 1}. "
                    f"URL={url} filename={filename} bytes={len(audio_bytes)} body={body_preview!r}"
                )

                if response.status_code in (502, 503, 504):
                    last_error = HFSpaceTranscriptionError(
                        f"HF Space cold-start (status {response.status_code}).",
                        status_code=response.status_code,
                        is_cold_start=True,
                    )
                else:
                    raise HFSpaceTranscriptionError(
                        f"HF Space error {response.status_code}: {body_preview}",
                        status_code=response.status_code,
                    )

            except (httpx.ReadTimeout, httpx.ConnectTimeout, httpx.PoolTimeout) as exc:
                last_error = HFSpaceTranscriptionError(
                    f"HF Space request timed out: {exc}",
                    is_cold_start=True,
                )
            except httpx.HTTPError as exc:
                last_error = HFSpaceTranscriptionError(
                    f"HF Space network error: {exc}",
                    is_cold_start=True,
                )

            if attempt < max_attempts - 1:
                delay = delays[min(attempt, len(delays) - 1)]
                logger.warning(
                    f"HF Whisper attempt {attempt + 1} failed "
                    f"({last_error.message if last_error else 'unknown'}). "
                    f"Retrying in {delay}s."
                )
                await asyncio.sleep(delay)

        raise last_error or HFSpaceTranscriptionError(
            "HF Space unavailable after retries — likely cold-start timeout. "
            "Try again in 30 seconds.",
            is_cold_start=True,
        )


whisper_service = HFSpaceWhisperService()
