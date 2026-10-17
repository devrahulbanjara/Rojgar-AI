import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Query, status
from pydantic import BaseModel

from app.core.dependencies import (
    ActiveMember,
    CurrentUser,
    DbSession,
    UUIDPath,
)
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.activity.schemas import ActivityEventResponse
from app.modules.applications import service
from app.modules.applications.schemas import (
    ApplicationResponse,
    ApplyRequest,
    CandidateApplicationView,
    RecruiterCandidateListItem,
    SemanticCandidateSearchResponse,
    SimilarCandidatesResponse,
)
from app.shared.enums import ApplicationStage

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/", status_code=status.HTTP_201_CREATED, summary="Apply (signed in)")
async def apply_to_job(
    payload: ApplyRequest,
    bg_tasks: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[ApplicationResponse]:
    data = await service.apply_to_job(db, user, payload, bg_tasks)
    return ResponseBuilder.success(
        data=data, message="Application submitted.", status_code=status.HTTP_201_CREATED
    )


@router.get("/me", summary="The signed-in candidate's applications")
async def list_my_applications(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: CurrentUser = None,
    db: DbSession = None,
) -> UnifiedResponse[list[CandidateApplicationView]]:
    data = await service.list_user_applications(db, user, page, size)
    return ResponseBuilder.success(data=data, message="Applications fetched.")


@router.get(
    "/company/me/candidates/search",
    summary="Search candidates in plain words, across jobs",
)
async def search_candidates_semantic(
    q: Annotated[str, Query(min_length=1, max_length=500)],
    stage: Annotated[list[str] | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[SemanticCandidateSearchResponse]:
    data = await service.semantic_search_candidates(db, user, q, stage, page, size)
    return ResponseBuilder.success(data=data, message="Search complete.")


@router.get(
    "/company/me/candidates", summary="Candidates across jobs, one row per person"
)
async def list_my_company_candidates(
    job_id: Annotated[str | None, Query()] = None,
    stage: Annotated[ApplicationStage | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=200)] = 50,
    user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[list[RecruiterCandidateListItem]]:
    data = await service.list_company_candidates(db, user, job_id, stage, page, size)
    return ResponseBuilder.success(data=data, message="Candidates fetched.")


@router.get(
    "/company/me/candidates/{application_id}/similar",
    summary="Candidates similar to this one",
)
async def get_similar_candidates(
    application_id: UUIDPath,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
    user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[SimilarCandidatesResponse]:
    data = await service.find_similar_candidates(db, user, application_id, limit)
    return ResponseBuilder.success(data=data, message="Similar candidates fetched.")


@router.get("/{application_id}", summary="One of my applications (candidate)")
async def get_application(
    application_id: UUIDPath, user: CurrentUser, db: DbSession
) -> UnifiedResponse[ApplicationResponse]:
    data = await service.get_application(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Application fetched.")


@router.get(
    "/{application_id}/timeline", summary="My application's timeline (candidate)"
)
async def get_application_timeline(
    application_id: UUIDPath, user: CurrentUser, db: DbSession
) -> UnifiedResponse[list[ActivityEventResponse]]:
    data = await service.get_application_timeline(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Application timeline fetched.")


class OfferResponsePayload(BaseModel):
    accepted: bool


@router.post("/{application_id}/offer/respond", summary="Accept or decline an offer")
async def respond_to_offer(
    application_id: uuid.UUID,
    payload: OfferResponsePayload,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[None]:
    await service.respond_to_offer(db, application_id, payload.accepted, user)
    return ResponseBuilder.success(
        message="Offer accepted" if payload.accepted else "Offer declined"
    )
