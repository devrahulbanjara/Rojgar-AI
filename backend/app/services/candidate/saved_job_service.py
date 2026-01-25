from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.candidate import CandidateProfile, CandidateSavedJob
from app.models.job import JobPosting


class SavedJobService:
    @staticmethod
    def toggle_save_job(db: Session, user_id: str, job_id: str) -> dict:
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
    def get_my_saved_jobs(db: Session, user_id: str) -> list[JobPosting]:
        stmt = (
            select(JobPosting)
            .join(CandidateSavedJob, JobPosting.job_id == CandidateSavedJob.job_id)
            .join(
                CandidateProfile,
                CandidateSavedJob.candidate_profile_id == CandidateProfile.profile_id,
            )
            .where(CandidateProfile.user_id == user_id)
            .options(
                selectinload(JobPosting.organization),
                selectinload(JobPosting.job_description),
            )
            .order_by(CandidateSavedJob.saved_at.desc())
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def get_saved_job_ids(db: Session, user_id: str) -> set[str]:
        stmt = (
            select(CandidateSavedJob.job_id)
            .join(
                CandidateProfile,
                CandidateSavedJob.candidate_profile_id == CandidateProfile.profile_id,
            )
            .where(CandidateProfile.user_id == user_id)
        )
        return set(str(job_id) for job_id in db.execute(stmt).scalars().all())

    @staticmethod
    def is_job_saved(db: Session, user_id: str, job_id: str) -> bool:
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
