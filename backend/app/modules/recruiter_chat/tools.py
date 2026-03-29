from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Annotated, Any

from fastapi import BackgroundTasks
from langchain.messages import ToolMessage
from langchain_core.tools import InjectedToolCallId, tool
from langgraph.prebuilt import InjectedState
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.infrastructures.ai.service import ai_service
from app.infrastructures.qdrant.service import qdrant_service
from app.infrastructures.search.service import search_service
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipStatus
from app.modules.auth.models import User
from app.modules.companies.models import CompanyMembership
from app.modules.job_ai.helpers import truncate_text
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
    CompanyJobListResult,
    JobEditDiff,
    JobEditInstruction,
    JobEditProposal,
    SalaryResearchResult,
    SalarySource,
    ToolResultEnvelope,
)
from app.modules.resumes.models import Resume
from app.shared.enums import ApplicationStatus, JobStatus


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
    job_list = "job_list"
    salary_info = "salary_info"
    candidate_detail = "candidate_detail"
    job_edit_preview = "job_edit_preview"
    job_clarification = "job_clarification"
    candidate_clarification = "candidate_clarification"


def _state_ids(state: dict[str, Any]) -> tuple[uuid.UUID, uuid.UUID]:
    return uuid.UUID(str(state["company_id"])), uuid.UUID(str(state["recruiter_id"]))


def _as_tool_message(
    tool_name: str, result: ToolResultEnvelope, tool_call_id: str
) -> ToolMessage:
    if not tool_call_id:
        raise ValueError(f"Missing tool_call_id for tool '{tool_name}'.")
    return ToolMessage(
        content=result.model_dump_json(), name=tool_name, tool_call_id=tool_call_id
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
    field, operation, value = (
        instruction.field,
        instruction.operation,
        instruction.value,
    )

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


async def _list_company_jobs_impl(
    company_id: uuid.UUID,
    statuses: list[JobStatus] | None = None,
) -> ToolResultEnvelope:
    """
    Returns ALL jobs for this company with no artificial limit.
    The LLM uses this full list to understand which job the recruiter means.
    Strictly scoped to the authenticated company for security.
    """
    async with AsyncSessionLocal() as db:
        query = select(Job).where(Job.company_id == company_id)
        if statuses:
            query = query.where(Job.status.in_(statuses))
        result = await db.execute(query.order_by(Job.updated_at.desc()))
        jobs = result.scalars().all()

    if not jobs:
        if statuses:
            readable_statuses = ", ".join(
                status.value.replace("_", " ") for status in statuses
            )
            empty_text = f"You do not have any {readable_statuses} jobs right now."
        else:
            empty_text = "You do not have any jobs posted yet."
        return ToolResultEnvelope(
            tool="list_company_jobs",
            ok=False,
            text=empty_text,
        )

    job_cards = [_job_to_chat_data(job) for job in jobs]
    total = len(job_cards)
    return ToolResultEnvelope(
        tool="list_company_jobs",
        text=f"Found {total} job{'s' if total != 1 else ''} for your company.",
        ui_type_hint=UIHint.job_list,
        data=CompanyJobListResult(total=total, jobs=job_cards).model_dump(mode="json"),
    )


async def _clarify_job_selection_impl(
    job_id: str,
    job_title: str,
    question: str,
    company_id: uuid.UUID,
) -> ToolResultEnvelope:
    """Security check: confirm the job belongs to this company before emitting a clarification interrupt."""
    try:
        parsed_job_id = uuid.UUID(job_id)
    except ValueError:
        return ToolResultEnvelope(
            tool="clarify_job_selection", ok=False, text="Invalid job ID."
        )

    async with AsyncSessionLocal() as db:
        job = await db.scalar(
            select(Job).where(Job.id == parsed_job_id, Job.company_id == company_id)
        )

    if job is None:
        return ToolResultEnvelope(
            tool="clarify_job_selection",
            ok=False,
            text="That job was not found in your company.",
        )

    return ToolResultEnvelope(
        tool="clarify_job_selection",
        ok=True,
        text=question,
        ui_type_hint=UIHint.job_clarification,
        data={
            "job_id": str(job.id),
            "job_title": job.title,
            "status": job.status.value,
            "location": job.location,
            "question": question,
        },
    )


async def _clarify_candidate_selection_impl(
    application_id: str,
    candidate_name: str,
    job_title: str,
    question: str,
    company_id: uuid.UUID,
) -> ToolResultEnvelope:
    """Security check: confirm the application belongs to a company job before emitting clarification."""
    try:
        parsed_app_id = uuid.UUID(application_id)
    except ValueError:
        return ToolResultEnvelope(
            tool="clarify_candidate_selection", ok=False, text="Invalid application ID."
        )

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Application, Job)
            .join(Job, Job.id == Application.job_id)
            .where(Application.id == parsed_app_id, Job.company_id == company_id)
        )
        row = result.one_or_none()

    if row is None:
        return ToolResultEnvelope(
            tool="clarify_candidate_selection",
            ok=False,
            text="That application was not found in your company.",
        )

    application, job = row
    return ToolResultEnvelope(
        tool="clarify_candidate_selection",
        ok=True,
        text=question,
        ui_type_hint=UIHint.candidate_clarification,
        data={
            "application_id": str(application.id),
            "candidate_name": candidate_name,
            "job_title": job.title,
            "application_status": application.status.value,
            "question": question,
        },
    )


