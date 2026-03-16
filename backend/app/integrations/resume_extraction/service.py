from __future__ import annotations

import tempfile
from pathlib import Path
from typing import TypeVar

from fastapi import HTTPException, UploadFile, status
from loguru import logger
from pydantic import BaseModel

from app.core.config import settings


SchemaT = TypeVar("SchemaT", bound=BaseModel)


class ResumeExtractionService:
    """
    Thin wrapper around LlamaExtract so the rest of the app stays vendor-agnostic.
    """

    def __init__(self) -> None:
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client

        if not settings.llama_cloud_api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="LLAMA_CLOUD_API_KEY is not configured.",
            )

        try:
            from llama_cloud_services import LlamaExtract
        except Exception as exc:
            logger.exception("Llama Cloud Services dependency missing.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="llama-cloud-services is not installed.",
            ) from exc

        kwargs = {"api_key": settings.llama_cloud_api_key}
        if settings.llama_cloud_base_url:
            kwargs["base_url"] = settings.llama_cloud_base_url

        self._client = LlamaExtract(**kwargs)
        return self._client

    def validate_upload(self, file: UploadFile) -> None:
        filename = file.filename or ""
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if extension != "pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF resumes are supported.",
            )

        current_position = file.file.tell()
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(current_position)

        if size <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        if size > settings.resume_import_max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume file is too large.",
            )

    def _build_extract_config(self):
        try:
            from llama_cloud import ExtractConfig
        except Exception as exc:
            logger.exception("Llama Cloud dependency missing.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="llama-cloud is not installed.",
            ) from exc

        return ExtractConfig(
            extraction_target="PER_DOC",
            extraction_mode=settings.llama_extract_mode.upper(),
            parse_model=settings.llama_extract_parse_model,
            extract_model=settings.llama_extract_model,
            multimodal_fast_mode=False,
            system_prompt=None,
            use_reasoning=True,
            citation_bbox=False,
            confidence_scores=False,
            chunk_mode="PAGE",
            high_resolution_mode=False,
            invalidate_cache=False,
            num_pages_context=None,
            page_range=None,
            cite_sources=True,
        )

    async def extract_structured(
        self,
        file: UploadFile,
        data_schema: dict,
        output_model: type[SchemaT],
    ) -> SchemaT:
        self.validate_upload(file)
        client = self._get_client()
        config = self._build_extract_config()

        temp_path: Path | None = None

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                temp_path = Path(temp_file.name)
                content = await file.read()
                temp_file.write(content)

            logger.info(
                "Starting LlamaExtract structured resume extraction for file='{}' mode='{}'",
                file.filename or "resume.pdf",
                settings.llama_extract_mode.upper(),
            )
            result = client.extract(data_schema, config, str(temp_path))
            raw = result.data if hasattr(result, "data") else result
            parsed = output_model.model_validate(raw)
            logger.info(
                "LlamaExtract structured resume extraction succeeded for file='{}'",
                file.filename or "resume.pdf",
            )
            return parsed
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception(
                "LlamaExtract resume extraction failed for file='{}': {}",
                file.filename or "resume.pdf",
                str(exc),
            )
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract structured data from the uploaded resume.",
            ) from exc
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)
            await file.seek(0)


resume_extraction_service = ResumeExtractionService()
