from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.application_repo import (
    JobApplicationRepository,
    JobApplicationStatusHistoryRepository,
)
from app.db.repositories.candidate_repo import (
    CandidateCertificationRepository,
    CandidateEducationRepository,
    CandidateProfileRepository,
    CandidateSkillsRepository,
    CandidateSocialLinkRepository,
    CandidateWorkExperienceRepository,
)
from app.db.repositories.job_repo import (
    JobDescriptionRepository,
    JobRepository,
    ReferenceJDRepository,
)
from app.db.repositories.resume_repo import (
    ResumeCertificationRepository,
    ResumeEducationRepository,
    ResumeRepository,
    ResumeSkillRepository,
    ResumeSocialLinkRepository,
    ResumeWorkExperienceRepository,
)

# Repository imports
from app.db.repositories.user_repo import (
    OrganizationRepository,
    UserGoogleRepository,
    UserRepository,
)
from app.db.session import get_db

# Integration imports
from app.integrations.qdrant.vector_service import JobVectorService
from app.services.auth.auth_service import AuthService
from app.services.auth.organization_auth_service import OrganizationAuthService
from app.services.candidate.application_service import ApplicationService
from app.services.candidate.profile_service import ProfileService
from app.services.candidate.resume_service import ResumeService

# Service imports
from app.services.job_service import JobService
from app.services.organization.organization_service import OrganizationService
from app.services.organization.recruiter_crud import RecruiterCrudService
from app.services.recruiter.activity_events import ActivityEventEmitter
from app.services.recruiter.job_generation_service import JobGenerationService
from app.services.recruiter.reference_jd_service import ReferenceJDService
from app.services.recruiter.shortlist_service import ShortlistService
from app.services.recruiter.stats_services import StatsService
from app.services.user_service import UserService


# Repository Dependencies
def get_user_repo(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_user_google_repo(db: AsyncSession = Depends(get_db)) -> UserGoogleRepository:
    return UserGoogleRepository(db)


def get_organization_repo(db: AsyncSession = Depends(get_db)) -> OrganizationRepository:
    return OrganizationRepository(db)


def get_job_repo(db: AsyncSession = Depends(get_db)) -> JobRepository:
    return JobRepository(db)


def get_job_description_repo(
    db: AsyncSession = Depends(get_db),
) -> JobDescriptionRepository:
    return JobDescriptionRepository(db)


def get_reference_jd_repo(db: AsyncSession = Depends(get_db)) -> ReferenceJDRepository:
    return ReferenceJDRepository(db)


def get_candidate_profile_repo(
    db: AsyncSession = Depends(get_db),
) -> CandidateProfileRepository:
    return CandidateProfileRepository(db)


def get_candidate_skills_repo(
    db: AsyncSession = Depends(get_db),
) -> CandidateSkillsRepository:
    return CandidateSkillsRepository(db)


def get_candidate_work_experience_repo(
    db: AsyncSession = Depends(get_db),
) -> CandidateWorkExperienceRepository:
    return CandidateWorkExperienceRepository(db)


def get_candidate_education_repo(
    db: AsyncSession = Depends(get_db),
) -> CandidateEducationRepository:
    return CandidateEducationRepository(db)


def get_candidate_certification_repo(
    db: AsyncSession = Depends(get_db),
) -> CandidateCertificationRepository:
    return CandidateCertificationRepository(db)


def get_candidate_social_link_repo(
    db: AsyncSession = Depends(get_db),
) -> CandidateSocialLinkRepository:
    return CandidateSocialLinkRepository(db)


def get_job_application_repo(
    db: AsyncSession = Depends(get_db),
) -> JobApplicationRepository:
    return JobApplicationRepository(db)


def get_job_application_status_history_repo(
    db: AsyncSession = Depends(get_db),
) -> JobApplicationStatusHistoryRepository:
    return JobApplicationStatusHistoryRepository(db)


def get_resume_repo(db: AsyncSession = Depends(get_db)) -> ResumeRepository:
    return ResumeRepository(db)


def get_resume_social_link_repo(
    db: AsyncSession = Depends(get_db),
) -> ResumeSocialLinkRepository:
    return ResumeSocialLinkRepository(db)


def get_resume_work_experience_repo(
    db: AsyncSession = Depends(get_db),
) -> ResumeWorkExperienceRepository:
    return ResumeWorkExperienceRepository(db)


def get_resume_education_repo(
    db: AsyncSession = Depends(get_db),
) -> ResumeEducationRepository:
    return ResumeEducationRepository(db)


def get_resume_certification_repo(
    db: AsyncSession = Depends(get_db),
) -> ResumeCertificationRepository:
    return ResumeCertificationRepository(db)


def get_resume_skill_repo(db: AsyncSession = Depends(get_db)) -> ResumeSkillRepository:
    return ResumeSkillRepository(db)


# Integration Dependencies
def get_vector_service() -> JobVectorService:
    return JobVectorService()


# Service Dependencies
def get_activity_emitter() -> ActivityEventEmitter:
    """Get ActivityEventEmitter instance"""
    return ActivityEventEmitter()


def get_job_service(
    job_repo: JobRepository = Depends(get_job_repo),
    job_description_repo: JobDescriptionRepository = Depends(get_job_description_repo),
    candidate_profile_repo: CandidateProfileRepository = Depends(
        get_candidate_profile_repo
    ),
    user_repo: UserRepository = Depends(get_user_repo),
    vector_service: JobVectorService = Depends(get_vector_service),
    activity_emitter: ActivityEventEmitter = Depends(get_activity_emitter),
) -> JobService:
    return JobService(
        job_repo,
        job_description_repo,
        candidate_profile_repo,
        user_repo,
        vector_service,
        activity_emitter,
    )


def get_user_service(
    user_repo: UserRepository = Depends(get_user_repo),
) -> UserService:
    return UserService(user_repo)


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repo),
    user_google_repo: UserGoogleRepository = Depends(get_user_google_repo),
    candidate_profile_repo: CandidateProfileRepository = Depends(
        get_candidate_profile_repo
    ),
) -> AuthService:
    return AuthService(user_repo, user_google_repo, candidate_profile_repo)


