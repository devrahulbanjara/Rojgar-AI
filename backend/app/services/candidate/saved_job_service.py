import math
import uuid
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.candidate import CandidateProfile, CandidateSavedJob
from app.models.job import JobPosting


class SavedJobService:
    @staticmethod
    def toggle_save_job(db: Session, user_id: uuid.UUID, job_id: uuid.UUID) -> dict:
        # Get profile_id
        profile_stmt = select(CandidateProfile.profile_id).where(
            CandidateProfile.user_id == user_id
        )
        profile_id = db.execute(profile_stmt).scalar_one_or_none()
        if not profile_id:
            raise ValueError("Candidate profile not found")

        # Check existence
        check_stmt = select(CandidateSavedJob).where(
            CandidateSavedJob.candidate_profile_id == profile_id,
            CandidateSavedJob.job_id == job_id,
        )
        existing = db.execute(check_stmt).scalar_one_or_none()

        if existing:
            # Unsave
            del_stmt = delete(CandidateSavedJob).where(
                CandidateSavedJob.candidate_profile_id == profile_id,
                CandidateSavedJob.job_id == job_id,
            )
            db.execute(del_stmt)
            db.commit()
            return {"status": "Job unsaved successfully"}
        else:
            # Save
            new_save = CandidateSavedJob(candidate_profile_id=profile_id, job_id=job_id)
            db.add(new_save)
            db.commit()
            return {"status": "Job saved successfully"}

    @staticmethod
    def get_my_saved_jobs(
        db: Session, user_id: uuid.UUID, page: int = 1, limit: int = 10
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

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.execute(count_stmt).scalar_one() or 0

        # Paginate and Load
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
        jobs = list(db.execute(jobs_stmt).scalars().all())

        total_pages = math.ceil(total / limit) if limit > 0 else 0

        # Inject is_saved (always True for saved jobs)
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
    def get_saved_job_ids(db: Session, user_id: uuid.UUID) -> set[uuid.UUID]:
        stmt = (
            select(CandidateSavedJob.job_id)
            .join(
                CandidateProfile,
                CandidateSavedJob.candidate_profile_id == CandidateProfile.profile_id,
            )
            .where(CandidateProfile.user_id == user_id)
        )
        return set(job_id for job_id in db.execute(stmt).scalars().all())

    @staticmethod
    def is_job_saved(db: Session, user_id: uuid.UUID, job_id: uuid.UUID) -> bool:
        """Check if a specific job is saved by the candidate."""
        stmt = (
            select(CandidateSavedJob)
            .join(
                CandidateProfile,
                CandidateSavedJob.candidate_profile_id == CandidateProfile.profile_id,
            )
            .where(
                CandidateProfile.user_id == user_id,
                CandidateSavedJob.job_id == job_id,
            )
        )
        return db.execute(stmt).scalar_one_or_none() is not None
