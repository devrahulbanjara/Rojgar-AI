import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Query, status
from pydantic import BaseModel

from app.core.dependencies import ActiveMember, CandidateUser, CurrentUser, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.applications import service
from app.modules.applications.schemas import (
    ApplicationResponse,
    ApplyRequest,
    CandidateApplicationView,
    RecruiterCandidateDetailView,
    RecruiterCandidateListItem,
    RecruiterApplicationView,
    SemanticCandidateSearchResponse,
    SimilarCandidatesResponse,
    UpdateApplicationReviewRequest,
    UpdateApplicationStatusRequest,
)
from app.modules.activity.schemas import ActivityEventResponse
from app.shared.enums import ApplicationStatus

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Apply to a job (auto-forks profile to resume if none provided)",
)
async def apply_to_job(
    payload: ApplyRequest,
    bg_tasks: BackgroundTasks,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[ApplicationResponse]:
    """Submit a candidate application for a job."""
    data = await service.apply_to_job(db, user, payload, bg_tasks)
    return ResponseBuilder.success(
        data=data,
        message="Application submitted.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get(
    "/me",
    summary="List all applications submitted by the authenticated candidate",
)
async def list_my_applications(
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: CandidateUser = None,
    db: DbSession = None,
) -> UnifiedResponse[list[CandidateApplicationView]]:
    """List the authenticated candidate's applications."""
    data = await service.list_user_applications(db, user, page, size)
    return ResponseBuilder.success(data=data, message="Applications fetched.")


@router.get(
    "/company/me",
    summary="List all applications for the authenticated recruiter's company, optionally filtered by job",
)
async def list_my_company_applications(
    job_id: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[list[RecruiterApplicationView]]:
    """List applications for the recruiter's active company."""
    data = await service.list_my_company_applications(db, user, job_id, page, size)
    return ResponseBuilder.success(data=data, message="Applications fetched.")


@router.get(
    "/company/me/candidates/search",
    summary="Semantic candidate search (natural language query)",
)
async def search_candidates_semantic(
    q: Annotated[
        str, Query(min_length=1, max_length=500, description="Free-text search query")
    ],
    status: Annotated[
        list[str] | None, Query(description="Filter by application statuses")
    ] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[SemanticCandidateSearchResponse]:
    """
    Search candidates semantically across your company.

    The query is embedded and matched against the resume vectors stored in
    Qdrant.  Results are ranked by cosine similarity.
    """
    data = await service.semantic_search_candidates(db, user, q, status, page, size)
    return ResponseBuilder.success(data=data, message="Search complete.")


@router.get(
    "/company/me/candidates",
    summary="List candidate applications for the authenticated recruiter's company",
)
async def list_my_company_candidates(
    job_id: Annotated[str | None, Query()] = None,
    status_filter: Annotated[ApplicationStatus | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=200)] = 50,
    user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[list[RecruiterCandidateListItem]]:
    """List candidate applications for the recruiter's active company."""
    data = await service.list_company_candidates(
        db,
        user,
        job_id,
        status_filter,
        page,
        size,
    )
    return ResponseBuilder.success(data=data, message="Candidates fetched.")


@router.get(
    "/company/me/candidates/{application_id}/similar",
    summary="Find candidates similar to a given application",
)
async def get_similar_candidates(
    application_id: str,
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
    user: ActiveMember = None,
    db: DbSession = None,
) -> UnifiedResponse[SimilarCandidatesResponse]:
    """
    Given one candidate application, surface the most similar candidates
    from the same company's talent pool using vector similarity.
    """
    data = await service.find_similar_candidates(db, user, application_id, limit)
    return ResponseBuilder.success(data=data, message="Similar candidates fetched.")


@router.get(
    "/company/me/candidates/{application_id}",
    summary="Get recruiter-safe candidate details for one application",
)
async def get_company_candidate_detail(
    application_id: str,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[RecruiterCandidateDetailView]:
    """Return recruiter-safe detail for one company application."""
    data = await service.get_company_candidate_detail(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Candidate fetched.")


@router.get(
    "/job/{job_id}",
    summary="List all applications for a specific job (company/recruiter only)",
)
async def list_job_applications(
    job_id: str,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 20,
    user: CurrentUser = None,
    db: DbSession = None,
) -> UnifiedResponse[list[RecruiterApplicationView]]:
    """List applications for one job the user can access."""
    data = await service.list_job_applications(db, user, job_id, page, size)
    return ResponseBuilder.success(data=data, message="Applications fetched.")


@router.get(
    "/{application_id}",
    summary="Get full details of a specific application",
)
async def get_application(
    application_id: str,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[ApplicationResponse]:
    """Return one application visible to the requesting user."""
    data = await service.get_application(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Application fetched.")


@router.get(
    "/{application_id}/timeline",
    summary="Get the event timeline for a specific application",
)
async def get_application_timeline(
    application_id: str,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[list[ActivityEventResponse]]:
    """Return the timeline for one visible application."""
    data = await service.get_application_timeline(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Application timeline fetched.")


@router.get(
    "/company/me/candidates/{application_id}/timeline",
    summary="Get the recruiter timeline for a specific candidate application",
)
async def get_company_candidate_timeline(
    application_id: str,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[list[ActivityEventResponse]]:
    """Return the recruiter-scoped timeline for one company candidate."""
    data = await service.get_company_candidate_timeline(db, user, application_id)
    return ResponseBuilder.success(data=data, message="Candidate timeline fetched.")


@router.patch(
    "/{application_id}/review",
    summary="Update application score and feedback (company/recruiter only)",
)
async def update_application_review(
    application_id: str,
    payload: UpdateApplicationReviewRequest,
    bg_tasks: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[ApplicationResponse]:
    """Update recruiter review data for an application."""
    data = await service.update_application_review(
        db, user, application_id, payload, bg_tasks
    )
    return ResponseBuilder.success(data=data, message="Application review updated.")


@router.patch(
    "/{application_id}/status",
    summary="Update application status (company/recruiter only)",
)
async def update_application_status(
    application_id: str,
    payload: UpdateApplicationStatusRequest,
    bg_tasks: BackgroundTasks,
    user: CurrentUser,
    db: DbSession,
) -> UnifiedResponse[ApplicationResponse]:
    """Update an application's workflow status."""
    data = await service.update_application_status(
        db, user, application_id, payload, bg_tasks
    )
    return ResponseBuilder.success(data=data, message="Application status updated.")


class OfferResponsePayload(BaseModel):
    accepted: bool


@router.post(
    "/{application_id}/offer/respond",
    summary="Candidate accepts or declines a recorded offer",
)
async def respond_to_offer(
    application_id: uuid.UUID,
    payload: OfferResponsePayload,
    user: CandidateUser,
    db: DbSession,
) -> UnifiedResponse[None]:
    """Record the candidate's response to an offer."""
    await service.respond_to_offer(db, application_id, payload.accepted, user)
    return ResponseBuilder.success(
        message="Offer accepted" if payload.accepted else "Offer declined"
    )
