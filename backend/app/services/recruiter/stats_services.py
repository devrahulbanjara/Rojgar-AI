from datetime import timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core import BusinessLogicError, get_datetime
from app.models import (
    CandidateProfile,
    JobApplication,
    JobApplicationStatusHistory,
    JobPosting,
    User,
)


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

    @staticmethod
    def get_recent_activity(
        db: Session, user: User, limit: int = 20
    ) -> list[dict[str, Any]]:
        """Get recent activity for the organization."""
        if not user.organization_id:
            raise BusinessLogicError("User does not belong to an organization")

        organization_id = user.organization_id
        activities = []

        # Get recent applications (last 7 days)
        seven_days_ago = get_datetime() - timedelta(days=7)

        # Applications
        applications_stmt = (
            select(JobApplication)
            .where(
                JobApplication.organization_id == organization_id,
                JobApplication.applied_at >= seven_days_ago,
            )
            .options(
                selectinload(JobApplication.job),
                selectinload(JobApplication.organization),
            )
            .order_by(JobApplication.applied_at.desc())
            .limit(limit)
        )
        applications = db.execute(applications_stmt).scalars().all()

        for app in applications:
            # Get candidate name
            candidate_profile = db.scalar(
                select(CandidateProfile).where(
                    CandidateProfile.profile_id == app.candidate_profile_id
                )
            )
            candidate_user = None
            if candidate_profile:
                candidate_user = db.scalar(
                    select(User).where(User.user_id == candidate_profile.user_id)
                )

            candidate_name = (
                candidate_user.name if candidate_user else "Unknown Candidate"
            )

            activities.append(
                {
                    "id": str(app.application_id),
                    "type": "application",
                    "user": candidate_name,
                    "action": "applied for",
                    "target": app.job.title if app.job else "Unknown Job",
                    "timestamp": app.applied_at.isoformat(),
                    "metadata": {
                        "application_id": str(app.application_id),
                        "job_id": str(app.job_id),
                        "status": app.current_status,
                    },
                }
            )

        # Get recent status changes (last 7 days)
        status_changes_stmt = (
            select(JobApplicationStatusHistory)
            .join(JobApplication)
            .where(
                JobApplication.organization_id == organization_id,
                JobApplicationStatusHistory.changed_at >= seven_days_ago,
            )
            .options(
                selectinload(JobApplicationStatusHistory.application).selectinload(
                    JobApplication.job
                ),
            )
            .order_by(JobApplicationStatusHistory.changed_at.desc())
            .limit(limit)
        )
        status_changes = db.execute(status_changes_stmt).scalars().all()

        for history in status_changes:
            app = history.application
            # Get candidate name
            candidate_profile = db.scalar(
                select(CandidateProfile).where(
                    CandidateProfile.profile_id == app.candidate_profile_id
                )
            )
            candidate_user = None
            if candidate_profile:
                candidate_user = db.scalar(
                    select(User).where(User.user_id == candidate_profile.user_id)
                )

            candidate_name = (
                candidate_user.name if candidate_user else "Unknown Candidate"
            )

            activities.append(
                {
                    "id": str(history.status_history_id),
                    "type": "status_change",
                    "user": candidate_name,
                    "action": f"updated status to {history.status}",
                    "target": app.job.title if app.job else "Unknown Job",
                    "timestamp": history.changed_at.isoformat(),
                    "metadata": {
                        "application_id": str(app.application_id),
                        "job_id": str(app.job_id),
                        "status": history.status,
                    },
                }
            )

        # Get recent job posts (last 7 days)
        jobs_stmt = (
            select(JobPosting)
            .where(
                JobPosting.organization_id == organization_id,
                JobPosting.created_at >= seven_days_ago,
            )
            .order_by(JobPosting.created_at.desc())
            .limit(limit)
        )
        jobs = db.execute(jobs_stmt).scalars().all()

        for job in jobs:
            recruiter_name = None
            if job.created_by_user_id:
                recruiter_user = db.scalar(
                    select(User).where(User.user_id == job.created_by_user_id)
                )
                recruiter_name = recruiter_user.name if recruiter_user else None

            activities.append(
                {
                    "id": str(job.job_id),
                    "type": "job_post",
                    "user": recruiter_name or "System",
                    "action": "posted new job",
                    "target": job.title,
                    "timestamp": job.created_at.isoformat(),
                    "metadata": {
                        "job_id": str(job.job_id),
                    },
                }
            )

        # Sort all activities by timestamp (most recent first)
        activities.sort(key=lambda x: x["timestamp"], reverse=True)

        # Return top N activities
        return activities[:limit]
