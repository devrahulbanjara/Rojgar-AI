from app.core.security import create_tokens
from app.modules.applications.models import Application
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.jobs.models import Job
from app.modules.profiles.models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileSkill,
)
from app.modules.resumes.models import Resume
from app.shared.enums import ApplicationStatus, LocationType
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def make_user(
    db: AsyncSession,
    email: str,
    role: str = "candidate",
    verified: bool = True,
) -> User:
    user = User(
        full_name="Test User",
        email=email,
        primary_role=role,
        is_email_verified=verified,
        password_hash=None,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def make_company(db: AsyncSession, name: str, domain: str) -> Company:
    company = Company(name=name, domain=domain, industry="Tech")
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


async def make_membership(
    db: AsyncSession,
    user: User,
    company: Company,
    role: str = "admin",
    status: str = "active",
) -> CompanyMembership:
    m = CompanyMembership(
        user_id=user.id,
        company_id=company.id,
        role=role,
        status=status,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


async def make_job(
    db: AsyncSession,
    company: Company,
    posted_by: User,
    title: str = "Test Job",
    status: str = "open",
    category: str = "backend",
) -> Job:
    job = Job(
        company_id=company.id,
        posted_by=posted_by.id,
        title=title,
        location_type=LocationType.remote,
        currency="NPR",
        status=status,
        category=category,
        responsibilities=[],
        requirements=[],
        preferred_qualifications=[],
        benefits=[],
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def make_resume(db: AsyncSession, user: User, name: str = "My Resume") -> Resume:
    resume = Resume(user_id=user.id, resume_name=name)
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume


async def make_application(
    db: AsyncSession,
    user: User,
    job: Job,
    resume: Resume,
    status: ApplicationStatus = ApplicationStatus.submitted,
) -> Application:
    application = Application(
        user_id=user.id,
        job_id=job.id,
        resume_id=resume.id,
        status=status,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application


async def make_profile(
    db: AsyncSession,
    user: User,
    *,
    with_children: bool = False,
) -> Profile:
    profile = Profile(
        user_id=user.id,
        headline="Candidate Headline",
        summary="Candidate summary",
        phone="9800000000",
        location="Kathmandu",
        linkedin_url="https://linkedin.com/in/test-user",
        github_url="https://github.com/test-user",
        portfolio_url="https://portfolio.test",
        years_of_experience=3,
    )
    db.add(profile)
    await db.flush()

    if with_children:
        db.add(
            ProfileExperience(
                profile_id=profile.id, company_name="Acme", title="Engineer"
            )
        )
        db.add(ProfileEducation(profile_id=profile.id, institution="Test University"))
        db.add(ProfileSkill(profile_id=profile.id, skill_name="Python"))

    await db.commit()
    await db.refresh(profile)
    return profile


def auth_headers(user: User) -> dict:
    tokens, _, _ = create_tokens(str(user.id))
    return {"Authorization": f"Bearer {tokens['access_token']}"}
