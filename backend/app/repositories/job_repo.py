"""
Job Repository
Clean, production-ready data access layer for jobs
"""

import json
import os
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple

from app.models.job import Job, Company, JobLevel, LocationType, EmploymentType, JobStatus

# Configure logging
logger = logging.getLogger(__name__)

# Data file configuration
DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data"
)
JOBS_FILE = os.path.join(DATA_DIR, "jobs.json")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Create jobs.json if it doesn't exist
if not os.path.exists(JOBS_FILE):
    with open(JOBS_FILE, "w") as f:
        json.dump({"jobs": [], "companies": []}, f)
        logger.info("Created new jobs.json file")


class JobRepository:
    """Repository for job data operations with proper error handling"""
    
    @staticmethod
    def _load_data() -> Dict[str, Any]:
        """Load jobs and companies from JSON file with error handling"""
        try:
            with open(JOBS_FILE, "r") as f:
                data = json.load(f)
                jobs = data.get("jobs", [])
                companies = data.get("companies", [])
                logger.debug(f"Loaded {len(jobs)} jobs and {len(companies)} companies from file")
                return {"jobs": jobs, "companies": companies}
        except FileNotFoundError:
            logger.warning("Jobs file not found, returning empty data")
            return {"jobs": [], "companies": []}
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing jobs JSON: {e}")
            return {"jobs": [], "companies": []}
        except Exception as e:
            logger.error(f"Unexpected error loading jobs data: {e}")
            return {"jobs": [], "companies": []}

    @staticmethod
    def _save_data(data: Dict[str, Any]) -> bool:
        """Save jobs and companies to JSON file with error handling"""
        try:
            with open(JOBS_FILE, "w") as f:
                json.dump(data, f, indent=2)
                logger.debug("Successfully saved jobs data to file")
                return True
        except Exception as e:
            logger.error(f"Error saving jobs data: {e}")
            return False

    @classmethod
    def get_all_jobs(cls) -> List[Job]:
        """Get all jobs from the repository"""
        try:
            data = cls._load_data()
            jobs_data = data.get("jobs", [])
            jobs = [Job.from_dict(job) for job in jobs_data]
            logger.info(f"Retrieved {len(jobs)} jobs from repository")
            return jobs
        except Exception as e:
            logger.error(f"Error retrieving all jobs: {e}")
            return []

    @classmethod
    def get_job_by_id(cls, job_id: int) -> Optional[Job]:
        """Get a specific job by ID"""
        try:
            data = cls._load_data()
            jobs_data = data.get("jobs", [])
            
            for job_data in jobs_data:
                if job_data["id"] == job_id:
                    job = Job.from_dict(job_data)
                    logger.info(f"Retrieved job {job_id} from repository")
                    return job
            
            logger.warning(f"Job {job_id} not found in repository")
            return None
        except Exception as e:
            logger.error(f"Error retrieving job {job_id}: {e}")
            return None

    @classmethod
    def get_jobs_by_company(cls, company_id: int) -> List[Job]:
        """Get all jobs for a specific company"""
        try:
            data = cls._load_data()
            jobs_data = data.get("jobs", [])
            
            company_jobs = [
                Job.from_dict(job) for job in jobs_data 
                if job["company_id"] == company_id
            ]
            
            logger.info(f"Retrieved {len(company_jobs)} jobs for company {company_id}")
            return company_jobs
        except Exception as e:
            logger.error(f"Error retrieving jobs for company {company_id}: {e}")
            return []

    @classmethod
    def get_featured_jobs(cls, limit: int = 10) -> List[Job]:
        """Get featured jobs"""
        try:
            data = cls._load_data()
            jobs_data = data.get("jobs", [])
            
            featured_jobs = [
                Job.from_dict(job) for job in jobs_data 
                if job.get("is_featured", False) and job.get("status") == "Active"
            ]
            
            # Sort by posted date (newest first) and limit results
            featured_jobs.sort(key=lambda x: x.posted_date, reverse=True)
            featured_jobs = featured_jobs[:limit]
            
            logger.info(f"Retrieved {len(featured_jobs)} featured jobs")
            return featured_jobs
        except Exception as e:
            logger.error(f"Error retrieving featured jobs: {e}")
            return []

    @classmethod
    def search_jobs(cls, search_params: Dict[str, Any]) -> Tuple[List[Job], int]:
        """Search jobs with filters and pagination"""
        try:
            data = cls._load_data()
            jobs_data = data.get("jobs", [])
            
            # Convert to Job objects
            all_jobs = [Job.from_dict(job) for job in jobs_data]
            
            # Apply filters
            filtered_jobs = cls._apply_filters(all_jobs, search_params)
            
            # Apply sorting
            sorted_jobs = cls._apply_sorting(filtered_jobs, search_params)
            
            # Apply pagination
            page = search_params.get("page", 1)
            limit = search_params.get("limit", 20)
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            
            paginated_jobs = sorted_jobs[start_idx:end_idx]
            total_count = len(sorted_jobs)
            
            logger.info(f"Search returned {len(paginated_jobs)} jobs out of {total_count} total")
            return paginated_jobs, total_count
        except Exception as e:
            logger.error(f"Error searching jobs: {e}")
            return [], 0

    @classmethod
    def _apply_filters(cls, jobs: List[Job], search_params: Dict[str, Any]) -> List[Job]:
        """Apply search filters to jobs"""
        filtered_jobs = jobs.copy()
        
        # Search query filter
        if search_params.get("search"):
            search_query = search_params["search"].lower()
            filtered_jobs = [
                job for job in filtered_jobs
                if (search_query in job.title.lower() or
                    search_query in job.description.lower() or
                    search_query in job.location.lower())
            ]
        
        # Location filter
        if search_params.get("location"):
            location = search_params["location"].lower()
            filtered_jobs = [
                job for job in filtered_jobs
                if location in job.location.lower()
            ]
        
        # Department filter
        if search_params.get("department"):
            department = search_params["department"].lower()
            filtered_jobs = [
                job for job in filtered_jobs
                if department in job.department.lower()
            ]
        
        # Level filter
        if search_params.get("level"):
            levels = search_params["level"]
            filtered_jobs = [
                job for job in filtered_jobs
                if job.level in levels
            ]
        
        # Location type filter
        if search_params.get("location_type"):
            location_types = search_params["location_type"]
            filtered_jobs = [
                job for job in filtered_jobs
                if job.location_type in location_types
            ]
        
        # Employment type filter
        if search_params.get("employment_type"):
            employment_types = search_params["employment_type"]
            filtered_jobs = [
                job for job in filtered_jobs
                if job.employment_type in employment_types
            ]
        
        # Salary filters
        if search_params.get("salary_min"):
            min_salary = search_params["salary_min"]
            filtered_jobs = [
                job for job in filtered_jobs
                if job.salary_range.max >= min_salary
            ]
        
        if search_params.get("salary_max"):
            max_salary = search_params["salary_max"]
            filtered_jobs = [
                job for job in filtered_jobs
                if job.salary_range.min <= max_salary
            ]
        
        # Remote work filter
        if search_params.get("is_remote") is not None:
            is_remote = search_params["is_remote"]
            filtered_jobs = [
                job for job in filtered_jobs
                if job.is_remote == is_remote
            ]
        
        # Featured jobs filter
        if search_params.get("is_featured") is not None:
            is_featured = search_params["is_featured"]
            filtered_jobs = [
                job for job in filtered_jobs
                if job.is_featured == is_featured
            ]
        
        # Company filter
        if search_params.get("company_id"):
            company_id = search_params["company_id"]
            filtered_jobs = [
                job for job in filtered_jobs
                if job.company_id == company_id
            ]
        
        # Only active jobs
        filtered_jobs = [job for job in filtered_jobs if job.status == JobStatus.ACTIVE]
        
        return filtered_jobs

    @classmethod
    def _apply_sorting(cls, jobs: List[Job], search_params: Dict[str, Any]) -> List[Job]:
        """Apply sorting to jobs"""
        sort_by = search_params.get("sort_by", "posted_date")
        sort_order = search_params.get("sort_order", "desc")
        
        reverse = sort_order == "desc"
        
        if sort_by == "posted_date":
            jobs.sort(key=lambda x: x.posted_date, reverse=reverse)
        elif sort_by == "title":
            jobs.sort(key=lambda x: x.title.lower(), reverse=reverse)
        elif sort_by == "salary":
            jobs.sort(key=lambda x: x.salary_range.min, reverse=reverse)
        elif sort_by == "company":
            jobs.sort(key=lambda x: x.company_id, reverse=reverse)
        elif sort_by == "views_count":
            jobs.sort(key=lambda x: x.views_count, reverse=reverse)
        elif sort_by == "applicant_count":
            jobs.sort(key=lambda x: x.applicant_count, reverse=reverse)
        
        return jobs

    @classmethod
    def get_all_companies(cls) -> List[Company]:
        """Get all companies from the repository"""
        try:
            data = cls._load_data()
            companies_data = data.get("companies", [])
            companies = [Company.from_dict(company) for company in companies_data]
            logger.info(f"Retrieved {len(companies)} companies from repository")
            return companies
        except Exception as e:
            logger.error(f"Error retrieving all companies: {e}")
            return []

    @classmethod
    def get_company_by_id(cls, company_id: int) -> Optional[Company]:
        """Get a specific company by ID"""
        try:
            data = cls._load_data()
            companies_data = data.get("companies", [])
            
            for company_data in companies_data:
                if company_data["id"] == company_id:
                    company = Company.from_dict(company_data)
                    logger.info(f"Retrieved company {company_id} from repository")
                    return company
            
            logger.warning(f"Company {company_id} not found in repository")
            return None
        except Exception as e:
            logger.error(f"Error retrieving company {company_id}: {e}")
            return None

    @classmethod
    def increment_job_views(cls, job_id: int) -> bool:
        """Increment view count for a job"""
        try:
            data = cls._load_data()
            jobs_data = data.get("jobs", [])
            
            for job_data in jobs_data:
                if job_data["id"] == job_id:
                    job_data["views_count"] = job_data.get("views_count", 0) + 1
                    job_data["updated_at"] = datetime.now().isoformat()
                    break
            else:
                logger.warning(f"Job {job_id} not found for view increment")
                return False
            
            success = cls._save_data(data)
            if success:
                logger.info(f"Incremented view count for job {job_id}")
            return success
        except Exception as e:
            logger.error(f"Error incrementing view count for job {job_id}: {e}")
            return False

    @classmethod
    def increment_job_applications(cls, job_id: int) -> bool:
        """Increment application count for a job"""
        try:
            data = cls._load_data()
            jobs_data = data.get("jobs", [])
            
            for job_data in jobs_data:
                if job_data["id"] == job_id:
                    job_data["applicant_count"] = job_data.get("applicant_count", 0) + 1
                    job_data["updated_at"] = datetime.now().isoformat()
                    break
            else:
                logger.warning(f"Job {job_id} not found for application increment")
                return False
            
            success = cls._save_data(data)
            if success:
                logger.info(f"Incremented application count for job {job_id}")
            return success
        except Exception as e:
            logger.error(f"Error incrementing application count for job {job_id}: {e}")
            return False

    @classmethod
    def get_job_statistics(cls) -> Dict[str, Any]:
        """Get job statistics"""
        try:
            data = cls._load_data()
            jobs_data = data.get("jobs", [])
            
            if not jobs_data:
                return {
                    "total_jobs": 0,
                    "active_jobs": 0,
                    "featured_jobs": 0,
                    "remote_jobs": 0,
                    "avg_salary": 0,
                    "top_skills": [],
                    "top_locations": [],
                    "top_companies": []
                }
            
            # Calculate statistics
            total_jobs = len(jobs_data)
            active_jobs = len([j for j in jobs_data if j.get("status") == "Active"])
            featured_jobs = len([j for j in jobs_data if j.get("is_featured", False)])
            remote_jobs = len([j for j in jobs_data if j.get("is_remote", False)])
            
            # Calculate average salary
            salaries = [j.get("salary_range", {}).get("min", 0) for j in jobs_data if j.get("salary_range")]
            avg_salary = sum(salaries) / len(salaries) if salaries else 0
            
            # Get top skills
            all_skills = []
            for job in jobs_data:
                all_skills.extend(job.get("skills", []))
            skill_counts = {}
            for skill in all_skills:
                skill_counts[skill] = skill_counts.get(skill, 0) + 1
            top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            top_skills = [skill for skill, count in top_skills]
            
            # Get top locations
            locations = [j.get("location", "") for j in jobs_data]
            location_counts = {}
            for location in locations:
                if location:
                    location_counts[location] = location_counts.get(location, 0) + 1
            top_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            top_locations = [location for location, count in top_locations]
            
            # Get top companies
            company_ids = [j.get("company_id") for j in jobs_data]
            company_counts = {}
            for company_id in company_ids:
                if company_id:
                    company_counts[company_id] = company_counts.get(company_id, 0) + 1
            top_company_ids = sorted(company_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # Get company names
            companies_data = data.get("companies", [])
            company_id_to_name = {c["id"]: c["name"] for c in companies_data}
            top_companies = [company_id_to_name.get(cid, f"Company {cid}") for cid, count in top_company_ids]
            
            stats = {
                "total_jobs": total_jobs,
                "active_jobs": active_jobs,
                "featured_jobs": featured_jobs,
                "remote_jobs": remote_jobs,
                "avg_salary": round(avg_salary, 2),
                "top_skills": top_skills,
                "top_locations": top_locations,
                "top_companies": top_companies
            }
            
            logger.info(f"Generated job statistics: {stats}")
            return stats
        except Exception as e:
            logger.error(f"Error generating job statistics: {e}")
            return {
                "total_jobs": 0,
                "active_jobs": 0,
                "featured_jobs": 0,
                "remote_jobs": 0,
                "avg_salary": 0,
                "top_skills": [],
                "top_locations": [],
                "top_companies": []
            }
