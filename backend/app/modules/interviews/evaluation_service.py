from __future__ import annotations

import json
import uuid

from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructures.ai.service import ai_service
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import CompanyMembership
from app.modules.interviews.evaluation_models import (
    CandidateEvaluationScore,
    JobEvaluationSchema,
)
from app.modules.interviews.recording_model import InterviewRecording
from app.modules.jobs.models import Job
from app.shared.enums import RecordingStatus


async def _get_company_membership(
    db: AsyncSession, recruiter_user_id: uuid.UUID
) -> CompanyMembership:
    """Return the recruiter's active company membership or raise 403."""
    result = await db.execute(
        select(CompanyMembership).where(
            CompanyMembership.user_id == recruiter_user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(
            status_code=403, detail="Active company membership required."
        )
    return membership


async def _get_job_for_company(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    job_id: uuid.UUID,
) -> Job:
    """Return a company-owned job visible to the recruiter."""
    membership = await _get_company_membership(db, recruiter_user_id)
    result = await db.execute(
        select(Job).where(Job.id == job_id, Job.company_id == membership.company_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


async def _get_application_for_company(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    application_id: uuid.UUID,
) -> Application:
    """Return a company-owned application visible to the recruiter."""
    membership = await _get_company_membership(db, recruiter_user_id)
    result = await db.execute(
        select(Application)
        .join(Job, Job.id == Application.job_id)
        .where(
            Application.id == application_id,
            Job.company_id == membership.company_id,
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    return application


async def upsert_job_schema(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    job_id: uuid.UUID,
    *,
    criteria: list[dict],
    human_weight: float,
    llm_weight: float,
) -> JobEvaluationSchema:
    """Create or update the evaluation schema for a job."""
    await _get_job_for_company(db, recruiter_user_id, job_id)

    result = await db.execute(
        select(JobEvaluationSchema).where(JobEvaluationSchema.job_id == job_id)
    )
    schema = result.scalar_one_or_none()

    if schema:
        schema.criteria = criteria
        schema.human_weight = human_weight
        schema.llm_weight = llm_weight
        schema.version += 1
    else:
        schema = JobEvaluationSchema(
            job_id=job_id,
            criteria=criteria,
            human_weight=human_weight,
            llm_weight=llm_weight,
        )
        db.add(schema)

    await db.commit()
    await db.refresh(schema)
    return schema


async def get_job_schema(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    job_id: uuid.UUID,
) -> JobEvaluationSchema | None:
    """Fetch the evaluation schema for a job after access checks."""
    await _get_job_for_company(db, recruiter_user_id, job_id)
    result = await db.execute(
        select(JobEvaluationSchema).where(JobEvaluationSchema.job_id == job_id)
    )
    return result.scalar_one_or_none()


async def submit_human_score(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    application_id: uuid.UUID,
    *,
    scores: dict[str, float],
    notes: str | None,
) -> CandidateEvaluationScore:
    """Persist recruiter-provided evaluation scores for an application."""
    application = await _get_application_for_company(
        db, recruiter_user_id, application_id
    )
    schema = await _get_schema_or_400(db, application.job_id)
    validated_scores = _coerce_scores(scores, schema.criteria)
    weighted_total = _compute_weighted_total(validated_scores, schema.criteria)

    result = await db.execute(
        select(CandidateEvaluationScore).where(
            CandidateEvaluationScore.application_id == application.id,
            CandidateEvaluationScore.evaluator_type == "human",
        )
    )
    row = result.scalar_one_or_none()

    if row:
        row.job_id = application.job_id
        row.schema_id = schema.id
        row.schema_version = schema.version
        row.scores = validated_scores
        row.criteria_snapshot = schema.criteria
        row.notes = notes.strip() if notes else None
        row.weighted_total = weighted_total
        row.submitted_by_user_id = recruiter_user_id
    else:
        row = CandidateEvaluationScore(
            application_id=application.id,
            job_id=application.job_id,
            schema_id=schema.id,
            schema_version=schema.version,
            evaluator_type="human",
            scores=validated_scores,
            criteria_snapshot=schema.criteria,
            notes=notes.strip() if notes else None,
            weighted_total=weighted_total,
            submitted_by_user_id=recruiter_user_id,
        )
        db.add(row)

    await db.commit()
    await db.refresh(row)
    return row


async def run_llm_evaluation(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    application_id: uuid.UUID,
) -> CandidateEvaluationScore:
    """Generate and persist LLM evaluation scores from a transcript."""
    application = await _get_application_for_company(
        db, recruiter_user_id, application_id
    )
    schema = await _get_schema_or_400(db, application.job_id)

    result = await db.execute(
        select(InterviewRecording)
        .where(
            InterviewRecording.application_id == application.id,
            InterviewRecording.status.in_(
                [RecordingStatus.transcribed, RecordingStatus.evaluated]
            ),
            InterviewRecording.transcript.is_not(None),
        )
        .order_by(InterviewRecording.created_at.desc())
        .limit(1)
    )
    recording = result.scalar_one_or_none()
    if not recording or not recording.transcript:
        raise HTTPException(
            status_code=400,
            detail="Transcript must exist before running LLM evaluation.",
        )

    criteria_lines = "\n".join(
        f"- {criterion['label']} (key: {criterion['key']}, max_score: {criterion['max_score']})"
        for criterion in schema.criteria
    )
    prompt = (
        "You are an expert interviewer evaluator.\n"
        "Review the transcript and score the candidate against the exact schema below.\n"
        "Return one JSON object with this shape only:\n"
        '{"scores":{"criterion_key":number},"notes":"short summary"}\n'
        "Rules:\n"
        "- Use every criterion key exactly once.\n"
        "- Keep scores within 0 and the provided max_score.\n"
        "- notes must be short plain text.\n"
        "- Do not include markdown.\n\n"
        f"Criteria:\n{criteria_lines}\n\n"
        f"Transcript:\n{recording.transcript}"
    )

    try:
        chunks: list[str] = []
        async for chunk in ai_service.stream_text(
            system_prompt=prompt,
            user_payload={"application_id": str(application.id)},
            temperature=0.1,
        ):
            chunks.append(chunk)
        payload = json.loads("".join(chunks).strip())
    except Exception as exc:
        logger.exception(
            "LLM evaluation failed for application %s: %s", application.id, exc
        )
        raise HTTPException(status_code=500, detail="LLM evaluation failed.") from exc

    raw_scores = payload.get("scores") if isinstance(payload, dict) else None
    if not isinstance(raw_scores, dict):
        raise HTTPException(
            status_code=500, detail="LLM evaluation returned invalid scores."
        )

    validated_scores = _coerce_scores(raw_scores, schema.criteria)
    weighted_total = _compute_weighted_total(validated_scores, schema.criteria)
    notes = payload.get("notes") if isinstance(payload, dict) else None
    llm_notes = notes.strip() if isinstance(notes, str) and notes.strip() else None

    result = await db.execute(
        select(CandidateEvaluationScore).where(
            CandidateEvaluationScore.application_id == application.id,
            CandidateEvaluationScore.evaluator_type == "llm",
        )
    )
    row = result.scalar_one_or_none()

    if row:
        row.job_id = application.job_id
        row.schema_id = schema.id
        row.schema_version = schema.version
        row.scores = validated_scores
        row.criteria_snapshot = schema.criteria
        row.notes = llm_notes
        row.weighted_total = weighted_total
    else:
        row = CandidateEvaluationScore(
            application_id=application.id,
            job_id=application.job_id,
            schema_id=schema.id,
            schema_version=schema.version,
            evaluator_type="llm",
            scores=validated_scores,
            criteria_snapshot=schema.criteria,
            notes=llm_notes,
            weighted_total=weighted_total,
        )
        db.add(row)

    await db.commit()
    await db.refresh(row)
    return row


async def get_combined_evaluation(
    db: AsyncSession,
    recruiter_user_id: uuid.UUID,
    application_id: uuid.UUID,
) -> tuple[
    Application,
    JobEvaluationSchema | None,
    CandidateEvaluationScore | None,
    CandidateEvaluationScore | None,
    float | None,
]:
    """Return application evaluation artifacts and the blended final score."""
    application = await _get_application_for_company(
        db, recruiter_user_id, application_id
    )

    schema_result = await db.execute(
        select(JobEvaluationSchema).where(
            JobEvaluationSchema.job_id == application.job_id
        )
    )
    schema = schema_result.scalar_one_or_none()

    rows = (
        await db.execute(
            select(CandidateEvaluationScore).where(
                CandidateEvaluationScore.application_id == application.id
            )
        )
    ).scalars()
    human = None
    llm = None
    for row in rows:
        if row.evaluator_type == "human":
            human = row
        elif row.evaluator_type == "llm":
            llm = row

    final_score = _compute_final_score(human, llm, schema)
    return application, schema, human, llm, final_score


async def _get_schema_or_400(
    db: AsyncSession, job_id: uuid.UUID
) -> JobEvaluationSchema:
    """Return a job schema or raise a 400 error if none exists."""
    result = await db.execute(
        select(JobEvaluationSchema).where(JobEvaluationSchema.job_id == job_id)
    )
    schema = result.scalar_one_or_none()
    if not schema:
        raise HTTPException(
            status_code=400, detail="No evaluation schema defined for this job."
        )
    return schema


def _coerce_scores(
    scores: dict[str, float] | dict[str, int],
    criteria: list[dict],
) -> dict[str, float]:
    """Validate and clamp submitted scores against the schema criteria."""
    normalized: dict[str, float] = {}
    allowed_keys = {criterion["key"] for criterion in criteria}

    extra_keys = set(scores.keys()) - allowed_keys
    if extra_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Unexpected score keys: {', '.join(sorted(extra_keys))}.",
        )

    for criterion in criteria:
        key = criterion["key"]
        max_score = float(criterion["max_score"])
        if key not in scores:
            raise HTTPException(status_code=400, detail=f"Missing score for '{key}'.")
        try:
            value = float(scores[key])
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=400, detail=f"Invalid score for '{key}'."
            ) from exc
        normalized[key] = max(0.0, min(value, max_score))

    return normalized


def _compute_weighted_total(scores: dict[str, float], criteria: list[dict]) -> float:
    """Compute the weighted normalized total for one evaluator."""
    total_weight = sum(float(criterion["weight"]) for criterion in criteria)
    if total_weight <= 0:
        return 0.0

    weighted_sum = 0.0
    for criterion in criteria:
        key = criterion["key"]
        max_score = float(criterion["max_score"])
        weight = float(criterion["weight"])
        value = float(scores.get(key, 0))
        normalized = (value / max_score) * 100 if max_score > 0 else 0
        weighted_sum += normalized * (weight / total_weight)

    return round(weighted_sum, 2)


def _compute_final_score(
    human: CandidateEvaluationScore | None,
    llm: CandidateEvaluationScore | None,
    schema: JobEvaluationSchema | None,
) -> float | None:
    """Blend human and LLM totals using the schema weights."""
    if not schema:
        return None

    available_weights = 0.0
    blended_total = 0.0

    if human and human.weighted_total is not None:
        available_weights += schema.human_weight
        blended_total += human.weighted_total * schema.human_weight

    if llm and llm.weighted_total is not None:
        available_weights += schema.llm_weight
        blended_total += llm.weighted_total * schema.llm_weight

    if available_weights <= 0:
        return None

    return round(blended_total / available_weights, 2)
