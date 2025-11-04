from typing import List, Optional, Dict
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, or_, and_

from app.models.job import Job, Company, JobStatus
from app.models.user import User
from app.models.skill import Skill
from app.models.profile import Profile, ProfileSkill
from app.schemas.job import JobResponse, CompanyResponse, JobSearchRequest
from app.services.vector_job_service import VectorJobService


class JobService:    
    @staticmethod
    def to_job_response(job: Job) -> JobResponse:
        return JobResponse.model_validate(job)
    
    @staticmethod
    def to_company_response(company: Company) -> CompanyResponse:
        return CompanyResponse.model_validate(company)
    
    @staticmethod
    def get_recommended_jobs(db: Session, limit: int = 5) -> Dict:
        query = (
            select(Job)
            .where(Job.status == JobStatus.ACTIVE.value)
            .options(selectinload(Job.company))
            .order_by(Job.posted_date.desc())
            .limit(limit)
        )

        jobs = db.execute(query).scalars().all()

        return {
            "jobs": [JobService.to_job_response(job) for job in jobs],
            "total": len(jobs),
            "limit": limit,
        }
    

    @staticmethod
    def search_jobs(db: Session, params: JobSearchRequest) -> Dict:

        query = (
            select(Job)
            .join(Company, Job.company_id == Company.id)
            .where(Job.status == JobStatus.ACTIVE.value)
            .options(selectinload(Job.company))
        )

        if params.search:
            search_term = f"%{params.search.lower()}%"
            query = query.where(
                or_(
                    Job.title.ilike(search_term),
                    Company.name.ilike(search_term),
                )
            )

        total = db.scalar(select(func.count()).select_from(query.subquery()))

        sort_column = Job.salary_min if params.sort_by == "salary" else Job.posted_date
        sort_method = sort_column.desc() if params.sort_order == "desc" else sort_column.asc()
        query = query.order_by(sort_method)

        offset = (params.page - 1) * params.limit
        query = query.offset(offset).limit(params.limit)

        jobs = db.scalars(query).all()

        total_pages = max((total + params.limit - 1) // params.limit, 1)
        return {
            "jobs": [JobService.to_job_response(job) for job in jobs],
            "total": total,
            "page": params.page,
            "total_pages": total_pages,
            "has_next": params.page < total_pages,
            "has_prev": params.page > 1,
        }

    
    @staticmethod
    def get_job_by_id(job_id: int, db: Session, increment_view: bool = False) -> Optional[Job]:
        query = select(Job).where(Job.id == job_id).options(selectinload(Job.company))
        job = db.execute(query).scalar_one_or_none()
        
        if job and increment_view:
            job.views_count += 1
            db.add(job)
            db.commit()
            db.refresh(job)
        
        return job
    
    @staticmethod
    def get_recent_jobs(db: Session, limit: int = 10) -> List[Job]:
        query = (
            select(Job)
            .where(Job.status == JobStatus.ACTIVE.value)
            .options(selectinload(Job.company))
            .order_by(Job.posted_date.desc())
            .limit(limit)
        )
        
        return db.execute(query).scalars().all()

    
    @staticmethod
    def increment_job_view(job_id: int, db: Session) -> bool:
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job:
            return False
        
        job.views_count += 1
        db.add(job)
        db.commit()
        return True
    
    @staticmethod
    def increment_job_application(job_id: int, db: Session) -> bool:        
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job:
            return False
        
        job.applicant_count += 1
        db.add(job)
        db.commit()
        return True
    
    # Company-related methods
    
    @staticmethod
    def get_all_companies(db: Session) -> List[Company]:
        return db.execute(select(Company)).scalars().all()
    
    @staticmethod
    def get_company_by_id(company_id: int, db: Session) -> Optional[Company]:
        return db.execute(select(Company).where(Company.id == company_id)).scalar_one_or_none()
    
    @staticmethod
    def get_company_jobs(company_id: int, db: Session) -> List[Job]:
        query = (
            select(Job)
            .where(Job.company_id == company_id)
            .options(selectinload(Job.company))
        )
        
        return db.execute(query).scalars().all()
    
    @staticmethod
    def get_company_info_with_stats(company_id: int, db: Session) -> Optional[Dict]:
        company = db.execute(
            select(Company).where(Company.id == company_id)
        ).scalar_one_or_none()
        if not company:
            return None
        
        # Use database aggregation for counts and sums
        total_jobs = db.execute(
            select(func.count(Job.id)).where(Job.company_id == company_id)
        ).scalar_one()
        
        active_jobs_count = db.execute(
            select(func.count(Job.id))
            .where(Job.company_id == company_id)
            .where(Job.status == JobStatus.ACTIVE.value)
        ).scalar_one()
        
        # Aggregate applications and views in database
        stats = db.execute(
            select(
                func.sum(Job.applicant_count),
                func.sum(Job.views_count)
            )
            .where(Job.company_id == company_id)
        ).one()
        
        total_applications = stats[0] or 0
        total_views = stats[1] or 0
        
        # Get average salary only for active jobs
        avg_salary_result = db.execute(
            select(func.avg(Job.salary_min))
            .where(Job.company_id == company_id)
            .where(Job.status == JobStatus.ACTIVE.value)
        ).scalar_one()
        avg_salary = avg_salary_result if avg_salary_result else 0
        
        # Fetch active jobs with eager loading for display
        active_jobs = db.execute(
            select(Job)
            .where(Job.company_id == company_id)
            .where(Job.status == JobStatus.ACTIVE.value)
            .options(selectinload(Job.company))
        ).scalars().all()
        
        # Extract unique skills from active jobs
        all_skills = set()
        for job in active_jobs:
            if job.skills:
                all_skills.update(job.skills)
        
        return {
            "company": JobService.to_company_response(company),
            "jobs": [JobService.to_job_response(job) for job in active_jobs],
            "statistics": {
                "total_jobs": total_jobs,
                "active_jobs": active_jobs_count,
                "total_applications": total_applications,
                "total_views": total_views,
                "average_salary": round(avg_salary, 2),
                "unique_skills": list(all_skills),
            }
        }
    
    @staticmethod
    def get_job_statistics(db: Session) -> Dict:
        # Aggregate counts in a single query for better performance
        total_jobs = db.execute(select(func.count(Job.id))).scalar_one()
        active_jobs = db.execute(
            select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE.value)
        ).scalar_one()
        featured_jobs = db.execute(
            select(func.count(Job.id)).where(Job.is_featured == True)
        ).scalar_one()
        remote_jobs = db.execute(
            select(func.count(Job.id)).where(Job.is_remote == True)
        ).scalar_one()
        
        avg_salary_result = db.execute(select(func.avg(Job.salary_min))).scalar_one()
        avg_salary = round(avg_salary_result, 2) if avg_salary_result else 0
        
        # Only fetch the specific columns we need instead of full Job objects
        jobs_data = db.execute(
            select(Job.skills, Job.location, Job.company_id)
        ).all()
        
        # Process skills efficiently
        skill_counts = {}
        for skills, _, _ in jobs_data:
            if skills:
                for skill in skills:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
        top_skills = [skill for skill, _ in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]]
        
        # Process locations efficiently
        location_counts = {}
        for _, location, _ in jobs_data:
            if location:
                location_counts[location] = location_counts.get(location, 0) + 1
        top_locations = [loc for loc, _ in sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]]
        
        # Process companies efficiently - fetch company names only for top companies
        company_counts = {}
        for _, _, company_id in jobs_data:
            company_counts[company_id] = company_counts.get(company_id, 0) + 1
        
        top_company_ids = [cid for cid, _ in sorted(company_counts.items(), key=lambda x: x[1], reverse=True)[:5]]
        
        # Only fetch names for top companies
        companies = db.execute(
            select(Company.id, Company.name).where(Company.id.in_(top_company_ids))
        ).all()
        company_map = {c.id: c.name for c in companies}
        top_companies = [company_map.get(cid, f"Company {cid}") for cid in top_company_ids]
        
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
    
    
    @staticmethod
    def add_job_to_vector_db(job: Job) -> bool:
        vector_service = VectorJobService()
        return vector_service.add_job_to_vector_db(job)
    
    @staticmethod
    def search_similar_jobs(query: str, limit: int = 5) -> List[Dict]:
        vector_service = VectorJobService()
        return vector_service.search_similar_jobs(query, limit)
    
    @staticmethod
    def delete_job_from_vector_db(job_id: int) -> bool:
        vector_service = VectorJobService()
        return vector_service.delete_job_from_vector_db(job_id)
    
    @staticmethod
    def create_job_with_vector_sync(job_data: dict, db: Session) -> Optional[Job]:
        try:
            job = Job(**job_data)
            db.add(job)
            db.commit()
            db.refresh(job)
            
            vector_success = JobService.add_job_to_vector_db(job)
            
            if not vector_success:
                print(f"Warning: Failed to add job {job.id} to vector database")
            
            return job
            
        except Exception as e:
            db.rollback()
            print(f"Error creating job: {e}")
            return None
    
    @staticmethod
    def get_user_skills(user_id: str, db: Session) -> List[str]:
        skills = []
        
        user_skills = db.execute(select(Skill.skill).where(Skill.user_id == user_id)).scalars().all()
        skills.extend(user_skills)
        
        profile = db.execute(select(Profile).where(Profile.user_id == user_id)).scalar_one_or_none()
        if profile:
            profile_skills = db.execute(
                select(ProfileSkill.skill_name).where(ProfileSkill.profile_id == profile.id)
            ).scalars().all()
            skills.extend(profile_skills)
        
        return list(set(skills))  # Remove duplicates
    
    @staticmethod
    def get_personalized_job_recommendations(user_id: str, db: Session, page: int = 1, limit: int = 10) -> Dict:
        try:
            user_skills = JobService.get_user_skills(user_id, db)
            
            if not user_skills:
                return {
                    "jobs": [],
                    "total": 0,
                    "page": page,
                    "total_pages": 0,
                    "has_next": False,
                    "has_prev": False
                }
            
            try:
                vector_service = VectorJobService()
                recommendations = vector_service.get_personalized_job_recommendations(user_skills, page, limit)
            except Exception as e:
                print(f"Vector database unavailable, falling back to regular job search: {e}")
                jobs = db.execute(
                    select(Job)
                    .where(Job.status == JobStatus.ACTIVE.value)
                    .options(selectinload(Job.company))
                    .order_by(Job.posted_date.desc())
                    .limit(limit)
                ).scalars().all()
                
                job_responses = []
                for job in jobs:
                    job_response = JobService.to_job_response(job)
                    job_response_dict = job_response.model_dump()
                    job_response_dict["similarity_score"] = 0.5
                    job_responses.append(job_response_dict)
                
                return {
                    "jobs": job_responses,
                    "total": len(job_responses),
                    "page": page,
                    "total_pages": 1,
                    "has_next": False,
                    "has_prev": False
                }
            
            if not recommendations:
                return {
                    "jobs": [],
                    "total": 0,
                    "page": page,
                    "total_pages": 0,
                    "has_next": False,
                    "has_prev": False
                }
            
            job_ids = [rec["job_id"] for rec in recommendations]
            scores = {rec["job_id"]: rec["score"] for rec in recommendations}
            
            jobs = db.execute(
                select(Job)
                .where(Job.id.in_(job_ids))
                .where(Job.status == JobStatus.ACTIVE.value)
                .options(selectinload(Job.company))
            ).scalars().all()
            
            jobs_with_scores = [(job, scores.get(job.id, 0)) for job in jobs]
            jobs_with_scores.sort(key=lambda x: x[1], reverse=True)
            
            job_responses = []
            for job, score in jobs_with_scores:
                job_response = JobService.to_job_response(job)
                job_response_dict = job_response.model_dump()
                job_response_dict["similarity_score"] = round(score, 4)
                job_responses.append(job_response_dict)
            
            total_jobs = len(job_responses)
            if page == 1:
                total_pages = max(2, (total_jobs + limit - 1) // limit)
            else:
                total_pages = page + 1
            
            has_next = len(job_responses) == limit
            
            return {
                "jobs": job_responses,
                "total": total_jobs,
                "page": page,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": page > 1
            }
            
        except Exception as e:
            print(f"Error getting personalized recommendations: {e}")
            return {
                "jobs": [],
                "total": 0,
                "page": page,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False
            }