async def _search_company_candidates_impl(
    query: str,
    company_id: uuid.UUID,
    statuses: list[ApplicationStatus] | None = None,
    limit: int = 10,
) -> ToolResultEnvelope:
    min_match_score = 0.3
    status_values = [s.value for s in statuses] if statuses else None
    hits = await qdrant_service.search_applications(
        query, company_id=company_id, statuses=status_values, limit=limit
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

    rows_by_id = {app.id: (app, job, profile) for app, job, profile in rows}
    cards: list[CandidateCardData] = []
    seen_users: set[uuid.UUID] = set()
    for app_id in hit_ids:
        row = rows_by_id.get(app_id)
        if not row:
            continue
        app, job, profile = row
        if app.user_id in seen_users:
            continue
        match_score = round(float(hit_scores[app.id]), 4)
        if match_score < min_match_score:
            continue
        seen_users.add(app.user_id)
        resume = app.resume
        skills = [s.skill_name for s in (resume.skills if resume else [])]
        cards.append(
            CandidateCardData(
                user_id=app.user_id,
                application_id=app.id,
                full_name=app.user.full_name,
                avatar_url=app.user.avatar_url,
                headline=(profile.headline if profile else None)
                or (resume.headline if resume else None),
                skills=skills,
                applied_for_job=job.title,
                application_status=app.status,
                score=app.score,
                feedback=app.feedback,
                match_score=match_score,
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
        role=normalized_role, country=normalized_country, year=year
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
                source_name=s.source_name,
                url=s.url,
                country=s.country,
                currency=s.currency,
                quoted_min=s.quoted_min,
                quoted_max=s.quoted_max,
                notes=s.notes,
            )
            for s in synthesized.sources
        ],
    )

    source_urls = {source.url for source in result_data.sources}
    fallback_sources = []
    for candidate in search_input.get("results", []):
        url = candidate.get("url")
        title = candidate.get("title")
        if not url or url in source_urls:
            continue
        fallback_sources.append(
            SalarySource(
                source_name=str(title or "Web search result"),
                url=str(url),
                country=normalized_country,
                currency=synthesized.currency,
                quoted_min=None,
                quoted_max=None,
                notes=truncate_text(candidate.get("content"), 180),
            )
        )
        source_urls.add(url)
        if len(result_data.sources) + len(fallback_sources) >= 3:
            break

    if fallback_sources and len(result_data.sources) < 3:
        result_data.sources.extend(
            fallback_sources[: max(0, 3 - len(result_data.sources))]
        )
    return ToolResultEnvelope(
        tool="research_salary",
        text=f"Here is the salary research for {normalized_role} in {normalized_country}.",
        ui_type_hint=UIHint.salary_info,
        data=result_data.model_dump(mode="json"),
    )


