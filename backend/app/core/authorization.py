import uuid

from app.core import BusinessLogicError, ForbiddenError
from app.models import JobPosting, User, UserRole


def verify_recruiter_belongs_to_organization(
    user: User, organization_id: uuid.UUID
) -> None:
    if user.role != UserRole.RECRUITER.value:
        raise ForbiddenError(
            message="User is not a recruiter",
            details={
                "user_id": str(user.user_id),
                "user_role": user.role,
                "organization_id": str(organization_id),
            },
        )
    if user.organization_id != organization_id:
        raise ForbiddenError(
            message="Recruiter does not belong to this organization",
            details={
                "user_id": str(user.user_id),
                "user_organization_id": str(user.organization_id)
                if user.organization_id
                else None,
                "expected_organization_id": str(organization_id),
            },
        )


def verify_job_belongs_to_organization(
    job: JobPosting, organization_id: uuid.UUID
) -> None:
    if job.organization_id != organization_id:
        raise ForbiddenError(
            message="Job does not belong to this organization",
            details={
                "job_id": str(job.job_id),
                "job_organization_id": str(job.organization_id)
                if job.organization_id
                else None,
                "expected_organization_id": str(organization_id),
            },
        )


def get_organization_from_user(user: User) -> uuid.UUID:
    if not user.organization_id:
        raise BusinessLogicError(
            message="User does not belong to any organization",
            details={
                "user_id": str(user.user_id),
                "user_role": user.role,
            },
        )
    return user.organization_id


def verify_user_can_edit_job(user: User, job: JobPosting) -> None:
    if user.role != UserRole.RECRUITER.value:
        raise ForbiddenError(
            message="Only recruiters can edit jobs",
            details={
                "user_id": str(user.user_id),
                "user_role": user.role,
                "job_id": str(job.job_id),
            },
        )
    if not user.organization_id:
        raise BusinessLogicError(
            message="Recruiter must belong to an organization",
            details={
                "user_id": str(user.user_id),
                "user_role": user.role,
            },
        )
    if job.organization_id != user.organization_id:
        raise ForbiddenError(
            message="You can only edit jobs from your organization",
            details={
                "user_id": str(user.user_id),
                "user_organization_id": str(user.organization_id)
                if user.organization_id
                else None,
                "job_id": str(job.job_id),
                "job_organization_id": str(job.organization_id)
                if job.organization_id
                else None,
            },
        )
