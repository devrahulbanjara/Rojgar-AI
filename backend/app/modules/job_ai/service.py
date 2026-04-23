import uuid

from typing import Any


from fastapi import BackgroundTasks, HTTPException, status

from langgraph.types import Command

from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession


from app.modules.auth.enums import UserRole

from app.modules.auth.models import User

from app.modules.job_ai.models import JobAIDraft

from app.modules.job_ai.runtime import job_ai_runtime

from app.modules.job_ai.schemas import (
    CommitDraftRequest,
    GenerateJobDraftRequest,
    HumanDecision,
    JobAIDraftResponse,
)

from app.modules.job_ai.tools import (
    get_company_context,
    get_recruiter_company_id,
    get_source_job_context,
    get_salary_research_data,
)
from app.modules.jobs import service as jobs_service

from app.modules.jobs.schemas import JobCreate

from app.shared.enums import JobStatus, LocationType


def _ensure_recruiting_user(user: User) -> None:
    """Raise when the user lacks recruiter privileges for job drafting."""

    if user.primary_role not in {UserRole.recruiter, UserRole.recruiter_admin}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter or recruiter admin role required.",
        )


def _new_thread_id() -> str:
    """Generate a new LangGraph thread ID for a draft session."""

    return f"job-ai-{uuid.uuid4()}"


def _extract_interrupt_payload(result: dict[str, Any]) -> dict[str, Any] | None:
    """Extract the latest interrupt payload from a graph result."""

    interrupts = result.get("__interrupt__")

    if not interrupts:
        return None

    first = interrupts[0]

    value = getattr(first, "value", None)

    if value is not None:
        return value

    if isinstance(first, dict) and "value" in first:
        return first["value"]

    return None


def _merge_latest_draft(
    current_draft: dict[str, Any] | None,
    edited_fields: dict[str, Any] | None,
) -> dict[str, Any] | None:
    """Merge recruiter edits into the latest draft payload."""

    if current_draft is None and not edited_fields:
        return None

    merged = {**(current_draft or {}), **(edited_fields or {})}
    return merged


def _map_draft_to_job_create(
    draft: dict[str, Any], status_override: JobStatus | None
) -> JobCreate:
    """Map a finalized AI draft into the normal job creation schema."""

    return JobCreate(
        title=draft["title"],
        location=draft.get("location"),
        location_type=LocationType(draft["location_type"]),
        salary_min=draft.get("salary_min"),
        salary_max=draft.get("salary_max"),
        currency=draft.get("currency") or "USD",
        status=status_override or JobStatus(draft.get("status", "draft")),
        shortlist_threshold=draft.get("shortlist_threshold", 70),
        overview=draft["overview"],
        responsibilities=draft.get("responsibilities", []),
        requirements=draft.get("requirements", []),
        preferred_qualifications=draft.get("preferred_qualifications", []),
        benefits=draft.get("benefits", []),
        auto_shortlist=draft.get("auto_shortlist", False),
    )


async def create_draft(
    db: AsyncSession,
    user: User,
    payload: GenerateJobDraftRequest,
) -> JobAIDraftResponse:
    """Create a new AI job draft and persist its first review state."""

    _ensure_recruiting_user(user)

    company_id = await get_recruiter_company_id(db, user.id)

    company_context = await get_company_context(db, company_id)

    source_job = None

    if payload.source_job_id:
        source_job = await get_source_job_context(db, payload.source_job_id)

    thread_id = _new_thread_id()

    draft_row = JobAIDraft(
        recruiter_id=user.id,
        company_id=company_id,
        thread_id=thread_id,
        status="drafting",
        mode=payload.mode,
        source_prompt=payload.prompt,
        source_text=payload.source_text,
        locked_fields=payload.locked_fields,
    )

    db.add(draft_row)

    await db.commit()

    await db.refresh(draft_row)

    salary_research_input = None

    if payload.research_salary:
        role_for_salary = None

        if payload.prompt:
            role_for_salary = payload.prompt

        elif source_job:
            role_for_salary = source_job.get("title")

        country = company_context["company"].get("location") or "Kathmandu, Nepal"

        if role_for_salary:
            salary_research_input = await get_salary_research_data(
                role=role_for_salary,
                country=country,
            )

    graph = job_ai_runtime.get_graph()

    config = {"configurable": {"thread_id": draft_row.thread_id}}

    state_input = {
        "draft_db_id": str(draft_row.id),
        "thread_id": draft_row.thread_id,
        "recruiter_id": str(user.id),
        "company_id": str(company_id),
        "mode": payload.mode,
        "prompt": payload.prompt,
        "source_text": payload.source_text,
        "source_job": source_job,
        "company_context": company_context,
        "research_salary": payload.research_salary,
        "salary_role": None,
        "salary_country": None,
        "salary_research_input": salary_research_input,
        "salary_research": None,
        "locked_fields": payload.locked_fields,
        "draft": None,
        "assumptions": [],
        "warnings": [],
        "missing_fields": [],
        "validation_errors": [],
        "human_decision": None,
    }

    result = await graph.ainvoke(state_input, config=config)

    interrupt_payload = _extract_interrupt_payload(result)

    if interrupt_payload:
        draft_row.status = "review_required"

        draft_row.last_interrupt = interrupt_payload

        draft_row.latest_draft = interrupt_payload.get("draft")

        draft_row.salary_research = interrupt_payload.get("salary_research")

        draft_row.assumptions = interrupt_payload.get("assumptions", [])

        draft_row.warnings = interrupt_payload.get("warnings", [])

        draft_row.missing_fields = interrupt_payload.get("missing_fields", [])

    else:
        draft_row.status = "ready"

        draft_row.latest_draft = result.get("draft")

        draft_row.salary_research = result.get("salary_research")

        draft_row.assumptions = result.get("assumptions", [])

        draft_row.warnings = result.get("warnings", [])

        draft_row.missing_fields = result.get("missing_fields", [])

    await db.commit()

    await db.refresh(draft_row)

    return JobAIDraftResponse.model_validate(draft_row)


