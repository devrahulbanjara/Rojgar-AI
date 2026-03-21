from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Annotated, Any

from fastapi import BackgroundTasks
from langchain_core.messages import ToolMessage
from langchain_core.tools import InjectedToolCallId, tool
from langgraph.prebuilt import InjectedState
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.infrastructures.ai.service import ai_service
from app.infrastructures.qdrant.service import qdrant_service
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.job_ai.prompts import SALARY_SYNTHESIS_SYSTEM_PROMPT
from app.modules.job_ai.schemas import SalaryResearch
from app.modules.job_ai.tools import get_salary_research_data
from app.modules.jobs import service as jobs_service
from app.modules.jobs.models import Job
from app.modules.jobs.schemas import JobUpdate
from app.modules.profiles.models import Profile
from app.modules.recruiter_chat.schemas import (
    CandidateCardData,
    CandidateDetailData,
    CandidateSearchResult,
    CompanyJobData,
    JobEditDiff,
    JobEditInstruction,
    JobEditProposal,
    JobSearchMatch,
    SalaryResearchResult,
    SalarySource,
    ToolResultEnvelope,
)
from app.modules.resumes.models import Resume
from app.shared.enums import ApplicationStatus
from app.shared.enums import JobStatus


LIST_FIELDS = {
    "responsibilities",
    "requirements",
    "preferred_qualifications",
    "benefits",
}
INT_FIELDS = {"salary_min", "salary_max"}
STRING_FIELDS = {"title", "location", "currency", "overview", "expires_at"}
BOOLEAN_FIELDS = {"auto_shortlist"}
ENUM_FIELDS = {"location_type", "status"}


class UIHint(str, Enum):
    text = "text"
    candidate_list = "candidate_list"
    salary_info = "salary_info"
    candidate_detail = "candidate_detail"
    job_edit_preview = "job_edit_preview"


def _state_ids(state: dict[str, Any]) -> tuple[uuid.UUID, uuid.UUID]:
    return uuid.UUID(str(state["company_id"])), uuid.UUID(str(state["recruiter_id"]))


def _as_tool_message(
    tool_name: str,
    result: ToolResultEnvelope,
    tool_call_id: str,
) -> ToolMessage:
    if not tool_call_id:
        raise ValueError(f"Missing tool_call_id for tool '{tool_name}'.")

    return ToolMessage(
        content=result.model_dump_json(),
        name=tool_name,
        tool_call_id=tool_call_id,
    )


