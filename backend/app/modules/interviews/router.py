import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Path, Query

from app.core.dependencies import ActiveMember, CandidateUser, DbSession, OptionalUser
from app.core.rate_limit import RateLimit
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.interviews import service
from app.modules.interviews.schemas import (
    AgendaItem,
    Availability,
    BookedInterview,
    BookRequest,
    CandidateInterviewView,
    InviteRequest,
    InviteResponse,
    PublicSchedule,
    ScorecardForm,
    ScorecardRequest,
    ScorecardView,
)
from app.modules.interviews.service import AgendaRange

router = APIRouter(tags=["Interviews"])

Token = Annotated[str, Path(min_length=20, max_length=64)]


def _limit(scope: str, times: int, seconds: int):
    return Depends(RateLimit(f"schedule.{scope}", times, seconds))


# --- recruiter ---------------------------------------------------------------


@router.get("/me/availability", summary="My interview hours, length, buffer and link")
async def get_availability(
    user: ActiveMember, db: DbSession
) -> UnifiedResponse[Availability]:
    return ResponseBuilder.success(data=await service.get_availability(db, user))


@router.put("/me/availability", summary="Save my interview hours")
async def put_availability(
    payload: Availability, user: ActiveMember, db: DbSession
) -> UnifiedResponse[Availability]:
    data = await service.put_availability(db, user, payload)
    return ResponseBuilder.success(data=data, message="Availability saved.")


@router.post(
    "/applications/{application_id}/invite",
    summary="Invite a shortlisted candidate to pick an interview time",
)
async def invite(
    application_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
    bg: BackgroundTasks,
    payload: InviteRequest | None = None,
) -> UnifiedResponse[InviteResponse]:
    notify = payload.notify if payload else True
    data = await service.invite(db, user, application_id, notify, bg)
    return ResponseBuilder.success(data=data, message="Invite ready.")


@router.get("/interviews", summary="Interviews for the company (agenda)")
async def agenda(
    user: ActiveMember,
    db: DbSession,
    range: Annotated[AgendaRange, Query()] = "week",
    start: Annotated[date | None, Query(description="First day, default today")] = None,
    job_id: Annotated[uuid.UUID | None, Query()] = None,
) -> UnifiedResponse[list[AgendaItem]]:
    data = await service.agenda(db, user, range, start, job_id)
    return ResponseBuilder.success(data=data)


@router.get(
    "/interviews/{interview_id}/scorecard",
    summary="Must-haves to rate and the scorecards so far",
)
async def scorecard_form(
    interview_id: uuid.UUID, user: ActiveMember, db: DbSession
) -> UnifiedResponse[ScorecardForm]:
    return ResponseBuilder.success(
        data=await service.scorecard_form(db, user, interview_id)
    )


@router.post("/interviews/{interview_id}/scorecard", summary="Save my scorecard")
async def submit_scorecard(
    interview_id: uuid.UUID,
    payload: ScorecardRequest,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[ScorecardView]:
    data = await service.submit_scorecard(db, user, interview_id, payload)
    return ResponseBuilder.success(data=data, message="Scorecard saved.")


# --- candidate ---------------------------------------------------------------


@router.get("/interviews/my", summary="Signed-in candidate: my interviews")
async def my_interviews(
    user: CandidateUser, db: DbSession
) -> UnifiedResponse[list[CandidateInterviewView]]:
    data = await service.list_candidate_interviews(db, user.id)
    return ResponseBuilder.success(data=data)


# --- public scheduling link (candidate or recruiter) -------------------------


@router.get(
    "/public/schedule/{token}",
    summary="Open times for this interview link, and the current booking",
    dependencies=[_limit("view", 60, 60)],
)
async def public_schedule(
    token: Token, db: DbSession
) -> UnifiedResponse[PublicSchedule]:
    return ResponseBuilder.success(data=await service.public_schedule(db, token))


@router.post(
    "/public/schedule/{token}/book",
    summary="Book an interview time",
    dependencies=[_limit("book", 10, 600)],
)
async def book(
    token: Token,
    payload: BookRequest,
    db: DbSession,
    bg: BackgroundTasks,
    user: OptionalUser = None,
) -> UnifiedResponse[BookedInterview]:
    data = await service.book(db, token, payload.start, user, bg)
    return ResponseBuilder.success(data=data, message="Interview booked.")


@router.post(
    "/public/schedule/{token}/reschedule",
    summary="Move the booked interview to another open time",
    dependencies=[_limit("reschedule", 10, 600)],
)
async def reschedule(
    token: Token,
    payload: BookRequest,
    db: DbSession,
    bg: BackgroundTasks,
    user: OptionalUser = None,
) -> UnifiedResponse[BookedInterview]:
    data = await service.reschedule(db, token, payload.start, user, bg)
    return ResponseBuilder.success(data=data, message="Interview moved.")


@router.post(
    "/public/schedule/{token}/cancel",
    summary="Cancel the booked interview",
    dependencies=[_limit("cancel", 10, 600)],
)
async def cancel(
    token: Token,
    db: DbSession,
    bg: BackgroundTasks,
    user: OptionalUser = None,
) -> UnifiedResponse[BookedInterview]:
    data = await service.cancel(db, token, user, bg)
    return ResponseBuilder.success(data=data, message="Interview cancelled.")
