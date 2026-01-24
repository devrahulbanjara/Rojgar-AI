from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import JobPosting, User


class RecruiterStatsService:
    @staticmethod
    def get_active_jobs_count(db: Session, user_id: str) -> int:
        user = db.query(User).filter(User.user_id == user_id).first()

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

        count = (
            db.query(JobPosting)
            .filter(
                JobPosting.organization_id == user.organization_id,
                JobPosting.status == "active",
            )
            .count()
        )

        return count