async def _load_active_recruiter(
    db, recruiter_id: uuid.UUID, company_id: uuid.UUID
) -> User:
    result = await db.execute(
        select(User)
        .join(CompanyMembership, CompanyMembership.user_id == User.id)
        .where(
            User.id == recruiter_id,
            CompanyMembership.company_id == company_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    recruiter = result.scalar_one_or_none()
    if recruiter is None:
        raise ValueError("Active recruiter membership required.")
    return recruiter


def _job_to_chat_data(job: Job) -> CompanyJobData:
    return CompanyJobData(
        job_id=job.id,
        title=job.title,
        location=job.location,
        location_type=job.location_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        currency=job.currency,
        status=job.status,
        auto_shortlist=job.auto_shortlist,
        expires_at=job.expires_at,
        overview=job.overview,
        responsibilities=job.responsibilities or [],
        requirements=job.requirements or [],
        preferred_qualifications=job.preferred_qualifications or [],
        benefits=job.benefits or [],
        updated_at=job.updated_at,
    )


def _normalize_for_diff(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "value"):
        return value.value
    return value


def _normalize_list_value(value: str | list[str] | int | bool | None) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    return [str(value)]


def _normalize_int_value(value: str | list[str] | int | bool | None) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.strip():
        return int(value.strip())
    raise ValueError("Expected an integer value.")


def _apply_job_edit_instruction(
    current_value: Any, instruction: JobEditInstruction
) -> Any:
    field = instruction.field
    operation = instruction.operation
    value = instruction.value

    if field in LIST_FIELDS:
        current_list = list(current_value or [])
        incoming = _normalize_list_value(value)
        if operation in {"set", "replace"}:
            return incoming
        if operation == "append":
            merged = current_list[:]
            for item in incoming:
                if item not in merged:
                    merged.append(item)
            return merged
        if operation == "remove":
            return [item for item in current_list if item not in incoming]
        if operation == "clear":
            return []
        raise ValueError(f"Unsupported list operation '{operation}'.")

    if field in INT_FIELDS:
        if operation == "clear":
            return None
        if operation != "set":
            raise ValueError(f"Unsupported integer operation '{operation}'.")
        return _normalize_int_value(value)

    if field in BOOLEAN_FIELDS:
        if operation == "clear":
            return False
        if operation != "set" or not isinstance(value, bool):
            raise ValueError("Boolean fields require a true/false value.")
        return value

    if field in STRING_FIELDS or field in ENUM_FIELDS:
        if operation == "clear":
            return None
        if operation != "set":
            raise ValueError(f"Unsupported scalar operation '{operation}'.")
        if isinstance(value, list):
            raise ValueError("Scalar fields do not accept list values.")
        return value

    raise ValueError(f"Unsupported field '{field}'.")


async def _find_company_job_impl(
    title_query: str, company_id: uuid.UUID
) -> ToolResultEnvelope:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Job)
            .where(
                Job.company_id == company_id,
                Job.title.ilike(f"%{title_query.strip()}%"),
            )
            .order_by(Job.updated_at.desc())
            .limit(5)
        )
        jobs = result.scalars().all()
        if not jobs:
            return ToolResultEnvelope(
                tool="find_company_job",
                ok=False,
                text=f"I couldn't find a company job matching '{title_query}'.",
            )
        if len(jobs) > 1:
            matches = [
                JobSearchMatch(
                    job_id=job.id,
                    title=job.title,
                    status=job.status,
                    location=job.location,
                    location_type=job.location_type,
                    updated_at=job.updated_at,
                )
                for job in jobs
            ]
            return ToolResultEnvelope(
                tool="find_company_job",
                ok=False,
                text="I found multiple matching jobs. Please choose one.",
                data={"matches": [match.model_dump(mode="json") for match in matches]},
            )
        job = jobs[0]
        job_data = _job_to_chat_data(job)
        return ToolResultEnvelope(
            tool="find_company_job",
            text=f"Found job '{job.title}'.",
            data=job_data.model_dump(mode="json"),
        )


async def _list_company_jobs_impl(
    company_id: uuid.UUID,
    limit: int = 10,
    statuses: list[JobStatus] | None = None,
) -> ToolResultEnvelope:
    safe_limit = max(1, min(limit, 20))

    async with AsyncSessionLocal() as db:
        query = select(Job).where(Job.company_id == company_id)
        if statuses:
            query = query.where(Job.status.in_(statuses))

        result = await db.execute(
            query.order_by(Job.updated_at.desc()).limit(safe_limit)
        )
        jobs = result.scalars().all()

    if not jobs:
        return ToolResultEnvelope(
            tool="list_company_jobs",
            ok=False,
            text="You don't have any company jobs posted yet.",
        )

    job_summaries = []
    for job in jobs:
        location = f", {job.location}" if job.location else ""
        job_summaries.append(
            f"{job.title} ({job.status.value}, {job.location_type.value}{location})"
        )

    total = len(jobs)
    intro = f"You currently have {total} company job{'s' if total != 1 else ''}"
    listing = "; ".join(job_summaries[:5])
    suffix = "." if total <= 5 else "; and more."

    return ToolResultEnvelope(
        tool="list_company_jobs",
        text=f"{intro}: {listing}{suffix}",
        data={
            "jobs": [
                {
                    "job_id": str(job.id),
                    "title": job.title,
                    "status": job.status.value,
                    "location": job.location,
                    "location_type": job.location_type.value,
                    "updated_at": job.updated_at.isoformat(),
                }
                for job in jobs
            ]
        },
    )


