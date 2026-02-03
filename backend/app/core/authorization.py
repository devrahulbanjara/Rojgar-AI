import uuid

from app.db.models.job import JobPosting
from app.db.models.user import User, UserRole


def verify_recruiter_belongs_to_organization(
    user: User, organization_id: uuid.UUID
) -> None:
    if user.role != UserRole.RECRUITER.value:
        raise ValueError("User is not a recruiter")
    if user.organization_id != organization_id:
        raise ValueError("Recruiter does not belong to this organization")


def verify_job_belongs_to_organization(
    job: JobPosting, organization_id: uuid.UUID
) -> None:
    if job.organization_id != organization_id:
        raise ValueError("Job does not belong to this organization")


def get_organization_from_user(user: User) -> uuid.UUID | None:
    """Get organization_id from user if they belong to one.

    Note: This does not verify the user is a recruiter.
    Use get_current_recruiter_organization_id for recruiter-only endpoints.
    """
    return user.organization_id


def require_recruiter_with_organization(user: User) -> uuid.UUID:
    """Require that the user is a recruiter with an organization.

    Raises:
        ValueError: If user is not a recruiter or doesn't have an organization
    """
    if user.role != UserRole.RECRUITER.value:
        raise ValueError(
            "This action requires a recruiter account. Please log in with a recruiter account."
        )
    if not user.organization_id:
        raise ValueError(
            "Your recruiter account is not associated with an organization. Please contact your administrator."
        )
    return user.organization_id


def verify_user_can_edit_job(user: User, job: JobPosting) -> None:
    if user.role != UserRole.RECRUITER.value:
        raise ValueError("Only recruiters can edit jobs")
    if not user.organization_id:
        raise ValueError("Recruiter must belong to an organization")
    if job.organization_id != user.organization_id:
        raise ValueError("You can only edit jobs from your organization")
