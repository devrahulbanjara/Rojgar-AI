from fastapi import HTTPException, status

from app.models import JobPosting, User, UserRole


def verify_recruiter_belongs_to_organization(user: User, organization_id: str) -> None:
    if user.role != UserRole.RECRUITER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a recruiter",
        )

    if user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter does not belong to this organization",
        )


def verify_job_belongs_to_organization(job: JobPosting, organization_id: str) -> None:
    if job.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job does not belong to this organization",
        )


def get_organization_from_user(user: User) -> str:
    if not user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not belong to any organization",
        )
    return user.organization_id


def verify_user_can_edit_job(user: User, job: JobPosting) -> None:
    if user.role != UserRole.RECRUITER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can edit jobs",
        )

    if not user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recruiter must belong to an organization",
        )

    if job.organization_id != user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit jobs from your organization",
        )
