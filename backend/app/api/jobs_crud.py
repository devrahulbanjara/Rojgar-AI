import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.jobs import map_job_to_response
from app.core import get_current_user_id, get_datetime, get_db
from app.core.authorization import get_organization_from_user, verify_user_can_edit_job
from app.core.limiter import limiter
from app.models import JobDescription, JobPosting, JobPostingStats, User
from app.schemas import job as schemas
from app.services.recruiter.job_generation_service import JobGenerationService

router = APIRouter()


@router.post(
    "/generate-draft",
    response_model=schemas.JobDraftResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("10/minute")
def generate_job_draft(
    request: Request,
    draft_request: schemas.JobDraftGenerateRequest,
    user_id: str = Depends(get_current_user_id),
):
    if not draft_request.raw_requirements:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Raw requirements / some keywords are required",
        )

    try:
        combined_requirements = (
            f"{draft_request.title}. {draft_request.raw_requirements}"
        )

        generated_draft = JobGenerationService.generate_job_draft(combined_requirements)

        return schemas.JobDraftResponse(
            title=generated_draft.job_title,
            description=generated_draft.role_overview,
            requiredSkillsAndExperience=generated_draft.required_skills_and_experience,
            niceToHave=generated_draft.nice_to_have,
            benefits=generated_draft.what_company_offers,
            about_company=generated_draft.about_the_company,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate job description: {str(e)}",
        )


@router.post(
    "", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("5/minute")
def create_job(
    request: Request,
    job_data: schemas.JobCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    organization_id = get_organization_from_user(user)

    job_description_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())

    required_skills_list = (
        job_data.requiredSkillsAndExperience
        if job_data.requiredSkillsAndExperience
        else []
    )
    required_skills_experience_dict = {
        "required_skills_experience": required_skills_list
    }

    nice_to_have_dict = None
    if job_data.niceToHave:
        nice_to_have_dict = {"nice_to_have": job_data.niceToHave}

    offers_dict = None
    if job_data.benefits:
        offers_dict = {"benefits": job_data.benefits}

    job_description = JobDescription(
        job_description_id=job_description_id,
        role_overview=job_data.description or "",
        required_skills_experience=required_skills_experience_dict,
        nice_to_have=nice_to_have_dict,
        offers=offers_dict,
        created_at=get_datetime(),
        updated_at=get_datetime(),
    )

    db.add(job_description)
    db.flush()

    application_deadline = None
    if job_data.applicationDeadline:
        try:
            if "T" in job_data.applicationDeadline:
                application_deadline = datetime.fromisoformat(
                    job_data.applicationDeadline.replace("Z", "+00:00")
                ).date()
            else:
                application_deadline = datetime.strptime(
                    job_data.applicationDeadline, "%Y-%m-%d"
                ).date()
        except Exception:
            application_deadline = None

    job_status = job_data.status if job_data.status else "active"

    job_posting = JobPosting(
        job_id=job_id,
        organization_id=organization_id,
        created_by_user_id=user_id,
        job_description_id=job_description_id,
        title=job_data.title,
        department=job_data.department,
        level=job_data.level,
        location_city=job_data.locationCity,
        location_country=job_data.locationCountry,
        location_type=job_data.locationType,
        employment_type=job_data.employmentType,
        salary_min=job_data.salaryMin,
        salary_max=job_data.salaryMax,
        salary_currency=job_data.currency,
        status=job_status,
        is_indexed=False,
        posted_date=date.today(),
        application_deadline=application_deadline,
        created_at=get_datetime(),
        updated_at=get_datetime(),
    )

    db.add(job_posting)

    job_stats = JobPostingStats(
        job_stats_id=str(uuid.uuid4()),
        job_id=job_id,
        applicant_count=0,
        views_count=0,
        created_at=get_datetime(),
        updated_at=get_datetime(),
    )

    db.add(job_stats)

    db.commit()
    db.refresh(job_posting)

    return map_job_to_response(job_posting)


@router.put(
    "/{job_id}", response_model=schemas.JobResponse, status_code=status.HTTP_200_OK
)
@limiter.limit("5/minute")
def update_job(
    request: Request,
    job_id: str,
    job_data: schemas.JobUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    job_posting = db.query(JobPosting).filter(JobPosting.job_id == job_id).first()
    if not job_posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    verify_user_can_edit_job(user, job_posting)

    if job_data.title is not None:
        job_posting.title = job_data.title
    if job_data.department is not None:
        job_posting.department = job_data.department
    if job_data.level is not None:
        job_posting.level = job_data.level
    if job_data.locationCity is not None:
        job_posting.location_city = job_data.locationCity
    if job_data.locationCountry is not None:
        job_posting.location_country = job_data.locationCountry
    if job_data.locationType is not None:
        job_posting.location_type = job_data.locationType
    if job_data.employmentType is not None:
        job_posting.employment_type = job_data.employmentType
    if job_data.salaryMin is not None:
        job_posting.salary_min = job_data.salaryMin
    if job_data.salaryMax is not None:
        job_posting.salary_max = job_data.salaryMax
    if job_data.currency is not None:
        job_posting.salary_currency = job_data.currency
    if job_data.status is not None:
        job_posting.status = job_data.status

    if job_data.applicationDeadline is not None:
        try:
            if "T" in job_data.applicationDeadline:
                job_posting.application_deadline = datetime.fromisoformat(
                    job_data.applicationDeadline.replace("Z", "+00:00")
                ).date()
            else:
                job_posting.application_deadline = datetime.strptime(
                    job_data.applicationDeadline, "%Y-%m-%d"
                ).date()
        except Exception:
            job_posting.application_deadline = None

    job_posting.updated_at = get_datetime()

    job_description = (
        db.query(JobDescription)
        .filter(JobDescription.job_description_id == job_posting.job_description_id)
        .first()
    )

    if job_description:
        if job_data.description is not None:
            job_description.role_overview = job_data.description

        if job_data.requiredSkillsAndExperience is not None:
            job_description.required_skills_experience = {
                "required_skills_experience": job_data.requiredSkillsAndExperience
            }

        if job_data.niceToHave is not None:
            job_description.nice_to_have = (
                {"nice_to_have": job_data.niceToHave} if job_data.niceToHave else None
            )

        if job_data.benefits is not None:
            job_description.offers = (
                {"benefits": job_data.benefits} if job_data.benefits else None
            )

        job_description.updated_at = get_datetime()

    db.commit()
    db.refresh(job_posting)

    return map_job_to_response(job_posting)
