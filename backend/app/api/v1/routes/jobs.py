from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import math
from datetime import date, datetime, UTC
import uuid

from app.core import get_db, get_current_user_id
from app.services.candidate.vector_job_service import JobVectorService
from app.models.job import JobPosting, JobDescription, JobPostingStats
from app.models.candidate import CandidateProfile
from app.models.company import CompanyProfile
from app.schemas import job as schemas

router = APIRouter()
vector_service = JobVectorService()

VISIBLE_STATUSES = ['active', 'expired']

@router.post("/admin/reindex")
def admin_reindex_jobs(db: Session = Depends(get_db)):
    """
    Admin endpoint to clear the vector store and re-index all open jobs.
    This fixes duplicate vector entries.
    """
    try:
        # 1. Clear the Qdrant collection
        if vector_service.client:
            try:
                vector_service.client.delete_collection(vector_service.collection_name)
                vector_service._ensure_collection_exists()
                
                # Recreate the vector store connection
                from langchain_qdrant import QdrantVectorStore
                vector_service.vector_store = QdrantVectorStore(
                    client=vector_service.client,
                    collection_name=vector_service.collection_name,
                    embedding=vector_service.embedding_model,
                )
            except Exception as e:
                return {"success": False, "error": f"Failed to reset Qdrant collection: {str(e)}"}
        
        # 2. Reset is_indexed flag on all jobs
        db.query(JobPosting).update({JobPosting.is_indexed: False})
        db.commit()
        
        # 3. Re-index all jobs
        vector_service.index_all_pending_jobs(db)
        
        indexed_count = db.query(JobPosting).filter(JobPosting.is_indexed == True).count()
        
        return {"success": True, "message": f"Successfully re-indexed {indexed_count} jobs."}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/recommendations", response_model=schemas.JobListResponse)
