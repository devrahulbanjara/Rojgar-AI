from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Company, Job, JobStatus, Profile, ProfileSkill, Skill
from app.schemas import CompanyResponse, JobResponse, JobSearchRequest

from .vector_job_service import VectorJobService



class JobService:
    """
    Service for managing jobs and company information.
    Handles job search, recommendations, retrieval, and statistics.
    """

    @staticmethod
    def to_job_response(job: Job) -> JobResponse:
        """Convert a Job model to a JobResponse schema."""
        return JobResponse.model_validate(job)

    @staticmethod
    def to_company_response(company: Company) -> CompanyResponse:
        """Convert a Company model to a CompanyResponse schema."""
        return CompanyResponse.model_validate(company)

    @staticmethod
    def get_recommended_jobs(db: Session, limit: int = 5) -> dict:
        """
        Get recommended jobs for general users (not personalized).
        Returns active jobs ordered by posting date.

        Args:
            db: Database session
            limit: Number of jobs to return

        Returns:
            Dictionary with job list and total count
        """
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
    def search_jobs(db: Session, params: JobSearchRequest) -> dict:
        """
        Search for jobs based on criteria (keyword, salary, etc.).

        Args:
            db: Database session
            params: Job search parameters (query, page, limit, sort)

        Returns:
            Dictionary with paginated job results and metadata
        """
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
        sort_method = (
            sort_column.desc() if params.sort_order == "desc" else sort_column.asc()
        )
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
    def get_job_by_id(
        job_id: int, db: Session, increment_view: bool = False
    ) -> Job | None:
        """
        Get a job by its ID.

        Args:
            job_id: ID of the job
            db: Database session
            increment_view: Whether to increment the view count (default: False)

        Returns:
            Job object if found, None otherwise
        """
        query = select(Job).where(Job.id == job_id).options(selectinload(Job.company))
        job = db.execute(query).scalar_one_or_none()

        if job and increment_view:
            job.views_count += 1
            db.add(job)
            db.commit()
            db.refresh(job)

        return job

    @staticmethod
    def get_recent_jobs(db: Session, limit: int = 10) -> list[Job]:
        """
        Get the most recent active jobs.

        Args:
            db: Database session
            limit: Number of jobs to return

        Returns:
            List of Job objects
        """
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
        """
        Increment the view count for a job.
        """
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job:
            return False

        job.views_count += 1
        db.add(job)
        db.commit()
        return True

    @staticmethod
    def increment_job_application(job_id: int, db: Session) -> bool:
        """
        Increment the applicant count for a job.
        """
        job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
        if not job:
            return False

        job.applicant_count += 1
        db.add(job)
        db.commit()
        return True

    # Company-related methods

    @staticmethod
    def get_all_companies(db: Session) -> list[Company]:
        """
        Get all companies.
        """
        return db.execute(select(Company)).scalars().all()

    @staticmethod
    def get_company_by_id(company_id: int, db: Session) -> Company | None:
        """
        Get a company by its ID.
        """
        return db.execute(
            select(Company).where(Company.id == company_id)
        ).scalar_one_or_none()

    @staticmethod
    def get_company_jobs(company_id: int, db: Session) -> list[Job]:
        """
        Get all jobs posted by a specific company.
        """
        query = (
            select(Job)
            .where(Job.company_id == company_id)
            .options(selectinload(Job.company))
        )

        return db.execute(query).scalars().all()

    @staticmethod
    def get_company_info_with_stats(company_id: int, db: Session) -> dict | None:
        """
        Get company information along with consolidated statistics.

        Calculates:
        - Total and active jobs
        - Total applications received
        - Total job views
        - Average salary
        - Unique skills across jobs

        Args:
            company_id: ID of the company
            db: Database session

        Returns:
            Dictionary with company info, jobs, and statistics
        """
        company = db.execute(
            select(Company).where(Company.id == company_id)
        ).scalar_one_or_none()
        if not company:
            return None

        jobs = (
            db.execute(select(Job).where(Job.company_id == company_id)).scalars().all()
        )
        active_jobs = [j for j in jobs if j.status == JobStatus.ACTIVE.value]

        total_applications = sum(j.applicant_count for j in jobs)
        total_views = sum(j.views_count for j in jobs)
        avg_salary = (
            sum(j.salary_min for j in active_jobs) / len(active_jobs)
            if active_jobs
            else 0
        )

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
            },
        }

    @staticmethod
    def get_job_statistics(db: Session) -> dict:
        """
        Get global job statistics for the platform.

        Include stats on:
        - Job counts (total, active, featured, remote)
        - Average salary
        - Trending skills (top 10)
        - Top locations (top 10)
        - Top companies (top 5)

        Args:
            db: Database session

        Returns:
            Dictionary containing global job stats
        """
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

        all_jobs = db.execute(select(Job)).scalars().all()

        all_skills = []
        for job in all_jobs:
            all_skills.extend(job.skills)
        skill_counts = {}
        for skill in all_skills:
            skill_counts[skill] = skill_counts.get(skill, 0) + 1
        top_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_skills = [skill for skill, count in top_skills]

        location_counts = {}
        for job in all_jobs:
            if job.location:
                location_counts[job.location] = location_counts.get(job.location, 0) + 1
        top_locations = sorted(
            location_counts.items(), key=lambda x: x[1], reverse=True
        )[:10]
        top_locations = [loc for loc, count in top_locations]

        companies = db.execute(select(Company)).scalars().all()
        company_map = {c.id: c.name for c in companies}
        company_counts = {}
        for job in all_jobs:
            company_counts[job.company_id] = company_counts.get(job.company_id, 0) + 1
        top_company_ids = sorted(
            company_counts.items(), key=lambda x: x[1], reverse=True
        )[:5]
        top_companies = [
            company_map.get(cid, f"Company {cid}") for cid, count in top_company_ids
        ]

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
        """
        Add a job to the vector database for semantic search.
        """
        vector_service = VectorJobService()
        return vector_service.add_job_to_vector_db(job)

    @staticmethod
    def search_similar_jobs(query: str, limit: int = 5) -> list[dict]:
        """
        Search for jobs using semantic vector search.
        """
        vector_service = VectorJobService()
        return vector_service.search_similar_jobs(query, limit)

    @staticmethod
    def delete_job_from_vector_db(job_id: int) -> bool:
        """
        Remove a job from the vector database.
        """
        vector_service = VectorJobService()
        return vector_service.delete_job_from_vector_db(job_id)

    @staticmethod
    def create_job_with_vector_sync(job_data: dict, db: Session) -> Job | None:
        """
        Create a new job and sync it to the vector database.
        Transactional: rolls back DB creation if anything fails during the process.

        Args:
            job_data: Dictionary of job fields
            db: Database session

        Returns:
            The created Job object if successful, None otherwise
        """
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
    def get_user_skills(user_id: str, db: Session) -> list[str]:
        """
        Get a consolidated list of skills for a user.
        Combines skills from the Skill table and ProfileSkill table.

        Args:
            user_id: User ID
            db: Database session

        Returns:
            List of unique skill names
        """
        skills = []

        user_skills = (
            db.execute(select(Skill.skill).where(Skill.user_id == user_id))
            .scalars()
            .all()
        )
        skills.extend(user_skills)

        profile = db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()
        if profile:
            profile_skills = (
                db.execute(
                    select(ProfileSkill.skill_name).where(
                        ProfileSkill.profile_id == profile.id
                    )
                )
                .scalars()
                .all()
            )
            skills.extend(profile_skills)

        return list(set(skills))  # Remove duplicates

    @staticmethod
    def get_personalized_job_recommendations(
        user_id: str, db: Session, page: int = 1, limit: int = 10
    ) -> dict:
        """
        Get personalized job recommendations based on user's skills.
        Uses vector search to find jobs matching user skills.
        Falls back to recent jobs if user has no skills or vector DB is down.

        Args:
            user_id: User ID
            db: Database session
            page: Page number
            limit: Results per page

        Returns:
            Dictionary with paginated job results and metadata
        """
        try:
            user_skills = JobService.get_user_skills(user_id, db)

            if not user_skills:
                # Fallback to recent jobs when user has no skills
                jobs = (
                    db.execute(
                        select(Job)
                        .where(Job.status == JobStatus.ACTIVE.value)
                        .options(selectinload(Job.company))
                        .order_by(Job.posted_date.desc())
                        .offset((page - 1) * limit)
                        .limit(limit)
                    )
                    .scalars()
                    .all()
                )

                total = db.scalar(
                    select(func.count(Job.id)).where(Job.status == JobStatus.ACTIVE.value)
                )
                total_pages = max((total + limit - 1) // limit, 1)

                job_responses = []
                for job in jobs:
                    job_response = JobService.to_job_response(job)
                    job_response_dict = job_response.model_dump()
                    job_response_dict["similarity_score"] = None
                    job_responses.append(job_response_dict)

                return {
                    "jobs": job_responses,
                    "total": total,
                    "page": page,
                    "total_pages": total_pages,
                    "has_next": page < total_pages,
                    "has_prev": page > 1,
                }

            try:
                vector_service = VectorJobService()
                recommendations = vector_service.get_personalized_job_recommendations(
                    user_skills, page, limit
                )
            except Exception as e:
                print(
                    f"Vector database unavailable, falling back to regular job search: {e}"
                )
                jobs = (
                    db.execute(
                        select(Job)
                        .where(Job.status == JobStatus.ACTIVE.value)
                        .options(selectinload(Job.company))
                        .order_by(Job.posted_date.desc())
                        .limit(limit)
                    )
                    .scalars()
                    .all()
                )

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
                    "has_prev": False,
                }

            if not recommendations:
                return {
                    "jobs": [],
                    "total": 0,
                    "page": page,
                    "total_pages": 0,
                    "has_next": False,
                    "has_prev": False,
                }

            job_ids = [rec["job_id"] for rec in recommendations]
            scores = {rec["job_id"]: rec["score"] for rec in recommendations}

            jobs = (
                db.execute(
                    select(Job)
                    .where(Job.id.in_(job_ids))
                    .where(Job.status == JobStatus.ACTIVE.value)
                    .options(selectinload(Job.company))
                )
                .scalars()
                .all()
            )

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
                "has_prev": page > 1,
            }

        except Exception as e:
            print(f"Error getting personalized recommendations: {e}")
            return {
                "jobs": [],
                "total": 0,
                "page": page,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False,
            }