async def _search_company_candidates_impl(
    query: str,
    company_id: uuid.UUID,
    statuses: list[ApplicationStatus] | None = None,
    limit: int = 10,
) -> ToolResultEnvelope:
    status_values = [status.value for status in statuses] if statuses else None
    hits = await qdrant_service.search_applications(
        query,
        company_id=company_id,
        statuses=status_values,
        limit=limit,
    )
    if not hits:
        return ToolResultEnvelope(
            tool="search_company_candidates",
            ok=False,
            text="I couldn't find any matching candidates in your company history.",
        )

    hit_ids = [hit["application_id"] for hit in hits]
    hit_scores = {hit["application_id"]: hit["score"] for hit in hits}

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Application, Job, Profile)
            .join(Job, Job.id == Application.job_id)
            .outerjoin(Profile, Profile.user_id == Application.user_id)
            .where(Application.id.in_(hit_ids), Job.company_id == company_id)
            .options(selectinload(Application.resume).selectinload(Resume.skills))
        )
        rows = result.all()

    rows_by_application_id = {
        application.id: (application, job, profile)
        for application, job, profile in rows
    }
    cards: list[CandidateCardData] = []
    seen_users: set[uuid.UUID] = set()
    for application_id in hit_ids:
        row = rows_by_application_id.get(application_id)
        if row is None:
            continue
        application, job, profile = row
        if application.user_id in seen_users:
            continue
        seen_users.add(application.user_id)
        resume = application.resume
        skills = [skill.skill_name for skill in (resume.skills if resume else [])]
        cards.append(
            CandidateCardData(
                user_id=application.user_id,
                application_id=application.id,
                full_name=application.user.full_name,
                avatar_url=application.user.avatar_url,
                headline=(profile.headline if profile else None)
                or (resume.headline if resume else None),
                skills=skills,
                applied_for_job=job.title,
                application_status=application.status,
                score=application.score,
                feedback=application.feedback,
                match_score=round(float(hit_scores[application.id]), 4),
            )
        )

    result_data = CandidateSearchResult(total=len(cards), candidates=cards)
    text = (
        f"Found {len(cards)} matching candidate{'s' if len(cards) != 1 else ''}."
        if cards
        else "I couldn't find any matching candidates in your company history."
    )
    return ToolResultEnvelope(
        tool="search_company_candidates",
        ok=bool(cards),
        text=text,
        ui_type_hint=UIHint.candidate_list if cards else UIHint.text,
        data=result_data.model_dump(mode="json") if cards else None,
    )


async def _research_salary_impl(
    role: str, country: str, year: int | None = None
) -> ToolResultEnvelope:
    normalized_role = role.strip()
    normalized_country = country.strip()
    if not normalized_role or not normalized_country:
        return ToolResultEnvelope(
            tool="research_salary",
            ok=False,
            text="I need both a job role and a country before I can research salary data.",
        )

    search_input = await get_salary_research_data(
        role=normalized_role,
        country=normalized_country,
        year=year,
    )
    synthesized = await ai_service.generate_structured(
        system_prompt=SALARY_SYNTHESIS_SYSTEM_PROMPT,
        user_payload=search_input,
        schema_model=SalaryResearch,
    )
    result_data = SalaryResearchResult(
        role=synthesized.role,
        country=synthesized.country,
        currency=synthesized.currency,
        recommended_min=synthesized.recommended_min,
        recommended_max=synthesized.recommended_max,
        confidence=synthesized.confidence,
        rationale=synthesized.rationale,
        insufficient_evidence=synthesized.insufficient_evidence,
        year_context=str(search_input["year"]),
        sources=[
            SalarySource(
                source_name=source.source_name,
                url=source.url,
                country=source.country,
                currency=source.currency,
                quoted_min=source.quoted_min,
                quoted_max=source.quoted_max,
                notes=source.notes,
            )
            for source in synthesized.sources
        ],
    )
    return ToolResultEnvelope(
        tool="research_salary",
        text=f"Here is the salary research for {normalized_role} in {normalized_country}.",
        ui_type_hint=UIHint.salary_info,
        data=result_data.model_dump(mode="json"),
    )


