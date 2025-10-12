"""
Job Service
Clean, production-ready business logic layer for jobs
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import logging

from app.models.job import Job, Company
from app.schemas.job import JobRead, CompanyRead
from app.repositories.job_repo import JobRepository

# Configure logging
logger = logging.getLogger(__name__)


class JobService:
    """Service layer for job business logic"""
    
    @staticmethod
    def get_all_jobs() -> List[Job]:
        """Get all jobs"""
        logger.info("Retrieving all jobs")
        return JobRepository.get_all_jobs()

    @staticmethod
    def get_job_by_id(job_id: int) -> Optional[Job]:
        """Get a specific job by ID"""
        logger.info(f"Retrieving job {job_id}")
        return JobRepository.get_job_by_id(job_id)

    @staticmethod
    def get_jobs_by_company(company_id: int) -> List[Job]:
        """Get all jobs for a specific company"""
        logger.info(f"Retrieving jobs for company {company_id}")
        return JobRepository.get_jobs_by_company(company_id)

    @staticmethod
    def get_featured_jobs(limit: int = 10) -> List[Job]:
        """Get featured jobs"""
        logger.info(f"Retrieving {limit} featured jobs")
        return JobRepository.get_featured_jobs(limit)

    @staticmethod
    def search_jobs(search_params: Dict[str, Any], with_company: bool = False) -> Tuple[List[Job], int]:
        """Search jobs with filters and pagination"""
        logger.info(f"Searching jobs with params: {search_params}")
        
        jobs, total_count = JobRepository.search_jobs(search_params, with_company=with_company)
        
        logger.info(f"Search returned {len(jobs)} jobs out of {total_count} total")
        return jobs, total_count

    @staticmethod
    def get_jobs_with_companies(jobs: List[Job]) -> List[JobRead]:
        """
        Get jobs with their company information.
        Note: For best performance, pass jobs that were fetched with the company 
        relationship already loaded (using with_company=True in repository methods).
        """
        logger.info(f"Converting {len(jobs)} jobs to JobRead with company data")
        
        enriched_jobs = []
        for job in jobs:
            job_read = JobRead.model_validate(job)
            # If the company relationship is loaded, use it directly
            if job.company:
                job_read.company = CompanyRead.model_validate(job.company)
            enriched_jobs.append(job_read)
        
        logger.info(f"Converted {len(enriched_jobs)} jobs with company data")
        return enriched_jobs

    @staticmethod
    def get_job_with_company(job_id: int) -> Optional[JobRead]:
        """Get a specific job with company information using relationship loading"""
        logger.info(f"Retrieving job {job_id} with company data")
        
        # Use with_company=True to leverage eager loading via relationship
        job = JobRepository.get_job_by_id(job_id, with_company=True)
        if not job:
            return None
        
        job_read = JobRead.model_validate(job)
        
        # Company is already loaded via relationship
        if job.company:
            job_read.company = CompanyRead.model_validate(job.company)
        
        return job_read

    @staticmethod
    def increment_job_views(job_id: int) -> bool:
        """Increment view count for a job"""
        logger.info(f"Incrementing view count for job {job_id}")
        return JobRepository.increment_job_views(job_id)

    @staticmethod
    def increment_job_applications(job_id: int) -> bool:
        """Increment application count for a job"""
        logger.info(f"Incrementing application count for job {job_id}")
        return JobRepository.increment_job_applications(job_id)

    @staticmethod
    def get_job_statistics() -> Dict[str, Any]:
        """Get job statistics"""
        logger.info("Generating job statistics")
        
        stats = JobRepository.get_job_statistics()
        
        logger.info(f"Generated job statistics")
        return stats

    @staticmethod
    def get_recent_jobs(limit: int = 10) -> List[Job]:
        """Get recently posted jobs"""
        logger.info(f"Retrieving {limit} recent jobs")
        
        all_jobs = JobRepository.get_all_jobs()
        
        # Filter active jobs and sort by posted date
        active_jobs = [job for job in all_jobs if job.status.value == "Active"]
        active_jobs.sort(key=lambda x: x.posted_date, reverse=True)
        
        recent_jobs = active_jobs[:limit]
        
        logger.info(f"Retrieved {len(recent_jobs)} recent jobs")
        return recent_jobs

    @staticmethod
    def get_jobs_by_skill(skill: str, limit: int = 20) -> List[Job]:
        """Get jobs that require a specific skill"""
        logger.info(f"Retrieving jobs requiring skill: {skill}")
        
        all_jobs = JobRepository.get_all_jobs()
        
        # Filter jobs that contain the skill
        skill_jobs = [
            job for job in all_jobs
            if job.status.value == "Active" and skill.lower() in [s.lower() for s in job.skills]
        ]
        
        # Sort by posted date (newest first)
        skill_jobs.sort(key=lambda x: x.posted_date, reverse=True)
        
        limited_jobs = skill_jobs[:limit]
        
        logger.info(f"Retrieved {len(limited_jobs)} jobs requiring skill: {skill}")
        return limited_jobs

    @staticmethod
    def get_jobs_by_location(location: str, limit: int = 20) -> List[Job]:
        """Get jobs in a specific location"""
        logger.info(f"Retrieving jobs in location: {location}")
        
        all_jobs = JobRepository.get_all_jobs()
        
        # Filter jobs in the location
        location_jobs = [
            job for job in all_jobs
            if job.status.value == "Active" and location.lower() in job.location.lower()
        ]
        
        # Sort by posted date (newest first)
        location_jobs.sort(key=lambda x: x.posted_date, reverse=True)
        
        limited_jobs = location_jobs[:limit]
        
        logger.info(f"Retrieved {len(limited_jobs)} jobs in location: {location}")
        return limited_jobs

    @staticmethod
    def get_remote_jobs(limit: int = 20) -> List[Job]:
        """Get remote jobs"""
        logger.info(f"Retrieving {limit} remote jobs")
        
        all_jobs = JobRepository.get_all_jobs()
        
        # Filter remote jobs
        remote_jobs = [
            job for job in all_jobs
            if job.status.value == "Active" and job.is_remote
        ]
        
        # Sort by posted date (newest first)
        remote_jobs.sort(key=lambda x: x.posted_date, reverse=True)
        
        limited_jobs = remote_jobs[:limit]
        
        logger.info(f"Retrieved {len(limited_jobs)} remote jobs")
        return limited_jobs

    @staticmethod
    def get_high_salary_jobs(min_salary: int, limit: int = 20) -> List[Job]:
        """Get jobs with salary above minimum threshold"""
        logger.info(f"Retrieving jobs with salary >= {min_salary}")
        
        all_jobs = JobRepository.get_all_jobs()
        
        # Filter high salary jobs
        high_salary_jobs = [
            job for job in all_jobs
            if job.status.value == "Active" and job.salary_min >= min_salary
        ]
        
        # Sort by salary (highest first)
        high_salary_jobs.sort(key=lambda x: x.salary_min, reverse=True)
        
        limited_jobs = high_salary_jobs[:limit]
        
        logger.info(f"Retrieved {len(limited_jobs)} high salary jobs")
        return limited_jobs

    @staticmethod
    def get_all_companies() -> List[Company]:
        """Get all companies"""
        logger.info("Retrieving all companies")
        return JobRepository.get_all_companies()

    @staticmethod
    def get_company_by_id(company_id: int) -> Optional[Company]:
        """Get a specific company by ID"""
        logger.info(f"Retrieving company {company_id}")
        return JobRepository.get_company_by_id(company_id)

    @staticmethod
    def get_company_jobs_with_stats(company_id: int) -> Dict[str, Any]:
        """Get company with its jobs and statistics"""
        logger.info(f"Retrieving company {company_id} with jobs and stats")
        
        company = JobRepository.get_company_by_id(company_id)
        if not company:
            return None
        
        jobs = JobRepository.get_jobs_by_company(company_id)
        active_jobs = [job for job in jobs if job.status.value == "Active"]
        
        # Calculate company statistics
        total_jobs = len(jobs)
        active_jobs_count = len(active_jobs)
        total_applications = sum(job.applicant_count for job in jobs)
        total_views = sum(job.views_count for job in jobs)
        
        # Get average salary
        salaries = [job.salary_min for job in active_jobs]
        avg_salary = sum(salaries) / len(salaries) if salaries else 0
        
        # Get unique skills
        all_skills = []
        for job in active_jobs:
            all_skills.extend(job.skills)
        unique_skills = list(set(all_skills))
        
        # Convert to Read models
        company_read = CompanyRead.model_validate(company)
        jobs_read = [JobRead.model_validate(job) for job in active_jobs]
        
        company_data = {
            "company": company_read,
            "jobs": jobs_read,
            "statistics": {
                "total_jobs": total_jobs,
                "active_jobs": active_jobs_count,
                "total_applications": total_applications,
                "total_views": total_views,
                "average_salary": round(avg_salary, 2),
                "unique_skills": unique_skills
            }
        }
        
        logger.info(f"Retrieved company {company_id} with {active_jobs_count} active jobs")
        return company_data

    @staticmethod
    def validate_job_access(job_id: int) -> bool:
        """Validate if a job exists and is accessible"""
        logger.info(f"Validating access to job {job_id}")
        
        job = JobRepository.get_job_by_id(job_id)
        if not job:
            logger.warning(f"Job {job_id} not found")
            return False
        
        if job.status.value != "Active":
            logger.warning(f"Job {job_id} is not active (status: {job.status.value})")
            return False
        
        if job.is_expired():
            logger.warning(f"Job {job_id} has expired")
            return False
        
        logger.info(f"Job {job_id} is accessible")
        return True
