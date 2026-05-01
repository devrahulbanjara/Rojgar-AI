import uuid

from fastapi import APIRouter, Depends, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.auth.dependencies import require_active_membership
from app.modules.auth.models import User
from app.modules.interviews import evaluation_service
from app.modules.interviews.evaluation_schemas import (
    CombinedEvaluationResponse,
    EvaluationScoreResponse,
    EvaluatorIdentity,
    HumanAverageResponse,
    HumanEvaluatorScoreResponse,
    JobEvaluationSchemaResponse,
    SubmitHumanEvaluationRequest,
    UpdateHumanEvaluationRequest,
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
    summary="Add a recruiter evaluation row for a candidate",
)
async def create_human_evaluation(
    application_id: uuid.UUID,
    payload: SubmitHumanEvaluationRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Create a new free-form recruiter evaluation row for an application."""
    score = await evaluation_service.create_human_score(
        db,
        user.id,
        application_id,
        evaluator_label=payload.evaluator_label,
        scores=payload.scores,
        notes=payload.notes,
    )
    return ResponseBuilder.success(data=score, message="Recruiter evaluation added.")


@router.patch(
    "/applications/{application_id}/evaluation/human/{score_id}",
    response_model=UnifiedResponse[EvaluationScoreResponse],
    summary="Update a recruiter evaluation row",
)
async def update_human_evaluation(
    application_id: uuid.UUID,
    score_id: uuid.UUID,
    payload: UpdateHumanEvaluationRequest,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing recruiter evaluation row by id."""
    score = await evaluation_service.update_human_score(
        db,
        user.id,
        application_id,
        score_id,
        evaluator_label=payload.evaluator_label,
        scores=payload.scores,
        notes=payload.notes,
    )
    return ResponseBuilder.success(data=score, message="Recruiter evaluation updated.")


@router.delete(
    "/applications/{application_id}/evaluation/human/{score_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a recruiter evaluation row",
)
async def delete_human_evaluation(
    application_id: uuid.UUID,
    score_id: uuid.UUID,
    user: User = Depends(require_active_membership),
    db: AsyncSession = Depends(get_db),
):
    """Delete a recruiter evaluation row by id."""
    await evaluation_service.delete_human_score(db, user.id, application_id, score_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    """Fetch human submissions, the human average, the LLM row, and the blended final."""
    (
        application,
        schema,
        humans,
        human_aggregate,
        llm,
        final_score,
    ) = await evaluation_service.get_combined_evaluation(db, user.id, application_id)

    user_pairs = await evaluation_service.list_humans_with_users(db, application.id)
    user_by_score_id = {score.id: submitter for score, submitter in user_pairs}

    human_responses: list[HumanEvaluatorScoreResponse] = []
    for row in humans:
        submitter = user_by_score_id.get(row.id)
        identity = (
            EvaluatorIdentity(
                id=submitter.id,
                full_name=submitter.full_name,
                email=submitter.email,
                avatar_url=submitter.avatar_url,
            )
            if submitter
            else None
        )
        base = EvaluationScoreResponse.model_validate(row).model_dump()
        human_responses.append(
            HumanEvaluatorScoreResponse(**base, submitted_by=identity)
        )

    return ResponseBuilder.success(
        data=CombinedEvaluationResponse(
            application_id=application.id,
            job_id=application.job_id,
            schema=JobEvaluationSchemaResponse.model_validate(schema)
            if schema
            else None,
            humans=human_responses,
            human_average=HumanAverageResponse(
                per_criterion=human_aggregate.per_criterion,
                weighted_total=human_aggregate.weighted_total,
                evaluator_count=human_aggregate.evaluator_count,
            )
            if human_aggregate
            else None,
            llm=EvaluationScoreResponse.model_validate(llm) if llm else None,
            final_score=final_score,
        ),
        message="Evaluation fetched.",
    )