async def _prepare_job_edit_impl(
    job_id: uuid.UUID,
    edits: list[JobEditInstruction],
    company_id: uuid.UUID,
) -> ToolResultEnvelope:
    async with AsyncSessionLocal() as db:
        job = await db.scalar(
            select(Job).where(Job.id == job_id, Job.company_id == company_id)
        )
        if job is None:
            return ToolResultEnvelope(
                tool="prepare_job_edit",
                ok=False,
                text="I couldn't find that job in your company.",
            )

    current_job = _job_to_chat_data(job)
    current_data = current_job.model_dump(mode="json")
    patch: dict[str, Any] = {}
    diffs: list[JobEditDiff] = []

    try:
        for edit in edits:
            before_value = patch.get(edit.field, current_data.get(edit.field))
            after_value = _apply_job_edit_instruction(before_value, edit)
            if before_value == after_value:
                continue
            patch[edit.field] = after_value
            diffs.append(
                JobEditDiff(
                    field=edit.field,
                    before=_normalize_for_diff(before_value),
                    after=_normalize_for_diff(after_value),
                )
            )
        if not patch:
            return ToolResultEnvelope(
                tool="prepare_job_edit",
                ok=False,
                text="There were no actual changes to propose for that job.",
            )
        JobUpdate.model_validate(patch)
    except Exception as exc:
        return ToolResultEnvelope(
            tool="prepare_job_edit",
            ok=False,
            text=f"I couldn't prepare that edit: {exc}",
        )

    proposal = JobEditProposal(
        job_id=job.id,
        job_title=job.title,
        summary=f"Prepared {len(diffs)} change(s) for '{job.title}'.",
        patch=patch,
        diffs=diffs,
    )
    return ToolResultEnvelope(
        tool="prepare_job_edit",
        text=proposal.summary,
        ui_type_hint=UIHint.job_edit_preview,
        data=proposal.model_dump(mode="json"),
    )


async def _apply_job_edit_impl(
    job_id: uuid.UUID,
    patch: dict,
    company_id: uuid.UUID,
    recruiter_id: uuid.UUID,
) -> ToolResultEnvelope:
    job_id = uuid.UUID(str(job_id))
    company_id = uuid.UUID(str(company_id))
    recruiter_id = uuid.UUID(str(recruiter_id))
    async with AsyncSessionLocal() as db:
        recruiter = await _load_active_recruiter(db, recruiter_id, company_id)
        background_tasks = BackgroundTasks()
        updated_job = await jobs_service.update_job(
            db=db,
            user=recruiter,
            job_id=str(job_id),
            payload=JobUpdate.model_validate(patch),
            bg_tasks=background_tasks,
        )
        await background_tasks()
        return ToolResultEnvelope(
            tool="apply_job_edit",
            text=f"Updated job '{updated_job.title}'.",
            data=updated_job.model_dump(mode="json"),
        )


async def _get_candidate_detail_impl(
    candidate_name: str,
    job_title_query: str,
    company_id: uuid.UUID,
) -> ToolResultEnvelope:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Application, Job, Profile)
            .join(Job, Job.id == Application.job_id)
            .join(User, User.id == Application.user_id)
            .outerjoin(Profile, Profile.user_id == Application.user_id)
            .where(
                Job.company_id == company_id,
                User.full_name.ilike(f"%{candidate_name.strip()}%"),
                Job.title.ilike(f"%{job_title_query.strip()}%"),
            )
            .options(
                selectinload(Application.resume).selectinload(Resume.experiences),
                selectinload(Application.resume).selectinload(Resume.educations),
                selectinload(Application.resume).selectinload(Resume.skills),
            )
            .order_by(Application.updated_at.desc())
            .limit(5)
        )
        rows = result.all()

    if not rows:
        return ToolResultEnvelope(
            tool="get_candidate_detail",
            ok=False,
            text=f"I couldn't find an application for {candidate_name} on '{job_title_query}'.",
        )
    if len(rows) > 1:
        matches = [
            {
                "application_id": str(application.id),
                "candidate_name": application.user.full_name,
                "job_title": job.title,
                "application_status": application.status.value,
            }
            for application, job, _profile in rows
        ]
        return ToolResultEnvelope(
            tool="get_candidate_detail",
            ok=False,
            text="I found multiple matching applications. Please clarify which one you want.",
            data={"matches": matches},
        )

    application, job, profile = rows[0]
    resume = application.resume
    detail = CandidateDetailData(
        user_id=application.user_id,
        application_id=application.id,
        job_id=job.id,
        job_title=job.title,
        full_name=application.user.full_name,
        email=application.user.email,
        avatar_url=application.user.avatar_url,
        headline=(profile.headline if profile else None)
        or (resume.headline if resume else None),
        summary=(profile.summary if profile else None)
        or (resume.summary if resume else None),
        resume_name=resume.resume_name if resume else "Unknown",
        application_status=application.status,
        score=application.score,
        feedback=application.feedback,
        applied_at=application.created_at,
        updated_at=application.updated_at,
        skills=list(resume.skills if resume else []),
        experiences=list(resume.experiences if resume else []),
        educations=list(resume.educations if resume else []),
    )
    return ToolResultEnvelope(
        tool="get_candidate_detail",
        text=f"Here are the application details for {detail.full_name}.",
        ui_type_hint=UIHint.candidate_detail,
        data=detail.model_dump(mode="json"),
    )