def get_organization_auth_service(
    user_repo: UserRepository = Depends(get_user_repo),
    organization_repo: OrganizationRepository = Depends(get_organization_repo),
) -> OrganizationAuthService:
    return OrganizationAuthService(user_repo, organization_repo)


def get_application_service(
    application_repo: JobApplicationRepository = Depends(get_job_application_repo),
    application_status_repo: JobApplicationStatusHistoryRepository = Depends(
        get_job_application_status_history_repo
    ),
    candidate_profile_repo: CandidateProfileRepository = Depends(
        get_candidate_profile_repo
    ),
    job_repo: JobRepository = Depends(get_job_repo),
    resume_repo: ResumeRepository = Depends(get_resume_repo),
    user_repo: UserRepository = Depends(get_user_repo),
    activity_emitter: ActivityEventEmitter = Depends(get_activity_emitter),
) -> ApplicationService:
    return ApplicationService(
        application_repo,
        application_status_repo,
        candidate_profile_repo,
        job_repo,
        resume_repo,
        user_repo,
        activity_emitter,
    )


def get_profile_service(
    candidate_profile_repo: CandidateProfileRepository = Depends(
        get_candidate_profile_repo
    ),
    candidate_skills_repo: CandidateSkillsRepository = Depends(
        get_candidate_skills_repo
    ),
    candidate_work_experience_repo: CandidateWorkExperienceRepository = Depends(
        get_candidate_work_experience_repo
    ),
    candidate_education_repo: CandidateEducationRepository = Depends(
        get_candidate_education_repo
    ),
    candidate_certification_repo: CandidateCertificationRepository = Depends(
        get_candidate_certification_repo
    ),
    candidate_social_link_repo: CandidateSocialLinkRepository = Depends(
        get_candidate_social_link_repo
    ),
    user_repo: UserRepository = Depends(get_user_repo),
) -> ProfileService:
    return ProfileService(
        candidate_profile_repo,
        candidate_skills_repo,
        candidate_work_experience_repo,
        candidate_education_repo,
        candidate_certification_repo,
        candidate_social_link_repo,
        user_repo,
    )


def get_resume_service(
    resume_repo: ResumeRepository = Depends(get_resume_repo),
    candidate_profile_repo: CandidateProfileRepository = Depends(
        get_candidate_profile_repo
    ),
    resume_work_experience_repo: ResumeWorkExperienceRepository = Depends(
        get_resume_work_experience_repo
    ),
    resume_education_repo: ResumeEducationRepository = Depends(
        get_resume_education_repo
    ),
    resume_skill_repo: ResumeSkillRepository = Depends(get_resume_skill_repo),
    resume_certification_repo: ResumeCertificationRepository = Depends(
        get_resume_certification_repo
    ),
    resume_social_link_repo: ResumeSocialLinkRepository = Depends(
        get_resume_social_link_repo
    ),
) -> ResumeService:
    return ResumeService(
        resume_repo,
        candidate_profile_repo,
        resume_work_experience_repo,
        resume_education_repo,
        resume_skill_repo,
        resume_certification_repo,
        resume_social_link_repo,
    )


def get_organization_service(
    organization_repo: OrganizationRepository = Depends(get_organization_repo),
) -> OrganizationService:
    return OrganizationService(organization_repo)


def get_recruiter_crud_service(
    user_repo: UserRepository = Depends(get_user_repo),
    organization_repo: OrganizationRepository = Depends(get_organization_repo),
    auth_service: AuthService = Depends(get_auth_service),
    organization_auth_service: OrganizationAuthService = Depends(
        get_organization_auth_service
    ),
) -> RecruiterCrudService:
    return RecruiterCrudService(
        user_repo, organization_repo, auth_service, organization_auth_service
    )


def get_job_generation_service(
    job_repo: JobRepository = Depends(get_job_repo),
    job_description_repo: JobDescriptionRepository = Depends(get_job_description_repo),
    reference_jd_repo: ReferenceJDRepository = Depends(get_reference_jd_repo),
    organization_repo: OrganizationRepository = Depends(get_organization_repo),
    vector_service: JobVectorService = Depends(get_vector_service),
) -> JobGenerationService:
    return JobGenerationService(
        job_repo,
        job_description_repo,
        reference_jd_repo,
        organization_repo,
        vector_service,
    )


def get_reference_jd_service(
    reference_jd_repo: ReferenceJDRepository = Depends(get_reference_jd_repo),
    organization_repo: OrganizationRepository = Depends(get_organization_repo),
) -> ReferenceJDService:
    return ReferenceJDService(reference_jd_repo, organization_repo)


def get_shortlist_service(
    application_repo: JobApplicationRepository = Depends(get_job_application_repo),
    job_repo: JobRepository = Depends(get_job_repo),
) -> ShortlistService:
    return ShortlistService(application_repo, job_repo)


def get_stats_service(
    job_repo: JobRepository = Depends(get_job_repo),
    application_repo: JobApplicationRepository = Depends(get_job_application_repo),
) -> StatsService:
    return StatsService(job_repo, application_repo)
