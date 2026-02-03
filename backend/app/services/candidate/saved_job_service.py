import math
import uuid
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import CandidateNotFoundError
from app.models.candidate import CandidateProfile, CandidateSavedJob
from app.models.job import JobPosting


class SavedJobService:
    @staticmethod
    async def toggle_save_job(
        db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
    ) -> dict:
        profile_stmt = select(CandidateProfile.profile_id).where(
            CandidateProfile.user_id == user_id
        )
        profile_result = await db.execute(profile_stmt)
        profile_id = profile_result.scalar_one_or_none()
        if not profile_id:
            raise CandidateNotFoundError(
                message="Candidate profile not found",
                details={
                    "user_id": str(user_id),
                    "job_id": str(job_id),
                    "operation": "toggle_save_job",
                },
                user_id=user_id,
            )
        check_stmt = select(CandidateSavedJob).where(
            CandidateSavedJob.candidate_profile_id == profile_id,
            CandidateSavedJob.job_id == job_id,
        )
        check_result = await db.execute(check_stmt)
        existing = check_result.scalar_one_or_none()
        if existing:
            del_stmt = delete(CandidateSavedJob).where(
                CandidateSavedJob.candidate_profile_id == profile_id,
                CandidateSavedJob.job_id == job_id,
            )
            await db.execute(del_stmt)
            await db.commit()
            return {"status": "Job unsaved successfully"}
        else:
            new_save = CandidateSavedJob(candidate_profile_id=profile_id, job_id=job_id)
            db.add(new_save)
            await db.commit()
            return {"status": "Job saved successfully"}

    @staticmethod
    async def get_my_saved_jobs(
        db: AsyncSession, user_id: uuid.UUID, page: int = 1, limit: int = 10
    ) -> dict[str, Any]:
        stmt = (
            select(JobPosting)
            .join(CandidateSavedJob, JobPosting.job_id == CandidateSavedJob.job_id)
            .join(
                CandidateProfile,
                CandidateSavedJob.candidate_profile_id == CandidateProfile.profile_id,
            )
            .where(CandidateProfile.user_id == user_id)
        )
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await db.execute(count_stmt)
        total = total_result.scalar_one() or 0
        offset = (page - 1) * limit
        jobs_stmt = (
            stmt.options(
                selectinload(JobPosting.organization),
                selectinload(JobPosting.job_description),
            )
            .order_by(CandidateSavedJob.saved_at.desc())
            .offset(offset)
            .limit(limit)
        )
        jobs_result = await db.execute(jobs_stmt)
        jobs = list(jobs_result.scalars().all())
        total_pages = math.ceil(total / limit) if limit > 0 else 0
        for job in jobs:
            job.is_saved = True
        return {
            "jobs": jobs,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }

    @staticmethod
    async def get_saved_job_ids(db: AsyncSession, user_id: uuid.UUID) -> set[uuid.UUID]:
        stmt = (
            select(CandidateSavedJob.job_id)
            .join(
                CandidateProfile,
                CandidateSavedJob.candidate_profile_id == CandidateProfile.profile_id,
            )
            .where(CandidateProfile.user_id == user_id)
        )
        result = await db.execute(stmt)
        return set(job_id for job_id in result.scalars().all())

    @staticmethod
    async def is_job_saved(
        db: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
    ) -> bool:
        stmt = (
            select(CandidateSavedJob)
            .join(
                CandidateProfile,
                CandidateSavedJob.candidate_profile_id == CandidateProfile.profile_id,
            )
            .where(
                CandidateProfile.user_id == user_id, CandidateSavedJob.job_id == job_id
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none() is not None
