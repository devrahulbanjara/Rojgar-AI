"""
Seed script — populates the database with realistic Nepali tech company data:
  • 3 companies (Leapfrog Technology, F1Soft Group, Deerwalk Services)
  • 2 recruiter_admin + 1 recruiter per company  (6 recruiter users)
  • 6 candidate users with profiles and resumes
  • 25 open jobs spread across the 3 companies (all salaries in NPR)
  • ~18 applications

Usage:
    uv run python seed.py            # add seed data (skips if already present)
    uv run python seed.py --reset    # wipe all seed data first, then re-seed
"""

import asyncio
import sys
import uuid
from datetime import date

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.jobs.models import Job
from app.modules.applications.models import Application
from app.modules.resumes.models import (
    Resume,
    ResumeEducation,
    ResumeExperience,
    ResumeSkill,
)
from app.modules.profiles.models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileSkill,
)
from app.shared.enums import ApplicationStatus, JobStatus, LocationType

# ---------------------------------------------------------------------------
# Seed password — all seeded users share this password
# ---------------------------------------------------------------------------
SEED_PASSWORD = "Seed1234!"
SEED_EMAIL_SUFFIX = "@seed.convex.dev"


# ---------------------------------------------------------------------------
# Data definitions
# ---------------------------------------------------------------------------

COMPANIES = [
    {
        "name": "Leapfrog Technology",
        "domain": "leapfrogtechnology.com",
        "website_url": "https://www.leapfrogtechnology.com",
        "industry": "Software & IT Services",
        "company_size": "201-500",
        "location": "Kathmandu, Nepal",
        "description": (
            "Leapfrog Technology is a leading software company in Nepal, building "
            "world-class digital products for global clients across healthcare, "
            "fintech, and enterprise sectors."
        ),
    },
    {
        "name": "F1Soft Group",
        "domain": "f1soft.com",
        "website_url": "https://www.f1soft.com",
        "industry": "Fintech",
        "company_size": "501-1000",
        "location": "Lalitpur, Nepal",
        "description": (
            "F1Soft Group is Nepal's leading fintech company, powering digital "
            "payments and financial services across South Asia through products "
            "like eSewa, fonePay, and Sparrow SMS."
        ),
    },
    {
        "name": "Deerwalk Services",
        "domain": "deerwalk.com",
        "website_url": "https://www.deerwalk.com",
        "industry": "Healthcare IT & Analytics",
        "company_size": "201-500",
        "location": "Kathmandu, Nepal",
        "description": (
            "Deerwalk Services is a Kathmandu-based healthcare analytics company "
            "providing data processing, AI-driven insights, and software solutions "
            "for US healthcare payers and providers."
        ),
    },
]

# Each company gets one admin + one recruiter
RECRUITER_USERS = [
    # Leapfrog
    {
        "full_name": "Srijana Shrestha",
        "email": f"srijana.shrestha{SEED_EMAIL_SUFFIX}",
        "role": UserRole.recruiter_admin,
        "company_idx": 0,
        "membership_role": MembershipRole.admin,
        "job_title": "Head of Talent Acquisition",
    },
    {
        "full_name": "Bikash Thapa",
        "email": f"bikash.thapa{SEED_EMAIL_SUFFIX}",
        "role": UserRole.recruiter,
        "company_idx": 0,
        "membership_role": MembershipRole.recruiter,
        "job_title": "Technical Recruiter",
    },
    # F1Soft
    {
        "full_name": "Anita Karki",
        "email": f"anita.karki{SEED_EMAIL_SUFFIX}",
        "role": UserRole.recruiter_admin,
        "company_idx": 1,
        "membership_role": MembershipRole.admin,
        "job_title": "VP of People & Culture",
    },
    {
        "full_name": "Rajiv Sharma",
        "email": f"rajiv.sharma{SEED_EMAIL_SUFFIX}",
        "role": UserRole.recruiter,
        "company_idx": 1,
        "membership_role": MembershipRole.recruiter,
        "job_title": "HR Manager",
    },
    # Deerwalk
    {
        "full_name": "Priya Maharjan",
        "email": f"priya.maharjan{SEED_EMAIL_SUFFIX}",
        "role": UserRole.recruiter_admin,
        "company_idx": 2,
        "membership_role": MembershipRole.admin,
        "job_title": "Talent Director",
    },
    {
        "full_name": "Suraj Pandey",
        "email": f"suraj.pandey{SEED_EMAIL_SUFFIX}",
        "role": UserRole.recruiter,
        "company_idx": 2,
        "membership_role": MembershipRole.recruiter,
        "job_title": "Engineering Recruiter",
    },
]

