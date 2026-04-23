from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructures.search.service import search_service
from app.modules.auth.enums import MembershipStatus
from app.modules.companies.models import Company
from app.modules.companies.models import CompanyMembership
from app.modules.jobs.models import Job
from app.shared.enums import JobStatus


def utcnow() -> datetime:
    """Return the current UTC datetime."""
    return datetime.now(timezone.utc)


async def get_active_company_id(
    db: AsyncSession,
    recruiter_id: uuid.UUID,
) -> uuid.UUID:
    """Return the active company ID for a recruiter user."""
    result = await db.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == recruiter_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company_id = result.scalar_one_or_none()
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active company membership required.",
        )
    return company_id


async def get_active_company(
    db: AsyncSession,
    recruiter_id: uuid.UUID,
) -> Company:
    """Return the active company for a recruiter user."""
    company = await db.scalar(
        select(Company)
        .join(CompanyMembership, CompanyMembership.company_id == Company.id)
        .where(
            CompanyMembership.user_id == recruiter_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    if not company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active company membership required.",
        )
    return company


async def get_company_jobs(
    db: AsyncSession,
    company_id: uuid.UUID,
) -> list[Job]:
    """List jobs belonging to a company."""
    rows = await db.execute(
        select(Job).where(Job.company_id == company_id).order_by(Job.created_at.desc())
    )
    return list(rows.scalars().all())


async def get_job_by_id_for_company(
    db: AsyncSession,
    company_id: uuid.UUID,
    job_id: uuid.UUID,
) -> Job:
    """Return one company-owned job by ID."""
    job = await db.scalar(
        select(Job).where(
            Job.id == job_id,
            Job.company_id == company_id,
        )
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found for this company.",
        )
    return job


def effective_job_status(job: Job) -> str:
    """Return the effective job status, accounting for expiry."""
    if (
        job.status == JobStatus.active
        and job.expires_at is not None
        and job.expires_at <= utcnow()
    ):
        return JobStatus.expired.value
    return job.status.value


def _normalize(text: str) -> str:
    """Normalize free-text job queries for fuzzy matching."""
    text = text.lower().strip()
    text = re.sub(r"\bml\b", "machine learning", text)
    text = re.sub(r"\bfe\b", "frontend", text)
    text = re.sub(r"\bbe\b", "backend", text)
    text = re.sub(r"\bds\b", "data science", text)
    text = re.sub(r"[^a-z0-9\s]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def find_job_matches(jobs: list[Job], user_text: str) -> list[Job]:
    """Return the best fuzzy job matches for a user query."""
    query = _normalize(user_text)
    scored: list[tuple[int, Job]] = []

    for job in jobs:
        title = _normalize(job.title)
        score = 0

        if query == title:
            score += 100
        if title in query or query in title:
            score += 50

        query_tokens = set(query.split())
        title_tokens = set(title.split())
        score += len(query_tokens & title_tokens) * 10

        if score > 0:
            scored.append((score, job))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [job for _, job in scored[:5]]


def serialize_job_option(job: Job) -> dict[str, Any]:
    """Serialize a job for chat selection options."""
    return {
        "job_id": str(job.id),
        "title": job.title,
        "location": job.location,
        "location_type": job.location_type.value if job.location_type else None,
        "status": effective_job_status(job),
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "currency": job.currency,
        "expires_at": job.expires_at.isoformat() if job.expires_at else None,
    }


def serialize_job_list_item(job: Job) -> dict[str, Any]:
    """Serialize a job for recruiter chat list responses."""
    return {
        "job_id": str(job.id),
        "title": job.title,
        "location": job.location,
        "location_type": job.location_type.value if job.location_type else None,
        "status": effective_job_status(job),
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "currency": job.currency,
        "expires_at": job.expires_at.isoformat() if job.expires_at else None,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
    }


def build_job_counts(jobs: list[Job]) -> dict[str, int]:
    """Count company jobs by effective status."""
    active = 0
    expired = 0
    draft = 0

    for job in jobs:
        current_status = effective_job_status(job)
        if current_status == JobStatus.active.value:
            active += 1
        elif current_status == JobStatus.expired.value:
            expired += 1
        elif current_status == JobStatus.draft.value:
            draft += 1

    return {
        "active": active,
        "expired": expired,
        "draft": draft,
        "total": len(jobs),
    }


async def search_web(
    query: str,
    *,
    max_results: int = 5,
    country: str | None = None,
) -> list[dict[str, Any]]:
    """Run a recruiter-chat web search query."""
    return await search_service.query(
        query=query,
        max_results=max_results,
        search_depth="advanced",
        country=country,
    )


def build_source_items(
    results: list[dict[str, Any]],
    limit: int = 4,
) -> list[dict[str, str]]:
    """Build compact source items from search results."""
    items: list[dict[str, str]] = []
    for row in results[:limit]:
        title = (row.get("title") or row.get("url") or "Source").strip()
        url = (row.get("url") or "").strip()
        if url:
            items.append({"title": title, "url": url})
    return items
