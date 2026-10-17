"""Recruiter v2 API: the job page (pipeline + candidate panel) and decisions."""

import json
import uuid
from typing import Annotated, Literal

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import Response
from pydantic import ValidationError

from app.core.dependencies import ActiveMember, DbSession
from app.core.responses import ResponseBuilder, UnifiedResponse
from app.modules.applications import pipeline
from app.modules.applications.schemas import (
    CandidatePanelResponse,
    DecideRequest,
    DecideResponse,
    EventView,
    JobPipelineResponse,
    NoteRequest,
    QuickAddCreated,
    QuickAddForm,
    ReferrerCreate,
    ReferrerResponse,
    UndoRequest,
    UndoResponse,
)
from app.shared.enums import ApplicationStage
from app.shared.normalize import normalize_email, normalize_phone

router = APIRouter(prefix="/recruiter/v2", tags=["Recruiter"])


@router.get(
    "/jobs/{job_id}/pipeline", summary="Stage counts and applications for a job"
)
async def get_pipeline(
    job_id: uuid.UUID,
    user: ActiveMember,
    db: DbSession,
    stage: Annotated[ApplicationStage | None, Query()] = None,
    sort: Annotated[Literal["best_fit", "newest"], Query()] = "best_fit",
) -> UnifiedResponse[JobPipelineResponse]:
    data = await pipeline.job_pipeline(db, user, job_id, stage=stage, sort=sort)
    return ResponseBuilder.success(data=data)


@router.get("/applications/{application_id}", summary="Candidate panel")
async def get_panel(
    application_id: uuid.UUID, user: ActiveMember, db: DbSession
) -> UnifiedResponse[CandidatePanelResponse]:
    return ResponseBuilder.success(
        data=await pipeline.candidate_panel(db, user, application_id)
    )


@router.post("/decide", summary="Move one or many applications (one decision)")
async def decide(
    payload: DecideRequest,
    bg_tasks: BackgroundTasks,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[DecideResponse]:
    return ResponseBuilder.success(
        data=await pipeline.decide(db, user, payload, bg_tasks)
    )


@router.post("/undo", summary="Undo decisions before their email goes out")
async def undo(
    payload: UndoRequest, user: ActiveMember, db: DbSession
) -> UnifiedResponse[UndoResponse]:
    return ResponseBuilder.success(
        data=await pipeline.undo(db, user, payload.event_ids)
    )


@router.post(
    "/applications/{application_id}/notes",
    status_code=status.HTTP_201_CREATED,
    summary="Add a note to the timeline",
)
async def add_note(
    application_id: uuid.UUID, payload: NoteRequest, user: ActiveMember, db: DbSession
) -> UnifiedResponse[EventView]:
    data = await pipeline.add_note(db, user, application_id, payload.text)
    return ResponseBuilder.success(data=data, status_code=status.HTTP_201_CREATED)


@router.post(
    "/applications/{application_id}/clear-flag",
    summary="I checked the CV: clear the flag and review it",
)
async def clear_flag(
    application_id: uuid.UUID,
    bg_tasks: BackgroundTasks,
    user: ActiveMember,
    db: DbSession,
) -> UnifiedResponse[CandidatePanelResponse]:
    data = await pipeline.clear_flag(db, user, application_id, bg_tasks)
    return ResponseBuilder.success(data=data)


@router.post(
    "/jobs/{job_id}/candidates",
    status_code=status.HTTP_201_CREATED,
    summary="Add a walk-in, phone or referral candidate",
)
async def quick_add(
    job_id: uuid.UUID,
    bg_tasks: BackgroundTasks,
    user: ActiveMember,
    db: DbSession,
    full_name: Annotated[str, Form(max_length=255)],
    phone: Annotated[str, Form(max_length=30)],
    source: Annotated[str, Form()],
    email: Annotated[str | None, Form(max_length=255)] = None,
    referred_by: Annotated[str | None, Form(max_length=255)] = None,
    answers: Annotated[
        str | None, Form(description="JSON [{question, answer}]")
    ] = None,
    cv: Annotated[UploadFile | None, File()] = None,
) -> UnifiedResponse[QuickAddCreated]:
    try:
        form = QuickAddForm(
            full_name=" ".join(full_name.split()),
            phone=phone,
            email=email or None,
            source=source,
            referred_by=(referred_by or "").strip() or None,
        )
        parsed_answers = [
            {"question": str(a["question"])[:200], "answer": str(a["answer"])[:2000]}
            for a in (json.loads(answers) if answers else [])
            if str(a.get("answer") or "").strip()
        ]
    except (ValidationError, ValueError, KeyError, TypeError, AttributeError) as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Check the name, phone and source.",
        ) from exc
    normalized_phone = normalize_phone(form.phone)
    if normalized_phone is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Enter a valid phone number."
        )
    data = await pipeline.quick_add(
        db,
        user,
        job_id,
        form,
        phone=normalized_phone,
        email=normalize_email(form.email) if form.email else None,
        answers=parsed_answers,
        cv=cv if cv is not None and cv.filename else None,
        bg_tasks=bg_tasks,
    )
    return ResponseBuilder.success(data=data, status_code=status.HTTP_201_CREATED)


@router.post(
    "/jobs/{job_id}/referrers",
    status_code=status.HTTP_201_CREATED,
    summary="Create a personal share link for someone who can pass the job on",
)
async def create_referrer(
    job_id: uuid.UUID, payload: ReferrerCreate, user: ActiveMember, db: DbSession
) -> UnifiedResponse[ReferrerResponse]:
    data = await pipeline.create_referrer(db, user, job_id, payload)
    return ResponseBuilder.success(data=data, status_code=status.HTTP_201_CREATED)


@router.get("/jobs/{job_id}/referrers", summary="Share links and how many applied")
async def list_referrers(
    job_id: uuid.UUID, user: ActiveMember, db: DbSession
) -> UnifiedResponse[list[ReferrerResponse]]:
    return ResponseBuilder.success(data=await pipeline.list_referrers(db, user, job_id))


@router.get("/jobs/{job_id}/export.csv", summary="Download applications as CSV")
async def export_applications(
    job_id: uuid.UUID, user: ActiveMember, db: DbSession
) -> Response:
    filename, body = await pipeline.export_csv(db, user, job_id)
    return Response(
        content=body.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
