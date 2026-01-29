from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import BusinessLogicError
from app.models import JobApplication, JobPosting, User


class RecruiterStatsService:
    @staticmethod
    def get_active_jobs_count(db: Session, user: User) -> int:
        if not user.organization_id:
            raise BusinessLogicError("User does not belong to an organization")

        count_stmt = (
            select(func.count())
            .select_from(JobPosting)
            .where(
                JobPosting.organization_id == user.organization_id,
                JobPosting.status == "active",
            )
        )
        count = db.execute(count_stmt).scalar_one()

        return count

    @staticmethod
    def get_active_candidates_count(db: Session, user: User) -> int:
        if not user.organization_id:
            raise BusinessLogicError("User does not belong to an organization")

        count_stmt = (
            select(func.count(func.distinct(JobApplication.candidate_profile_id)))
            .select_from(JobApplication)
            .where(
                JobApplication.organization_id == user.organization_id,
                JobApplication.current_status != "rejected",
            )
        )
        count = db.execute(count_stmt).scalar_one()

        return count
