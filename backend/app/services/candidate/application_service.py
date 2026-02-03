import uuid

from app.db.models.application import ApplicationStatus, JobApplication
from app.db.repositories.application_repo import (
    JobApplicationRepository,
    JobApplicationStatusHistoryRepository,
)
from app.db.repositories.candidate_repo import CandidateProfileRepository
from app.db.repositories.job_repo import JobRepository
from app.db.repositories.resume_repo import ResumeRepository
from app.db.repositories.user_repo import UserRepository
from app.services.recruiter.activity_events import ActivityEventEmitter


class ApplicationService:
    def __init__(
        self,
        application_repo: JobApplicationRepository,
        application_status_repo: JobApplicationStatusHistoryRepository,
        candidate_profile_repo: CandidateProfileRepository,
        job_repo: JobRepository,
        resume_repo: ResumeRepository,
        user_repo: UserRepository,
        activity_emitter: ActivityEventEmitter,
    ):
        self.application_repo = application_repo
        self.application_status_repo = application_status_repo
        self.candidate_profile_repo = candidate_profile_repo
        self.job_repo = job_repo
        self.resume_repo = resume_repo
        self.user_repo = user_repo
        self.activity_emitter = activity_emitter

    async def get_candidate_applications(
        self, user_id: uuid.UUID
    ) -> list[JobApplication] | None:
        """Get all applications for a candidate"""
        candidate = await self.candidate_profile_repo.get_by_user_id(user_id)
        if not candidate:
            return None
        applications = await self.application_repo.get_by_candidate(user_id)
        return list(applications)

    async def get_application_by_id(
        self, user_id: uuid.UUID, application_id: uuid.UUID
    ) -> JobApplication | None:
        """Get a specific application by ID for a user"""
        candidate = await self.candidate_profile_repo.get_by_user_id(user_id)
        if not candidate:
            return None
        application = await self.application_repo.get_with_details(application_id)
        # Verify ownership
        if application and application.candidate_profile_id == candidate.profile_id:
            return application
        return None

    async def get_application_by_job(
        self, user_id: uuid.UUID, job_id: uuid.UUID
    ) -> JobApplication | None:
        """Get application for a specific job"""
        candidate = await self.candidate_profile_repo.get_by_user_id(user_id)
        if not candidate:
            return None
        return await self.application_repo.get_by_candidate_and_job(
            candidate.profile_id, job_id
        )

    async def apply_to_job(
        self, user_id: uuid.UUID, job_id: uuid.UUID, resume_id: uuid.UUID
    ) -> JobApplication | None:
        """Apply to a job with a resume"""
        # Get candidate profile
        candidate = await self.candidate_profile_repo.get_by_user_id(user_id)
        if not candidate:
            return None

        # Get job
        job = await self.job_repo.get(job_id)
        if not job:
            return None

        # Validate job is active
        if job.status != "active":
            raise ValueError("Job is no longer accepting applications")

        # Verify resume belongs to candidate
        resume = await self.resume_repo.get(resume_id)
        if not resume or resume.profile_id != candidate.profile_id:
            raise ValueError("Unauthorized resume usage")

        # Check if already applied
        existing = await self.application_repo.get_by_candidate_and_job(
            candidate.profile_id, job_id
        )
        if existing:
            raise ValueError("You have already applied for this job")

        # Create application
        app_id = uuid.uuid4()
        new_application = JobApplication(
            application_id=app_id,
            candidate_profile_id=candidate.profile_id,
            job_id=job_id,
            organization_id=job.organization_id,
            resume_id=resume_id,
            current_status=ApplicationStatus.APPLIED,
        )
        await self.application_repo.create(new_application)

        # Create status history
        await self.application_status_repo.add_status_change(
            app_id, ApplicationStatus.APPLIED
        )

        # Get user for event data
        user = await self.user_repo.get(user_id)
        candidate_name = user.name if user else "Unknown Candidate"

        # Get full application with relations
        application = await self.application_repo.get_with_details(app_id)

        # Emit activity event
        if application:
            try:
                await self.activity_emitter.emit_application_created(
                    organization_id=job.organization_id,
                    candidate_name=candidate_name,
                    job_title=job.title,
                    application_id=app_id,
                    job_id=job_id,
                    timestamp=new_application.applied_at,
                )
            except Exception as e:
                # Log error but don't fail the application creation
                import logging

                logging.error(f"Failed to emit activity event: {e}")

        return application
