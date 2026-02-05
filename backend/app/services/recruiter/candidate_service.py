import uuid

from app.db.repositories.application_repo import JobApplicationRepository
from app.schemas.recruiter_candidate import (
    CandidateApplicationSummary,
    RecruiterCandidateListResponse,
)


class RecruiterCandidateService:
    def __init__(self, application_repo: JobApplicationRepository):
        self.application_repo = application_repo

    async def get_organization_candidates(
        self, organization_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> RecruiterCandidateListResponse:

        applications = await self.application_repo.get_by_organization(
            organization_id=organization_id, skip=skip, limit=limit
        )
        total = await self.application_repo.count_by_organization(organization_id)

        candidate_summaries = []
        for app in applications:
            candidate_profile = app.candidate_profile
            user = candidate_profile.user

            social_links = []
            for link in candidate_profile.social_links:
                social_links.append(
                    {
                        "social_link_id": link.social_link_id,
                        "type": link.type,
                        "url": link.url,
                    }
                )

            candidate_summaries.append(
                CandidateApplicationSummary(
                    application_id=app.application_id,
                    job_id=app.job_id,
                    job_title=app.job.title,
                    candidate_id=app.candidate_profile_id,
                    name=user.name,
                    email=user.email,
                    phone=candidate_profile.phone,
                    picture=user.picture,
                    professional_headline=candidate_profile.professional_headline,
                    professional_summary=candidate_profile.professional_summary,
                    current_status=app.current_status,
                    applied_at=app.applied_at,
                    ai_score=app.ai_score,
                    ai_analysis=app.ai_analysis,
                    social_links=social_links,
                )
            )

        return RecruiterCandidateListResponse(
            candidates=candidate_summaries, total=total
        )

    async def get_application_resume(
        self, application_id: uuid.UUID, organization_id: uuid.UUID
    ):
        """Fetch the full resume associated with a specific job application."""
        application = await self.application_repo.get_with_details(application_id)

        if not application:
            return None

        # Security: Ensure this application belongs to the recruiter's organization
        if application.organization_id != organization_id:
            raise ValueError(
                "Access denied: Application belongs to another organization."
            )

        return application.resume
