from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlmodel import Session, select, or_, and_, col, func
from sqlalchemy.orm import selectinload
from app.models.job import (
    Job,
    Company,
    JobStatus,
)
from app.core.database import engine
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class JobRepository:
    """Repository for job data operations with proper error handling"""

    @staticmethod
    def get_all_jobs() -> List[Job]:
        """Get all jobs from the database"""
        try:
            with Session(engine) as session:
                statement = select(Job)
                jobs = list(session.exec(statement).all())
                logger.info(f"Retrieved {len(jobs)} jobs from database")
                return jobs
        except Exception as e:
            logger.error(f"Error retrieving all jobs: {e}")
            return []

    @staticmethod
    def get_job_by_id(job_id: int, with_company: bool = False) -> Optional[Job]:
        """Get a specific job by ID, optionally with company relationship"""
        try:
            with Session(engine) as session:
                if with_company:
                    statement = (
                        select(Job)
                        .where(Job.id == job_id)
                        .options(selectinload(Job.company))
                    )
                    job = session.exec(statement).first()
                else:
                    job = session.get(Job, job_id)

                if job:
                    logger.info(f"Retrieved job {job_id} from database")
                else:
                    logger.warning(f"Job {job_id} not found in database")
                return job
        except Exception as e:
            logger.error(f"Error retrieving job {job_id}: {e}")
            return None

    @staticmethod
    def get_jobs_by_company(company_id: int) -> List[Job]:
        """Get all jobs for a specific company"""
        try:
            with Session(engine) as session:
                statement = select(Job).where(Job.company_id == company_id)
                company_jobs = list(session.exec(statement).all())
                logger.info(
                    f"Retrieved {len(company_jobs)} jobs for company {company_id}"
                )
                return company_jobs
        except Exception as e:
            logger.error(f"Error retrieving jobs for company {company_id}: {e}")
            return []

    @staticmethod
    def get_featured_jobs(limit: int = 10) -> List[Job]:
        """Get featured jobs"""
        try:
            with Session(engine) as session:
                statement = (
                    select(Job)
                    .where(
                        and_(Job.is_featured == True, Job.status == JobStatus.ACTIVE)
                    )
                    .order_by(col(Job.posted_date).desc())
                    .limit(limit)
                )
                featured_jobs = list(session.exec(statement).all())
                logger.info(f"Retrieved {len(featured_jobs)} featured jobs")
                return featured_jobs
        except Exception as e:
            logger.error(f"Error retrieving featured jobs: {e}")
            return []

    @staticmethod
    def search_jobs(
        search_params: Dict[str, Any], with_company: bool = False
    ) -> Tuple[List[Job], int]:
        """Search jobs with filters and pagination, optionally with company relationship"""
        try:
            with Session(engine) as session:
                # Start with base query for active jobs
                statement = select(Job).where(Job.status == JobStatus.ACTIVE)

                # Apply filters
                statement = JobRepository._apply_filters(statement, search_params)

                # Get total count before pagination
                count_statement = select(func.count()).select_from(statement.subquery())
                total_count = session.exec(count_statement).one()

                # Apply sorting
                statement = JobRepository._apply_sorting(statement, search_params)

                # Apply pagination
                page = search_params.get("page", 1)
                limit = search_params.get("limit", 20)
                offset = (page - 1) * limit
                statement = statement.offset(offset).limit(limit)

                # Optionally eager load company relationship
                if with_company:
                    statement = statement.options(selectinload(Job.company))

                # Execute query
                jobs = list(session.exec(statement).all())
                logger.info(
                    f"Search returned {len(jobs)} jobs out of {total_count} total"
                )
                return jobs, total_count
        except Exception as e:
            logger.error(f"Error searching jobs: {e}")
            return [], 0

    @staticmethod
    def _apply_filters(statement, search_params: Dict[str, Any]):
        """Apply search filters to query"""
        # Search query filter
        if search_params.get("search"):
            search_query = f"%{search_params['search'].lower()}%"
            statement = statement.where(
                or_(
                    col(Job.title).ilike(search_query),
                    col(Job.description).ilike(search_query),
                    col(Job.location).ilike(search_query),
                )
            )

        # Location filter
        if search_params.get("location"):
            location = f"%{search_params['location'].lower()}%"
            statement = statement.where(col(Job.location).ilike(location))

        # Department filter
        if search_params.get("department"):
            department = f"%{search_params['department'].lower()}%"
            statement = statement.where(col(Job.department).ilike(department))

        # Level filter
        if search_params.get("level"):
            levels = search_params["level"]
            statement = statement.where(col(Job.level).in_(levels))

        # Location type filter
        if search_params.get("location_type"):
            location_types = search_params["location_type"]
            statement = statement.where(col(Job.location_type).in_(location_types))

        # Employment type filter
        if search_params.get("employment_type"):
            employment_types = search_params["employment_type"]
            statement = statement.where(col(Job.employment_type).in_(employment_types))

        # Salary filters
        if search_params.get("salary_min"):
            min_salary = search_params["salary_min"]
            statement = statement.where(Job.salary_max >= min_salary)

        if search_params.get("salary_max"):
            max_salary = search_params["salary_max"]
            statement = statement.where(Job.salary_min <= max_salary)

        # Remote work filter
        if search_params.get("is_remote") is not None:
            is_remote = search_params["is_remote"]
            statement = statement.where(Job.is_remote == is_remote)

        # Featured jobs filter
        if search_params.get("is_featured") is not None:
            is_featured = search_params["is_featured"]
            statement = statement.where(Job.is_featured == is_featured)

        # Company filter
        if search_params.get("company_id"):
            company_id = search_params["company_id"]
            statement = statement.where(Job.company_id == company_id)

        return statement

    @staticmethod
    def _apply_sorting(statement, search_params: Dict[str, Any]):
        """Apply sorting to query"""
        sort_by = search_params.get("sort_by", "posted_date")
        sort_order = search_params.get("sort_order", "desc")

        # Determine sort column
        sort_column = Job.posted_date
        if sort_by == "title":
            sort_column = Job.title
        elif sort_by == "salary":
            sort_column = Job.salary_min
        elif sort_by == "company":
            sort_column = Job.company_id
        elif sort_by == "views_count":
            sort_column = Job.views_count
        elif sort_by == "applicant_count":
            sort_column = Job.applicant_count

        # Apply sort order
        if sort_order == "desc":
            statement = statement.order_by(col(sort_column).desc())
        else:
            statement = statement.order_by(col(sort_column).asc())

        return statement

    @staticmethod
    def get_all_companies() -> List[Company]:
        """Get all companies from the database"""
        try:
            with Session(engine) as session:
                statement = select(Company)
                companies = list(session.exec(statement).all())
                logger.info(f"Retrieved {len(companies)} companies from database")
                return companies
        except Exception as e:
            logger.error(f"Error retrieving all companies: {e}")
            return []

    @staticmethod
    def get_company_by_id(company_id: int) -> Optional[Company]:
        """Get a specific company by ID"""
        try:
            with Session(engine) as session:
                company = session.get(Company, company_id)
                if company:
                    logger.info(f"Retrieved company {company_id} from database")
                else:
                    logger.warning(f"Company {company_id} not found in database")
                return company
        except Exception as e:
            logger.error(f"Error retrieving company {company_id}: {e}")
            return None

    @staticmethod
    def increment_job_views(job_id: int) -> bool:
        """Increment view count for a job"""
        try:
            with Session(engine) as session:
                job = session.get(Job, job_id)
                if job:
                    job.views_count += 1
                    job.updated_at = datetime.utcnow()
                    session.add(job)
                    session.commit()
                    logger.info(f"Incremented view count for job {job_id}")
                    return True
                else:
                    logger.warning(f"Job {job_id} not found for view increment")
                    return False
        except Exception as e:
            logger.error(f"Error incrementing view count for job {job_id}: {e}")
            return False

    @staticmethod
    def increment_job_applications(job_id: int) -> bool:
        """Increment application count for a job"""
        try:
            with Session(engine) as session:
                job = session.get(Job, job_id)
                if job:
                    job.applicant_count += 1
                    job.updated_at = datetime.utcnow()
                    session.add(job)
                    session.commit()
                    logger.info(f"Incremented application count for job {job_id}")
                    return True
                else:
                    logger.warning(f"Job {job_id} not found for application increment")
                    return False
        except Exception as e:
            logger.error(f"Error incrementing application count for job {job_id}: {e}")
            return False

    @staticmethod
    def get_job_statistics() -> Dict[str, Any]:
        """Get job statistics"""
        try:
            with Session(engine) as session:
                # Get counts
                total_jobs = session.exec(select(func.count(Job.id))).one()
                active_jobs = session.exec(
                    select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE)
                ).one()
                featured_jobs = session.exec(
                    select(func.count(Job.id)).where(Job.is_featured == True)
                ).one()
                remote_jobs = session.exec(
                    select(func.count(Job.id)).where(Job.is_remote == True)
                ).one()

                # Get average salary
                avg_salary_result = session.exec(select(func.avg(Job.salary_min))).one()
                avg_salary = round(avg_salary_result, 2) if avg_salary_result else 0

                # Get all jobs for skill analysis
                all_jobs = list(session.exec(select(Job)).all())

                # Get top skills
                all_skills = []
                for job in all_jobs:
                    all_skills.extend(job.skills)
                skill_counts = {}
                for skill in all_skills:
                    skill_counts[skill] = skill_counts.get(skill, 0) + 1
                top_skills = sorted(
                    skill_counts.items(), key=lambda x: x[1], reverse=True
                )[:10]
                top_skills = [skill for skill, count in top_skills]

                # Get top locations
                location_counts = {}
                for job in all_jobs:
                    if job.location:
                        location_counts[job.location] = (
                            location_counts.get(job.location, 0) + 1
                        )
                top_locations = sorted(
                    location_counts.items(), key=lambda x: x[1], reverse=True
                )[:10]
                top_locations = [location for location, count in top_locations]

                # Get top companies
                company_counts = {}
                for job in all_jobs:
                    company_counts[job.company_id] = (
                        company_counts.get(job.company_id, 0) + 1
                    )
                top_company_ids = sorted(
                    company_counts.items(), key=lambda x: x[1], reverse=True
                )[:5]

                # Get company names
                companies = JobRepository.get_all_companies()
                company_id_to_name = {c.id: c.name for c in companies}
                top_companies = [
                    company_id_to_name.get(cid, f"Company {cid}")
                    for cid, count in top_company_ids
                ]

                stats = {
                    "total_jobs": total_jobs,
                    "active_jobs": active_jobs,
                    "featured_jobs": featured_jobs,
                    "remote_jobs": remote_jobs,
                    "avg_salary": avg_salary,
                    "top_skills": top_skills,
                    "top_locations": top_locations,
                    "top_companies": top_companies,
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
                "top_companies": [],
            }
