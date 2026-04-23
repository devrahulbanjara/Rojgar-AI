import asyncio
import os
import tempfile
from groq import Groq
from loguru import logger
from app.core.config import settings


class WhisperService:
    """
    Transcription service. Currently backed by Groq whisper-large-v3-turbo.
    """

    async def transcribe_from_bytes(self, audio_bytes: bytes, filename: str) -> str:
        """Transcribe audio bytes without blocking the event loop."""
        return await asyncio.to_thread(self._transcribe_bytes, audio_bytes, filename)

    def _transcribe_bytes(self, audio_bytes: bytes, filename: str) -> str:
        """Write audio bytes to a temp file, transcribe them, and clean up."""

        client = Groq(api_key=settings.groq_api_key)

        suffix = "." + filename.rsplit(".", 1)[-1] if "." in filename else ".webm"

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as f:
                transcription = client.audio.transcriptions.create(
                    file=(filename, f.read()),
                    model="whisper-large-v3-turbo",
                    temperature=0,
                    response_format="verbose_json",
                )
            logger.info("Whisper transcribed: %s chars", len(transcription.text))
            return transcription.text
        finally:
            os.unlink(tmp_path)


whisper_service = WhisperService()
