import uuid
from datetime import timedelta
from typing import Any

from app.core import get_datetime
from app.db.models.user import User
from app.db.repositories.application_repo import JobApplicationRepository
from app.db.repositories.job_repo import JobRepository


class StatsService:
    def __init__(
        self,
        job_repo: JobRepository,
        application_repo: JobApplicationRepository,
    ):
        self.job_repo = job_repo
        self.application_repo = application_repo

    def _ensure_org_id(self, user: User) -> uuid.UUID | None:
        """Ensure user has organization ID"""
        return user.organization_id

    async def get_active_jobs_count(self, user: User) -> int | None:
        """Get count of active jobs for organization"""
        org_id = self._ensure_org_id(user)
        if not org_id:
            return None
        jobs = await self.job_repo.get_by_organization(org_id)
        active_count = sum(1 for job in jobs if job.status == "active")
        return active_count

    async def get_active_candidates_count(self, user: User) -> int | None:
        """Get count of active candidates for organization"""
        org_id = self._ensure_org_id(user)
        if not org_id:
            return None
        applications = await self.application_repo.get_by_organization(org_id)
        # Count unique candidates with non-rejected status
        unique_candidates = set()
        for app in applications:
            if app.current_status != "rejected":
                unique_candidates.add(app.candidate_profile_id)
        return len(unique_candidates)

    async def get_recent_activity(
        self, user: User, limit: int = 20
    ) -> list[dict[str, Any]] | None:
        """Get recent activity for organization"""
        org_id = self._ensure_org_id(user)
        if not org_id:
            return None

        seven_days_ago = get_datetime() - timedelta(days=7)
        activities = []

        # Get recent applications
        applications = await self.application_repo.get_by_organization(org_id)
        recent_applications = [
            app for app in applications if app.applied_at >= seven_days_ago
        ]
        recent_applications.sort(key=lambda x: x.applied_at, reverse=True)
        recent_applications = recent_applications[:limit]

        for app in recent_applications:
            candidate_name = "Unknown Candidate"
            if app.candidate_profile and app.candidate_profile.user:
                candidate_name = app.candidate_profile.user.name

            job_title = "Unknown Job"
            if app.job:
                job_title = app.job.title

            activities.append(
                {
                    "id": str(app.application_id),
                    "type": "application",
                    "user": candidate_name,
                    "action": "applied for",
                    "target": job_title,
                    "timestamp": app.applied_at.isoformat(),
                    "metadata": {
                        "application_id": str(app.application_id),
                        "job_id": str(app.job_id),
                        "status": app.current_status,
                    },
                }
            )

        # Get recent status changes
        status_history = await self.application_repo.get_by_organization(org_id)
        recent_status_changes = []
        for app in status_history:
            if hasattr(app, "history") and app.history:
                for history in app.history:
                    if (
                        history.changed_at >= seven_days_ago
                        and history.status != "applied"
                    ):
                        recent_status_changes.append((history, app))

        recent_status_changes.sort(key=lambda x: x[0].changed_at, reverse=True)
        recent_status_changes = recent_status_changes[:limit]

        for history, app in recent_status_changes:
            candidate_name = "Unknown Candidate"
            if app.candidate_profile and app.candidate_profile.user:
                candidate_name = app.candidate_profile.user.name

            job_title = "Unknown Job"
            if app.job:
                job_title = app.job.title

            activities.append(
                {
                    "id": str(history.status_history_id),
                    "type": "status_change",
                    "user": candidate_name,
                    "action": f"updated status to {history.status}",
                    "target": job_title,
                    "timestamp": history.changed_at.isoformat(),
                    "metadata": {
                        "application_id": str(app.application_id),
                        "job_id": str(app.job_id),
                        "status": history.status,
                    },
                }
            )

        # Get recent job posts
        jobs = await self.job_repo.get_by_organization(org_id)
        recent_jobs = [job for job in jobs if job.created_at >= seven_days_ago]
        recent_jobs.sort(key=lambda x: x.created_at, reverse=True)
        recent_jobs = recent_jobs[:limit]

        for job in recent_jobs:
            creator_name = "System"
            if job.created_by:
                creator_name = job.created_by.name

            activities.append(
                {
                    "id": str(job.job_id),
                    "type": "job_post",
                    "user": creator_name,
                    "action": "posted new job",
                    "target": job.title,
                    "timestamp": job.created_at.isoformat(),
                    "metadata": {"job_id": str(job.job_id)},
                }
            )

        # Sort all activities by timestamp
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:limit]
