from app.core.security import create_tokens, hash_password
from app.modules.applications.models import Application, Review
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.jobs.models import Job
from app.modules.resumes.models import Resume
from app.shared.enums import ApplicationStage, JobStatus, LocationType

TEST_PASSWORD = "TestPass@123"


async def make_candidate(db, email: str = "candidate@test.com") -> User:
    user = User(
        email=email,
        full_name="Test Candidate",
        password_hash=hash_password(TEST_PASSWORD),
        primary_role=UserRole.candidate,
        is_email_verified=True,
        is_onboarded=False,
    )
    db.add(user)
    await db.flush()
    return user


async def make_resume(db, user_id) -> Resume:
    resume = Resume(user_id=user_id, resume_name="Test Resume")
    db.add(resume)
    await db.flush()
    return resume


async def make_candidate_with_resume(
    db, email: str = "candidate@test.com"
) -> tuple[User, Resume]:
    user = await make_candidate(db, email)
    resume = await make_resume(db, user.id)
    return user, resume


async def make_recruiter_admin(
    db, email: str = "admin@test.com", company_name: str = "ACME Corp"
) -> tuple[User, Company]:
    user = User(
        email=email,
        full_name="Test Admin",
        password_hash=hash_password(TEST_PASSWORD),
        primary_role=UserRole.recruiter_admin,
        is_email_verified=True,
        is_onboarded=True,
    )
    db.add(user)
    await db.flush()

    company = Company(name=company_name)
    db.add(company)
    await db.flush()

    db.add(
        CompanyMembership(
            user_id=user.id,
            company_id=company.id,
            role=MembershipRole.admin,
            status=MembershipStatus.active,
        )
    )
    await db.flush()
    return user, company


async def make_pending_recruiter(
    db, company_id, email: str = "recruiter@test.com"
) -> User:
    """Recruiter with a pending (not yet approved) membership."""
    user = User(
        email=email,
        full_name="Pending Recruiter",
        password_hash=hash_password(TEST_PASSWORD),
        primary_role=UserRole.recruiter,
        is_email_verified=True,
        is_onboarded=True,
    )
    db.add(user)
    await db.flush()
    db.add(
        CompanyMembership(
            user_id=user.id,
            company_id=company_id,
            role=MembershipRole.recruiter,
            status=MembershipStatus.pending,
        )
    )
    await db.flush()
    return user


async def make_active_job(db, company_id, **overrides) -> Job:
    defaults = dict(
        title="Backend Engineer",
        location="Remote",
        location_type=LocationType.remote,
        status=JobStatus.open,
        description="Test job description",
        must_haves=[],
        nice_to_haves=[],
        questions=[],
    )
    defaults.update(overrides)
    job = Job(company_id=company_id, **defaults)
    db.add(job)
    await db.flush()
    return job


async def make_application(
    db,
    user_id,
    job_id,
    resume_id,
    stage: ApplicationStage = ApplicationStage.new,
    *,
    review: dict | None = None,
    **fields,
) -> Application:
    """Application with a Review row (pending unless `review` gives fields)."""
    application = Application(
        job_id=job_id,
        user_id=user_id,
        resume_id=resume_id,
        stage=stage,
        **fields,
    )
    db.add(application)
    await db.flush()
    db.add(Review(application_id=application.id, **(review or {"state": "pending"})))
    await db.flush()
    return application


def auth_headers(user_id) -> dict[str, str]:
    tokens, _, _ = create_tokens(str(user_id))
    return {"Authorization": f"Bearer {tokens['access_token']}"}