async def get_draft(
    db: AsyncSession,
    user: User,
    draft_id: uuid.UUID,
) -> JobAIDraftResponse:
    """Fetch one AI draft owned by the current recruiter."""

    _ensure_recruiting_user(user)

    draft = await db.scalar(
        select(JobAIDraft).where(
            JobAIDraft.id == draft_id,
            JobAIDraft.recruiter_id == user.id,
        )
    )

    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    return JobAIDraftResponse.model_validate(draft)


async def list_drafts(
    db: AsyncSession,
    user: User,
) -> list[JobAIDraftResponse]:
    """List non-terminal AI drafts owned by the current recruiter."""

    _ensure_recruiting_user(user)

    drafts = await db.scalars(
        select(JobAIDraft)
        .where(
            JobAIDraft.recruiter_id == user.id,
            JobAIDraft.status != "committed",
            JobAIDraft.status != "rejected",
        )
        .order_by(JobAIDraft.updated_at.desc(), JobAIDraft.created_at.desc())
    )

    return [JobAIDraftResponse.model_validate(draft) for draft in drafts.all()]


async def respond_to_draft(
    db: AsyncSession,
    user: User,
    draft_id: uuid.UUID,
    decision: HumanDecision,
) -> JobAIDraftResponse:
    """Resume a paused draft workflow with a recruiter decision."""

    _ensure_recruiting_user(user)

    draft = await db.scalar(
        select(JobAIDraft).where(
            JobAIDraft.id == draft_id,
            JobAIDraft.recruiter_id == user.id,
        )
    )

    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if decision.locked_fields is not None:
        draft.locked_fields = decision.locked_fields

    if decision.action in {"approve", "save_draft", "reject"}:
        merged_draft = _merge_latest_draft(draft.latest_draft, decision.edited_fields)
        if merged_draft is not None:
            draft.latest_draft = merged_draft

        if decision.action == "approve":
            draft.status = "approved"
        elif decision.action == "save_draft":
            draft.status = "saved"
        else:
            draft.status = "rejected"

        draft.last_interrupt = None

        await db.commit()
        await db.refresh(draft)
        return JobAIDraftResponse.model_validate(draft)

    graph = job_ai_runtime.get_graph()

    config = {"configurable": {"thread_id": draft.thread_id}}

    result = await graph.ainvoke(
        Command(resume=decision.model_dump(mode="json")),
        config=config,
    )

    interrupt_payload = _extract_interrupt_payload(result)

    if interrupt_payload:
        draft.status = "review_required"
        draft.last_interrupt = interrupt_payload
        draft.locked_fields = decision.locked_fields or draft.locked_fields

        draft.latest_draft = interrupt_payload.get("draft")

        draft.salary_research = interrupt_payload.get("salary_research")

        draft.assumptions = interrupt_payload.get("assumptions", [])

        draft.warnings = interrupt_payload.get("warnings", [])

        draft.missing_fields = interrupt_payload.get("missing_fields", [])

    else:
        if decision.action == "approve":
            draft.status = "approved"

        elif decision.action == "save_draft":
            draft.status = "saved"

        elif decision.action == "reject":
            draft.status = "rejected"

        else:
            draft.status = "ready"

        draft.last_interrupt = None
        draft.locked_fields = decision.locked_fields or draft.locked_fields

        draft.latest_draft = result.get("draft", draft.latest_draft)

        draft.salary_research = result.get("salary_research", draft.salary_research)

        draft.assumptions = result.get("assumptions", draft.assumptions)

        draft.warnings = result.get("warnings", draft.warnings)

        draft.missing_fields = result.get("missing_fields", draft.missing_fields)

    await db.commit()

    await db.refresh(draft)

    return JobAIDraftResponse.model_validate(draft)


async def commit_draft(
    db: AsyncSession,
    user: User,
    draft_id: uuid.UUID,
    payload: CommitDraftRequest,
    bg_tasks: BackgroundTasks,
):
    """Commit an approved AI draft through the standard job creation flow."""

    _ensure_recruiting_user(user)

    draft = await db.scalar(
        select(JobAIDraft).where(
            JobAIDraft.id == draft_id,
            JobAIDraft.recruiter_id == user.id,
        )
    )

    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if not draft.latest_draft:
        raise HTTPException(
            status_code=400, detail="Draft has no generated job payload"
        )

    if draft.status not in {"approved", "saved", "ready", "review_required"}:
        raise HTTPException(
            status_code=400,
            detail=f"Draft cannot be committed from status '{draft.status}'",
        )

    job_payload = _map_draft_to_job_create(
        draft=draft.latest_draft,
        status_override=payload.status_override,
    )

    created_job = await jobs_service.create_job(db, user, job_payload, bg_tasks)

    draft.status = "committed"

    draft.committed_job_id = created_job.id

    await db.commit()

    await db.refresh(draft)

    return {
        "draft": JobAIDraftResponse.model_validate(draft),
        "job": created_job,
    }
