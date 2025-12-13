from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.core import get_db, get_current_user_id
from app.services.candidate.vector_job_service import JobVectorService
from app.models.job import JobPosting
from app.models.candidate import CandidateProfile
from app.schemas import job as schemas

router = APIRouter()
vector_service = JobVectorService()

# Valid job statuses that should be visible to candidates
VISIBLE_STATUSES = ['open', 'active']

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

@router.get("", response_model=schemas.JobListResponse)
def get_jobs(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    total = db.query(JobPosting).filter(JobPosting.status.in_(VISIBLE_STATUSES)).count()
    jobs = db.query(JobPosting).filter(JobPosting.status.in_(VISIBLE_STATUSES)).offset(offset).limit(limit).all()
    
    items = [map_job_to_response(job) for job in jobs]
    total_pages = math.ceil(total / limit)
    
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
    
    # Extract skills and requirements from job description
    skills = []
    requirements = []
    if job.job_description and job.job_description.required_skills_experience:
        req = job.job_description.required_skills_experience
        if isinstance(req, dict):
            # Extract skills array if present
            if "skills" in req and isinstance(req["skills"], list):
                skills = req["skills"]
            # Extract requirements array if present
            if "requirements" in req and isinstance(req["requirements"], list):
                requirements = req["requirements"]
            
            # Fallback: if no explicit "skills" key, try other common formats
            if not skills:
                for key, val in req.items():
                    if key != "requirements" and isinstance(val, list):
                        skills.extend(val)
                    elif key != "requirements" and isinstance(val, str):
                        skills.append(val)
        elif isinstance(req, list):
            skills = req
    
    # Extract benefits from offers JSON
    benefits = []
    if job.job_description and job.job_description.offers:
        offers = job.job_description.offers
        if isinstance(offers, dict) and "benefits" in offers:
            if isinstance(offers["benefits"], list):
                benefits = offers["benefits"]
    
    # Build company object for frontend with full profile info
    company = None
    if job.company:
        # Build company location string
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
        "id": job.job_id,  # Frontend uses this as key
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
        
        # Skills, Requirements, and Benefits - as arrays for frontend
        "skills": skills,
        "requirements": requirements,
        "benefits": benefits,
        "required_skills": job.job_description.required_skills_experience if job.job_description else None,
        
        # Placeholder fields the frontend might expect
        "applicant_count": 0,
        "views_count": 0,
        "is_featured": False,
    }
