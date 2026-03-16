from __future__ import annotations

from collections.abc import Iterable
from copy import deepcopy

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.resume_extraction.service import resume_extraction_service
from app.modules.auth.models import User
from app.modules.profiles import service as profiles_service
from app.modules.profiles.ai_import_schemas import (
    AiImportCommitRequest,
    AiImportCommitResponse,
    AiImportPreviewResponse,
    ImportedCandidateDocument,
    ResumeTargetOption,
)
from app.modules.profiles.schemas import ProfileUpdate
from app.modules.resumes import service as resumes_service
from app.modules.resumes.schemas import ResumeUpdate


def _dedupe_texts(values: Iterable[str]) -> list[str]:
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
    if isinstance(flattened, dict):
        flattened.pop("$defs", None)
        flattened["additionalProperties"] = False
    return flattened


def _augment_warnings(data: ImportedCandidateDocument) -> ImportedCandidateDocument:
    warnings = _dedupe_texts(data.warnings)
    if not data.experiences:
        warnings.append("No work experience was detected.")
    if not data.skills:
        warnings.append("No skills were detected.")
    if not data.linkedin_url:
        warnings.append("No LinkedIn URL was found.")

    return data.model_copy(update={"warnings": _dedupe_texts(warnings)})


def _to_profile_update(data: ImportedCandidateDocument) -> ProfileUpdate:
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
        experiences=list(data.experiences),
        educations=list(data.educations),
        skills=list(data.skills),
    )


def _to_resume_update(
    data: ImportedCandidateDocument,
    resume_name: str | None = None,
) -> ResumeUpdate:
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
        experiences=list(data.experiences),
        educations=list(data.educations),
        skills=list(data.skills),
    )


async def preview_profile_from_resume_upload(
    db: AsyncSession,
    user: User,
    file: UploadFile,
) -> AiImportPreviewResponse:
    extracted = await resume_extraction_service.extract_structured(
        file=file,
        data_schema=_build_data_schema(),
        output_model=ImportedCandidateDocument,
    )
    extracted = _augment_warnings(extracted)

    resumes = await resumes_service.list_resumes(db, user)
    return AiImportPreviewResponse(
        source_file_name=file.filename or "resume.pdf",
        extracted_profile=extracted,
        available_resume_targets=[
            ResumeTargetOption(id=item.id, resume_name=item.resume_name)
            for item in resumes
        ],
    )


async def commit_profile_from_ai_import(
    db: AsyncSession,
    user: User,
    payload: AiImportCommitRequest,
) -> AiImportCommitResponse:
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
