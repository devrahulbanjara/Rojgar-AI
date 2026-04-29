from __future__ import annotations

import tempfile
import uuid
from collections.abc import Iterable
from copy import deepcopy
from pathlib import Path
from typing import Literal, cast
from uuid import UUID

from fastapi import BackgroundTasks, HTTPException, UploadFile, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.infrastructures.resume_extraction.service import resume_extraction_service
from app.modules.auth.models import User
from app.modules.profiles import service as profiles_service
from app.modules.profiles.ai_import_schemas import (
    AiImportCommitRequest,
    AiImportCommitResponse,
    AiImportPreviewResponse,
    AiImportTaskStartResponse,
    AiImportTaskStatusResponse,
    ImportedCandidateDocument,
    ResumeTargetOption,
)
from app.modules.profiles.models import ResumeImportTask
from app.modules.profiles.schemas import ProfileUpdate
from app.modules.resumes import service as resumes_service
from app.modules.resumes.schemas import ResumeUpdate
from app.shared.schemas import EducationBase, ExperienceBase, SkillBase


def _dedupe_texts(values: Iterable[str]) -> list[str]:
    """Return unique non-empty strings while preserving order."""
    seen: set[str] = set()
    result: list[str] = []

    for value in values:
        cleaned = value.strip()
        if not cleaned:
            continue
        key = cleaned.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(cleaned)

    return result


def _build_data_schema() -> dict:
    """Build the flattened extraction schema for resume parsing."""
    raw_schema = ImportedCandidateDocument.model_json_schema()
    return _inline_local_refs(raw_schema)


def _inline_local_refs(schema: dict) -> dict:
    """
    Inline local #/$defs references so LlamaExtract receives a simple schema
    without unresolved nested refs.
    """
    schema = deepcopy(schema)
    defs = schema.get("$defs", {})

    def resolve(node):
        if isinstance(node, dict):
            if "$ref" in node:
                ref = node["$ref"]
                if ref.startswith("#/$defs/"):
                    key = ref.split("/")[-1]
                    target = defs.get(key)
                    if target is not None:
                        merged = deepcopy(target)
                        for nested_key, nested_value in node.items():
                            if nested_key != "$ref":
                                merged[nested_key] = resolve(nested_value)
                        return resolve(merged)
                return {key: resolve(value) for key, value in node.items()}

            return {
                key: resolve(value) for key, value in node.items() if key != "$defs"
            }

        if isinstance(node, list):
            return [resolve(item) for item in node]

        return node

    flattened = resolve(schema)
    if not isinstance(flattened, dict):
        raise TypeError(f"Expected dict from schema resolution, got {type(flattened)}")
    flattened.pop("$defs", None)
    flattened["additionalProperties"] = False
    return flattened


def _augment_warnings(data: ImportedCandidateDocument) -> ImportedCandidateDocument:
    """Add derived extraction warnings to imported candidate data."""
    warnings = _dedupe_texts(data.warnings)
    if not data.experiences:
        warnings.append("No work experience was detected.")
    if not data.skills:
        warnings.append("No skills were detected.")
    if not data.linkedin_url:
        warnings.append("No LinkedIn URL was found.")

    return data.model_copy(update={"warnings": _dedupe_texts(warnings)})


async def _list_resume_target_options(
    db: AsyncSession,
    user_id: UUID,
) -> list[ResumeTargetOption]:
    """List resume targets available for an import commit."""
    resume_items = await resumes_service.list_resumes_by_user_id(db, user_id)
    return [
        ResumeTargetOption(id=item.id, resume_name=item.resume_name)
        for item in resume_items
    ]


async def _build_preview_response(
    db: AsyncSession,
    user_id: UUID,
    source_file_name: str,
    extracted: ImportedCandidateDocument,
) -> AiImportPreviewResponse:
    """Build the preview payload returned from resume import."""
    return AiImportPreviewResponse(
        source_file_name=source_file_name,
        extracted_profile=_augment_warnings(extracted),
        available_resume_targets=await _list_resume_target_options(db, user_id),
    )


def _to_profile_update(data: ImportedCandidateDocument) -> ProfileUpdate:
    """Map imported candidate data into a profile update payload."""
    return ProfileUpdate(
        headline=data.headline,
        summary=data.summary,
        phone=data.phone,
        location=data.location,
        linkedin_url=data.linkedin_url,
        github_url=data.github_url,
        portfolio_url=data.portfolio_url,
        years_of_experience=data.years_of_experience,
        target_roles=_dedupe_texts(data.target_roles),
        experiences=[
            ExperienceBase.model_validate(e.model_dump()) for e in data.experiences
        ],
        educations=[
            EducationBase.model_validate(e.model_dump()) for e in data.educations
        ],
        skills=[SkillBase.model_validate(e.model_dump()) for e in data.skills],
    )


def _to_resume_update(
    data: ImportedCandidateDocument,
    resume_name: str | None = None,
) -> ResumeUpdate:
    """Map imported candidate data into a resume update payload."""
    return ResumeUpdate(
        resume_name=resume_name,
        headline=data.headline,
        summary=data.summary,
        phone=data.phone,
        location=data.location,
        linkedin_url=data.linkedin_url,
        github_url=data.github_url,
        portfolio_url=data.portfolio_url,
        years_of_experience=data.years_of_experience,
        experiences=[
            ExperienceBase.model_validate(e.model_dump()) for e in data.experiences
        ],
        educations=[
            EducationBase.model_validate(e.model_dump()) for e in data.educations
        ],
        skills=[SkillBase.model_validate(e.model_dump()) for e in data.skills],
    )


