import uuid
from datetime import timedelta
from typing import Any

from sqlalchemy import func, select

from app.core import get_datetime
from app.db.models.application import JobApplication
from app.db.models.email_draft import EmailDraft
from app.db.models.job import JobPosting
from app.db.models.user import User
from app.db.repositories.application_repo import JobApplicationRepository
from app.db.repositories.email_draft_repo import EmailDraftRepository
from app.db.repositories.interview_repo import InterviewRepository
from app.db.repositories.job_repo import JobRepository


class StatsService:
    def __init__(
        self,
        job_repo: JobRepository,
        application_repo: JobApplicationRepository,
        email_draft_repo: EmailDraftRepository | None = None,
        interview_repo: InterviewRepository | None = None,
    ):
        self.job_repo = job_repo
        self.application_repo = application_repo
        self.email_draft_repo = email_draft_repo
        self.interview_repo = interview_repo

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

    async def get_pending_email_drafts_count(self, user: User) -> int:
        """Count pending (unsent, undiscarded) email drafts for organization."""
        org_id = self._ensure_org_id(user)
        if not org_id or not self.email_draft_repo:
            return 0

        query = (
            select(func.count())
            .select_from(EmailDraft)
            .join(
                JobApplication,
                EmailDraft.application_id == JobApplication.application_id,
            )
            .join(JobPosting, JobApplication.job_id == JobPosting.job_id)
            .where(
                JobPosting.organization_id == org_id,
                EmailDraft.is_sent == False,  # noqa: E712
                EmailDraft.is_discarded == False,  # noqa: E712
            )
        )
        result = await self.email_draft_repo.db.execute(query)
        return result.scalar_one()

    async def get_interviews_this_week_count(self, user: User) -> int:
        """Count interviews scheduled this week for organization."""
        org_id = self._ensure_org_id(user)
        if not org_id or not self.interview_repo:
            return 0
        return await self.interview_repo.count_this_week(org_id)

    async def get_dashboard_stats(self, user: User) -> dict[str, Any]:
        """Get all 4 dashboard KPIs in one call."""
        active_jobs = await self.get_active_jobs_count(user)
        active_candidates = await self.get_active_candidates_count(user)
        pending_emails = await self.get_pending_email_drafts_count(user)
        interviews_this_week = await self.get_interviews_this_week_count(user)

        return {
            "active_jobs": active_jobs or 0,
            "active_candidates": active_candidates or 0,
            "pending_email_drafts": pending_emails,
            "interviews_this_week": interviews_this_week,
        }