@tool
async def search_company_candidates(
    query: Annotated[
        str,
        "Semantic candidate search query, for example 'backend engineers with Python and fintech experience'.",
    ],
    statuses: Annotated[
        list[ApplicationStatus] | None,
        "Optional application statuses to filter by, such as shortlisted or interviewed.",
    ] = None,
    limit: Annotated[
        int,
        "Maximum number of candidates to return. Keep this small unless the recruiter explicitly asks for more.",
    ] = 10,
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """Search past company candidates semantically by skills, experience, or feedback."""
    company_id, _ = _state_ids(state)
    result = await _search_company_candidates_impl(query, company_id, statuses, limit)
    return _as_tool_message("search_company_candidates", result, tool_call_id)


@tool
async def research_salary(
    role: Annotated[
        str,
        "The exact job role to research salary for, for example 'Senior Backend Engineer'.",
    ],
    country: Annotated[
        str,
        "The country where compensation should be researched, for example 'Nepal' or 'United States'.",
    ],
    year: Annotated[
        int | None,
        "Optional year to anchor the research to. Leave empty to use the current year.",
    ] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """Research market salary ranges for a role and country."""
    result = await _research_salary_impl(role, country, year)
    return _as_tool_message("research_salary", result, tool_call_id)


@tool
async def find_company_job(
    title_query: Annotated[
        str,
        "Approximate job title to look up before editing, for example 'Senior Product Designer'.",
    ],
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """Find a company job by approximate title before preparing an edit."""
    company_id, _ = _state_ids(state)
    result = await _find_company_job_impl(title_query, company_id)
    return _as_tool_message("find_company_job", result, tool_call_id)


@tool
async def list_company_jobs(
    limit: Annotated[
        int,
        "Maximum number of company jobs to list. Keep this small unless the recruiter asks for a full inventory.",
    ] = 10,
    statuses: Annotated[
        list[JobStatus] | None,
        "Optional job statuses to filter by, such as active or draft.",
    ] = None,
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """List the company's jobs or confirm whether any jobs are posted."""
    company_id, _ = _state_ids(state)
    result = await _list_company_jobs_impl(company_id, limit, statuses)
    return _as_tool_message("list_company_jobs", result, tool_call_id)


@tool
async def prepare_job_edit(
    job_id: Annotated[
        str,
        "The company job ID returned by find_company_job.",
    ],
    edits: Annotated[
        list[JobEditInstruction],
        "One or more structured edit instructions describing which fields to change and how.",
    ],
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """Prepare one or more edits to a company job. This does not write to the database."""
    company_id, _ = _state_ids(state)
    result = await _prepare_job_edit_impl(uuid.UUID(job_id), edits, company_id)
    return _as_tool_message("prepare_job_edit", result, tool_call_id)


@tool
async def get_candidate_detail(
    candidate_name: Annotated[
        str,
        "Candidate name to look up, for example 'Asha Sharma'.",
    ],
    job_title_query: Annotated[
        str,
        "Job title the candidate applied for, for example 'Frontend Engineer'.",
    ],
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """Look up a specific candidate application by candidate name and job title."""
    company_id, _ = _state_ids(state)
    result = await _get_candidate_detail_impl(
        candidate_name, job_title_query, company_id
    )
    return _as_tool_message("get_candidate_detail", result, tool_call_id)


MODEL_TOOLS = [
    search_company_candidates,
    research_salary,
    find_company_job,
    list_company_jobs,
    prepare_job_edit,
    get_candidate_detail,
]