async def preview_profile_from_resume_upload(
    db: AsyncSession,
    user: User,
    file: UploadFile,
) -> AiImportPreviewResponse:
    """Extract and preview profile data from an uploaded resume."""
    extracted = await resume_extraction_service.extract_structured(
        file=file,
        data_schema=_build_data_schema(),
        output_model=ImportedCandidateDocument,
    )
    return await _build_preview_response(
        db=db,
        user_id=user.id,
        source_file_name=file.filename or "resume.pdf",
        extracted=extracted,
    )


async def start_resume_import_task(
    db: AsyncSession,
    user: User,
    file: UploadFile,
    background_tasks: BackgroundTasks,
) -> AiImportTaskStartResponse:
    """Create a background resume-import task and queue extraction."""
    resume_extraction_service.validate_upload(file)

    task = ResumeImportTask(
        id=uuid.uuid4(),
        user_id=user.id,
        status="pending",
        source_file_name=file.filename or "resume.pdf",
    )
    db.add(task)
    await db.commit()

    suffix = Path(task.source_file_name or "resume.pdf").suffix or ".pdf"
    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        prefix=f"resume-import-{task.id}-",
        suffix=suffix,
    )

    try:
        content = await file.read()
        with temp_file:
            temp_file.write(content)
    finally:
        await file.seek(0)

    file_path = Path(temp_file.name)
    background_tasks.add_task(
        _run_resume_import_task,
        task.id,
        user.id,
        file_path,
        task.source_file_name or "resume.pdf",
    )

    logger.info("Queued resume import task '{}' for user '{}'", task.id, user.id)
    return AiImportTaskStartResponse(task_id=task.id, status="pending")


async def get_resume_import_task_status(
    db: AsyncSession,
    user: User,
    task_id: UUID,
) -> AiImportTaskStatusResponse:
    """Return the current state of a resume import task."""
    task = await db.get(ResumeImportTask, task_id)
    if task is None or task.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume import task not found.",
        )

    result = (
        AiImportPreviewResponse.model_validate(task.result_data)
        if task.result_data is not None
        else None
    )
    return AiImportTaskStatusResponse(
        task_id=task.id,
        status=cast(
            Literal["pending", "processing", "completed", "failed"], task.status
        ),
        source_file_name=task.source_file_name,
        result=result,
        error=task.error_message,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


async def _run_resume_import_task(
    task_id: UUID,
    user_id: UUID,
    file_path: Path,
    source_file_name: str,
) -> None:
    """Run the asynchronous resume extraction job for one task."""
    try:
        async with AsyncSessionLocal() as db:
            task = await db.get(ResumeImportTask, task_id)
            if task is None:
                return

            task.status = "processing"
            task.error_message = None
            await db.commit()

            try:
                extracted = (
                    await resume_extraction_service.extract_structured_from_path(
                        file_path=file_path,
                        source_file_name=source_file_name,
                        data_schema=_build_data_schema(),
                        output_model=ImportedCandidateDocument,
                    )
                )
                preview = await _build_preview_response(
                    db=db,
                    user_id=user_id,
                    source_file_name=source_file_name,
                    extracted=extracted,
                )
                task.status = "completed"
                task.result_data = preview.model_dump(mode="json")
                task.error_message = None
                logger.info("Completed resume import task '{}'", task_id)
            except HTTPException as exc:
                task.status = "failed"
                task.result_data = None
                task.error_message = str(exc.detail)
                logger.warning(
                    "Resume import task '{}' failed with handled error: {}",
                    task_id,
                    exc.detail,
                )
            except Exception as exc:  # pragma: no cover - defensive guard
                task.status = "failed"
                task.result_data = None
                task.error_message = "We could not parse that resume right now."
                logger.exception(
                    "Resume import task '{}' failed unexpectedly: {}",
                    task_id,
                    str(exc),
                )

            await db.commit()
    finally:
        file_path.unlink(missing_ok=True)


async def commit_profile_from_ai_import(
    db: AsyncSession,
    user: User,
    payload: AiImportCommitRequest,
) -> AiImportCommitResponse:
    """Apply imported data to the requested profile or resume target."""
    if payload.action == "update_profile":
        updated = await profiles_service.update_profile(
            db,
            user,
            _to_profile_update(payload.data),
        )
        return AiImportCommitResponse(
            target_type="profile",
            target_id=updated.id,
            profile=updated,
            resume=None,
        )

    if payload.action == "create_resume":
        if not payload.resume_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="resume_name is required when action=create_resume.",
            )

        created = await resumes_service.create_resume_from_import(
            db,
            user,
            payload.resume_name,
            _to_resume_update(payload.data, resume_name=payload.resume_name),
        )
        return AiImportCommitResponse(
            target_type="resume",
            target_id=created.id,
            profile=None,
            resume=created,
        )

    if payload.action == "update_resume":
        if not payload.resume_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="resume_id is required when action=update_resume.",
            )

        updated = await resumes_service.update_resume(
            db,
            user,
            str(payload.resume_id),
            _to_resume_update(payload.data),
        )
        return AiImportCommitResponse(
            target_type="resume",
            target_id=updated.id,
            profile=None,
            resume=updated,
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported action.",
    )
