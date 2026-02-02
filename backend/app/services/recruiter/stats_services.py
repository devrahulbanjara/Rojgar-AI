import uuid
from datetime import timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core import BusinessLogicError, get_datetime
from app.models import (
    CandidateProfile,
    JobApplication,
    JobApplicationStatusHistory,
    JobPosting,
    User,
)


class RecruiterStatsService:
    @classmethod
    def _ensure_org_id(cls, user: User) -> uuid.UUID:
        if not user.organization_id:
            raise BusinessLogicError("User does not belong to an organization")
        return user.organization_id

    @classmethod
    def get_active_jobs_count(cls, db: Session, user: User) -> int:
        org_id = cls._ensure_org_id(user)
        return (
            db.scalar(
                select(func.count(JobPosting.job_id)).where(
                    JobPosting.organization_id == org_id, JobPosting.status == "active"
                )
            )
            or 0
        )

    @classmethod
    def get_active_candidates_count(cls, db: Session, user: User) -> int:
        org_id = cls._ensure_org_id(user)
        return (
            db.scalar(
                select(
                    func.count(func.distinct(JobApplication.candidate_profile_id))
                ).where(
                    JobApplication.organization_id == org_id,
                    JobApplication.current_status != "rejected",
                )
            )
            or 0
        )

    @classmethod
    def get_recent_activity(
        cls, db: Session, user: User, limit: int = 20
    ) -> list[dict[str, Any]]:
        org_id = cls._ensure_org_id(user)
        seven_days_ago = get_datetime() - timedelta(days=7)
        activities = []
        app_stmt = (
            select(JobApplication)
            .options(
                joinedload(JobApplication.job),
                joinedload(JobApplication.candidate_profile).joinedload(
                    CandidateProfile.user
                ),
            )
            .where(
                JobApplication.organization_id == org_id,
                JobApplication.applied_at >= seven_days_ago,
            )
            .order_by(JobApplication.applied_at.desc())
            .limit(limit)
        )
        applications = db.scalars(app_stmt).all()
        for app in applications:
            candidate_name = (
                app.candidate_profile.user.name
                if app.candidate_profile and app.candidate_profile.user
                else "Unknown Candidate"
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
        history_stmt = (
            select(JobApplicationStatusHistory)
            .join(JobApplicationStatusHistory.application)
            .options(
                joinedload(JobApplicationStatusHistory.application).options(
                    joinedload(JobApplication.job),
                    joinedload(JobApplication.candidate_profile).joinedload(
                        CandidateProfile.user
                    ),
                )
            )
            .where(
                JobApplication.organization_id == org_id,
                JobApplicationStatusHistory.changed_at >= seven_days_ago,
                JobApplicationStatusHistory.status != "applied",
            )
            .order_by(JobApplicationStatusHistory.changed_at.desc())
            .limit(limit)
        )
        status_changes = db.scalars(history_stmt).all()
        for history in status_changes:
            app = history.application
            candidate_name = (
                app.candidate_profile.user.name
                if app.candidate_profile and app.candidate_profile.user
                else "Unknown Candidate"
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
        jobs_stmt = (
            select(JobPosting)
            .options(joinedload(JobPosting.created_by))
            .where(
                JobPosting.organization_id == org_id,
                JobPosting.created_at >= seven_days_ago,
            )
            .order_by(JobPosting.created_at.desc())
            .limit(limit)
        )
        jobs = db.scalars(jobs_stmt).all()
        for job in jobs:
            activities.append(
                {
                    "id": str(job.job_id),
                    "type": "job_post",
                    "user": job.created_by.name if job.created_by else "System",
                    "action": "posted new job",
                    "target": job.title,
                    "timestamp": job.created_at.isoformat(),
                    "metadata": {"job_id": str(job.job_id)},
                }
            )
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:limit]
