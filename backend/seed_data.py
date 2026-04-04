"""
Comprehensive seed script for ConvexHire – Nepal IT Hiring Platform.

Seeds an empty database with realistic data simulating an active hiring platform:
  - 2 companies (each with 1 admin + 2 recruiters)
  - 4 jobs per company (8 total), all expired → ready for shortlisting
  - 5 candidates (each with profile + 2 resumes)
  - Applications with varied share preferences
  - AI screening scores & feedback
  - Shortlisted / rejected statuses
  - Outreach email drafts (shortlist + rejection)
  - Cal.com interview bookings for shortlisted candidates
  - Evaluation schemas per job

Usage:
    uv run python seed_data.py
"""

import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.applications.models import Application
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.interviews.evaluation_models import (
    JobEvaluationSchema,
)
from app.modules.interviews.models import Interview
from app.modules.jobs.models import Job, JobSyncEvent
from app.modules.outreach.models import EmailDraft
from app.modules.profiles.models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileSkill,
)
from app.modules.resumes.models import (
    Resume,
    ResumeEducation,
    ResumeExperience,
    ResumeSkill,
)
from app.shared.enums import (
    ApplicationStatus,
    JobStatus,
    LocationType,
    ShortlistStatus,
    SyncAction,
)

COMMON_PW = hash_password("Password@123")

NOW = datetime(2026, 4, 4, 10, 0, 0, tzinfo=timezone.utc)
EXPIRED_DATE = NOW - timedelta(days=3)  # Jobs expired 3 days ago


# ============================================================================
# COMPANY DATA
# ============================================================================