async def _prepare_job_edit_impl(
    job_id: uuid.UUID, edits: list[JobEditInstruction], company_id: uuid.UUID
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

    current_data = _job_to_chat_data(job).model_dump(mode="json")
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
                text="There were no actual changes to propose.",
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
    job_id: uuid.UUID, patch: dict, company_id: uuid.UUID, recruiter_id: uuid.UUID
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
    candidate_name: str, job_id: str, company_id: uuid.UUID
) -> ToolResultEnvelope:
    """
    Look up a candidate's application using the confirmed job UUID.
    """
    try:
        parsed_job_id = uuid.UUID(job_id)
    except ValueError:
        return ToolResultEnvelope(
            tool="get_candidate_detail",
            ok=False,
            text="Invalid job ID. Use clarify_job_selection first.",
        )

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Application, Job, Profile)
            .join(Job, Job.id == Application.job_id)
            .join(User, User.id == Application.user_id)
            .outerjoin(Profile, Profile.user_id == Application.user_id)
            .where(
                Job.company_id == company_id,
                Job.id == parsed_job_id,
                User.full_name.ilike(f"%{candidate_name.strip()}%"),
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
            text=f"I couldn't find an application for '{candidate_name}' on that job.",
        )

    if len(rows) > 1:
        matches = [
            {
                "application_id": str(app.id),
                "candidate_name": app.user.full_name,
                "job_title": job.title,
                "application_status": app.status.value,
            }
            for app, job, _ in rows
        ]
        return ToolResultEnvelope(
            tool="get_candidate_detail",
            ok=False,
            text="Multiple candidates matched that name. Use clarify_candidate_selection to confirm which one.",
            data={"matches": matches},
        )

    app, job, profile = rows[0]
    resume = app.resume
    detail = CandidateDetailData(
        user_id=app.user_id,
        application_id=app.id,
        job_id=job.id,
        job_title=job.title,
        full_name=app.user.full_name,
        email=app.user.email,
        avatar_url=app.user.avatar_url,
        headline=(profile.headline if profile else None)
        or (resume.headline if resume else None),
        summary=(profile.summary if profile else None)
        or (resume.summary if resume else None),
        resume_name=resume.resume_name if resume else "Unknown",
        application_status=app.status,
        score=app.score,
        feedback=app.feedback,
        applied_at=app.created_at,
        updated_at=app.updated_at,
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
async def list_company_jobs(
    statuses: Annotated[
        list[JobStatus] | None,
        "Optional status filter (active, draft, closed). Leave null to return all jobs.",
    ] = None,
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """
    Return ALL jobs for this company so you can reason about which one the recruiter means.
    Call this whenever the recruiter references a job by title — especially abbreviated or
    partial titles like 'ml engineer', 'the senior fe role', 'that data job'. After seeing
    the full list, use clarify_job_selection to confirm if there is any ambiguity.
    Results are strictly scoped to the authenticated company.
    """
    company_id, _ = _state_ids(state)
    result = await _list_company_jobs_impl(company_id, statuses)
    return _as_tool_message("list_company_jobs", result, tool_call_id)


@tool
async def clarify_job_selection(
    job_id: Annotated[
        str,
        "UUID of the job you believe the recruiter means. Must come from list_company_jobs results.",
    ],
    job_title: Annotated[
        str, "Full job title as stored in the database, for the confirmation card."
    ],
    question: Annotated[
        str,
        "Question to show the recruiter, e.g. 'Did you mean Machine Learning Engineer?'",
    ],
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """
    After identifying which job the recruiter likely means from list_company_jobs, call this
    to ask the recruiter for confirmation. The frontend shows a 'Did you mean X?' card with
    Yes / No buttons. Always call this before prepare_job_edit or get_candidate_detail when
    the recruiter's job reference was ambiguous or abbreviated.
    """
    company_id, _ = _state_ids(state)
    result = await _clarify_job_selection_impl(job_id, job_title, question, company_id)
    return _as_tool_message("clarify_job_selection", result, tool_call_id)


@tool
async def clarify_candidate_selection(
    application_id: Annotated[
        str, "UUID of the application from search_company_candidates results."
    ],
    candidate_name: Annotated[str, "Candidate's full name for the confirmation card."],
    job_title: Annotated[str, "Job title the candidate applied for."],
    question: Annotated[
        str,
        "Question to show, e.g. 'Did you mean Asha Sharma for Machine Learning Engineer?'",
    ],
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """
    When search_company_candidates returns a likely candidate match but the query was ambiguous,
    call this to confirm with the recruiter before showing full details.
    """
    company_id, _ = _state_ids(state)
    result = await _clarify_candidate_selection_impl(
        application_id, candidate_name, job_title, question, company_id
    )
    return _as_tool_message("clarify_candidate_selection", result, tool_call_id)


@tool
async def search_company_candidates(
    query: Annotated[
        str,
        "Semantic search query, e.g. 'backend engineers with Python and fintech experience'.",
    ],
    statuses: Annotated[
        list[ApplicationStatus] | None, "Optional application status filter."
    ] = None,
    limit: Annotated[int, "Max candidates to return."] = 10,
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """Search past company candidates semantically by skills, experience, or feedback."""
    company_id, _ = _state_ids(state)
    result = await _search_company_candidates_impl(query, company_id, statuses, limit)
    return _as_tool_message("search_company_candidates", result, tool_call_id)


@tool
async def research_salary(
    role: Annotated[str, "The job role to research salary for."],
    country: Annotated[str, "The country to research compensation in."],
    year: Annotated[int | None, "Optional year. Defaults to current year."] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """Research market salary ranges for a role and country."""
    result = await _research_salary_impl(role, country, year)
    return _as_tool_message("research_salary", result, tool_call_id)


@tool
async def web_search(
    query: Annotated[str, "Search query to look up on the web."],
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """
    Search the web for information that may be time-sensitive, uncertain, or outside
    the model's reliable knowledge. Do not guess when a quick search can verify it.
    """
    results = await search_service.query(query, max_results=4)
    if not results:
        result = ToolResultEnvelope(
            tool="web_search",
            ok=False,
            text="No results found for that query.",
        )
    else:
        snippets: list[str] = []
        sources: list[dict[str, str]] = []
        for row in results:
            title = row.get("title") or "Untitled result"
            content = (row.get("content") or "")[:300]
            url = row.get("url") or ""
            snippets.append(f"[{title}]({url}): {content}")
            if url:
                sources.append(
                    {
                        "title": title,
                        "url": url,
                        "snippet": (row.get("content") or "")[:150],
                    }
                )
        result = ToolResultEnvelope(
            tool="web_search",
            ok=True,
            text="\n\n".join(snippets),
            ui_type_hint=UIHint.text,
            data={"sources": sources},
        )

    return _as_tool_message("web_search", result, tool_call_id)


@tool
async def prepare_job_edit(
    job_id: Annotated[
        str, "Confirmed job UUID from clarify_job_selection. Never guess this."
    ],
    edits: Annotated[
        list[JobEditInstruction], "One or more structured edit instructions."
    ],
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """Prepare edits to a company job. Does NOT write to the database — the recruiter must confirm first."""
    company_id, _ = _state_ids(state)
    result = await _prepare_job_edit_impl(uuid.UUID(job_id), edits, company_id)
    return _as_tool_message("prepare_job_edit", result, tool_call_id)


@tool
async def get_candidate_detail(
    candidate_name: Annotated[str, "Candidate's name (partial match supported)."],
    job_id: Annotated[
        str, "Confirmed job UUID from clarify_job_selection. Never guess this."
    ],
    state: Annotated[dict[str, Any], InjectedState] = None,
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> ToolMessage:
    """
    Fetch full application details for a candidate on a specific job.
    Requires confirmed job_id - do not guess. If multiple candidates match the name,
    use clarify_candidate_selection.
    """
    company_id, _ = _state_ids(state)
    result = await _get_candidate_detail_impl(candidate_name, job_id, company_id)
    return _as_tool_message("get_candidate_detail", result, tool_call_id)


MODEL_TOOLS = [
    list_company_jobs,
    clarify_job_selection,
    clarify_candidate_selection,
    search_company_candidates,
    research_salary,
    web_search,
    prepare_job_edit,
    get_candidate_detail,
]
