from typing import Annotated

from fastapi import APIRouter, Query

from app.core.dependencies import DbSession, ManagerUser
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.applications import service
from app.modules.applications.schemas import (
    RecruiterCandidateListItem,
    SemanticCandidateSearchResponse,
)
from app.shared.enums import ApplicationStage

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get(
    "/company/me/candidates/search",
    summary="Search candidates in plain words, across jobs",
)
async def search_candidates_semantic(
    q: Annotated[str, Query(min_length=1, max_length=500)],
    stage: Annotated[list[str] | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: ManagerUser = None,
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
    user: ManagerUser = None,
    db: DbSession = None,
) -> UnifiedResponse[list[RecruiterCandidateListItem]]:
    data = await service.list_company_candidates(db, user, job_id, stage, page, size)
    return ResponseBuilder.success(data=data, message="Candidates fetched.")
