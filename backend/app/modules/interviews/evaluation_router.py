import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_active_membership
from app.modules.auth.models import User
from app.modules.interviews import evaluation_service
from app.modules.interviews.evaluation_schemas import (
    CombinedEvaluationResponse,
    EvaluationScoreResponse,
    JobEvaluationSchemaResponse,
    SubmitHumanEvaluationRequest,
    UpsertJobEvaluationSchemaRequest,
)

router = APIRouter()


@router.put(
    "/jobs/{job_id}/evaluation-schema",
    response_model=UnifiedResponse[JobEvaluationSchemaResponse],
    summary="Create or update the evaluation schema for a job",
)
async def upsert_job_evaluation_schema(
    job_id: uuid.UUID,
    payload: UpsertJobEvaluationSchemaRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Create or update the evaluation schema for a company job."""
    schema = await evaluation_service.upsert_job_schema(
        db,
        user.id,
        job_id,
        criteria=[criterion.model_dump() for criterion in payload.criteria],
        human_weight=payload.human_weight,
        llm_weight=payload.llm_weight,
    )
    return ResponseBuilder.success(data=schema, message="Evaluation schema saved.")


@router.get(
    "/jobs/{job_id}/evaluation-schema",
    response_model=UnifiedResponse[JobEvaluationSchemaResponse | None],
    summary="Fetch the evaluation schema for a job",
)
async def fetch_job_evaluation_schema(
    job_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Fetch the evaluation schema configured for a company job."""
    schema = await evaluation_service.get_job_schema(db, user.id, job_id)
    return ResponseBuilder.success(data=schema, message="Evaluation schema fetched.")


@router.post(
    "/applications/{application_id}/evaluation/human",
    response_model=UnifiedResponse[EvaluationScoreResponse],
    summary="Submit recruiter evaluation for a candidate",
)
async def submit_human_evaluation(
    application_id: uuid.UUID,
    payload: SubmitHumanEvaluationRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Submit recruiter-provided evaluation scores for an application."""
    score = await evaluation_service.submit_human_score(
        db,
        user.id,
        application_id,
        scores=payload.scores,
        notes=payload.notes,
    )
    return ResponseBuilder.success(data=score, message="Human evaluation saved.")


@router.post(
    "/applications/{application_id}/evaluation/llm",
    response_model=UnifiedResponse[EvaluationScoreResponse],
    summary="Run LLM evaluation for a candidate transcript",
)
async def run_llm_evaluation(
    application_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Run LLM scoring for the latest transcribed interview recording."""
    score = await evaluation_service.run_llm_evaluation(db, user.id, application_id)
    return ResponseBuilder.success(data=score, message="LLM evaluation complete.")


@router.get(
    "/applications/{application_id}/evaluation",
    response_model=UnifiedResponse[CombinedEvaluationResponse],
    summary="Fetch combined human and LLM evaluation for a candidate",
)
async def fetch_combined_evaluation(
    application_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Fetch human, LLM, and blended evaluation results for an application."""
    (
        application,
        schema,
        human,
        llm,
        final_score,
    ) = await evaluation_service.get_combined_evaluation(db, user.id, application_id)
    return ResponseBuilder.success(
        data=CombinedEvaluationResponse(
            application_id=application.id,
            job_id=application.job_id,
            evaluation_schema=JobEvaluationSchemaResponse.model_validate(schema)
            if schema
            else None,
            human=EvaluationScoreResponse.model_validate(human) if human else None,
            llm=EvaluationScoreResponse.model_validate(llm) if llm else None,
            final_score=final_score,
        ),
        message="Evaluation fetched.",
    )
