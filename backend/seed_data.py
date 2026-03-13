import asyncio
from datetime import date

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password

# Model Imports
from app.modules.auth.models import User
from app.modules.auth.enums import UserRole, MembershipRole, MembershipStatus
from app.modules.companies.models import Company, CompanyMembership
from app.modules.jobs.models import Job
from app.modules.jobs.enums import SyncAction
from app.modules.jobs.models import JobSyncEvent
from app.modules.profiles.models import (
    Profile,
    ProfileExperience,
    ProfileEducation,
    ProfileSkill,
)
from app.modules.resumes.models import (
    Resume,
    ResumeExperience,
    ResumeEducation,
    ResumeSkill,
)
from app.shared.enums import JobStatus, LocationType

COMMON_PW = hash_password("Password@123")


async def seed():
    async with AsyncSessionLocal() as db:
        print("🚀 Starting ULTIMATE Database Seeding (Nepal Tech Context)...")

        # ---------------------------------------------------------------------------
        # 1. ADMIN & COMPANY
        # ---------------------------------------------------------------------------
        admin_email = "rdbanjara07@gmail.com"
        admin = User(
            full_name="Rahul Dev Banjara",
            email=admin_email,
            password_hash=COMMON_PW,
            primary_role=UserRole.recruiter_admin,
            is_email_verified=True,
            is_onboarded=True,
        )
        db.add(admin)
        await db.flush()

        company = Company(
            name="Banjara Group of Industries",
            industry="Fintech & Digital Banking",
            company_size="100-500",
            location="Hattisar, Kathmandu",
            website_url="https://banjaragroup.com.np",
            domain="banjaragroup.com.np",
            description=(
                "Banjara Group of Industries is Nepal's leading technology powerhouse, "
                "driving innovation in digital payments and enterprise cloud solutions. "
                "We operate the backbone for major financial institutions across South Asia."
            ),
        )
        db.add(company)
        await db.flush()

        db.add(
            CompanyMembership(
                user_id=admin.id,
                company_id=company.id,
                role=MembershipRole.admin,
                status=MembershipStatus.active,
                job_title="Chief Technology Officer",
            )
        )

        # ---------------------------------------------------------------------------
        # 2. RECRUITERS
        # ---------------------------------------------------------------------------
        recruiters = []
        rec_names = [
            ("Prabesh Hamal", "recruiter1@gmail.com"),
            ("Sita Thapa", "recruiter2@gmail.com"),
        ]
        for name, email in rec_names:
            u = User(
                full_name=name,
                email=email,
                password_hash=COMMON_PW,
                primary_role=UserRole.recruiter,
                is_email_verified=True,
                is_onboarded=True,
            )
            db.add(u)
            await db.flush()
            db.add(
                CompanyMembership(
                    user_id=u.id,
                    company_id=company.id,
                    role=MembershipRole.recruiter,
                    status=MembershipStatus.active,
                    job_title="Talent Acquisition Lead",
                )
            )
            recruiters.append(u)

        # ---------------------------------------------------------------------------
        # 3. DETAILED JOB POSTINGS
        # ---------------------------------------------------------------------------
        jobs = [
            Job(
                company_id=company.id,
                posted_by=admin.id,
                title="Senior Backend Engineer (FastAPI/Python)",
                category="Backend",
                location="Hattisar, Kathmandu",
                location_type=LocationType.onsite,
                salary_min=180000,
                salary_max=280000,
                currency="NPR",
                status=JobStatus.active,
                overview="We seek an expert to architect our high-frequency payment gateway.",
                responsibilities=[
                    "Design scalable microservices with Python/FastAPI",
                    "Optimize PostgreSQL for 10k+ requests per second",
                    "Mentor the engineering team through strict code reviews",
                ],
                requirements=[
                    "Expert knowledge of Python 3.12+",
                    "Deep experience with PostgreSQL and Redis",
                    "Proven history of managing AWS infrastructure",
                ],
                benefits=[
                    "Performance Bonus",
                    "Dashain Bonus",
                    "Accidental Insurance",
                    "Lunch Provided",
                ],
            ),
            Job(
                company_id=company.id,
                posted_by=recruiters[0].id,
                title="Lead Frontend Engineer (React/Next.js)",
                category="Frontend",
                location="Jawalakhel, Lalitpur",
                location_type=LocationType.hybrid,
                salary_min=150000,
                salary_max=220000,
                currency="NPR",
                status=JobStatus.active,
                overview="Lead our frontend team in building pixel-perfect digital banking portals.",
                responsibilities=[
                    "Architect UI components using Next.js 15 and Tailwind",
                    "Implement state management with TanStack Query and Zustand",
                    "Collaborate with UX/UI designers on Figma",
                ],
                requirements=[
                    "5+ years of professional React experience",
                    "Strong mastery of TypeScript",
                    "Understanding of Server Components and Web Vitals",
                ],
                benefits=["Flexible Hours", "Gym Reimbursement", "Internet Allowance"],
            ),
            Job(
                company_id=company.id,
                posted_by=recruiters[1].id,
                title="DevOps & Security Specialist",
                category="Infrastructure",
                location="Kathmandu/Remote",
                location_type=LocationType.remote,
                salary_min=140000,
                salary_max=210000,
                currency="NPR",
                status=JobStatus.active,
                overview="Maintain 99.9% uptime and implement zero-trust security architecture.",
                responsibilities=[
                    "Manage EKS clusters on AWS",
                    "Automate CI/CD pipelines with GitHub Actions",
                    "Perform regular security audits and penetration testing",
                ],
                requirements=[
                    "Proficiency with Terraform and Kubernetes",
                    "Knowledge of AWS Security best practices",
                    "Linux administration mastery",
                ],
                benefits=["Certification Paid", "Flexible Working", "Health Checkups"],
            ),
        ]
        db.add_all(jobs)
        await db.flush()  # Generate IDs without committing yet

        print("📝 Queuing jobs for vectorization via outbox...")
        for job in jobs:
            db.add(JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT))

        await db.commit()
        print("✅ Jobs committed. The background daemon will vectorize them within 60 s.")

        # ---------------------------------------------------------------------------
        # 4. CANDIDATES DATA
        # ---------------------------------------------------------------------------
        candidates_data = [
            {
                "name": "Ajit Koirala",
                "email": "candidate1@gmail.com",
                "headline": "Senior Fullstack Engineer | Ex-Leapfrog | Python Expert",
                "summary": "Fullstack developer with 7 years of experience in high-scale systems.",
                "phone": "9841234567",
                "location": "Koteshwor, Kathmandu",
                "target_roles": ["Backend Developer", "Fullstack Engineer"],
                "skills": ["Python", "FastAPI", "React", "AWS", "PostgreSQL"],
                "exp": [
                    {
                        "co": "Leapfrog Technology",
                        "title": "Senior Software Engineer",
                        "start": date(2021, 1, 1),
                        "end": None,
                        "desc": [
                            "Leading a US-based healthtech project",
                            "Reduced latency by 30%",
                        ],
                    },
                    {
                        "co": "F1Soft International",
                        "title": "Software Engineer",
                        "start": date(2018, 6, 1),
                        "end": date(2020, 12, 15),
                        "desc": [
                            "Built modules for mobile banking app",
                            "Managed SQL optimizations",
                        ],
                    },
                ],
                "edu": [
                    {
                        "inst": "Pulchowk Campus, IOE",
                        "deg": "B.E. Computer Engineering",
                        "field": "Computer Science & Engineering",
                        "start": date(2014, 11, 1),
                        "end": date(2018, 11, 1),
                    }
                ],
            },
            {
                "name": "Sarthak Sharma",
                "email": "candidate2@gmail.com",
                "headline": "DevOps Engineer | Security Researcher | KU Alumnus",
                "summary": "Specialist in building secure cloud environments and automated pipelines.",
                "phone": "9801234567",
                "location": "Dhobighat, Lalitpur",
                "target_roles": ["DevOps Engineer", "Cloud Architect"],
                "skills": [
                    "Docker",
                    "Kubernetes",
                    "Node.js",
                    "TypeScript",
                    "Terraform",
                ],
                "exp": [
                    {
                        "co": "Logpoint",
                        "title": "DevOps Engineer",
                        "start": date(2022, 3, 1),
                        "end": None,
                        "desc": [
                            "Managing SIEM cloud infrastructure",
                            "Automated K8s cluster updates",
                        ],
                    },
                    {
                        "co": "CloudFactory",
                        "title": "Junior Developer",
                        "start": date(2020, 1, 1),
                        "end": date(2022, 2, 1),
                        "desc": [
                            "Internal tool development with Ruby",
                            "Data labeling pipeline support",
                        ],
                    },
                ],
                "edu": [
                    {
                        "inst": "Kathmandu University (KU)",
                        "deg": "B.Sc. Computer Science",
                        "field": "Information Technology",
                        "start": date(2016, 9, 1),
                        "end": date(2020, 9, 1),
                    }
                ],
            },
        ]

        # ---------------------------------------------------------------------------
        # 5. INSERT CANDIDATES, PROFILES & RESUMES
        # ---------------------------------------------------------------------------
        for data in candidates_data:
            c = User(
                full_name=data["name"],
                email=data["email"],
                password_hash=COMMON_PW,
                primary_role=UserRole.candidate,
                is_email_verified=True,
                is_onboarded=True,
            )
            db.add(c)
            await db.flush()

            # Profile
            p = Profile(
                user_id=c.id,
                headline=data["headline"],
                summary=data["summary"],
                phone=data["phone"],
                location=data["location"],
                years_of_experience=7,
                target_roles=data["target_roles"],
            )
            db.add(p)
            await db.flush()

            # Profile Children
            for e in data["exp"]:
                db.add(
                    ProfileExperience(
                        profile_id=p.id,
                        company_name=e["co"],
                        title=e["title"],
                        start_date=e["start"],
                        end_date=e["end"],
                        description=e["desc"],
                    )
                )
            for edu in data["edu"]:
                db.add(
                    ProfileEducation(
                        profile_id=p.id,
                        institution=edu["inst"],
                        degree=edu["deg"],
                        field_of_study=edu["field"],
                        start_date=edu["start"],
                        end_date=edu["end"],
                    )
                )
            for s in data["skills"]:
                db.add(ProfileSkill(profile_id=p.id, skill_name=s))

            # 2 Resumes for each
            for i in range(1, 3):
                res = Resume(
                    user_id=c.id,
                    resume_name=f"Standard CV V{i}",
                    headline=data["headline"],
                    summary=data["summary"],
                    phone=data["phone"],
                    location=data["location"],
                    years_of_experience=7,
                )
                db.add(res)
                await db.flush()
                # Copy children
                for e in data["exp"]:
                    db.add(
                        ResumeExperience(
                            resume_id=res.id,
                            company_name=e["co"],
                            title=e["title"],
                            start_date=e["start"],
                            end_date=e["end"],
                            description=e["desc"],
                        )
                    )
                for edu in data["edu"]:
                    db.add(
                        ResumeEducation(
                            resume_id=res.id,
                            institution=edu["inst"],
                            degree=edu["deg"],
                            field_of_study=edu["field"],
                            start_date=edu["start"],
                            end_date=edu["end"],
                        )
                    )
                for s in data["skills"]:
                    db.add(ResumeSkill(resume_id=res.id, skill_name=s))

        await db.commit()
        print("\n" + "=" * 50)
        print("✅ SUCCESS: ULTIMATE SEED COMPLETE")
        print("All dates, field of studies, and bullet points added.")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(seed())
