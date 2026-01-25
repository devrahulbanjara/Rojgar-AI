from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import JobPosting, User


class RecruiterStatsService:
    @staticmethod
    def get_active_jobs_count(db: Session, user_id: str) -> int:
        user_stmt = select(User).where(User.user_id == user_id)
        user = db.execute(user_stmt).scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if not user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not belong to an organization",
            )

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