COMPANIES = [
    {
        "name": "Pinnacle Tech Nepal Pvt. Ltd.",
        "industry": "Fintech & Digital Banking",
        "company_size": "201-500",
        "location": "Hattisar, Kathmandu",
        "website_url": "https://pinnacletech.com.np",
        "domain": "pinnacletech.com.np",
        "cal_booking_url": "https://cal.com/pinnacletech-hiring",
        "cal_organizer_email": "hiring@pinnacletech.com.np",
        "description": (
            "Pinnacle Tech Nepal is a leading fintech company building the next generation of "
            "digital payment infrastructure for Nepal and South Asia. Founded in 2015, we power "
            "real-time payment rails, mobile banking platforms, and lending APIs used by over "
            "40 banks and financial institutions. Our engineering team operates at the intersection "
            "of distributed systems, financial compliance, and mobile-first product design. "
            "We are headquartered in Hattisar, Kathmandu with a satellite office in Pokhara."
        ),
        "admin": {
            "full_name": "Bikash Shrestha",
            "email": "bikash.shrestha@pinnacletech.com.np",
            "job_title": "Chief Technology Officer",
        },
        "recruiters": [
            {
                "full_name": "Priya Maharjan",
                "email": "priya.maharjan@pinnacletech.com.np",
                "job_title": "Head of Talent Acquisition",
            },
            {
                "full_name": "Roshan Karki",
                "email": "roshan.karki@pinnacletech.com.np",
                "job_title": "Technical Recruiter",
            },
        ],
        "jobs": [
            {
                "title": "Senior Backend Engineer – Payment Systems (Python/FastAPI)",
                "location": "Hattisar, Kathmandu",
                "location_type": LocationType.hybrid,
                "salary_min": 170000,
                "salary_max": 260000,
                "currency": "NPR",
                "overview": (
                    "We are looking for a Senior Backend Engineer to join our Core Payments team, "
                    "which owns the transaction processing engine that handles millions of NPR transfers "
                    "daily. You will design and own critical microservices, contribute to architectural "
                    "decisions, and mentor mid-level engineers. This role sits at the heart of Nepal's "
                    "digital payment infrastructure — the work you do directly impacts how millions of "
                    "people send and receive money."
                ),
                "responsibilities": [
                    "Design, build, and maintain high-throughput payment microservices using Python 3.12 and FastAPI",
                    "Own the end-to-end reliability of core transaction APIs, targeting 99.95% uptime SLA",
                    "Optimize PostgreSQL query performance for financial ledger tables processing 5,000+ TPS",
                    "Implement idempotency patterns, distributed locking, and saga-based transaction rollbacks",
                    "Collaborate with the compliance team to ensure PCI-DSS and Nepal Rastra Bank regulatory requirements are met",
                    "Lead technical design reviews and mentor 2–3 junior engineers on the team",
                    "Participate in a 24/7 on-call rotation for production incidents (compensated separately)",
                ],
                "requirements": [
                    "5+ years of professional backend engineering experience, with at least 3 years in Python",
                    "Strong command of FastAPI, SQLAlchemy (async), and Alembic for database migrations",
                    "Solid understanding of distributed systems: eventual consistency, CAP theorem, and idempotency",
                    "Hands-on experience with PostgreSQL query optimization, indexing strategies, and EXPLAIN ANALYZE",
                    "Familiarity with message queues (RabbitMQ or Kafka) and event-driven architecture",
                    "Experience with AWS (EC2, RDS, SQS) or equivalent cloud infrastructure",
                    "Strong knowledge of financial transaction concepts: double-entry bookkeeping, reconciliation, chargebacks",
                ],
                "preferred_qualifications": [
                    "Prior experience in fintech, banking, or payment processing companies",
                    "Knowledge of Nepal Rastra Bank (NRB) regulations and digital payment compliance frameworks",
                    "Experience with Redis for distributed caching and rate limiting",
                    "Contributions to open-source Python projects",
                    "B.E./B.Tech in Computer Engineering from Pulchowk Campus, KU, or equivalent",
                ],
                "benefits": [
                    "Monthly gross salary: NPR 1,70,000 – 2,60,000 (negotiable for exceptional candidates)",
                    "Dashain and Tihar festival bonuses (equivalent to one month's salary each)",
                    "Comprehensive health insurance covering self, spouse, and up to two dependants",
                    "Annual performance bonus of 10–20% of salary based on individual and company OKRs",
                    "NPR 20,000 annual learning & certification allowance",
                    "Hybrid work: 3 days office, 2 days remote with home-internet reimbursement",
                    "6 months paid maternity leave and 15 days paternity leave",
                    "Company-sponsored attendance at one international tech conference per year",
                ],
                "shortlist_threshold": 65,
                "evaluation_criteria": [
                    {
                        "key": "technical_depth",
                        "label": "Technical Depth (Python/FastAPI/DB)",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "system_design",
                        "label": "System Design & Architecture",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "fintech_domain",
                        "label": "Fintech Domain Knowledge",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "communication",
                        "label": "Communication & Clarity",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "cultural_fit",
                        "label": "Cultural Fit & Team Collaboration",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
            {
                "title": "Lead Frontend Engineer – Mobile Banking Platform (React Native / Next.js)",
                "location": "Hattisar, Kathmandu",
                "location_type": LocationType.onsite,
                "salary_min": 140000,
                "salary_max": 210000,
                "currency": "NPR",
                "overview": (
                    "Our mobile banking platform serves over 3 million end-users across 40+ partner banks. "
                    "We are hiring a Lead Frontend Engineer to own both the React Native mobile app and "
                    "the Next.js web banking portal. You will drive technical decisions, define component "
                    "architecture, and ensure a smooth, accessible experience for users across Nepal's "
                    "diverse network conditions — from Kathmandu fibre to rural 2G connectivity."
                ),
                "responsibilities": [
                    "Lead the architecture and development of the React Native mobile banking app (iOS & Android)",
                    "Build and maintain the Next.js 15 web portal used by bank relationship managers and end-users",
                    "Define and enforce a component library and design system aligned with Figma specifications",
                    "Optimize app performance for low-bandwidth environments common outside Kathmandu valley",
                    "Conduct code reviews, set coding standards, and mentor 3–4 frontend engineers",
                    "Work closely with UX designers, product managers, and backend teams in two-week sprints",
                    "Implement analytics, crash reporting, and A/B testing infrastructure",
                ],
                "requirements": [
                    "6+ years of frontend development experience, with at least 3 years in React Native",
                    "Deep expertise in TypeScript, React hooks, and state management (Redux Toolkit or Zustand)",
                    "Strong understanding of mobile performance profiling, bundle optimization, and offline-first patterns",
                    "Proficiency with Next.js App Router, Server Components, and React Server Actions",
                    "Experience integrating REST and GraphQL APIs, including secure token-based authentication flows",
                    "Knowledge of WCAG accessibility standards and cross-platform testing on both iOS and Android",
                ],
                "preferred_qualifications": [
                    "Experience building apps for financial services, with PII data-handling awareness",
                    "Familiarity with Nepal's mobile ecosystem (carrier constraints, SIM-based OTP flows)",
                    "Prior experience with Expo EAS build pipelines",
                    "Understanding of Web Vitals and Core Web Vitals optimization",
                ],
                "benefits": [
                    "Monthly gross salary: NPR 1,40,000 – 2,10,000",
                    "Dashain and Tihar festival bonuses",
                    "Comprehensive health insurance (self + family)",
                    "Flexible working hours with core hours 10am–4pm NST",
                    "Annual device upgrade budget: NPR 50,000 (for test devices)",
                    "NPR 15,000 annual learning allowance (courses, books, subscriptions)",
                    "Gym membership reimbursement up to NPR 5,000/month",
                ],
                "shortlist_threshold": 60,
                "evaluation_criteria": [
                    {
                        "key": "frontend_mastery",
                        "label": "React / React Native Mastery",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "mobile_perf",
                        "label": "Mobile Performance Optimization",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "leadership",
                        "label": "Technical Leadership",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "ux_sense",
                        "label": "UX & Design Sensibility",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "communication",
                        "label": "Communication Skills",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
            {
                "title": "DevOps & Cloud Infrastructure Engineer (AWS / Kubernetes)",
                "location": "Kathmandu / Remote (Nepal)",
                "location_type": LocationType.remote,
                "salary_min": 130000,
                "salary_max": 200000,
                "currency": "NPR",
                "overview": (
                    "Pinnacle Tech's infrastructure team manages a multi-region AWS footprint that "
                    "serves real-time financial transactions. We are looking for a DevOps & Cloud "
                    "Infrastructure Engineer who can drive automation, improve deployment reliability, "
                    "and ensure our systems meet the security standards demanded by NRB and partner banks. "
                    "You will have significant autonomy to improve our CI/CD pipelines, Kubernetes workloads, "
                    "and observability stack."
                ),
                "responsibilities": [
                    "Manage and scale EKS clusters running production payment microservices across ap-south-1 and ap-southeast-1",
                    "Own CI/CD pipelines built on GitHub Actions, ArgoCD, and Helm charts",
                    "Implement infrastructure-as-code using Terraform; maintain a clean module library",
                    "Set up and maintain observability stack: Prometheus, Grafana, Loki, and PagerDuty alerting",
                    "Conduct regular security audits, vulnerability scanning (Trivy, Snyk), and penetration testing coordination",
                    "Manage disaster recovery planning; maintain RTO < 30 minutes and RPO < 5 minutes for critical services",
                    "Document runbooks and train developers on operational best practices",
                ],
                "requirements": [
                    "4+ years of DevOps / SRE / cloud engineering experience",
                    "Strong proficiency with AWS: EKS, RDS, S3, SQS, IAM, CloudTrail, VPC design",
                    "Hands-on Terraform experience managing production infrastructure",
                    "Solid Kubernetes knowledge: workloads, networking (Cilium/Calico), RBAC, and resource management",
                    "Experience writing automation scripts in Python or Bash",
                    "Familiarity with container security best practices and SAST/DAST tooling",
                ],
                "preferred_qualifications": [
                    "AWS Solutions Architect Professional or DevOps Engineer Professional certification",
                    "Experience with financial sector compliance requirements (PCI-DSS, SOC 2)",
                    "Knowledge of Istio or similar service mesh",
                    "Prior work in a fintech or payment company environment",
                ],
                "benefits": [
                    "100% remote from anywhere in Nepal",
                    "Monthly gross salary: NPR 1,30,000 – 2,00,000",
                    "NPR 25,000 annual certification sponsorship (AWS, CKA, etc.)",
                    "Home internet allowance: NPR 3,000/month",
                    "Dashain and Tihar bonuses",
                    "Annual health checkup and accident insurance",
                    "Company equipment: MacBook Pro M3, external monitor, and peripherals",
                ],
                "shortlist_threshold": 60,
                "evaluation_criteria": [
                    {
                        "key": "aws_infra",
                        "label": "AWS & Cloud Infrastructure",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "k8s_expertise",
                        "label": "Kubernetes & Container Orchestration",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "iac_cicd",
                        "label": "IaC & CI/CD Pipeline Design",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "security_compliance",
                        "label": "Security & Compliance Awareness",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "incident_mgmt",
                        "label": "Incident Management & On-call Readiness",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
            {
                "title": "QA Automation Engineer – Payment Gateway Testing",
                "location": "Hattisar, Kathmandu",
                "location_type": LocationType.hybrid,
                "salary_min": 90000,
                "salary_max": 150000,
                "currency": "NPR",
                "overview": (
                    "Our Quality Assurance team ensures that every release to production meets the "
                    "highest standards of reliability and compliance. We are looking for a QA Automation "
                    "Engineer to design and maintain end-to-end test suites for our payment gateway, "
                    "mobile banking APIs, and reconciliation engines. You will work with Python, Pytest, "
                    "Playwright, and Postman to build automated regression suites that catch issues "
                    "before they reach customers."
                ),
                "responsibilities": [
                    "Design and maintain end-to-end automated test suites for REST APIs using Pytest and requests",
                    "Build UI automation tests for the web banking portal using Playwright (TypeScript)",
                    "Create and maintain Postman collections for manual and automated API testing across payment workflows",
                    "Write integration tests simulating multi-bank transaction flows including edge cases and failure scenarios",
                    "Set up CI/CD test stages in GitHub Actions that gate deployments on test pass rate",
                    "Collaborate with developers to define acceptance criteria and testability requirements in sprint planning",
                    "Report and track bugs in Jira; maintain a defect metrics dashboard for weekly engineering reviews",
                ],
                "requirements": [
                    "3+ years of QA engineering experience with a focus on automation",
                    "Strong Python skills for writing automated test scripts (Pytest, requests, Faker)",
                    "Experience with Playwright, Selenium, or Cypress for browser-based testing",
                    "Familiarity with REST API testing tools: Postman, Newman, or equivalent",
                    "Understanding of CI/CD concepts and how to integrate test stages into deployment pipelines",
                    "Good analytical skills and attention to detail in identifying edge cases",
                    "Experience with Git-based version control workflows",
                ],
                "preferred_qualifications": [
                    "Experience testing financial or payment systems",
                    "Knowledge of load testing tools: Locust, k6, or JMeter",
                    "ISTQB Foundation or Advanced certification",
                    "Experience with contract testing (Pact) or performance profiling",
                ],
                "benefits": [
                    "Monthly gross salary: NPR 90,000 – 1,50,000",
                    "Dashain and Tihar festival bonuses",
                    "Health insurance (self + spouse)",
                    "NPR 10,000 annual learning and certification budget",
                    "Hybrid work: 3 days office, 2 days remote",
                    "Team lunch every Friday at the office",
                    "Annual company retreat within Nepal",
                ],
                "shortlist_threshold": 55,
                "evaluation_criteria": [
                    {
                        "key": "automation_skills",
                        "label": "Test Automation Expertise",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "api_testing",
                        "label": "API & Integration Testing",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "analytical_thinking",
                        "label": "Analytical Thinking & Edge Cases",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "tools_cicd",
                        "label": "Tools & CI/CD Integration",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "communication",
                        "label": "Communication & Documentation",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
        ],
    },
    {
        "name": "NovaMind AI Solutions Pvt. Ltd.",
        "industry": "Artificial Intelligence & Data Science",
        "company_size": "51-200",
        "location": "Kumaripati, Lalitpur",
        "website_url": "https://novamind.ai",
        "domain": "novamind.ai",
        "cal_booking_url": "https://cal.com/novamind-interviews",
        "cal_organizer_email": "interviews@novamind.ai",
        "description": (
            "NovaMind AI Solutions is Nepal's fastest-growing applied AI company, building "
            "machine learning products for healthcare, agritech, and enterprise automation. "
            "Spun out of research at Kathmandu University in 2019, we now serve clients across "
            "Nepal, India, and the United States. Our team of 80+ engineers, data scientists, "
            "and ML researchers work on everything from custom LLM fine-tuning to computer vision "
            "systems deployed on edge devices in remote health posts. We are backed by South Asian "
            "venture capital and are scaling rapidly."
        ),
        "admin": {
            "full_name": "Dr. Samjhana Poudel",
            "email": "samjhana.poudel@novamind.ai",
            "job_title": "CEO & Co-Founder",
        },
        "recruiters": [
            {
                "full_name": "Anil Thapa Magar",
                "email": "anil.thapamagar@novamind.ai",
                "job_title": "People Operations Manager",
            },
            {
                "full_name": "Sunita Rai",
                "email": "sunita.rai@novamind.ai",
                "job_title": "Senior Technical Recruiter",
            },
        ],
        "jobs": [
            {
                "title": "Machine Learning Engineer – NLP & LLM Fine-tuning",
                "location": "Kumaripati, Lalitpur",
                "location_type": LocationType.hybrid,
                "salary_min": 160000,
                "salary_max": 250000,
                "currency": "NPR",
                "overview": (
                    "NovaMind is building a Nepali-language AI assistant for the public health sector, "
                    "funded by the Ministry of Health and Population. We need a Machine Learning Engineer "
                    "with hands-on experience in LLM fine-tuning and NLP to join the core model team. "
                    "You will work on Nepali language tokenization, fine-tuning open-weight models like "
                    "LLaMA and Mistral on domain-specific corpora, and deploying inference pipelines at scale."
                ),
                "responsibilities": [
                    "Fine-tune and evaluate open-weight LLMs (LLaMA 3, Mistral, Gemma) on Nepali-language health corpora",
                    "Build and maintain data pipelines for preprocessing Devanagari text, removing noise, and creating instruction datasets",
                    "Design and run model evaluation frameworks: BLEU, ROUGE, human evaluation, and clinical accuracy benchmarks",
                    "Optimize inference latency and memory footprint for deployment on CPU-constrained edge servers at health posts",
                    "Collaborate with linguists and domain experts (doctors, ANMs) to gather and annotate training data",
                    "Implement RAG (Retrieval-Augmented Generation) pipelines using LangChain and vector databases",
                    "Document experiments rigorously in MLflow; present findings to technical and non-technical stakeholders",
                ],
                "requirements": [
                    "3+ years of practical machine learning engineering experience (not just research)",
                    "Strong Python skills: PyTorch, Hugging Face Transformers, Datasets, and PEFT/LoRA fine-tuning",
                    "Hands-on experience fine-tuning or deploying at least one large language model",
                    "Solid understanding of transformer architecture, attention mechanisms, and tokenization",
                    "Experience with experiment tracking (MLflow, Weights & Biases) and reproducible ML pipelines",
                    "Proficiency with Linux, Docker, and basic GPU cluster management",
                    "Working knowledge of Nepali language (reading ability) is a strong plus",
                ],
                "preferred_qualifications": [
                    "Master's or PhD in Computer Science, AI, or related field",
                    "Published research or notable open-source contributions in NLP",
                    "Experience with quantization (GGUF, GPTQ) and vLLM for efficient inference",
                    "Familiarity with Nepal's healthcare data landscape and NHISS system",
                ],
                "benefits": [
                    "Monthly gross salary: NPR 1,60,000 – 2,50,000",
                    "Equity / ESOPs in a pre-Series A company",
                    "GPU compute credits: dedicated A100 access for research work",
                    "Full conference sponsorship (NeurIPS, ACL, or equivalent once per year)",
                    "Research publication support and 5 days research leave per quarter",
                    "Dashain and Tihar festival bonuses",
                    "Health insurance covering self and immediate family",
                    "Flexible work: core hours 10am–3pm with async flexibility otherwise",
                ],
                "shortlist_threshold": 70,
                "evaluation_criteria": [
                    {
                        "key": "ml_fundamentals",
                        "label": "ML Fundamentals & Theory",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "llm_finetuning",
                        "label": "LLM Fine-tuning & NLP Expertise",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "engineering_practices",
                        "label": "ML Engineering Practices",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "research_aptitude",
                        "label": "Research Aptitude & Publications",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "nepali_language",
                        "label": "Nepali Language & Domain Knowledge",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
            {
                "title": "Data Engineer – Healthcare Analytics Pipeline (Spark / dbt / Airflow)",
                "location": "Kumaripati, Lalitpur",
                "location_type": LocationType.onsite,
                "salary_min": 120000,
                "salary_max": 185000,
                "currency": "NPR",
                "overview": (
                    "NovaMind's data platform ingests health records, lab results, and epidemiological "
                    "datasets from over 200 health facilities across Nepal. We are hiring a Data Engineer "
                    "to build and maintain the pipelines that make this data clean, reliable, and accessible "
                    "for our ML and analytics teams. You will own the data warehouse architecture, orchestrate "
                    "ETL workflows, and ensure data quality standards that meet clinical-grade accuracy requirements."
                ),
                "responsibilities": [
                    "Design and maintain batch and streaming ETL pipelines using Apache Spark and Apache Airflow",
                    "Build and manage dbt transformation models on top of our Snowflake data warehouse",
                    "Own data quality: implement Great Expectations checks, anomaly detection, and SLA monitoring",
                    "Ingest data from diverse sources: FHIR APIs, CSV exports from DHIS2, PostgreSQL operational DBs",
                    "Collaborate with ML engineers to build feature stores and training dataset pipelines",
                    "Document data lineage, schema changes, and transformation logic in our data catalog (DataHub)",
                    "Optimize pipeline costs and run times; reduce Snowflake compute spend without compromising freshness",
                ],
                "requirements": [
                    "3+ years of data engineering experience in a production environment",
                    "Strong Python skills for pipeline development; comfort with SQL at an advanced level",
                    "Hands-on experience with Apache Airflow for workflow orchestration",
                    "Proficiency with dbt (data build tool) — models, tests, macros, and documentation",
                    "Experience with a modern cloud data warehouse: Snowflake, BigQuery, or Redshift",
                    "Solid understanding of data modelling patterns: star schema, slowly changing dimensions",
                    "Familiarity with Docker and containerized deployment of data services",
                ],
                "preferred_qualifications": [
                    "Experience with healthcare data standards (HL7 FHIR, ICD-10 coding)",
                    "Knowledge of streaming platforms: Kafka or Kinesis",
                    "Experience with Apache Spark on AWS EMR or Databricks",
                    "Understanding of HIPAA-equivalent data privacy requirements",
                ],
                "benefits": [
                    "Monthly gross salary: NPR 1,20,000 – 1,85,000",
                    "Annual performance bonus",
                    "Dashain and Tihar festival bonuses",
                    "Health insurance (self + spouse + children)",
                    "NPR 20,000 annual training budget",
                    "Subsidized lunch at the Kumaripati office",
                    "Team off-site trips (one per quarter within Nepal)",
                ],
                "shortlist_threshold": 60,
                "evaluation_criteria": [
                    {
                        "key": "data_engineering",
                        "label": "Data Engineering Skills (Spark/Airflow/dbt)",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "sql_mastery",
                        "label": "SQL & Data Modelling",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "healthcare_data",
                        "label": "Healthcare Data Knowledge",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "data_quality",
                        "label": "Data Quality & Testing",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "collaboration",
                        "label": "Cross-team Collaboration",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
            {
                "title": "Full Stack Engineer – AI Product Platform (FastAPI + React)",
                "location": "Kumaripati, Lalitpur / Remote Nepal",
                "location_type": LocationType.hybrid,
                "salary_min": 110000,
                "salary_max": 175000,
                "currency": "NPR",
                "overview": (
                    "We are building a SaaS platform that allows healthcare organizations and agritech "
                    "startups to deploy NovaMind's AI models via a no-code interface. Think: drag-and-drop "
                    "pipeline builder, model performance dashboards, and automated alert systems. "
                    "You will be a core engineer on this product, owning both the FastAPI backend and the "
                    "React frontend. This is a greenfield product — expect to make real architectural "
                    "decisions, not just execute tickets."
                ),
                "responsibilities": [
                    "Build and maintain the FastAPI backend: REST APIs, WebSocket connections for live model inference, background tasks",
                    "Develop the React (TypeScript) frontend: dashboard views, drag-and-drop pipeline builder, real-time charts",
                    "Design and manage the PostgreSQL schema; write and review Alembic migrations",
                    "Integrate model inference endpoints (our internal model serving layer built on vLLM and Triton)",
                    "Implement multi-tenant RBAC: organisation-level isolation, role-based access for admins and analysts",
                    "Write comprehensive test suites: pytest for backend, Vitest + React Testing Library for frontend",
                    "Contribute to CI/CD setup and deployment automation on AWS ECS",
                ],
                "requirements": [
                    "3+ years of full-stack development experience",
                    "Solid FastAPI and Python skills; comfortable with async/await patterns",
                    "Strong React (TypeScript) skills, including hooks, context, and modern state management",
                    "PostgreSQL proficiency: schema design, query writing, and understanding of indexes",
                    "Experience with SQLAlchemy ORM and Alembic",
                    "Familiarity with Docker and containerized local development workflows",
                    "Good sense of product design and UX — you care about what you ship, not just that it ships",
                ],
                "preferred_qualifications": [
                    "Experience with WebSockets or Server-Sent Events for real-time features",
                    "Prior work on SaaS B2B products",
                    "Knowledge of Tailwind CSS and shadcn/ui",
                    "Exposure to ML concepts: inference pipelines, model versioning, A/B testing",
                ],
                "benefits": [
                    "Monthly gross salary: NPR 1,10,000 – 1,75,000",
                    "Early employee ESOPs",
                    "Dashain and Tihar festival bonuses",
                    "MacBook Pro and standing desk setup (office or home)",
                    "Health insurance for self and dependants",
                    "NPR 15,000 learning budget per year",
                    "Hybrid flexibility: 2–3 days in Kumaripati office, rest remote",
                ],
                "shortlist_threshold": 60,
                "evaluation_criteria": [
                    {
                        "key": "fullstack_skills",
                        "label": "Full Stack Engineering (FastAPI + React)",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "system_design",
                        "label": "System Design & Architecture",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "product_sense",
                        "label": "Product Sense & UX Awareness",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "testing_quality",
                        "label": "Testing & Code Quality",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "ai_ml_exposure",
                        "label": "AI/ML Integration Experience",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                ],
            },
            {
                "title": "Computer Vision Engineer – Agricultural Pest Detection (Edge AI)",
                "location": "Kumaripati, Lalitpur",
                "location_type": LocationType.onsite,
                "salary_min": 140000,
                "salary_max": 220000,
                "currency": "NPR",
                "overview": (
                    "NovaMind's agritech division is deploying AI-powered pest and disease detection "
                    "systems to farming cooperatives across Nepal's Terai region. We are looking for a "
                    "Computer Vision Engineer who can train, optimize, and deploy object detection and "
                    "classification models on edge devices (Raspberry Pi, Jetson Nano). This role combines "
                    "cutting-edge CV research with real-world deployment challenges — intermittent connectivity, "
                    "varying lighting conditions, and diverse crop species. Your work will directly help "
                    "Nepali farmers protect their livelihoods."
                ),
                "responsibilities": [
                    "Train and fine-tune object detection models (YOLOv8, YOLOv9, Detectron2) for crop pest identification",
                    "Collect, annotate, and curate image datasets from field deployments in Chitwan, Jhapa, and Rupandehi districts",
                    "Optimize models for edge deployment: quantization (INT8/FP16), TensorRT, and ONNX Runtime on Jetson Nano",
                    "Build inference pipelines that run offline with periodic sync when connectivity is available",
                    "Develop a mobile companion app (Flutter or React Native) for field agents to capture and classify images",
                    "Run A/B tests and accuracy benchmarks across different crop types and environmental conditions",
                    "Collaborate with agronomists to map model predictions to actionable pest management recommendations",
                ],
                "requirements": [
                    "3+ years of hands-on computer vision engineering experience",
                    "Strong proficiency in Python, PyTorch, and OpenCV",
                    "Experience training YOLO-family or similar real-time detection models",
                    "Knowledge of model optimization: quantization, pruning, knowledge distillation",
                    "Hands-on experience deploying models on edge devices (Raspberry Pi, NVIDIA Jetson, or similar)",
                    "Familiarity with image annotation tools (CVAT, Roboflow, Label Studio)",
                    "Understanding of data augmentation techniques for small and imbalanced datasets",
                ],
                "preferred_qualifications": [
                    "Experience in agriculture technology or environmental monitoring",
                    "Familiarity with satellite imagery analysis (Sentinel-2, Planet Labs)",
                    "Published work or competition wins in computer vision (Kaggle, CVPR workshops)",
                    "Knowledge of Nepal's agricultural landscape and major crop diseases",
                ],
                "benefits": [
                    "Monthly gross salary: NPR 1,40,000 – 2,20,000",
                    "ESOPs for early team members",
                    "Field trip allowances for data collection visits to Terai districts",
                    "NVIDIA Jetson hardware kit for personal R&D",
                    "Conference sponsorship (CVPR, ICCV, or ECCV once per year)",
                    "Dashain and Tihar bonuses",
                    "Health insurance (self + family)",
                    "Flexible hours with core time 10am–2pm",
                ],
                "shortlist_threshold": 65,
                "evaluation_criteria": [
                    {
                        "key": "cv_expertise",
                        "label": "Computer Vision & Object Detection",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "edge_deployment",
                        "label": "Edge AI & Model Optimization",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "data_pipeline",
                        "label": "Data Collection & Pipeline Design",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "domain_knowledge",
                        "label": "Agriculture / Domain Knowledge",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "problem_solving",
                        "label": "Problem Solving & Creativity",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
        ],
    },
]


# ============================================================================
# CANDIDATE DATA (5 candidates, each with 2 resume variants)
# ============================================================================

CANDIDATES = [
    {
        "full_name": "Aashish Basnet",
        "email": "aashish.basnet@gmail.com",
        "years_of_experience": 7,
        "headline": "Senior Backend Engineer | Python & FastAPI | Ex-F1Soft | 7 Years in Fintech",
        "summary": (
            "Backend engineer with 7 years of experience building high-throughput financial systems "
            "in Nepal's fintech sector. At F1Soft International, I worked on the eSewa payment processing "
            "engine handling millions of daily transactions. I specialise in Python/FastAPI microservices, "
            "PostgreSQL performance tuning, and distributed systems design. I have led teams of up to 5 "
            "engineers and have a strong track record of shipping reliable, well-tested code. "
            "Currently seeking a senior IC or tech lead role at a company solving meaningful problems "
            "at scale."
        ),
        "phone": "+977-9841-234567",
        "location": "Koteshwor, Kathmandu",
        "linkedin_url": "https://linkedin.com/in/aashishbasnet",
        "github_url": "https://github.com/aashishbasnet",
        "portfolio_url": None,
        "target_roles": [
            "Senior Backend Engineer",
            "Tech Lead – Backend",
            "Software Architect",
        ],
        "is_open_to_work": True,
        "skills": [
            "Python",
            "FastAPI",
            "SQLAlchemy",
            "PostgreSQL",
            "Redis",
            "AWS (EC2, RDS, SQS, Lambda)",
            "Docker",
            "Kubernetes",
            "RabbitMQ",
            "Alembic",
            "Pytest",
            "Git",
            "Linux",
            "System Design",
            "Microservices Architecture",
        ],
        "experiences": [
            {
                "company_name": "F1Soft International Pvt. Ltd.",
                "title": "Senior Software Engineer – Core Payments",
                "start_date": date(2020, 8, 1),
                "end_date": None,
                "description": [
                    "Owned the core eSewa transaction processing service (Python/Django), handling peak loads of 8,000+ TPS during festival seasons",
                    "Led a performance optimisation initiative that reduced P99 payment latency from 900ms to 180ms through query tuning and Redis caching",
                    "Introduced idempotency keys and distributed locking patterns to eliminate duplicate transaction issues, reducing customer complaints by 60%",
                    "Designed and shipped an NRB reporting module that automated daily regulatory reports previously done manually",
                    "Mentored 3 junior engineers; conducted weekly architecture design sessions for the team",
                ],
            },
            {
                "company_name": "YoungInnovations Pvt. Ltd.",
                "title": "Software Engineer",
                "start_date": date(2018, 2, 1),
                "end_date": date(2020, 7, 31),
                "description": [
                    "Built REST APIs and data pipelines for Nepal's Open Government Data portal (data.nepalims.gov.np)",
                    "Developed a fiscal data visualisation tool used by the Ministry of Finance for budget transparency reporting",
                    "Migrated legacy PHP services to Python/Flask with a 40% reduction in server costs",
                    "Participated in Agile sprints with USAID and World Bank funded project teams",
                ],
            },
            {
                "company_name": "Deerwalk Services Pvt. Ltd.",
                "title": "Junior Software Developer",
                "start_date": date(2016, 10, 1),
                "end_date": date(2018, 1, 31),
                "description": [
                    "Developed features on a US healthcare claims processing platform (Java/Spring Boot backend)",
                    "Wrote SQL stored procedures for a healthcare analytics data warehouse",
                    "Fixed production bugs in a high-criticality claims adjudication engine",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Pulchowk Campus, Institute of Engineering (IOE), TU",
                "degree": "Bachelor of Engineering",
                "field_of_study": "Computer Engineering",
                "start_date": date(2012, 11, 1),
                "end_date": date(2016, 11, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Fintech Backend – Senior IC Profile",
                "headline": "Senior Backend Engineer | Python & FastAPI | 7 Years in Fintech",
                "summary": (
                    "Result-driven backend engineer with 7 years building critical payment infrastructure. "
                    "Deep expertise in Python/FastAPI, PostgreSQL tuning, and distributed systems. "
                    "Looking to join a fintech or payment company as a senior individual contributor."
                ),
            },
            {
                "resume_name": "Tech Lead Application Profile",
                "headline": "Tech Lead – Backend Engineering | Python | Team Leadership | Fintech",
                "summary": (
                    "Engineering lead with 7 years of backend experience and 3 years of team leadership. "
                    "Successfully mentored junior engineers, owned architectural decisions, and delivered "
                    "high-stakes financial systems. Seeking a Tech Lead or Engineering Manager role."
                ),
            },
        ],
    },
    {
        "full_name": "Dipika Shrestha",
        "email": "dipika.shrestha@gmail.com",
        "years_of_experience": 5,
        "headline": "ML Engineer | NLP & Computer Vision | Ex-Fusemachines | KU Graduate",
        "summary": (
            "Machine learning engineer with 5 years of experience in NLP and computer vision, "
            "primarily working on healthcare and agriculture AI applications in Nepal. At Fusemachines, "
            "I contributed to AI Fellowship curriculum and worked on production NLP pipelines for "
            "US healthcare clients. I am passionate about Nepali language AI and have open-source "
            "contributions to Nepali NLP tooling. I hold an M.Sc. in Artificial Intelligence from "
            "Kathmandu University and am actively looking for opportunities to work on impactful ML "
            "products."
        ),
        "phone": "+977-9801-345678",
        "location": "Ekantakuna, Lalitpur",
        "linkedin_url": "https://linkedin.com/in/dipikashrestha",
        "github_url": "https://github.com/dipika-shrestha",
        "portfolio_url": "https://dipikashrestha.dev",
        "target_roles": [
            "Machine Learning Engineer",
            "NLP Engineer",
            "AI Research Engineer",
        ],
        "is_open_to_work": True,
        "skills": [
            "Python",
            "PyTorch",
            "TensorFlow",
            "Hugging Face Transformers",
            "scikit-learn",
            "spaCy",
            "NLTK",
            "LangChain",
            "LoRA / PEFT Fine-tuning",
            "MLflow",
            "Weights & Biases",
            "FastAPI",
            "Docker",
            "PostgreSQL",
            "Nepali NLP",
            "Computer Vision (OpenCV, YOLO)",
            "SQL",
        ],
        "experiences": [
            {
                "company_name": "Fusemachines Nepal Pvt. Ltd.",
                "title": "Machine Learning Engineer",
                "start_date": date(2021, 6, 1),
                "end_date": None,
                "description": [
                    "Fine-tuned BERT and RoBERTa models for clinical NER on US healthcare datasets — achieving 91% F1 on discharge summary extraction tasks",
                    "Built a Nepali-language text classification pipeline for social media content moderation; curated a 50k-sentence annotated dataset",
                    "Developed a crop disease detection model using YOLOv8, deployed on Raspberry Pi 4 for offline inference at agriculture extension offices",
                    "Led the NLP track of the 2023 AI Fellowship cohort, training 40+ fellows across Nepal and Rwanda",
                    "Optimised inference using ONNX export and quantisation, reducing model size by 60% for edge deployment",
                ],
            },
            {
                "company_name": "Kathmandu University – AI Lab",
                "title": "Research Assistant (Part-time)",
                "start_date": date(2020, 1, 1),
                "end_date": date(2021, 5, 31),
                "description": [
                    "Assisted in research on low-resource language modelling for Nepali, Maithili, and Newari",
                    "Collected and cleaned a 10M-token Nepali web corpus for pre-training experiments",
                    "Co-authored a paper on transfer learning for low-resource Nepali NLP (presented at LREC 2021)",
                ],
            },
            {
                "company_name": "CloudFactory Nepal",
                "title": "AI Data Analyst (Internship → Contract)",
                "start_date": date(2019, 1, 1),
                "end_date": date(2019, 12, 31),
                "description": [
                    "Annotated and quality-reviewed training data for computer vision and NLP models for US/EU clients",
                    "Created annotation guidelines and trained a team of 12 junior analysts",
                    "Developed internal Python scripts to automate data quality checks, reducing QA time by 35%",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Kathmandu University (KU), Dhulikhel",
                "degree": "Master of Science",
                "field_of_study": "Artificial Intelligence",
                "start_date": date(2019, 9, 1),
                "end_date": date(2021, 9, 1),
            },
            {
                "institution": "Kathmandu University (KU), Dhulikhel",
                "degree": "Bachelor of Engineering",
                "field_of_study": "Computer Science",
                "start_date": date(2015, 9, 1),
                "end_date": date(2019, 9, 1),
            },
        ],
        "resume_variants": [
            {
                "resume_name": "NLP & LLM Engineer Profile",
                "headline": "ML Engineer – NLP & LLMs | Hugging Face | Fine-tuning | Nepali AI",
                "summary": (
                    "ML engineer specialising in NLP and large language models with 5 years of "
                    "production experience. Strong background in fine-tuning transformers, building "
                    "multilingual pipelines, and deploying models at scale."
                ),
            },
            {
                "resume_name": "AI Research & Computer Vision Profile",
                "headline": "AI Research Engineer | Computer Vision & NLP | M.Sc. AI – KU",
                "summary": (
                    "Research-oriented ML engineer with publications in low-resource NLP and practical "
                    "experience building CV and NLP systems for healthcare and agritech in Nepal. "
                    "Comfortable moving between research prototyping and production deployment."
                ),
            },
        ],
    },
    {
        "full_name": "Suraj Pandey",
        "email": "suraj.pandey@gmail.com",
        "years_of_experience": 4,
        "headline": "Data Engineer | dbt & Airflow | Ex-Cotiviti Nepal | Healthcare Analytics",
        "summary": (
            "Data engineer with 4 years of experience building large-scale data pipelines in "
            "healthcare analytics at Cotiviti Nepal. I design and maintain ETL workflows, data "
            "warehouse models, and data quality frameworks that process clinical records for "
            "US health insurance clients. I work primarily with Apache Airflow, dbt, Spark, "
            "and Snowflake. I take pride in clean, well-documented pipelines and care deeply "
            "about data accuracy in high-stakes domains. Looking for a senior data engineering "
            "role where I can grow toward data architecture."
        ),
        "phone": "+977-9851-456789",
        "location": "Imadol, Lalitpur",
        "linkedin_url": "https://linkedin.com/in/surajpandey-data",
        "github_url": "https://github.com/suraj-pandey",
        "portfolio_url": None,
        "target_roles": [
            "Senior Data Engineer",
            "Data Platform Engineer",
            "Analytics Engineer",
        ],
        "is_open_to_work": True,
        "skills": [
            "Python",
            "SQL",
            "Apache Airflow",
            "Apache Spark",
            "dbt",
            "Snowflake",
            "PostgreSQL",
            "AWS (S3, EMR, Glue, Redshift)",
            "Great Expectations",
            "Docker",
            "Pandas",
            "PySpark",
            "DataHub",
            "Git",
            "Linux",
            "FHIR / Healthcare Data Standards",
        ],
        "experiences": [
            {
                "company_name": "Cotiviti Nepal Pvt. Ltd.",
                "title": "Data Engineer II",
                "start_date": date(2022, 3, 1),
                "end_date": None,
                "description": [
                    "Own 25+ Airflow DAGs that ingest, transform, and load clinical claims data for 3 US health plan clients, processing ~2M records daily",
                    "Migrated 15 legacy SQL stored procedures to dbt models, improving test coverage from 0% to 85%",
                    "Implemented Great Expectations data quality suite across the ingestion layer",
                    "Built a FHIR R4 data ingestion adapter that parses HL7 FHIR bundles from EHR APIs",
                    "Collaborated with the US-based data architecture team on schema design",
                ],
            },
            {
                "company_name": "Cotiviti Nepal Pvt. Ltd.",
                "title": "Data Engineer I",
                "start_date": date(2020, 9, 1),
                "end_date": date(2022, 2, 28),
                "description": [
                    "Built and maintained ETL pipelines using Python and Airflow for healthcare payment integrity analytics",
                    "Wrote complex analytical SQL queries for fraud, waste, and abuse detection models",
                    "Onboarded new data sources: pharmacy claims, lab results, and provider credentialling feeds",
                ],
            },
            {
                "company_name": "Leapfrog Technology Inc.",
                "title": "Software Engineer (Data Focus)",
                "start_date": date(2019, 7, 1),
                "end_date": date(2020, 8, 31),
                "description": [
                    "Developed backend data APIs and reporting modules for a US-based healthtech SaaS client",
                    "Built automated report generation system using Python/Pandas",
                    "Wrote database migration scripts and managed schema changes for PostgreSQL production database",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Tribhuvan University – Pulchowk Campus (IOE)",
                "degree": "Bachelor of Engineering",
                "field_of_study": "Electronics and Computer Engineering",
                "start_date": date(2015, 11, 1),
                "end_date": date(2019, 11, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Senior Data Engineer Application",
                "headline": "Senior Data Engineer | Airflow · dbt · Snowflake | Healthcare Analytics",
                "summary": (
                    "Data engineer with 4 years building production ETL pipelines for healthcare analytics. "
                    "Deep expertise in Airflow, dbt, and Snowflake. Strong data quality and documentation culture."
                ),
            },
            {
                "resume_name": "Analytics Engineering / Data Platform Profile",
                "headline": "Analytics Engineer | dbt · SQL · Python | Data Platform Design",
                "summary": (
                    "Analytics engineer bridging data engineering and BI, with strong dbt skills and "
                    "4 years of hands-on Snowflake experience. Interested in analytics engineering and "
                    "data platform roles."
                ),
            },
        ],
    },
    {
        "full_name": "Nisha Tamang",
        "email": "nisha.tamang@gmail.com",
        "years_of_experience": 3,
        "headline": "Full Stack Engineer | React + FastAPI | Ex-Braindigit | IOE Pulchowk",
        "summary": (
            "Full stack engineer with 3 years of experience building product-led web applications "
            "at Braindigit IT Solutions. I work across the stack — React (TypeScript) on the frontend "
            "and FastAPI/Python on the backend — and have shipped two SaaS products from zero to "
            "production. I pay close attention to UX and performance, not just correctness. "
            "I'm a quick learner who thrives in small, autonomous teams."
        ),
        "phone": "+977-9808-567890",
        "location": "Baneshwor, Kathmandu",
        "linkedin_url": "https://linkedin.com/in/nishatamang-dev",
        "github_url": "https://github.com/nisha-tamang",
        "portfolio_url": "https://nishatamang.com.np",
        "target_roles": [
            "Full Stack Engineer",
            "Frontend Engineer",
            "Product Engineer",
        ],
        "is_open_to_work": True,
        "skills": [
            "TypeScript",
            "React",
            "Next.js",
            "React Native",
            "TanStack Query",
            "Zustand",
            "Tailwind CSS",
            "Python",
            "FastAPI",
            "SQLAlchemy",
            "PostgreSQL",
            "REST APIs",
            "Docker",
            "Git",
            "Figma",
            "Vitest",
            "Pytest",
            "AWS (S3, EC2 basics)",
        ],
        "experiences": [
            {
                "company_name": "Braindigit IT Solutions Pvt. Ltd.",
                "title": "Software Engineer",
                "start_date": date(2022, 1, 1),
                "end_date": None,
                "description": [
                    "Core engineer on 'SanoBazar', a B2B e-commerce platform for FMCG distribution in Nepal — Next.js 14 and FastAPI; serves 200+ merchant accounts",
                    "Designed and built the real-time order tracking module using WebSockets and PostgreSQL triggers",
                    "Developed a React Native companion app for field sales agents, enabling offline order entry with background sync",
                    "Built a multi-tenant RBAC system supporting distributor admin, sales rep, and merchant roles",
                    "Improved Lighthouse performance score from 54 to 91",
                ],
            },
            {
                "company_name": "Braindigit IT Solutions Pvt. Ltd.",
                "title": "Junior Software Engineer",
                "start_date": date(2021, 3, 1),
                "end_date": date(2021, 12, 31),
                "description": [
                    "Built UI components for a real estate listing portal using React and REST APIs",
                    "Wrote FastAPI endpoint handlers for a property search feature",
                    "Participated in daily standups and biweekly code reviews with senior engineers",
                ],
            },
            {
                "company_name": "Softwarica College of IT & E-Commerce",
                "title": "Teaching Assistant (Part-time)",
                "start_date": date(2020, 7, 1),
                "end_date": date(2021, 2, 28),
                "description": [
                    "Assisted in delivering Python and Web Development lab sessions to BSc CSIT students",
                    "Evaluated student assignments and provided feedback on code quality and design",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Tribhuvan University – Pulchowk Campus (IOE)",
                "degree": "Bachelor of Engineering",
                "field_of_study": "Computer Engineering",
                "start_date": date(2016, 11, 1),
                "end_date": date(2021, 7, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Full Stack Product Engineer",
                "headline": "Full Stack Engineer | React · FastAPI · TypeScript | Product-focused",
                "summary": (
                    "Full stack engineer with 3 years of end-to-end product development experience. "
                    "Equally comfortable with React/Next.js on the frontend and FastAPI on the backend. "
                    "Shipped two production SaaS products and care deeply about user experience."
                ),
            },
            {
                "resume_name": "Frontend / React Engineer Profile",
                "headline": "Frontend Engineer | React · Next.js · React Native | TypeScript",
                "summary": (
                    "Frontend engineer with strong TypeScript and React skills, including React Native "
                    "for mobile. 3 years of experience building performant, accessible web and mobile "
                    "applications. Looking for a product company with a strong design culture."
                ),
            },
        ],
    },
    {
        "full_name": "Rajan Adhikari",
        "email": "rajan.adhikari@gmail.com",
        "years_of_experience": 2,
        "headline": "Junior DevOps Engineer | AWS & Docker | CSIT Graduate | Eager Learner",
        "summary": (
            "Junior DevOps and cloud engineer with 2 years of experience at Logpoint Nepal, "
            "working on CI/CD pipelines, container orchestration, and AWS infrastructure. "
            "I am a CSIT graduate from Tribhuvan University with a strong interest in "
            "infrastructure automation, Kubernetes, and site reliability engineering. "
            "While I am still early in my career, I have hands-on experience with Terraform, "
            "Docker, GitHub Actions, and basic Kubernetes cluster management. I am looking "
            "for a role where I can grow into a mid-level DevOps or SRE engineer under "
            "good mentorship."
        ),
        "phone": "+977-9860-678901",
        "location": "Balkhu, Kathmandu",
        "linkedin_url": "https://linkedin.com/in/rajanadhikari-devops",
        "github_url": "https://github.com/rajan-adhikari",
        "portfolio_url": None,
        "target_roles": [
            "DevOps Engineer",
            "Cloud Engineer",
            "Site Reliability Engineer",
        ],
        "is_open_to_work": False,
        "skills": [
            "AWS (EC2, S3, RDS, IAM)",
            "Docker",
            "Docker Compose",
            "Kubernetes (basics)",
            "Terraform",
            "GitHub Actions",
            "Linux (Ubuntu/CentOS)",
            "Bash Scripting",
            "Python (scripting)",
            "Nginx",
            "Prometheus",
            "Grafana",
            "Git",
        ],
        "experiences": [
            {
                "company_name": "Logpoint Nepal Pvt. Ltd.",
                "title": "Junior DevOps Engineer",
                "start_date": date(2024, 1, 1),
                "end_date": None,
                "description": [
                    "Manage CI/CD pipelines using GitHub Actions for 3 product teams, reducing deployment time from 45min to 12min",
                    "Maintain Docker Compose-based development environments and production Docker deployments",
                    "Wrote Terraform modules for provisioning AWS EC2 instances, RDS databases, and S3 buckets",
                    "Set up basic Prometheus + Grafana monitoring for staging environments",
                    "Assist senior SRE team with incident response and root cause analysis documentation",
                ],
            },
            {
                "company_name": "Logpoint Nepal Pvt. Ltd.",
                "title": "IT Support Intern → DevOps Trainee",
                "start_date": date(2023, 3, 1),
                "end_date": date(2023, 12, 31),
                "description": [
                    "Started as IT support intern; transitioned to DevOps trainee after demonstrating Linux and scripting skills",
                    "Automated routine server maintenance tasks using Bash and Python scripts",
                    "Deployed internal tools using Docker Compose on company servers",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Tribhuvan University – Patan Multiple Campus",
                "degree": "Bachelor of Science",
                "field_of_study": "Computer Science and Information Technology (CSIT)",
                "start_date": date(2019, 7, 1),
                "end_date": date(2023, 7, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "DevOps & Cloud Engineer Resume",
                "headline": "Junior DevOps Engineer | AWS · Docker · Terraform | 2 Years Experience",
                "summary": (
                    "Early-career DevOps engineer with 2 years of hands-on experience in CI/CD, "
                    "Docker, AWS, and Terraform. Strong Linux fundamentals and scripting skills. "
                    "Looking for a role with growth opportunities and senior mentorship."
                ),
            },
            {
                "resume_name": "Cloud Infrastructure & SRE Profile",
                "headline": "Cloud Engineer | AWS · Kubernetes · Monitoring | Aspiring SRE",
                "summary": (
                    "Cloud-focused engineer with practical experience in AWS infrastructure management, "
                    "container orchestration, and monitoring setup. CSIT graduate passionate about "
                    "infrastructure reliability and automation."
                ),
            },
        ],
    },
]


# ============================================================================
# APPLICATION MATRIX — who applies where, with what resume, score, and outcome
# ============================================================================
# Format: (candidate_idx, company_idx, job_idx, resume_variant_idx,
#           score, feedback, status, share_overrides)
#
# candidate_idx: 0=Aashish, 1=Dipika, 2=Suraj, 3=Nisha, 4=Rajan
# company_idx: 0=Pinnacle, 1=NovaMind
# job_idx: per-company index (0-3)
# resume_variant_idx: 0 or 1

APPLICATIONS = [
    # --- Pinnacle Tech Jobs ---
    # Job 0: Senior Backend Engineer (Python/FastAPI)
    (
        0,
        0,
        0,
        0,
        92,
        "Excellent match. 7 years backend experience with deep FastAPI and PostgreSQL expertise at F1Soft — directly relevant to payment systems. Strong distributed systems knowledge (idempotency, saga patterns). Has led teams and mentored engineers. Education from Pulchowk Campus. Near-perfect fit for this role.",
        ApplicationStatus.interview_booked,
        {},
    ),
    (
        3,
        0,
        0,
        0,
        58,
        "Moderate match. 3 years full-stack experience with some FastAPI backend work, but lacks the depth needed for a senior payment systems role. No fintech domain experience. PostgreSQL skills are present but not at the advanced query optimization level required. Could be a stretch candidate.",
        ApplicationStatus.rejected,
        {},
    ),
    (
        2,
        0,
        0,
        0,
        42,
        "Weak match. Suraj is a data engineer, not a backend application engineer. While he has Python and SQL skills, his experience is in ETL/data pipelines rather than building transactional microservices. No FastAPI, distributed systems, or fintech application experience.",
        ApplicationStatus.rejected,
        {"share_phone": False, "share_links": False},
    ),
    # Job 1: Lead Frontend Engineer (React Native / Next.js)
    (
        3,
        0,
        1,
        1,
        78,
        "Strong match. Nisha has 3 years of full-stack experience with significant React, Next.js, and React Native work. Built a real-time mobile app and improved Lighthouse scores significantly. Lacks the 6+ years required and team leadership experience for a 'Lead' title, but technical skills are solid and she could grow into the role quickly.",
        ApplicationStatus.interview_booked,
        {"share_avatar": False},
    ),
    (
        0,
        0,
        1,
        1,
        35,
        "Weak match. Aashish is primarily a backend engineer. While he has strong Python skills, he has no demonstrated frontend, React, or React Native experience. This is a frontend-focused leadership role that does not align with his expertise.",
        ApplicationStatus.rejected,
        {},
    ),
    # Job 2: DevOps & Cloud Infrastructure Engineer (AWS / Kubernetes)
    (
        4,
        0,
        2,
        0,
        55,
        "Partial match. Rajan has 2 years of DevOps experience with Docker, basic Terraform, and AWS fundamentals. However, the role requires 4+ years and deep Kubernetes expertise, multi-region AWS management, and experience with financial compliance (PCI-DSS). He is too junior for the seniority level required but shows potential for a more junior DevOps role.",
        ApplicationStatus.rejected,
        {"share_phone": False, "share_location": False},
    ),
    (
        0,
        0,
        2,
        0,
        48,
        "Partial match. While Aashish lists Docker, Kubernetes, and AWS as skills, his primary career trajectory is backend engineering. He has not held a dedicated DevOps or infrastructure role. His experience is more as a consumer of infrastructure rather than a builder/maintainer of it.",
        ApplicationStatus.rejected,
        {},
    ),
    # Job 3: QA Automation Engineer
    (
        4,
        0,
        3,
        1,
        38,
        "Weak match. Rajan is a DevOps engineer with CI/CD experience but has no dedicated QA automation background. He understands testing at a pipeline level but has not built test suites, used Playwright/Selenium, or worked on structured QA processes. Missing core QA skills.",
        ApplicationStatus.rejected,
        {"share_email": False, "share_headline_summary": False},
    ),
    (
        3,
        0,
        3,
        0,
        45,
        "Partial match. Nisha has Pytest and Vitest experience from her full-stack work, but her testing is developer-level, not QA-specialist level. No Playwright or Postman automation experience. She could pivot to QA but would need ramp-up time.",
        ApplicationStatus.rejected,
        {},
    ),
    # --- NovaMind AI Jobs ---
    # Job 0: ML Engineer – NLP & LLM Fine-tuning
    (
        1,
        1,
        0,
        0,
        95,
        "Outstanding match. Dipika has 5 years of ML engineering experience with deep NLP expertise — fine-tuned BERT/RoBERTa, built Nepali-language pipelines, and has hands-on LLM experience. M.Sc. in AI from KU with a publication in low-resource NLP. She has deployed models on edge devices and used MLflow. Also has Nepali language skills. Almost tailor-made for this role.",
        ApplicationStatus.interview_booked,
        {},
    ),
    (
        0,
        1,
        0,
        1,
        28,
        "Poor match. Aashish is a backend engineer with no ML, NLP, or LLM experience. While he has strong Python skills, the role requires deep knowledge of transformers, fine-tuning, and ML engineering practices that are entirely outside his background.",
        ApplicationStatus.rejected,
        {"share_phone": False},
    ),
    (
        2,
        1,
        0,
        1,
        32,
        "Poor match. Suraj is a data engineer with pipeline experience but no ML model training, NLP, or LLM expertise. His data skills are relevant to data preprocessing but not to the core model engineering work required.",
        ApplicationStatus.rejected,
        {},
    ),
    # Job 1: Data Engineer – Healthcare Analytics Pipeline
    (
        2,
        1,
        1,
        0,
        90,
        "Excellent match. Suraj has 4 years of data engineering experience at Cotiviti Nepal with direct healthcare analytics pipeline experience. Deep expertise in Airflow, dbt, and Snowflake. Built FHIR data ingestion adapters and implemented Great Expectations. Healthcare data standards knowledge (FHIR, HL7) is a standout. Ideal candidate.",
        ApplicationStatus.interview_booked,
        {},
    ),
    (
        1,
        1,
        1,
        1,
        40,
        "Weak match. Dipika is an ML engineer, not a data engineer. She has some data pipeline experience from building training datasets, but lacks Airflow, dbt, Snowflake, or formal data engineering skills. The overlap is limited to Python and general data handling.",
        ApplicationStatus.rejected,
        {"share_avatar": False, "share_links": False},
    ),
    (
        4,
        1,
        1,
        0,
        25,
        "Poor match. Rajan is a junior DevOps engineer with no data engineering experience. He has basic Python scripting skills but no knowledge of Airflow, dbt, Spark, Snowflake, or healthcare data standards. Not a viable candidate for this role.",
        ApplicationStatus.rejected,
        {"share_profile_all": False},
    ),
    # Job 2: Full Stack Engineer – AI Product Platform
    (
        3,
        1,
        2,
        0,
        85,
        "Strong match. Nisha has 3 years of direct full-stack experience with FastAPI and React (TypeScript). She built a multi-tenant RBAC system, which is directly relevant. Her SaaS product experience at Braindigit is a great fit for this greenfield SaaS platform. She has WebSocket experience and knows Docker. Missing only ML integration experience, which is a 'preferred' qualification.",
        ApplicationStatus.interview_booked,
        {},
    ),
    (
        0,
        1,
        2,
        0,
        72,
        "Good match. Aashish has strong FastAPI and Python backend skills, but his frontend experience is limited. He could handle the backend portion well but would need to ramp up on React/TypeScript. His 7 years of backend experience and system design skills are valuable, but this is a full-stack role requiring equal frontend proficiency.",
        ApplicationStatus.interview_booked,
        {},
    ),
    (
        4,
        1,
        2,
        1,
        30,
        "Poor match. Rajan's experience is in DevOps and infrastructure, not application development. He has basic Python scripting skills but no FastAPI, React, or full-stack product development experience. Does not meet the core requirements.",
        ApplicationStatus.rejected,
        {"share_phone": False, "share_headline_summary": False},
    ),
    # Job 3: Computer Vision Engineer – Agricultural Pest Detection
    (
        1,
        1,
        3,
        1,
        88,
        "Excellent match. Dipika has direct computer vision experience — built a crop disease detection model with YOLOv8 and deployed it on Raspberry Pi for agricultural use. She has edge deployment experience with ONNX quantization. Her work at Fusemachines on agriculture AI and at KU's AI lab is directly relevant. One of the strongest candidates we could find for this niche role in Nepal.",
        ApplicationStatus.interview_booked,
        {},
    ),
    (
        2,
        1,
        3,
        1,
        22,
        "Very poor match. Suraj is a data engineer with no computer vision, PyTorch, or edge deployment experience. His skill set is entirely in data pipelines and SQL, with no overlap with the CV requirements of this role.",
        ApplicationStatus.rejected,
        {},
    ),
    (
        4,
        1,
        3,
        0,
        20,
        "Very poor match. Rajan is a junior DevOps engineer with no machine learning, computer vision, or Python ML library experience. The role requires deep CV expertise that is entirely outside his background.",
        ApplicationStatus.rejected,
        {"share_location": False, "share_email": False},
    ),
]


# ============================================================================
# HELPERS
# ============================================================================


def make_user(full_name: str, email: str, role: UserRole) -> User:
    return User(
        full_name=full_name,
        email=email,
        password_hash=COMMON_PW,
        primary_role=role,
        is_email_verified=True,
        is_onboarded=True,
    )


def make_membership(
    user_id, company_id, role: MembershipRole, job_title: str
) -> CompanyMembership:
    return CompanyMembership(
        user_id=user_id,
        company_id=company_id,
        role=role,
        status=MembershipStatus.active,
        job_title=job_title,
    )


def make_job(company_id, posted_by, data: dict) -> Job:
    return Job(
        company_id=company_id,
        posted_by=posted_by,
        title=data["title"],
        location=data["location"],
        location_type=data["location_type"],
        salary_min=data["salary_min"],
        salary_max=data["salary_max"],
        currency=data["currency"],
        status=JobStatus.expired,
        overview=data["overview"],
        responsibilities=data["responsibilities"],
        requirements=data["requirements"],
        preferred_qualifications=data["preferred_qualifications"],
        benefits=data["benefits"],
        auto_shortlist=False,
        shortlist_threshold=data.get("shortlist_threshold", 70),
        shortlist_status=ShortlistStatus.completed,
        final_shortlist_completed=True,
        expires_at=EXPIRED_DATE,
    )


def build_resume(user, data, variant):
    """Build a Resume + children from candidate data and a variant override."""
    resume = Resume(
        user_id=user.id,
        resume_name=variant["resume_name"],
        headline=variant["headline"],
        summary=variant["summary"],
        phone=data["phone"],
        location=data["location"],
        linkedin_url=data.get("linkedin_url"),
        github_url=data.get("github_url"),
        portfolio_url=data.get("portfolio_url"),
        years_of_experience=data["years_of_experience"],
    )
    experiences = [
        ResumeExperience(
            resume_id=None,  # set after flush
            company_name=exp["company_name"],
            title=exp["title"],
            start_date=exp["start_date"],
            end_date=exp.get("end_date"),
            description=exp["description"],
        )
        for exp in data["experiences"]
    ]
    educations = [
        ResumeEducation(
            resume_id=None,
            institution=edu["institution"],
            degree=edu.get("degree"),
            field_of_study=edu.get("field_of_study"),
            start_date=edu.get("start_date"),
            end_date=edu.get("end_date"),
        )
        for edu in data["educations"]
    ]
    skills = [ResumeSkill(resume_id=None, skill_name=s) for s in data["skills"]]
    return resume, experiences, educations, skills


def generate_shortlist_email(
    candidate_name: str, job_title: str, company_name: str, cal_url: str
) -> tuple[str, str]:
    """Generate a shortlist email subject and body."""
    subject = f"Great news – You've been shortlisted for {job_title} at {company_name}!"
    body = (
        f"Dear {candidate_name},\n\n"
        f"We're pleased to let you know that after reviewing your application for the "
        f"{job_title} position at {company_name}, our team has shortlisted you for the "
        f"next stage of our hiring process.\n\n"
        f"Your profile and experience stood out among the applicants, and we would love to "
        f"learn more about you in an interview.\n\n"
        f"Please book your interview slot using the link below:\n"
        f"{cal_url}\n\n"
        f"IMPORTANT: When booking, please use the same name and email address you registered "
        f"with on ConvexHire so we can automatically match your booking to your application.\n\n"
        f"If you have any questions or need to reschedule, please don't hesitate to reach out "
        f"to us at this email address.\n\n"
        f"We look forward to speaking with you!\n\n"
        f"Warm regards,\n"
        f"The {company_name} Hiring Team"
    )
    return subject, body


def generate_rejection_email(
    candidate_name: str, job_title: str, company_name: str, feedback: str
) -> tuple[str, str]:
    """Generate a rejection email subject and body."""
    subject = f"Update on your application for {job_title} at {company_name}"
    body = (
        f"Dear {candidate_name},\n\n"
        f"Thank you for taking the time to apply for the {job_title} position at "
        f"{company_name}. We genuinely appreciate your interest in our team.\n\n"
        f"After carefully reviewing all applications, we have decided to move forward "
        f"with other candidates whose experience more closely aligns with the specific "
        f"requirements of this role.\n\n"
        f"Here is some personalised feedback from our review:\n\n"
        f"{feedback}\n\n"
        f"We encourage you to apply for future openings that match your skills and "
        f"experience. This decision does not reflect on your overall abilities — it is "
        f"simply about the specific fit for this particular role at this time.\n\n"
        f"We wish you the very best in your career and future applications.\n\n"
        f"Kind regards,\n"
        f"The {company_name} Hiring Team"
    )
    return subject, body


# ============================================================================
# SEEDING FUNCTIONS
# ============================================================================


async def seed_company(db, company_data: dict) -> tuple[list, User, list]:
    """Seed a single company: admin + recruiters + jobs. Returns (jobs, admin, recruiter_users)."""

    admin_info = company_data["admin"]
    admin = make_user(
        admin_info["full_name"], admin_info["email"], UserRole.recruiter_admin
    )
    db.add(admin)
    await db.flush()

    company = Company(
        name=company_data["name"],
        industry=company_data["industry"],
        company_size=company_data["company_size"],
        location=company_data["location"],
        website_url=company_data["website_url"],
        domain=company_data["domain"],
        cal_booking_url=company_data["cal_booking_url"],
        cal_organizer_email=company_data["cal_organizer_email"],
        description=company_data["description"],
    )
    db.add(company)
    await db.flush()

    db.add(
        make_membership(
            admin.id, company.id, MembershipRole.admin, admin_info["job_title"]
        )
    )

    recruiter_users = []
    for rec in company_data["recruiters"]:
        r = make_user(rec["full_name"], rec["email"], UserRole.recruiter)
        db.add(r)
        await db.flush()
        db.add(
            make_membership(
                r.id, company.id, MembershipRole.recruiter, rec["job_title"]
            )
        )
        recruiter_users.append(r)

    created_jobs = []
    posters = [admin] + recruiter_users
    for i, job_data in enumerate(company_data["jobs"]):
        job = make_job(company.id, posters[i % len(posters)].id, job_data)
        db.add(job)
        await db.flush()
        created_jobs.append(job)

        # Create evaluation schema for this job
        eval_criteria = job_data.get("evaluation_criteria", [])
        if eval_criteria:
            eval_schema = JobEvaluationSchema(
                job_id=job.id,
                version=1,
                criteria=eval_criteria,
                human_weight=0.6,
                llm_weight=0.4,
            )
            db.add(eval_schema)
            await db.flush()

    print(
        f"  ✓ {company_data['name']}: 1 admin, {len(recruiter_users)} recruiters, {len(created_jobs)} jobs"
    )
    return created_jobs, admin, recruiter_users


async def seed_candidate(db, data: dict) -> tuple[User, list[Resume]]:
    """Seed a single candidate: user + profile + 2 resumes. Returns (user, [resume0, resume1])."""

    user = User(
        full_name=data["full_name"],
        email=data["email"],
        password_hash=COMMON_PW,
        primary_role=UserRole.candidate,
        is_email_verified=True,
        is_onboarded=True,
    )
    db.add(user)
    await db.flush()

    profile = Profile(
        user_id=user.id,
        headline=data["headline"],
        summary=data["summary"],
        phone=data["phone"],
        location=data["location"],
        linkedin_url=data.get("linkedin_url"),
        github_url=data.get("github_url"),
        portfolio_url=data.get("portfolio_url"),
        years_of_experience=data["years_of_experience"],
        target_roles=data["target_roles"],
        is_open_to_work=data.get("is_open_to_work", False),
    )
    db.add(profile)
    await db.flush()

    for exp in data["experiences"]:
        db.add(
            ProfileExperience(
                profile_id=profile.id,
                company_name=exp["company_name"],
                title=exp["title"],
                start_date=exp["start_date"],
                end_date=exp.get("end_date"),
                description=exp["description"],
            )
        )

    for edu in data["educations"]:
        db.add(
            ProfileEducation(
                profile_id=profile.id,
                institution=edu["institution"],
                degree=edu.get("degree"),
                field_of_study=edu.get("field_of_study"),
                start_date=edu.get("start_date"),
                end_date=edu.get("end_date"),
            )
        )

    for skill_name in data["skills"]:
        db.add(ProfileSkill(profile_id=profile.id, skill_name=skill_name))

    resumes = []
    for variant in data["resume_variants"]:
        resume, exps, edus, skills = build_resume(user, data, variant)
        db.add(resume)
        await db.flush()

        for exp in exps:
            exp.resume_id = resume.id
            db.add(exp)
        for edu in edus:
            edu.resume_id = resume.id
            db.add(edu)
        for skill in skills:
            skill.resume_id = resume.id
            db.add(skill)

        resumes.append(resume)

    print(
        f"  ✓ Candidate: {data['full_name']} ({data['email']}) — profile + {len(resumes)} resumes"
    )
    return user, resumes


async def seed_applications(
    db,
    candidate_users: list[tuple[User, list[Resume]]],
    company_jobs: list[list[Job]],
    company_data_list: list[dict],
    company_extras: list[tuple[User, list]],
):
    """Seed applications, screening, shortlisting, outreach emails, and interview bookings."""

    print(
        "\n📋 Seeding applications, screening, shortlisting, outreach, and interviews..."
    )

    interview_counter = 0
    application_counter = 0
    email_counter = 0

    for app_spec in APPLICATIONS:
        (
            cand_idx,
            comp_idx,
            job_idx,
            resume_idx,
            score,
            feedback,
            target_status,
            share_overrides,
        ) = app_spec

        candidate_user, candidate_resumes = candidate_users[cand_idx]
        job = company_jobs[comp_idx][job_idx]
        resume = candidate_resumes[resume_idx]
        company_info = company_data_list[comp_idx]

        # Build share settings
        share = {
            "share_profile_all": True,
            "share_avatar": True,
            "share_email": True,
            "share_phone": True,
            "share_location": True,
            "share_links": True,
            "share_headline_summary": True,
        }
        share.update(share_overrides)

        # Build shared profile snapshot based on share settings
        shared_full_name = candidate_user.full_name
        shared_email = candidate_user.email if share["share_email"] else None
        cand_data = CANDIDATES[cand_idx]
        shared_phone = cand_data["phone"] if share["share_phone"] else None
        shared_location = cand_data["location"] if share["share_location"] else None
        shared_headline = (
            cand_data["headline"] if share["share_headline_summary"] else None
        )
        shared_summary = (
            cand_data["summary"] if share["share_headline_summary"] else None
        )
        shared_linkedin = (
            cand_data.get("linkedin_url") if share["share_links"] else None
        )
        shared_github = cand_data.get("github_url") if share["share_links"] else None
        shared_portfolio = (
            cand_data.get("portfolio_url") if share["share_links"] else None
        )

        # Application created_at: spread across last 2-4 weeks before expiry
        days_before_expiry = 7 + (application_counter * 3) % 21
        app_created = EXPIRED_DATE - timedelta(days=days_before_expiry)

        application = Application(
            job_id=job.id,
            user_id=candidate_user.id,
            resume_id=resume.id,
            score=score,
            feedback=feedback,
            status=target_status,
            shortlist_notified=True,
            created_at=app_created,
            updated_at=NOW - timedelta(days=1),
            # Share settings
            share_profile_all=share["share_profile_all"],
            share_avatar=share["share_avatar"],
            share_email=share["share_email"],
            share_phone=share["share_phone"],
            share_location=share["share_location"],
            share_links=share["share_links"],
            share_headline_summary=share["share_headline_summary"],
            # Shared snapshots
            shared_full_name=shared_full_name,
            shared_email_value=shared_email,
            shared_phone_value=shared_phone,
            shared_location_value=shared_location,
            shared_headline_value=shared_headline,
            shared_summary_value=shared_summary,
            shared_linkedin_url=shared_linkedin,
            shared_github_url=shared_github,
            shared_portfolio_url=shared_portfolio,
            shared_avatar_url=None,
        )
        db.add(application)
        await db.flush()
        application_counter += 1

        # Create outreach email draft
        if target_status == ApplicationStatus.interview_booked:
            cal_url = company_info.get("cal_booking_url", "https://cal.com/default")
            subject, body = generate_shortlist_email(
                candidate_user.full_name,
                job.title,
                company_info["name"],
                cal_url,
            )
            draft = EmailDraft(
                application_id=application.id,
                subject=subject,
                body=body,
                is_approved=True,
                is_sent=True,
            )
            db.add(draft)
            email_counter += 1

            # Create interview booking
            interview_counter += 1
            interview_base = NOW + timedelta(days=interview_counter * 2, hours=10)
            interview = Interview(
                application_id=application.id,
                cal_booking_uid=f"cal-booking-{uuid.uuid4().hex[:12]}",
                candidate_name=candidate_user.full_name,
                candidate_email=candidate_user.email,
                start_time=interview_base,
                end_time=interview_base + timedelta(minutes=45),
                timezone="Asia/Kathmandu",
                location="Google Meet – link sent via calendar invite",
                title=f"Interview: {candidate_user.full_name} – {job.title}",
            )
            db.add(interview)

        elif target_status == ApplicationStatus.rejected:
            subject, body = generate_rejection_email(
                candidate_user.full_name,
                job.title,
                company_info["name"],
                feedback,
            )
            draft = EmailDraft(
                application_id=application.id,
                subject=subject,
                body=body,
                is_approved=True,
                is_sent=True,
            )
            db.add(draft)
            email_counter += 1

        print(
            f"    • {CANDIDATES[cand_idx]['full_name']} → {job.title[:50]}... "
            f"[score={score}, status={target_status.value}]"
        )

    await db.flush()
    print(f"\n  ✓ Applications: {application_counter}")
    print(f"  ✓ Outreach emails: {email_counter}")
    print(f"  ✓ Interview bookings: {interview_counter}")


# ============================================================================
# MAIN
# ============================================================================


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        print("\n🚀 Seeding ConvexHire – Nepal IT Hiring Platform\n")

        # --- Companies, Admins, Recruiters, Jobs ---
        print(
            "📦 Seeding companies, admins, recruiters, jobs, and evaluation schemas..."
        )
        all_jobs: list[list[Job]] = []
        company_extras = []
        for company_data in COMPANIES:
            jobs, admin, recruiters = await seed_company(db, company_data)
            all_jobs.append(jobs)
            company_extras.append((admin, recruiters))

        # Queue all jobs for vector sync
        for job_list in all_jobs:
            for job in job_list:
                db.add(JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT))

        # --- Candidates ---
        print("\n👤 Seeding candidates with profiles and resumes...")
        candidate_users: list[tuple[User, list[Resume]]] = []
        for candidate_data in CANDIDATES:
            user_resume_pair = await seed_candidate(db, candidate_data)
            candidate_users.append(user_resume_pair)

        # --- Applications, Screening, Shortlisting, Outreach, Interviews ---
        await seed_applications(
            db, candidate_users, all_jobs, COMPANIES, company_extras
        )

        await db.commit()

        # --- Summary ---
        total_jobs = sum(len(jl) for jl in all_jobs)
        total_resumes = sum(len(c["resume_variants"]) for c in CANDIDATES)
        shortlisted = sum(
            1 for a in APPLICATIONS if a[6] == ApplicationStatus.interview_booked
        )
        rejected = sum(1 for a in APPLICATIONS if a[6] == ApplicationStatus.rejected)

        print("\n" + "=" * 70)
        print("✅ Seeding complete!")
        print("=" * 70)
        print(f"  Companies           : {len(COMPANIES)}")
        print(f"  Admins              : {len(COMPANIES)}")
        print(f"  Recruiters          : {sum(len(c['recruiters']) for c in COMPANIES)}")
        print(
            f"  Jobs                : {total_jobs} (all expired, shortlisting completed)"
        )
        print(f"  Evaluation schemas  : {total_jobs}")
        print(f"  Candidates          : {len(CANDIDATES)}")
        print(f"  Resumes             : {total_resumes}")
        print(f"  Applications        : {len(APPLICATIONS)}")
        print(f"    → Shortlisted     : {shortlisted} (with interview bookings)")
        print(f"    → Rejected        : {rejected} (with rejection emails)")
        print(f"  Email drafts        : {len(APPLICATIONS)} (all approved & sent)")
        print(f"  Interview bookings  : {shortlisted}")
        print()
        print("  Login credentials for all accounts: Password@123")
        print()
        print("  📧 Recruiter Admin logins:")
        for c in COMPANIES:
            print(f"     {c['admin']['email']}")
        print("  📧 Recruiter logins:")
        for c in COMPANIES:
            for r in c["recruiters"]:
                print(f"     {r['email']}")
        print("  📧 Candidate logins:")
        for c in CANDIDATES:
            print(f"     {c['email']}")
        print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(seed())
