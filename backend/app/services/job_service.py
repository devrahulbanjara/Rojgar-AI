"""
Job service - Business logic for job operations
"""

from typing import List, Optional, Dict
from sqlmodel import Session, select, func, or_, and_, col
from sqlalchemy.orm import selectinload

from app.models.job import (
    Job,
    Company,
    JobStatus,
    JobResponse,
    CompanyResponse,
)


class JobService:
    """Service for handling job-related business logic"""
    
    @staticmethod
    def to_job_response(job: Job) -> JobResponse:
        """Convert Job model to JobResponse"""
        response = JobResponse(
            id=job.id,
            title=job.title,
            department=job.department,
            level=job.level,
            description=job.description,
            location=job.location,
            location_type=job.location_type,
            is_remote=job.is_remote,
            employment_type=job.employment_type,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            salary_currency=job.salary_currency,
            requirements=job.requirements,
            skills=job.skills,
            benefits=job.benefits,
            posted_date=job.posted_date,
            application_deadline=job.application_deadline,
            status=job.status,
            is_featured=job.is_featured,
            applicant_count=job.applicant_count,
            views_count=job.views_count,
            company_id=job.company_id,
            created_by=job.created_by,
            created_at=job.created_at,
            updated_at=job.updated_at,
        )
        
        # Add company info if loaded
        if job.company:
            response.company = JobService.to_company_response(job.company)
        
        return response
    
    @staticmethod
    def to_company_response(company: Company) -> CompanyResponse:
        """Convert Company model to CompanyResponse"""
        return CompanyResponse(
            id=company.id,
            name=company.name,
            logo=company.logo,
            website=company.website,
            description=company.description,
            location=company.location,
            size=company.size,
            industry=company.industry,
            brand_color=company.brand_color,
            founded_year=company.founded_year,
        )
    
    @staticmethod
    def search_jobs(
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        location: Optional[str] = None,
        department: Optional[str] = None,
        level: Optional[str] = None,
        location_type: Optional[str] = None,
        employment_type: Optional[str] = None,
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None,
        is_remote: Optional[bool] = None,
        is_featured: Optional[bool] = None,
        company_id: Optional[int] = None,
        sort_by: str = "posted_date",
        sort_order: str = "desc",
    ) -> Dict:
        """Search and filter jobs with pagination"""
        # Start with active jobs only
        query = select(Job).where(Job.status == JobStatus.ACTIVE)
        
        # Add company relationship
        query = query.options(selectinload(Job.company))
        
        # Apply search filter
        if search:
            search_term = f"%{search.lower()}%"
            query = query.where(
                or_(
                    col(Job.title).ilike(search_term),
                    col(Job.description).ilike(search_term),
                    col(Job.location).ilike(search_term),
                )
            )
        
        # Apply filters
        if location:
            query = query.where(col(Job.location).ilike(f"%{location}%"))
        if department:
            query = query.where(col(Job.department).ilike(f"%{department}%"))
        if level:
            query = query.where(Job.level == level)
        if location_type:
            query = query.where(Job.location_type == location_type)
        if employment_type:
            query = query.where(Job.employment_type == employment_type)
        if salary_min:
            query = query.where(Job.salary_max >= salary_min)
        if salary_max:
            query = query.where(Job.salary_min <= salary_max)
        if is_remote is not None:
            query = query.where(Job.is_remote == is_remote)
        if is_featured is not None:
            query = query.where(Job.is_featured == is_featured)
        if company_id:
            query = query.where(Job.company_id == company_id)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = db.exec(count_query).one()
        
        # Apply sorting
        sort_column = Job.posted_date
        if sort_by == "title":
            sort_column = Job.title
        elif sort_by == "salary":
            sort_column = Job.salary_min
        
        if sort_order == "desc":
            query = query.order_by(col(sort_column).desc())
        else:
            query = query.order_by(col(sort_column).asc())
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        # Execute
        jobs = db.exec(query).all()
        
        # Calculate pagination info
        total_pages = (total + limit - 1) // limit
        has_next = page < total_pages
        has_prev = page > 1
        
        return {
            "jobs": [JobService.to_job_response(job) for job in jobs],
            "total": total,
            "page": page,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev,
        }
    
    @staticmethod
    def get_job_by_id(job_id: int, db: Session, increment_view: bool = False) -> Optional[Job]:
        """Get a job by ID with company info"""
        query = select(Job).where(Job.id == job_id).options(selectinload(Job.company))
        job = db.exec(query).first()
        
        if job and increment_view:
            job.views_count += 1
            db.add(job)
            db.commit()
            db.refresh(job)
        
        return job
    
    @staticmethod
    def get_featured_jobs(db: Session, limit: int = 10) -> List[Job]:
        """Get featured jobs"""
        query = (
            select(Job)
            .where(and_(Job.is_featured == True, Job.status == JobStatus.ACTIVE))
            .options(selectinload(Job.company))
            .order_by(col(Job.posted_date).desc())
            .limit(limit)
        )
        
        return db.exec(query).all()
    
    @staticmethod
    def get_recent_jobs(db: Session, limit: int = 10) -> List[Job]:
        """Get recently posted jobs"""
        query = (
            select(Job)
            .where(Job.status == JobStatus.ACTIVE)
            .options(selectinload(Job.company))
            .order_by(col(Job.posted_date).desc())
            .limit(limit)
        )
        
        return db.exec(query).all()
    
    @staticmethod
    def get_remote_jobs(db: Session, limit: int = 20) -> List[Job]:
        """Get remote jobs"""
        query = (
            select(Job)
            .where(and_(Job.is_remote == True, Job.status == JobStatus.ACTIVE))
            .options(selectinload(Job.company))
            .order_by(col(Job.posted_date).desc())
            .limit(limit)
        )
        
        return db.exec(query).all()
    
    @staticmethod
    def get_jobs_by_skill(db: Session, skill: str, limit: int = 20) -> List[Job]:
        """Get jobs that require a specific skill"""
        query = (
            select(Job)
            .where(Job.status == JobStatus.ACTIVE)
            .options(selectinload(Job.company))
        )
        
        all_jobs = db.exec(query).all()
        
        # Filter by skill (case-insensitive)
        skill_lower = skill.lower()
        matching_jobs = [
            job for job in all_jobs
            if any(skill_lower in s.lower() for s in job.skills)
        ]
        
        # Sort by posted date and limit
        matching_jobs.sort(key=lambda x: x.posted_date, reverse=True)
        return matching_jobs[:limit]
    
    @staticmethod
    def get_jobs_by_location(db: Session, location: str, limit: int = 20) -> List[Job]:
        """Get jobs in a specific location"""
        query = (
            select(Job)
            .where(and_(
                col(Job.location).ilike(f"%{location}%"),
                Job.status == JobStatus.ACTIVE
            ))
            .options(selectinload(Job.company))
            .order_by(col(Job.posted_date).desc())
            .limit(limit)
        )
        
        return db.exec(query).all()
    
    @staticmethod
    def get_high_salary_jobs(db: Session, min_salary: int, limit: int = 20) -> List[Job]:
        """Get jobs with salary above minimum threshold"""
        query = (
            select(Job)
            .where(and_(
                Job.salary_min >= min_salary,
                Job.status == JobStatus.ACTIVE
            ))
            .options(selectinload(Job.company))
            .order_by(col(Job.salary_min).desc())
            .limit(limit)
        )
        
        return db.exec(query).all()
    
    @staticmethod
    def increment_job_view(job_id: int, db: Session) -> bool:
        """Increment view count for a job"""
        job = db.get(Job, job_id)
        if not job:
            return False
        
        job.views_count += 1
        db.add(job)
        db.commit()
        return True
    
    @staticmethod
    def increment_job_application(job_id: int, db: Session) -> bool:
        """Increment application count for a job"""
        job = db.get(Job, job_id)
        if not job:
            return False
        
        job.applicant_count += 1
        db.add(job)
        db.commit()
        return True
    
    # Company-related methods
    
    @staticmethod
    def get_all_companies(db: Session) -> List[Company]:
        """Get all companies"""
        return db.exec(select(Company)).all()
    
    @staticmethod
    def get_company_by_id(company_id: int, db: Session) -> Optional[Company]:
        """Get a specific company"""
        return db.get(Company, company_id)
    
    @staticmethod
    def get_company_jobs(company_id: int, db: Session) -> List[Job]:
        """Get all jobs for a specific company"""
        query = (
            select(Job)
            .where(Job.company_id == company_id)
            .options(selectinload(Job.company))
        )
        
        return db.exec(query).all()
    
    @staticmethod
    def get_company_info_with_stats(company_id: int, db: Session) -> Optional[Dict]:
        """Get company with jobs and statistics"""
        company = db.get(Company, company_id)
        if not company:
            return None
        
        # Get all jobs for this company
        jobs = db.exec(select(Job).where(Job.company_id == company_id)).all()
        active_jobs = [j for j in jobs if j.status == JobStatus.ACTIVE]
        
        # Calculate stats
        total_applications = sum(j.applicant_count for j in jobs)
        total_views = sum(j.views_count for j in jobs)
        avg_salary = sum(j.salary_min for j in active_jobs) / len(active_jobs) if active_jobs else 0
        
        # Get unique skills
        all_skills = []
        for job in active_jobs:
            all_skills.extend(job.skills)
        unique_skills = list(set(all_skills))
        
        return {
            "company": JobService.to_company_response(company),
            "jobs": [JobService.to_job_response(job) for job in active_jobs],
            "statistics": {
                "total_jobs": len(jobs),
                "active_jobs": len(active_jobs),
                "total_applications": total_applications,
                "total_views": total_views,
                "average_salary": round(avg_salary, 2),
                "unique_skills": unique_skills,
            }
        }
    
    @staticmethod
    def get_job_statistics(db: Session) -> Dict:
        """Get overall job statistics"""
        # Get counts
        total_jobs = db.exec(select(func.count(Job.id))).one()
        active_jobs = db.exec(
            select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE)
        ).one()
        featured_jobs = db.exec(
            select(func.count(Job.id)).where(Job.is_featured == True)
        ).one()
        remote_jobs = db.exec(
            select(func.count(Job.id)).where(Job.is_remote == True)
        ).one()
        
        # Average salary
        avg_salary_result = db.exec(select(func.avg(Job.salary_min))).one()
        avg_salary = round(avg_salary_result, 2) if avg_salary_result else 0
        
        # Get all jobs for analysis
        all_jobs = db.exec(select(Job)).all()
        
        # Top skills
        all_skills = []
        for job in all_jobs:
            all_skills.extend(job.skills)
        skill_counts = {}
        for skill in all_skills:
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
        top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_skills = [skill for skill, count in top_skills]
        
        # Top locations
        location_counts = {}
        for job in all_jobs:
            if job.location:
                location_counts[job.location] = location_counts.get(job.location, 0) + 1
        top_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_locations = [loc for loc, count in top_locations]
        
        # Top companies
        companies = db.exec(select(Company)).all()
        company_map = {c.id: c.name for c in companies}
        company_counts = {}
        for job in all_jobs:
            company_counts[job.company_id] = company_counts.get(job.company_id, 0) + 1
        top_company_ids = sorted(company_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_companies = [company_map.get(cid, f"Company {cid}") for cid, count in top_company_ids]
        
        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "featured_jobs": featured_jobs,
            "remote_jobs": remote_jobs,
            "avg_salary": avg_salary,
            "top_skills": top_skills,
            "top_locations": top_locations,
            "top_companies": top_companies,
        }