CANDIDATE_USERS = [
    {
        "full_name": "Aarav Joshi",
        "email": f"aarav.joshi{SEED_EMAIL_SUFFIX}",
        "headline": "Senior Full-Stack Developer | React · Node.js · PostgreSQL",
        "location": "Kathmandu, Nepal",
        "years_of_experience": 6,
        "skills": ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
        "experiences": [
            {
                "company_name": "Leapfrog Technology",
                "title": "Senior Software Engineer",
                "start_date": date(2021, 4, 1),
                "end_date": None,
                "description": [
                    "Led migration of legacy modules to React 18 with TypeScript",
                    "Reduced API response time by 35% via caching and query optimisation",
                ],
            },
            {
                "company_name": "Yomari",
                "title": "Software Engineer",
                "start_date": date(2019, 1, 1),
                "end_date": date(2021, 3, 31),
                "description": [
                    "Built multi-tenant SaaS platform for small businesses"
                ],
            },
        ],
        "educations": [
            {
                "institution": "Tribhuvan University, IOE Pulchowk",
                "degree": "B.E.",
                "field_of_study": "Computer Engineering",
                "start_date": date(2014, 11, 1),
                "end_date": date(2018, 11, 30),
            },
        ],
    },
    {
        "full_name": "Manisha Poudel",
        "email": f"manisha.poudel{SEED_EMAIL_SUFFIX}",
        "headline": "Backend Engineer | Python · FastAPI · Microservices",
        "location": "Lalitpur, Nepal",
        "years_of_experience": 4,
        "skills": ["Python", "FastAPI", "Redis", "Docker", "Kafka"],
        "experiences": [
            {
                "company_name": "F1Soft Group",
                "title": "Backend Engineer",
                "start_date": date(2022, 6, 1),
                "end_date": None,
                "description": [
                    "Designed real-time notification microservice for eSewa with 500k+ daily users",
                    "Implemented idempotent payment reconciliation APIs",
                ],
            },
            {
                "company_name": "Cotiviti Nepal",
                "title": "Junior Developer",
                "start_date": date(2020, 3, 1),
                "end_date": date(2022, 5, 31),
                "description": ["Built ETL pipelines for healthcare claims data"],
            },
        ],
        "educations": [
            {
                "institution": "Kathmandu University",
                "degree": "B.Sc.",
                "field_of_study": "Computer Science and Information Technology",
                "start_date": date(2016, 9, 1),
                "end_date": date(2020, 6, 30),
            },
        ],
    },
    {
        "full_name": "Rajan Tamang",
        "email": f"rajan.tamang{SEED_EMAIL_SUFFIX}",
        "headline": "UI/UX Designer | Figma · Design Systems · User Research",
        "location": "Kathmandu, Nepal",
        "years_of_experience": 4,
        "skills": [
            "Figma",
            "User Research",
            "Prototyping",
            "Design Systems",
            "Adobe XD",
        ],
        "experiences": [
            {
                "company_name": "Leapfrog Technology",
                "title": "Product Designer",
                "start_date": date(2022, 2, 1),
                "end_date": None,
                "description": [
                    "Redesigned mobile onboarding flows, improving user activation by 30%",
                    "Maintained Figma design system with 150+ components",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Islington College, Kathmandu",
                "degree": "B.Sc.",
                "field_of_study": "Computing",
                "start_date": date(2018, 9, 1),
                "end_date": date(2022, 6, 30),
            },
        ],
    },
    {
        "full_name": "Sunita Gurung",
        "email": f"sunita.gurung{SEED_EMAIL_SUFFIX}",
        "headline": "DevOps / Cloud Engineer | Kubernetes · AWS · Terraform",
        "location": "Remote",
        "years_of_experience": 5,
        "skills": ["Kubernetes", "Terraform", "AWS", "Prometheus", "Helm"],
        "experiences": [
            {
                "company_name": "Deerwalk Services",
                "title": "Cloud Engineer",
                "start_date": date(2021, 7, 1),
                "end_date": None,
                "description": [
                    "Managed AWS EKS clusters for healthcare analytics workloads",
                    "Reduced infrastructure cost by 25% through right-sizing and reserved instance planning",
                ],
            },
            {
                "company_name": "CloudFactory",
                "title": "Site Reliability Engineer",
                "start_date": date(2019, 5, 1),
                "end_date": date(2021, 6, 30),
                "description": [
                    "Maintained 99.95% uptime SLA across global microservices"
                ],
            },
        ],
        "educations": [
            {
                "institution": "Tribhuvan University, IOE Pulchowk",
                "degree": "B.E.",
                "field_of_study": "Electronics and Communication",
                "start_date": date(2015, 11, 1),
                "end_date": date(2019, 11, 30),
            },
        ],
    },
    {
        "full_name": "Dipesh Acharya",
        "email": f"dipesh.acharya{SEED_EMAIL_SUFFIX}",
        "headline": "Data Scientist | ML · Python · Healthcare Analytics",
        "location": "Kathmandu, Nepal",
        "years_of_experience": 3,
        "skills": ["Python", "Scikit-learn", "PyTorch", "SQL", "Spark"],
        "experiences": [
            {
                "company_name": "Deerwalk Services",
                "title": "Data Scientist",
                "start_date": date(2023, 1, 1),
                "end_date": None,
                "description": [
                    "Built predictive models for chronic disease risk stratification",
                    "Achieved 89% AUC on readmission prediction model",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Kathmandu University",
                "degree": "M.Sc.",
                "field_of_study": "Data Science",
                "start_date": date(2020, 9, 1),
                "end_date": date(2022, 6, 30),
            },
            {
                "institution": "Tribhuvan University",
                "degree": "B.Sc.",
                "field_of_study": "Computer Science",
                "start_date": date(2016, 11, 1),
                "end_date": date(2020, 6, 30),
            },
        ],
    },
    {
        "full_name": "Nisha Rai",
        "email": f"nisha.rai{SEED_EMAIL_SUFFIX}",
        "headline": "Mobile Developer | React Native · Flutter · Android",
        "location": "Bhaktapur, Nepal",
        "years_of_experience": 3,
        "skills": ["React Native", "Flutter", "Kotlin", "Firebase", "TypeScript"],
        "experiences": [
            {
                "company_name": "F1Soft Group",
                "title": "Mobile Developer",
                "start_date": date(2023, 2, 1),
                "end_date": None,
                "description": [
                    "Shipped cross-platform eSewa mobile app features to 7M+ users in Nepal"
                ],
            },
            {
                "company_name": "Leapfrog Technology",
                "title": "Junior Mobile Developer",
                "start_date": date(2021, 8, 1),
                "end_date": date(2023, 1, 31),
                "description": [
                    "Built React Native components for a US fintech client app"
                ],
            },
        ],
        "educations": [
            {
                "institution": "Pokhara University, KCM College",
                "degree": "B.E.",
                "field_of_study": "Computer Engineering",
                "start_date": date(2017, 11, 1),
                "end_date": date(2021, 6, 30),
            },
        ],
    },
]

# Salaries are in NPR (annual). 1 Lakh = 100,000 NPR.
# jobs[i] = (company_idx, job_dict)
JOBS_DATA = [
    # ── Leapfrog Technology (company_idx=0) ────────────────────────────────
    (
        0,
        {
            "title": "Senior React Developer",
            "category": "frontend",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1500000,
            "salary_max": 2400000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Join our product team to build cutting-edge React and TypeScript applications for global clients in healthcare, fintech, and enterprise.",
            "responsibilities": [
                "Architect and ship features in our React/TypeScript monorepo",
                "Collaborate with designers on component library evolution",
                "Mentor junior and mid-level developers",
                "Drive frontend performance improvements",
            ],
            "requirements": [
                "5+ years of frontend experience",
                "Expert-level React and TypeScript",
                "Experience with design systems and accessibility",
                "Strong CS fundamentals",
            ],
            "preferred_qualifications": [
                "Experience with Next.js or Remix",
                "Open source contributions",
            ],
            "benefits": [
                "Competitive NPR salary",
                "Performance bonus",
                "Festival allowance",
                "Work-from-home flexibility",
            ],
        },
    ),
    (
        0,
        {
            "title": "Node.js Backend Developer",
            "category": "backend",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 900000,
            "salary_max": 1500000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build scalable RESTful and GraphQL APIs for international clients, working in an agile environment with a talented engineering team.",
            "responsibilities": [
                "Design and implement Node.js/Express APIs",
                "Write integration and unit tests",
                "Optimise database queries in PostgreSQL",
                "Participate in code reviews and sprint planning",
            ],
            "requirements": [
                "3+ years Node.js experience",
                "PostgreSQL or MongoDB proficiency",
                "Understanding of REST and GraphQL",
                "Git workflow experience",
            ],
            "preferred_qualifications": [
                "Experience with microservices",
                "AWS or Azure deployment knowledge",
            ],
            "benefits": [
                "Annual bonus",
                "Health insurance",
                "Training budget",
                "Team lunches",
            ],
        },
    ),
    (
        0,
        {
            "title": "DevOps Engineer",
            "category": "devops",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1200000,
            "salary_max": 2000000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build and maintain our CI/CD infrastructure and cloud environments across multiple projects and clients.",
            "responsibilities": [
                "Manage AWS infrastructure with Terraform and CloudFormation",
                "Build and maintain Jenkins and GitHub Actions pipelines",
                "Implement monitoring with Datadog and CloudWatch",
                "Support engineering teams with infra tooling",
            ],
            "requirements": [
                "4+ years DevOps/SRE experience",
                "AWS proficiency with certifications preferred",
                "Terraform and Kubernetes expertise",
                "Python or Bash scripting",
            ],
            "preferred_qualifications": [
                "Experience with multi-tenant SaaS deployments",
                "SOC2 compliance knowledge",
            ],
            "benefits": [
                "Hybrid schedule",
                "Dacert/AWS certification support",
                "Equipment stipend",
            ],
        },
    ),
    (
        0,
        {
            "title": "UI/UX Designer",
            "category": "design",
            "location": "Remote",
            "location_type": LocationType.remote,
            "salary_min": 840000,
            "salary_max": 1440000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Shape digital experiences for global products used by millions of users. Work closely with product owners and engineers on end-to-end design.",
            "responsibilities": [
                "Own design for 1-2 product streams",
                "Conduct user research and usability testing",
                "Maintain and evolve the shared Figma design system",
                "Collaborate with engineers on implementation fidelity",
            ],
            "requirements": [
                "3+ years product design experience",
                "Expert Figma skills with strong portfolio",
                "Ability to handle feedback and iterate rapidly",
                "Basic understanding of frontend constraints",
            ],
            "preferred_qualifications": [
                "B2B SaaS or enterprise product background",
                "Experience with atomic design principles",
            ],
            "benefits": [
                "Fully remote",
                "Annual design retreat",
                "Udemy/Figma course budget",
            ],
        },
    ),
    (
        0,
        {
            "title": "Data Engineer",
            "category": "data",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1100000,
            "salary_max": 1800000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build and maintain the data pipelines that power analytics and ML features for our healthcare and enterprise clients.",
            "responsibilities": [
                "Build dbt and Airflow ETL pipelines",
                "Design and own data warehouse schemas",
                "Partner with data scientists on feature engineering",
                "Ensure data quality through automated testing",
            ],
            "requirements": [
                "3+ years data engineering",
                "SQL expertise",
                "Python proficiency",
                "Experience with dbt, Spark, or Flink",
            ],
            "preferred_qualifications": [
                "Snowflake or BigQuery experience",
                "Healthcare data (HL7/FHIR) background",
            ],
            "benefits": [
                "Hybrid schedule",
                "Health + life insurance",
                "Festival bonus",
            ],
        },
    ),
    (
        0,
        {
            "title": "Full Stack Engineer",
            "category": "full_stack",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 960000,
            "salary_max": 1600000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Work across our entire stack — React frontend, Node.js or Python backend, and AWS infrastructure — to deliver end-to-end product features.",
            "responsibilities": [
                "Build and own product features from UI to database",
                "Collaborate with design and QA",
                "Write tests and participate in code reviews",
                "Improve deployment and developer tooling",
            ],
            "requirements": [
                "3+ years full-stack experience",
                "React + Node.js or Python proficiency",
                "Git and agile workflow",
                "Good communication skills",
            ],
            "preferred_qualifications": [
                "TypeScript proficiency",
                "Experience shipping to production at scale",
            ],
            "benefits": [
                "Performance bonus",
                "Team outings",
                "Health & dental insurance",
            ],
        },
    ),
    (
        0,
        {
            "title": "Engineering Manager",
            "category": "management",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.onsite,
            "salary_min": 2800000,
            "salary_max": 4200000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Lead a cross-functional engineering team of 8-12 people building products for global clients. Drive technical excellence, people growth, and delivery.",
            "responsibilities": [
                "Manage IC growth, 1:1s, and performance reviews",
                "Define and execute team roadmap with client leads",
                "Drive hiring and onboarding for the team",
                "Represent engineering in client-facing planning sessions",
            ],
            "requirements": [
                "3+ years engineering management",
                "Strong technical background in backend or full-stack",
                "Experience managing cross-cultural or distributed teams",
                "Track record of shipping on deadline",
            ],
            "preferred_qualifications": [
                "Software consulting or outsourcing background",
                "PMP or Agile certifications",
            ],
            "benefits": [
                "Top salary band",
                "Executive coaching",
                "International travel opportunities",
                "Equity-equivalent bonus",
            ],
        },
    ),
    (
        0,
        {
            "title": "QA Engineer",
            "category": "qa",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 600000,
            "salary_max": 1000000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Ensure quality across Leapfrog's product delivery pipeline. Work with developers to define test strategies and automate regression coverage.",
            "responsibilities": [
                "Write and maintain automated test suites with Cypress and Playwright",
                "Perform exploratory and regression testing",
                "Define acceptance criteria with product owners",
                "Report and track bugs through full lifecycle",
            ],
            "requirements": [
                "2+ years QA experience",
                "Experience with Selenium, Cypress, or Playwright",
                "SQL skills for data validation",
                "Good analytical thinking",
            ],
            "preferred_qualifications": [
                "ISTQB certification",
                "API testing with Postman or REST Assured",
            ],
            "benefits": ["Festival bonus", "Health insurance", "Annual retreat"],
        },
    ),
    # ── F1Soft Group (company_idx=1) ────────────────────────────────────────
    (
        1,
        {
            "title": "Android Developer",
            "category": "mobile",
            "location": "Lalitpur, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 960000,
            "salary_max": 1680000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build and maintain the Android applications of Nepal's largest digital payment platform — eSewa — used by 7M+ consumers.",
            "responsibilities": [
                "Ship new features on the eSewa Android app (Kotlin)",
                "Implement Jetpack Compose UI components",
                "Integrate with payment and banking APIs",
                "Write unit tests and participate in code reviews",
            ],
            "requirements": [
                "3+ years Android development",
                "Kotlin proficiency",
                "Experience with Jetpack libraries (Compose, ViewModel, Room)",
                "Understanding of secure coding for payments",
            ],
            "preferred_qualifications": [
                "KMP (Kotlin Multiplatform) experience",
                "Experience with biometric authentication SDKs",
            ],
            "benefits": [
                "Hybrid work",
                "Dashain + Tihar bonus",
                "Health insurance",
                "Employee stock options",
            ],
        },
    ),
    (
        1,
        {
            "title": "iOS Developer",
            "category": "mobile",
            "location": "Lalitpur, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 960000,
            "salary_max": 1680000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build the eSewa iOS application experience, ensuring it is fast, secure, and accessible to millions of users across Nepal.",
            "responsibilities": [
                "Ship features on native iOS app (Swift)",
                "Build real-time payment flows using async/await",
                "Implement biometric and wallet security features",
                "Maintain 4.7+ App Store rating",
            ],
            "requirements": [
                "3+ years iOS development",
                "Swift and SwiftUI proficiency",
                "Experience with Combine or async/await",
                "Knowledge of secure enclave & Keychain APIs",
            ],
            "preferred_qualifications": [
                "iPadOS and watchOS experience",
                "Payment app background",
            ],
            "benefits": [
                "Hybrid Lalitpur",
                "Festival bonuses",
                "Commuter allowance",
                "Professional development budget",
            ],
        },
    ),
    (
        1,
        {
            "title": "Java Backend Engineer",
            "category": "backend",
            "location": "Lalitpur, Nepal",
            "location_type": LocationType.onsite,
            "salary_min": 1100000,
            "salary_max": 1900000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build mission-critical payment processing and reconciliation services that process billions of rupees in transactions daily.",
            "responsibilities": [
                "Design high-availability payment microservices in Java/Spring Boot",
                "Implement real-time fraud detection rules",
                "Ensure PCI-DSS compliance for all payment flows",
                "On-call rotation for tier-1 SLA",
            ],
            "requirements": [
                "4+ years Java development",
                "Spring Boot and microservices experience",
                "Strong understanding of ACID transactions",
                "Knowledge of payment standards",
            ],
            "preferred_qualifications": [
                "Nepal Clearing House (NCH) or NPS integration experience",
                "PCI-DSS certification",
            ],
            "benefits": [
                "Competitive salary",
                "Quarterly performance bonuses",
                "Provident fund",
                "Group health insurance",
            ],
        },
    ),
    (
        1,
        {
            "title": "Data Scientist",
            "category": "data",
            "location": "Lalitpur, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1320000,
            "salary_max": 2160000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build ML models to detect fraud, predict churn, and personalise product recommendations across F1Soft's fintech products.",
            "responsibilities": [
                "Develop fraud detection and risk scoring models",
                "Monitor model drift and maintain model registry",
                "Work with engineering to deploy models via REST APIs",
                "Present insights to business stakeholders",
            ],
            "requirements": [
                "3+ years data science in fintech or banking",
                "Python expertise with Scikit-learn and XGBoost",
                "Strong statistical foundations",
                "SQL proficiency",
            ],
            "preferred_qualifications": [
                "EBM or explainability framework experience",
                "NLP for Nepali language models",
            ],
            "benefits": [
                "Hybrid schedule",
                "R&D time allocation",
                "Conference sponsorship",
            ],
        },
    ),
    (
        1,
        {
            "title": "Security Engineer",
            "category": "security",
            "location": "Lalitpur, Nepal",
            "location_type": LocationType.onsite,
            "salary_min": 1440000,
            "salary_max": 2400000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Protect F1Soft's financial products and customer data including 7M+ eSewa users and Nepal's largest QR payment network.",
            "responsibilities": [
                "Conduct threat modelling and VAPT assessments",
                "Implement SAST/DAST in CI/CD pipelines",
                "Lead PCI-DSS audit preparation",
                "Run security awareness training for engineers",
            ],
            "requirements": [
                "4+ years application or cloud security",
                "OWASP Top 10 expertise",
                "Experience with AWS and container security",
                "Scripting in Python",
            ],
            "preferred_qualifications": [
                "CEH, OSCP, or CISSP certification",
                "Experience in payment or banking security",
            ],
            "benefits": [
                "Top salary band",
                "Security certification sponsorship",
                "Remote-friendly Fridays",
            ],
        },
    ),
    (
        1,
        {
            "title": "Product Manager",
            "category": "product",
            "location": "Lalitpur, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1800000,
            "salary_max": 2800000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Define and drive the product roadmap for eSewa's consumer and merchant experiences. Work with engineering, design, and business to ship impactful features.",
            "responsibilities": [
                "Own product roadmap for one or more eSewa product areas",
                "Write detailed PRDs and user stories",
                "Conduct user research and competitor analysis",
                "Track KPIs and iterate based on data",
            ],
            "requirements": [
                "3+ years product management experience",
                "Track record of shipping consumer fintech features",
                "Strong analytical and communication skills",
                "Familiarity with Nepal's digital payments ecosystem",
            ],
            "preferred_qualifications": [
                "MBA or relevant postgraduate qualification",
                "Experience with A/B testing frameworks",
            ],
            "benefits": [
                "Competitive salary",
                "Equity-equivalent plan",
                "International travel for industry events",
            ],
        },
    ),
    (
        1,
        {
            "title": "Frontend Engineer (React)",
            "category": "frontend",
            "location": "Lalitpur, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 840000,
            "salary_max": 1440000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build responsive and accessible web interfaces for eSewa merchant portal and fonePay dashboard used by thousands of businesses.",
            "responsibilities": [
                "Build dashboard features in React and TypeScript",
                "Optimise rendering for large transaction tables",
                "Write unit and E2E tests",
                "Collaborate closely with UX designers",
            ],
            "requirements": [
                "2+ years React experience",
                "TypeScript proficiency",
                "Understanding of accessibility (WCAG 2.1)",
                "Experience with REST API integration",
            ],
            "preferred_qualifications": [
                "Experience with Recharts or D3 for data visualisation",
                "Storybook component library experience",
            ],
            "benefits": ["Hybrid Lalitpur", "Annual bonus", "Team retreats to Pokhara"],
        },
    ),
    (
        1,
        {
            "title": "Platform Reliability Engineer",
            "category": "devops",
            "location": "Lalitpur, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1440000,
            "salary_max": 2200000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Own reliability of F1Soft's fintech infrastructure processing billions in daily payments. Maintain 99.99% uptime.",
            "responsibilities": [
                "Define SLOs and error budgets for all critical services",
                "Build observability with Prometheus, Grafana, and PagerDuty",
                "Drive blameless post-mortems and action item tracking",
                "Automate toil reduction",
            ],
            "requirements": [
                "4+ years SRE or platform engineering",
                "Kubernetes and Terraform expertise",
                "On-call experience for critical financial systems",
                "Strong scripting skills",
            ],
            "preferred_qualifications": [
                "Financial services background",
                "Chaos engineering practice",
            ],
            "benefits": [
                "Competitive salary",
                "On-call allowance",
                "Monthly engineering events",
            ],
        },
    ),
    # ── Deerwalk Services (company_idx=2) ───────────────────────────────────
    (
        2,
        {
            "title": "Healthcare Data Analyst",
            "category": "data",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.onsite,
            "salary_min": 840000,
            "salary_max": 1440000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Analyse US healthcare claims and clinical data to generate insights that help payers and providers improve outcomes and reduce costs.",
            "responsibilities": [
                "Analyse medical claims, pharmacy, and lab datasets",
                "Build SQL-based reporting pipelines",
                "Collaborate with US-based client teams",
                "Document findings in clear reports and presentations",
            ],
            "requirements": [
                "2+ years data analysis experience",
                "Advanced SQL proficiency",
                "Experience with US healthcare data (ICD-10, CPT codes) preferred",
                "Good written English communication",
            ],
            "preferred_qualifications": [
                "Python for data analysis",
                "Tableau or Power BI dashboarding",
            ],
            "benefits": [
                "US-hour aligned shift (afternoon)",
                "USD salary equivalent",
                "Health insurance",
                "Skill development budget",
            ],
        },
    ),
    (
        2,
        {
            "title": "Machine Learning Engineer",
            "category": "ml_ai",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1560000,
            "salary_max": 2640000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build and deploy ML models for predictive healthcare analytics across risk stratification, readmission prediction, and care gap identification.",
            "responsibilities": [
                "Train and fine-tune classification and regression models",
                "Build ML serving infrastructure on AWS SageMaker",
                "Evaluate model fairness and clinical validity",
                "Collaborate with clinical informaticists on feature design",
            ],
            "requirements": [
                "3+ years ML engineering experience",
                "Python and PyTorch or TensorFlow expertise",
                "Experience with model deployment pipelines",
                "Understanding of healthcare analytics",
            ],
            "preferred_qualifications": [
                "Publications in healthcare AI",
                "Experience with FHIR or HL7 data standards",
            ],
            "benefits": [
                "Hybrid schedule",
                "Research collaboration with US partner universities",
                "International conference sponsorship",
            ],
        },
    ),
    (
        2,
        {
            "title": "Full Stack Developer",
            "category": "full_stack",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1080000,
            "salary_max": 1800000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build features across the Deerwalk platform — React frontend, Python backend, and AWS infrastructure — to deliver analytics applications for US healthcare clients.",
            "responsibilities": [
                "Build and maintain React dashboards for claims analytics",
                "Develop Python/Django REST APIs",
                "Participate in architecture discussions and code reviews",
                "Write automated tests and ensure CI/CD quality gates",
            ],
            "requirements": [
                "3+ years full-stack experience",
                "React and Python proficiency",
                "PostgreSQL database skills",
                "Comfortable working in an US-aligned shift",
            ],
            "preferred_qualifications": [
                "Healthcare or insurance domain knowledge",
                "GraphQL experience",
            ],
            "benefits": [
                "Hybrid schedule",
                "International training opportunities",
                "Provident fund",
                "Medical insurance",
            ],
        },
    ),
    (
        2,
        {
            "title": "Cloud Engineer (AWS)",
            "category": "devops",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1320000,
            "salary_max": 2160000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Design, build, and operate Deerwalk's HIPAA-compliant AWS cloud infrastructure supporting healthcare analytics for US enterprise clients.",
            "responsibilities": [
                "Design multi-account AWS architecture with security guardrails",
                "Manage EKS clusters and RDS databases",
                "Implement HIPAA compliance controls (PHI handling, audit logs)",
                "Build IaC pipelines with Terraform",
            ],
            "requirements": [
                "4+ years AWS experience",
                "AWS Solutions Architect certification",
                "Terraform and Kubernetes expertise",
                "HIPAA or HITRUST compliance knowledge",
            ],
            "preferred_qualifications": [
                "AWS Security Specialty certification",
                "Multi-region disaster recovery design",
            ],
            "benefits": [
                "AWS certification bonuses",
                "Hybrid schedule",
                "International project exposure",
            ],
        },
    ),
    (
        2,
        {
            "title": "Staff Software Engineer",
            "category": "backend",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.onsite,
            "salary_min": 2400000,
            "salary_max": 3600000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Lead technical direction for Deerwalk's core platform as a senior individual contributor. Define architecture, mentor senior engineers, and represent engineering in planning.",
            "responsibilities": [
                "Define and execute multi-quarter technical roadmap",
                "Mentor senior and mid-level engineers",
                "Drive cross-team architectural decisions",
                "Engage US client leads on technical strategy",
            ],
            "requirements": [
                "8+ years software engineering",
                "Track record of staff-level design and delivery",
                "Experience in healthcare IT or data-intensive systems",
                "Strong written communication",
            ],
            "preferred_qualifications": [
                "Open source maintainership",
                "Published technical blog or conference talks",
            ],
            "benefits": [
                "Top-of-market NPR salary",
                "Executive coaching budget",
                "Annual international travel",
            ],
        },
    ),
    (
        2,
        {
            "title": "BI Developer",
            "category": "data",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.onsite,
            "salary_min": 960000,
            "salary_max": 1560000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Build business intelligence dashboards and self-service analytics tools for Deerwalk's healthcare clients using Tableau and Power BI.",
            "responsibilities": [
                "Design and build Tableau and Power BI dashboards",
                "Develop SQL data models and SSAS cubes",
                "Partner with data engineers on warehouse schema design",
                "Train client users on self-service analytics",
            ],
            "requirements": [
                "2+ years BI development",
                "Tableau or Power BI certification",
                "Advanced SQL and data modelling",
                "Healthcare data domain preferred",
            ],
            "preferred_qualifications": [
                "LookML or Metabase experience",
                "ETL pipeline development",
            ],
            "benefits": ["US daytime shift", "Cert bonus", "Health insurance"],
        },
    ),
    (
        2,
        {
            "title": "Site Reliability Engineer",
            "category": "devops",
            "location": "Kathmandu, Nepal",
            "location_type": LocationType.hybrid,
            "salary_min": 1440000,
            "salary_max": 2400000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Own the reliability and observability of Deerwalk's healthcare SaaS platform meeting stringent HIPAA and enterprise SLAs.",
            "responsibilities": [
                "Define and enforce SLOs across all HIPAA-regulated services",
                "Build alerting with Prometheus + Alertmanager",
                "Lead blameless post-mortems and long-term reliability improvements",
                "Automate runbooks and toil elimination",
            ],
            "requirements": [
                "4+ years SRE or platform engineering",
                "Kubernetes production experience",
                "AWS operational expertise",
                "Strong scripting in Python or Go",
            ],
            "preferred_qualifications": [
                "Game days / chaos engineering experience",
                "HIPAA security rule knowledge",
            ],
            "benefits": [
                "Hybrid schedule",
                "On-call allowance",
                "Certifications sponsored",
            ],
        },
    ),
    (
        2,
        {
            "title": "Technical Writer",
            "category": "other",
            "location": "Remote",
            "location_type": LocationType.remote,
            "salary_min": 540000,
            "salary_max": 900000,
            "currency": "NPR",
            "status": JobStatus.open,
            "overview": "Produce world-class documentation for Deerwalk's APIs, data platform, and analytical products consumed by US healthcare enterprise clients.",
            "responsibilities": [
                "Write and maintain API references, how-to guides, and release notes",
                "Build out docs infrastructure (Docusaurus / ReadTheDocs)",
                "Collaborate with engineers to document new features",
                "Produce client-facing user manuals and training materials",
            ],
            "requirements": [
                "2+ years technical writing for software products",
                "Ability to understand and document REST APIs",
                "Excellent written English",
                "Docs-as-code workflow (Git + Markdown)",
            ],
            "preferred_qualifications": [
                "Healthcare domain familiarity",
                "OpenAPI/Swagger documentation experience",
            ],
            "benefits": ["Fully remote", "Equipment stipend", "Flexible hours"],
        },
    ),
]

# Applications: (candidate_idx, job_idx_in_JOBS_DATA, status)
# Job index reference:
#  0-7  = Leapfrog  (0=Sr React, 1=Node.js, 2=DevOps, 3=UI/UX, 4=DataEng, 5=FullStack, 6=EngMgr, 7=QA)
#  8-15 = F1Soft    (8=Android, 9=iOS, 10=JavaBE, 11=DataSci, 12=Security, 13=PM, 14=Frontend, 15=PlatformRE)
#  16-23= Deerwalk  (16=HcDataAn, 17=MLEng, 18=FullStack, 19=CloudEng, 20=StaffSWE, 21=BI, 22=SRE, 23=TechWriter)
APPLICATIONS_DATA = [
    (0, 0, ApplicationStatus.interview),  # Aarav → Leapfrog Senior React Developer
    (0, 5, ApplicationStatus.submitted),  # Aarav → Leapfrog Full Stack Engineer
    (0, 18, ApplicationStatus.screening),  # Aarav → Deerwalk Full Stack Developer
    (0, 14, ApplicationStatus.submitted),  # Aarav → F1Soft Frontend Engineer
    (1, 1, ApplicationStatus.screening),  # Manisha → Leapfrog Node.js Backend Developer
    (1, 4, ApplicationStatus.submitted),  # Manisha → Leapfrog Data Engineer
    (1, 10, ApplicationStatus.interview),  # Manisha → F1Soft Java Backend Engineer
    (1, 11, ApplicationStatus.offered),  # Manisha → F1Soft Data Scientist
    (2, 3, ApplicationStatus.submitted),  # Rajan → Leapfrog UI/UX Designer
    (2, 14, ApplicationStatus.screening),  # Rajan → F1Soft Frontend Engineer
    (3, 2, ApplicationStatus.submitted),  # Sunita → Leapfrog DevOps Engineer
    (
        3,
        15,
        ApplicationStatus.interview,
    ),  # Sunita → F1Soft Platform Reliability Engineer
    (3, 19, ApplicationStatus.submitted),  # Sunita → Deerwalk Cloud Engineer
    (3, 22, ApplicationStatus.screening),  # Sunita → Deerwalk SRE
    (4, 16, ApplicationStatus.submitted),  # Dipesh → Deerwalk Healthcare Data Analyst
    (4, 17, ApplicationStatus.screening),  # Dipesh → Deerwalk ML Engineer
    (5, 8, ApplicationStatus.submitted),  # Nisha → F1Soft Android Developer
    (5, 9, ApplicationStatus.interview),  # Nisha → F1Soft iOS Developer
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def get_or_create_company(db: AsyncSession, data: dict) -> Company:
    result = await db.execute(select(Company).where(Company.domain == data["domain"]))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    company = Company(**data)
    db.add(company)
    await db.flush()
    return company


async def get_or_create_user(db: AsyncSession, data: dict) -> User:
    result = await db.execute(select(User).where(User.email == data["email"]))
    existing = result.scalar_one_or_none()
    if existing:
        return existing
    user = User(
        full_name=data["full_name"],
        email=data["email"],
        password_hash=hash_password(SEED_PASSWORD),
        is_email_verified=True,
        primary_role=data["role"],
    )
    db.add(user)
    await db.flush()
    return user


async def wipe_seed_data(db: AsyncSession) -> None:
    """Delete all seed data by email suffix pattern."""
    print("  Wiping existing seed data…")

    # Fetch seed user ids
    result = await db.execute(
        select(User.id).where(User.email.like(f"%{SEED_EMAIL_SUFFIX}"))
    )
    user_ids = [row[0] for row in result.all()]

    # Fetch seed company ids
    result = await db.execute(
        select(Company.id).where(Company.domain.in_([c["domain"] for c in COMPANIES]))
    )
    company_ids = [row[0] for row in result.all()]

    if user_ids:
        await db.execute(delete(Application).where(Application.user_id.in_(user_ids)))
        await db.execute(delete(Resume).where(Resume.user_id.in_(user_ids)))
        await db.execute(delete(Profile).where(Profile.user_id.in_(user_ids)))

    if company_ids:
        await db.execute(delete(Job).where(Job.company_id.in_(company_ids)))
        await db.execute(
            delete(CompanyMembership).where(
                CompanyMembership.company_id.in_(company_ids)
            )
        )
        await db.execute(delete(Company).where(Company.id.in_(company_ids)))

    if user_ids:
        await db.execute(delete(User).where(User.id.in_(user_ids)))

    await db.commit()
    print("  Done wiping.")


# ---------------------------------------------------------------------------
# Main seed function
# ---------------------------------------------------------------------------


async def seed(reset: bool = False) -> None:
    async with AsyncSessionLocal() as db:
        if reset:
            await wipe_seed_data(db)

        # ------------------------------------------------------------------
        # 1. Companies
        # ------------------------------------------------------------------
        print("Creating companies…")
        companies: list[Company] = []
        for c_data in COMPANIES:
            company = await get_or_create_company(db, c_data)
            companies.append(company)
        await db.commit()
        print(f"  {len(companies)} companies ready.")

        # ------------------------------------------------------------------
        # 2. Recruiter users + memberships
        # ------------------------------------------------------------------
        print("Creating recruiter users…")
        for r_data in RECRUITER_USERS:
            user = await get_or_create_user(db, r_data)
            # Membership
            company = companies[r_data["company_idx"]]
            result = await db.execute(
                select(CompanyMembership).where(
                    CompanyMembership.user_id == user.id,
                    CompanyMembership.company_id == company.id,
                )
            )
            if not result.scalar_one_or_none():
                membership = CompanyMembership(
                    user_id=user.id,
                    company_id=company.id,
                    role=r_data["membership_role"],
                    status=MembershipStatus.active,
                    job_title=r_data["job_title"],
                )
                db.add(membership)
        await db.commit()
        print(f"  {len(RECRUITER_USERS)} recruiters ready.")

        # ------------------------------------------------------------------
        # 3. Candidate users + profiles + resumes
        # ------------------------------------------------------------------
        print("Creating candidate users…")
        candidate_users: list[User] = []
        candidate_resumes: list[Resume] = []

        for cand_data in CANDIDATE_USERS:
            user = await get_or_create_user(
                db,
                {
                    "full_name": cand_data["full_name"],
                    "email": cand_data["email"],
                    "role": UserRole.candidate,
                },
            )
            candidate_users.append(user)

            # Profile
            result = await db.execute(select(Profile).where(Profile.user_id == user.id))
            profile = result.scalar_one_or_none()
            if not profile:
                profile = Profile(
                    user_id=user.id,
                    headline=cand_data["headline"],
                    location=cand_data["location"],
                    years_of_experience=cand_data["years_of_experience"],
                )
                db.add(profile)
                await db.flush()

                for exp in cand_data["experiences"]:
                    db.add(ProfileExperience(profile_id=profile.id, **exp))
                for edu in cand_data["educations"]:
                    db.add(ProfileEducation(profile_id=profile.id, **edu))
                for skill_name in cand_data["skills"]:
                    db.add(ProfileSkill(profile_id=profile.id, skill_name=skill_name))

            # Resume (one per candidate)
            result = await db.execute(select(Resume).where(Resume.user_id == user.id))
            resume = result.scalar_one_or_none()
            if not resume:
                resume = Resume(
                    user_id=user.id,
                    resume_name=f"{cand_data['full_name']} — Resume",
                    headline=cand_data["headline"],
                    location=cand_data["location"],
                    years_of_experience=cand_data["years_of_experience"],
                )
                db.add(resume)
                await db.flush()

                for exp in cand_data["experiences"]:
                    db.add(ResumeExperience(resume_id=resume.id, **exp))
                for edu in cand_data["educations"]:
                    db.add(ResumeEducation(resume_id=resume.id, **edu))
                for skill_name in cand_data["skills"]:
                    db.add(ResumeSkill(resume_id=resume.id, skill_name=skill_name))

            candidate_resumes.append(resume)

        await db.commit()
        print(f"  {len(candidate_users)} candidates ready.")

        # ------------------------------------------------------------------
        # 4. Jobs
        # ------------------------------------------------------------------
        print("Creating jobs…")
        jobs: list[Job] = []

        # Recruiter user ids per company (for posted_by)
        recruiter_per_company: dict[int, uuid.UUID] = {}
        for r_data in RECRUITER_USERS:
            if r_data["membership_role"] == MembershipRole.admin:
                result = await db.execute(
                    select(User.id).where(User.email == r_data["email"])
                )
                recruiter_per_company[r_data["company_idx"]] = result.scalar_one()

        for company_idx, job_data in JOBS_DATA:
            company = companies[company_idx]
            result = await db.execute(
                select(Job).where(
                    Job.company_id == company.id,
                    Job.title == job_data["title"],
                )
            )
            existing_job = result.scalar_one_or_none()
            if existing_job:
                jobs.append(existing_job)
                continue

            job = Job(
                company_id=company.id,
                posted_by=recruiter_per_company.get(company_idx),
                **job_data,
            )
            db.add(job)
            await db.flush()
            jobs.append(job)

        await db.commit()
        print(f"  {len(jobs)} jobs ready.")

        # ------------------------------------------------------------------
        # 5. Applications
        # ------------------------------------------------------------------
        print("Creating applications…")
        app_count = 0
        for cand_idx, job_idx, status in APPLICATIONS_DATA:
            user = candidate_users[cand_idx]
            resume = candidate_resumes[cand_idx]
            job = jobs[job_idx]

            result = await db.execute(
                select(Application).where(
                    Application.job_id == job.id,
                    Application.user_id == user.id,
                )
            )
            if result.scalar_one_or_none():
                continue

            application = Application(
                job_id=job.id,
                user_id=user.id,
                resume_id=resume.id,
                status=status,
            )
            db.add(application)
            app_count += 1

        await db.commit()
        print(f"  {app_count} applications created.")

        # ------------------------------------------------------------------
        # Summary
        # ------------------------------------------------------------------
        print()
        print("=" * 55)
        print("Seed complete!")
        print(f"  Companies:    {len(companies)}")
        print(f"  Recruiters:   {len(RECRUITER_USERS)}")
        print(f"  Candidates:   {len(candidate_users)}")
        print(f"  Jobs:         {len(jobs)}")
        print(f"  Applications: {app_count}")
        print()
        print(f"All seeded users share password: {SEED_PASSWORD}")
        print()
        print("Candidate logins:")
        for c in CANDIDATE_USERS:
            print(f"  {c['email']}")
        print()
        print("Recruiter logins:")
        for r in RECRUITER_USERS:
            print(
                f"  {r['email']}  ({r['role'].value} @ {COMPANIES[r['company_idx']]['name']})"
            )
        print("=" * 55)


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    asyncio.run(seed(reset=reset))
