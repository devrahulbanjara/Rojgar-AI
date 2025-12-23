from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime, UTC
import uuid

from app.core import get_db, get_current_user_id
from app.models.job import JobPosting, JobDescription, JobPostingStats
from app.models.company import CompanyProfile
from app.schemas import job as schemas
from app.api.v1.routes.jobs import map_job_to_response

router = APIRouter()


@router.post("", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: schemas.JobCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    company = db.query(CompanyProfile).filter(CompanyProfile.user_id == user_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found for this user"
        )
    
    company_id = company.company_id
    
    job_description_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())
    
    # Handle required skills - allow empty list for drafts
    required_skills_list = job_data.requiredSkillsAndExperience if job_data.requiredSkillsAndExperience else []
    required_skills_experience_dict = {
        "required_skills_experience": required_skills_list
    }
    
    nice_to_have_dict = None
    if job_data.niceToHave:
        nice_to_have_dict = {
            "nice_to_have": job_data.niceToHave
        }
    
    offers_dict = None
    if job_data.benefits:
        offers_dict = {
            "benefits": job_data.benefits
        }
    
    job_description = JobDescription(
        job_description_id=job_description_id,
        role_overview=job_data.description or "",  # Allow empty for drafts
        required_skills_experience=required_skills_experience_dict,
        nice_to_have=nice_to_have_dict,
        offers=offers_dict,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None)
    )
    
    db.add(job_description)
    db.flush()
    
    application_deadline = None
    if job_data.applicationDeadline:
        try:
            if 'T' in job_data.applicationDeadline:
                application_deadline = datetime.fromisoformat(job_data.applicationDeadline.replace('Z', '+00:00')).date()
            else:
                application_deadline = datetime.strptime(job_data.applicationDeadline, '%Y-%m-%d').date()
        except Exception:
            application_deadline = None
    
    # Determine status - use provided status or default to "active"
    job_status = job_data.status if job_data.status else "active"
    
    job_posting = JobPosting(
        job_id=job_id,
        company_id=company_id,
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
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None)
    )
    
    db.add(job_posting)
    
    job_stats = JobPostingStats(
        job_stats_id=str(uuid.uuid4()),
        job_id=job_id,
        applicant_count=0,
        views_count=0,
        created_at=datetime.now(UTC).replace(tzinfo=None),
        updated_at=datetime.now(UTC).replace(tzinfo=None)
    )
    
    db.add(job_stats)
    
    db.commit()
    db.refresh(job_posting)
    
    return map_job_to_response(job_posting)
