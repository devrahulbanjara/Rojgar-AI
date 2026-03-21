import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json
import re

from app.infrastructures.redis.service import redis_service

from app.infrastructures.search.service import search_service
from app.modules.companies.models import Company, CompanyMembership
from app.modules.job_ai.helpers import (
    MAX_SALARY_CONTENT_CHARS,
    MAX_SALARY_SEARCH_RESULTS,
    MAX_SALARY_TITLE_CHARS,
    truncate_text,
)
from app.modules.jobs.models import Job
from app.modules.auth.enums import MembershipStatus
from app.shared.enums import JobStatus


async def get_recruiter_company_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID:
    result = await db.execute(
        select(CompanyMembership.company_id).where(
            CompanyMembership.user_id == user_id,
            CompanyMembership.status == MembershipStatus.active,
        )
    )
    company_id = result.scalar_one_or_none()
    if not company_id:
        raise ValueError("Active company membership required")
    return company_id


async def get_company_context(
    db: AsyncSession, company_id: uuid.UUID
) -> dict[str, Any]:
    company = await db.scalar(select(Company).where(Company.id == company_id))
    if not company:
        raise ValueError("Company not found")

    jobs = await db.scalars(
        select(Job)
        .where(Job.company_id == company_id)
        .order_by(Job.updated_at.desc())
        .limit(5)
    )
    recent_jobs = list(jobs)

    return {
        "company": {
            "id": str(company.id),
            "name": company.name,
            "industry": company.industry,
            "website_url": company.website_url,
            "location": company.location,
            "description": company.description,
        },
        "recent_jobs": [
            {
                "id": str(job.id),
                "title": job.title,
                "location": job.location,
                "location_type": job.location_type.value if job.location_type else None,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "currency": job.currency,
                "overview": job.overview,
                "requirements": job.requirements,
                "preferred_qualifications": job.preferred_qualifications,
                "benefits": job.benefits,
                "auto_shortlist": job.auto_shortlist,
            }
            for job in recent_jobs
        ],
        "allowed_location_types": ["remote", "onsite", "hybrid"],
        "default_status": JobStatus.draft.value,
    }


async def get_source_job_context(
    db: AsyncSession, job_id: uuid.UUID
) -> dict[str, Any] | None:
    job = await db.scalar(select(Job).where(Job.id == job_id))
    if not job:
        return None

    return {
        "id": str(job.id),
        "title": job.title,
        "location": job.location,
        "location_type": job.location_type.value if job.location_type else None,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "currency": job.currency,
        "status": job.status.value,
        "overview": job.overview,
        "responsibilities": job.responsibilities,
        "requirements": job.requirements,
        "preferred_qualifications": job.preferred_qualifications,
        "benefits": job.benefits,
        "auto_shortlist": job.auto_shortlist,
    }


async def get_salary_research_data(role: str, country: str) -> dict[str, Any]:
    """
    Research salary and compensation data for a given role and location.
    Cached for 24 hours since salary data doesn't change rapidly.
    """
    # 1. Standardize inputs to create a stable cache key
    norm_role = re.sub(r"[^a-zA-Z0-9]+", "_", role.lower()).strip("_")
    norm_country = re.sub(r"[^a-zA-Z0-9]+", "_", country.lower()).strip("_")
    cache_key = f"ai:salary_research:{norm_role}:{norm_country}"

    # 2. Check Cache
    cached_data = await redis_service.get(cache_key)
    if cached_data:
        try:
            return json.loads(cached_data)
        except Exception:
            pass

    queries = [
        f"{role} salary range in {country} 2026",
        f"{role} compensation in {country} 2026",
        f"{role} salary {country}",
    ]

    aggregated: list[dict[str, Any]] = []
    seen_urls: set[str] = set()

    for query in queries:
        results = await search_service.query(query, country=country.lower())

        for res in results:
            url = res.get("url")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            aggregated.append(
                {
                    "title": truncate_text(res.get("title"), MAX_SALARY_TITLE_CHARS),
                    "url": url,
                    "content": truncate_text(
                        res.get("content"), MAX_SALARY_CONTENT_CHARS
                    ),
                    "score": res.get("relevance_score"),
                }
            )
            if len(aggregated) >= MAX_SALARY_SEARCH_RESULTS:
                break
        if len(aggregated) >= MAX_SALARY_SEARCH_RESULTS:
            break

    response = {
        "role": role,
        "country": country,
        "results": aggregated,
    }

    # 4. Save to Cache (TTL 24 hours - 86400 seconds)
    await redis_service.set(cache_key, json.dumps(response), ttl_seconds=86400)

    return response