def get_recommendations(
    user_id: str,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    # 1. Get Candidate Skills from Postgres
    candidate = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    
    user_skills = []
    if candidate and candidate.skills:
        user_skills = [s.skill_name for s in candidate.skills]

    # 2. Get Matching Job IDs from Qdrant
    # Fetch a large number to account for duplicates/closed jobs
    fetch_limit = 200  # Fetch up to 200 candidates from vector store
    
    raw_ids = []
    if user_skills:
        raw_ids = vector_service.recommend_jobs_by_skills(user_skills, limit=fetch_limit)

    # 3. Fallback: If no skills or no vector results, show recent jobs from DB
    if not raw_ids:
        offset = (page - 1) * limit
        total_recent = db.query(JobPosting).filter(JobPosting.status.in_(VISIBLE_STATUSES)).count()
        recent_jobs = db.query(JobPosting).filter(JobPosting.status.in_(VISIBLE_STATUSES)).order_by(JobPosting.posted_date.desc()).offset(offset).limit(limit).all()
        
        total_pages = math.ceil(total_recent / limit) if limit > 0 else 0
        return {
            "jobs": [map_job_to_response(j) for j in recent_jobs],
            "total": total_recent, 
            "page": page, 
            "limit": limit, 
            "total_pages": total_pages, 
            "has_next": page < total_pages, 
            "has_prev": page > 1
        }

    # 4. Deduplicate IDs from vector store (preserving order/relevance)
    seen_ids = set()
    unique_vector_ids = []
    for jid in raw_ids:
        if jid not in seen_ids:
            seen_ids.add(jid)
            unique_vector_ids.append(jid)

    # 5. Fetch Full Data from Postgres and Filter Open Jobs
    # Build a list of valid, unique jobs
    valid_jobs = []
    valid_job_ids_seen = set()  # Extra safety to ensure uniqueness in response
    for jid in unique_vector_ids:
        if jid in valid_job_ids_seen:
            continue
        job = db.query(JobPosting).get(jid)
        if job and job.status in VISIBLE_STATUSES:
            valid_jobs.append(map_job_to_response(job))
            valid_job_ids_seen.add(jid)
            
    # 6. Apply Pagination to the list of valid unique jobs
    total_valid = len(valid_jobs)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    paginated_jobs = valid_jobs[start_idx:end_idx]
    
    total_pages = math.ceil(total_valid / limit) if limit > 0 else 0
    
    return {
        "jobs": paginated_jobs,
        "total": total_valid, 
        "page": page, 
        "limit": limit, 
        "total_pages": total_pages, 
        "has_next": page < total_pages, 
        "has_prev": page > 1
    }

@router.get("/search", response_model=schemas.JobListResponse)
def search_jobs(
    q: str,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    # Fetch a large number to account for duplicates/closed jobs
    fetch_limit = 200

    # 1. Get IDs from Qdrant
    raw_ids = vector_service.search_jobs(q, limit=fetch_limit)
    
    if not raw_ids:
        return {"jobs": [], "total": 0, "page": 1, "limit": limit, "total_pages": 0, "has_next": False, "has_prev": False}

    # 2. Deduplicate IDs from vector store (preserving order/relevance)
    seen_ids = set()
    unique_vector_ids = []
    for jid in raw_ids:
        if jid not in seen_ids:
            seen_ids.add(jid)
            unique_vector_ids.append(jid)

    # 3. Fetch Full Data and Filter
    valid_jobs = []
    valid_job_ids_seen = set()
    for jid in unique_vector_ids:
        if jid in valid_job_ids_seen:
            continue
        job = db.query(JobPosting).get(jid)
        if job and job.status in VISIBLE_STATUSES:
            valid_jobs.append(map_job_to_response(job))
            valid_job_ids_seen.add(jid)

    # 4. Apply Pagination
    total_valid = len(valid_jobs)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    paginated_jobs = valid_jobs[start_idx:end_idx]
    
    total_pages = math.ceil(total_valid / limit) if limit > 0 else 0

    return {
        "jobs": paginated_jobs,
        "total": total_valid, 
        "page": page, 
        "limit": limit, 
        "total_pages": total_pages, 
        "has_next": page < total_pages, 
        "has_prev": page > 1
    }

@router.post("", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: schemas.JobCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new job posting"""
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


@router.get("", response_model=schemas.JobListResponse)
def get_jobs(
    user_id: Optional[str] = None,
    company_id: Optional[str] = None,  # Keep for backward compatibility
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get list of jobs with optional filtering by user_id (recruiter) or company_id and status.
    If user_id is provided, looks up the company profile for that user and returns jobs for that company.
    If company_id is provided, returns jobs for that company directly.
    If status is provided, filters by status.
    For recruiters (user_id provided): returns all statuses by default (active, draft, expired).
    For public views (company_id or neither): shows active/expired by default.
    """
    query = db.query(JobPosting)
    is_recruiter_view = False
    
    # If user_id is provided, look up the company profile
    if user_id:
        is_recruiter_view = True
        company_profile = db.query(CompanyProfile).filter(CompanyProfile.user_id == user_id).first()
        if company_profile:
            query = query.filter(JobPosting.company_id == company_profile.company_id)
        else:
            # User has no company profile, return empty result
            return {
                "jobs": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False
            }
    # Filter by company_id if provided (backward compatibility)
    elif company_id:
        query = query.filter(JobPosting.company_id == company_id)
    
    # Filter by status
    # If status is explicitly provided, use it
    if status:
        query = query.filter(JobPosting.status == status)
    # For recruiters viewing their own jobs, return all statuses (active, draft, expired)
    # For public views, only show active/expired
    elif not is_recruiter_view:
        query = query.filter(JobPosting.status.in_(VISIBLE_STATUSES))
    
    # Get total count
    total = query.count()
    
    # Apply pagination and eager load relationships
    from sqlalchemy.orm import selectinload
    offset = (page - 1) * limit
    jobs = query.options(
        selectinload(JobPosting.company),
        selectinload(JobPosting.job_description),
        selectinload(JobPosting.stats)
    ).order_by(JobPosting.posted_date.desc()).offset(offset).limit(limit).all()
    items = [map_job_to_response(job) for job in jobs]
    total_pages = math.ceil(total / limit) if limit > 0 else 0
    
    return {
        "jobs": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }

@router.get("/{job_id}", response_model=schemas.JobResponse)
def get_job_detail(job_id: str, db: Session = Depends(get_db)):
    job = db.query(JobPosting).filter(JobPosting.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return map_job_to_response(job)

def map_job_to_response(job: JobPosting):
    """Map JobPosting model to API response that matches frontend Job type"""
    
    # Build location string
    location_parts = []
    if job.location_city:
        location_parts.append(job.location_city)
    if job.location_country:
        location_parts.append(job.location_country)
    location = ", ".join(location_parts) if location_parts else job.location_type or "Not specified"
    
    requirements = []
    if job.job_description and job.job_description.required_skills_experience:
        req_and_skills = job.job_description.required_skills_experience
        if isinstance(req_and_skills, dict):
            if isinstance(req_and_skills["required_skills_experience"], list):
                requirements = req_and_skills["required_skills_experience"]
    
    benefits = []
    if job.job_description and job.job_description.offers:
        offers = job.job_description.offers
        if isinstance(offers, dict) and "benefits" in offers:
            if isinstance(offers["benefits"], list):
                benefits = offers["benefits"]
    
    nice_to_have = []
    if job.job_description and job.job_description.nice_to_have:
        nth = job.job_description.nice_to_have
        if isinstance(nth, list):
            nice_to_have = nth
        elif isinstance(nth, dict):
            for key, val in nth.items():
                if isinstance(val, list):
                    nice_to_have = val
                    break
    
    company = None
    if job.company:
        company_location_parts = []
        if job.company.location_city:
            company_location_parts.append(job.company.location_city)
        if job.company.location_country:
            company_location_parts.append(job.company.location_country)
        company_location = ", ".join(company_location_parts) if company_location_parts else None
        
        company = {
            "id": job.company.company_id,
            "name": job.company.company_name,
            "description": job.company.description,
            "location": company_location,
            "website": job.company.website,
            "industry": job.company.industry,
            "founded_year": job.company.founded_year,
        }
    
    return {
        # IDs
        "job_id": job.job_id,
        "id": job.job_id,
        "company_id": job.company_id,
        "job_description_id": job.job_description_id,
        
        # Core job info
        "title": job.title,
        "department": job.department,
        "level": job.level,
        
        # Location - combined for frontend
        "location": location,
        "location_city": job.location_city,
        "location_country": job.location_country,
        "is_remote": job.location_type == "Remote",  # Derived for frontend compatibility
        "location_type": job.location_type,
        
        # Employment
        "employment_type": job.employment_type or "Full-time",
        
        # Salary - provide both formats
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "salary_currency": job.salary_currency or "USD",
        "salary_range": {
            "min": job.salary_min or 0,
            "max": job.salary_max or 0,
            "currency": job.salary_currency or "USD"
        } if job.salary_min or job.salary_max else None,
        
        # Status and dates
        "status": job.status,
        "posted_date": job.posted_date.isoformat() if job.posted_date else None,
        "application_deadline": job.application_deadline.isoformat() if job.application_deadline else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
        
        # Company - as object for frontend
        "company": company,
        "company_name": job.company.company_name if job.company else "Unknown Company",
        
        # Description
        "description": job.job_description.role_overview if job.job_description else None,
        "role_overview": job.job_description.role_overview if job.job_description else None,
        
        # Skills, Requirements, Benefits, and Nice to Have - as arrays for frontend
        "requirements": requirements,
        "benefits": benefits,
        "nice_to_have": nice_to_have,
        "required_skills_experience": job.job_description.required_skills_experience if job.job_description else None,
        
        # Stats from JobPostingStats
        "applicant_count": job.stats.applicant_count if job.stats else 0,
        "views_count": job.stats.views_count if job.stats else 0,
        "is_featured": False,
    }
