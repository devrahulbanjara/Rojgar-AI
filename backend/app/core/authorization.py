import uuid

from app.models import JobPosting, User, UserRole


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
    return user.organization_id


def verify_user_can_edit_job(user: User, job: JobPosting) -> None:
    if user.role != UserRole.RECRUITER.value:
        raise ValueError("Only recruiters can edit jobs")
    if not user.organization_id:
        raise ValueError("Recruiter must belong to an organization")
    if job.organization_id != user.organization_id:
        raise ValueError("You can only edit jobs from your organization")
