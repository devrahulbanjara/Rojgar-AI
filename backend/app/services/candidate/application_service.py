from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.application import JobApplication
from app.models.candidate import CandidateProfile


class ApplicationService:
    @staticmethod
    def get_candidate_applications(db: Session, user_id: str):
        stmt = select(CandidateProfile.profile_id).where(
            CandidateProfile.user_id == user_id
        )
        profile_id = db.execute(stmt).scalar_one_or_none()

        if not profile_id:
            return []

        stmt = (
            select(JobApplication)
            .where(JobApplication.candidate_profile_id == profile_id)
            .options(
                selectinload(JobApplication.job), selectinload(JobApplication.company)
            )
            .order_by(JobApplication.updated_at.desc())
        )
        apps = db.execute(stmt).scalars().all()
        return apps

    @staticmethod
    def apply_to_job(db: Session, user_id: str, job_id: str, resume_id: str):
        pass
