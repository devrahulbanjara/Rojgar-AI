import asyncio
import json
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from enum import Enum
from pathlib import Path

from fastapi.encoders import jsonable_encoder
from sqlalchemy import delete, func, inspect, select, text

import app.core.model_registry  # noqa: F401
from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import hash_password
from app.modules.activity.models import ActivityEvent
from app.modules.applications.models import Application, ApplicationSyncEvent
from app.modules.audit.models import AuditLog
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.interviews.evaluation_models import (
    CandidateEvaluationScore,
    JobEvaluationSchema,
)
from app.modules.interviews.models import Interview
from app.modules.interviews.recording_model import InterviewRecording
from app.modules.job_ai.models import JobAIDraft
from app.modules.jobs.models import Job, JobSyncEvent
from app.modules.notifications.models import Notification
from app.modules.outreach.models import EmailDraft
from app.modules.profiles.models import (
    Profile,
    ProfileEducation,
    ProfileExperience,
    ProfileSkill,
    ResumeImportTask,
)
from app.modules.recruiter_chat.models import RecruiterChatSession
from app.modules.recruiter_preferences.models import RecruiterPreference
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
    RecordingStatus,
    ShortlistStatus,
    SyncAction,
)

COMMON_PW = hash_password("Password@123")
DEFAULT_LOGIN_PASSWORD = "Password@123"

NOW = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
EXPIRED_DATE = NOW - timedelta(days=3)  # Jobs expired 3 days ago
SEED_AUDIT_USER_AGENT = "ConvexHire Seed Script"
AUDIT_REDACTED_FIELDS = {
    "password_hash",
    "password_reset_token",
    "email_verify_token",
    "jti",
}


def _audit_serialize_value(value):
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return jsonable_encoder(value)


def _serialize_audit_entity(instance) -> dict:
    state = inspect(instance)
    data: dict[str, object] = {}
    for column in state.mapper.columns:
        key = column.key
        if key in AUDIT_REDACTED_FIELDS:
            data[key] = "[REDACTED]"
            continue
        data[key] = _audit_serialize_value(getattr(instance, key))
    return data


def _build_audit_snapshots(
    instance,
    *,
    before_overrides: dict | None = None,
    after_overrides: dict | None = None,
) -> tuple[dict, dict, dict | None]:
    after_json = _serialize_audit_entity(instance)
    if after_overrides:
        for key, value in after_overrides.items():
            after_json[key] = _audit_serialize_value(value)

    before_json = dict(after_json)
    diff_json: dict[str, dict[str, object]] = {}
    changed_fields = set(before_overrides or {}) | set(after_overrides or {})
    for field in changed_fields:
        before_value = _audit_serialize_value(
            before_overrides[field]
            if before_overrides and field in before_overrides
            else before_json.get(field)
        )
        after_value = _audit_serialize_value(
            after_overrides[field]
            if after_overrides and field in after_overrides
            else after_json.get(field)
        )
        before_json[field] = before_value
        after_json[field] = after_value
        if before_value != after_value:
            diff_json[field] = {"before": before_value, "after": after_value}

    return before_json, after_json, diff_json or None


def _actor_role_value(actor: User | None) -> str | None:
    return actor.primary_role.value if actor is not None else None


def _queue_seed_audit_log(
    db,
    *,
    created_at: datetime,
    entity_type: str,
    action_type: str,
    actor: User | None = None,
    entity_id: str | uuid.UUID | None = None,
    company_id: uuid.UUID | None = None,
    target_user_id: uuid.UUID | None = None,
    parent_entity_type: str | None = None,
    parent_entity_id: str | uuid.UUID | None = None,
    before_json: dict | None = None,
    after_json: dict | None = None,
    diff_json: dict | None = None,
    metadata: dict | None = None,
    reason: str | None = None,
    request_path: str | None = None,
    request_method: str | None = None,
) -> None:
    request_hint = request_path or entity_type
    db.add(
        AuditLog(
            actor_user_id=actor.id if actor is not None else None,
            actor_role=_actor_role_value(actor),
            target_user_id=target_user_id,
            company_id=company_id,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            parent_entity_type=parent_entity_type,
            parent_entity_id=str(parent_entity_id)
            if parent_entity_id is not None
            else None,
            action_type=action_type,
            request_id=f"seed-{request_hint.replace('/', '-').strip('-')}-{uuid.uuid4().hex[:10]}",
            request_path=request_path,
            request_method=request_method,
            ip_address="127.0.0.1",
            user_agent=SEED_AUDIT_USER_AGENT,
            source="seed",
            reason=reason,
            success=True,
            before_json=before_json,
            after_json=after_json,
            diff_json=diff_json,
            metadata_json=metadata,
            created_at=created_at,
        )
    )


# ============================================================================
# COMPANY DATA
# ============================================================================

COMPANIES = [
    {
        "name": "F1Soft International Pvt. Ltd.",
        "industry": "Fintech & Digital Banking",
        "company_size": "201-500",
        "location": "Hattisar, Kathmandu",
        "website_url": "https://f1soft.com",
        "domain": "f1soft.com",
        "cal_booking_url": "https://cal.com/f1soft-hiring",
        "cal_organizer_email": "hiring@f1soft.com",
        "description": (
            "F1Soft International is a dominant force in Nepal's fintech landscape, responsible for "
            "developing nearly 90% of the digital banking systems in the country. We are the parent "
            "company of eSewa (Nepal's leading digital wallet) and Fonepay (the national payment network). "
            "Our engineering team operates at the intersection of distributed systems, financial compliance, "
            "and mobile-first product design, powering real-time payment rails and mobile banking platforms "
            "used by millions across Nepal and South Asia."
        ),
        "admin": {
            "full_name": "Bikash Shrestha",
            "email": "bikash.shrestha@f1soft.com",
            "job_title": "Chief Technology Officer",
        },
        "recruiters": [
            {
                "full_name": "Priya Maharjan",
                "email": "priya.maharjan@f1soft.com",
                "job_title": "Head of Talent Acquisition",
            },
            {
                "full_name": "Roshan Karki",
                "email": "roshan.karki@f1soft.com",
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
                    "F1Soft's infrastructure team manages a multi-region AWS footprint that "
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
        "name": "Leapfrog Technology Inc.",
        "industry": "Artificial Intelligence & Data Science",
        "company_size": "51-200",
        "location": "Kumaripati, Lalitpur",
        "website_url": "https://lftechnology.com",
        "domain": "lftechnology.com",
        "cal_booking_url": "https://cal.com/leapfrog-interviews",
        "cal_organizer_email": "interviews@lftechnology.com",
        "description": (
            "Leapfrog Technology Inc. is a premier software development firm known for its strong "
            "engineering culture and technical excellence. We specialize in healthcare technology, "
            "AI-driven solutions, and digital transformation for global clients across the United States, "
            "Europe, and Asia. Our team of engineers, data scientists, and product designers work on "
            "cutting-edge projects ranging from healthcare platforms and machine learning systems to "
            "enterprise automation and mobile applications. We are committed to building world-class "
            "software while fostering a culture of continuous learning and innovation."
        ),
        "admin": {
            "full_name": "Dr. Samjhana Poudel",
            "email": "samjhana.poudel@lftechnology.com",
            "job_title": "CEO & Co-Founder",
        },
        "recruiters": [
            {
                "full_name": "Anil Thapa Magar",
                "email": "anil.thapamagar@lftechnology.com",
                "job_title": "People Operations Manager",
            },
            {
                "full_name": "Sunita Rai",
                "email": "sunita.rai@lftechnology.com",
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
                    "Leapfrog is building a Nepali-language AI assistant for the public health sector, "
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
                    "Leapfrog's data platform ingests health records, lab results, and epidemiological "
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
                    "startups to deploy Leapfrog's AI models via a no-code interface. Think: drag-and-drop "
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
                    "Leapfrog's agritech division is deploying AI-powered pest and disease detection "
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
    {
        "name": "Sastodeal Technology Pvt. Ltd.",
        "industry": "E-commerce & Marketplace",
        "company_size": "101-200",
        "location": "Tinkune, Kathmandu",
        "website_url": "https://sastodeal.com",
        "domain": "sastodeal.com",
        "cal_booking_url": "https://cal.com/sastodeal-hiring",
        "cal_organizer_email": "careers@sastodeal.com",
        "description": (
            "Sastodeal is Nepal's leading online marketplace connecting buyers and sellers across "
            "electronics, fashion, home goods, and groceries. Founded in 2011, we process over "
            "50,000 orders monthly and operate fulfillment centers in Kathmandu, Pokhara, and Biratnagar. "
            "Our engineering team builds high-scale inventory management, payment processing, logistics "
            "optimization, and seller onboarding platforms."
        ),
        "admin": {
            "full_name": "Sanjay Agrawal",
            "email": "sanjay.agrawal@sastodeal.com",
            "job_title": "VP of Engineering",
        },
        "recruiters": [
            {
                "full_name": "Anjali Thapa",
                "email": "anjali.thapa@sastodeal.com",
                "job_title": "Senior Technical Recruiter",
            },
        ],
        "jobs": [
            {
                "title": "Senior Backend Engineer – Marketplace Platform (Python/Django)",
                "location": "Tinkune, Kathmandu",
                "location_type": LocationType.hybrid,
                "salary_min": 150000,
                "salary_max": 230000,
                "currency": "NPR",
                "overview": (
                    "Join our Marketplace Platform team to build the core systems that power Nepal's "
                    "largest e-commerce platform. You'll work on inventory sync, order orchestration, "
                    "payment processing, and seller analytics serving 50,000+ monthly transactions."
                ),
                "responsibilities": [
                    "Design and maintain Django REST APIs for product catalog, cart, and checkout flows",
                    "Build real-time inventory sync systems integrating with 2,000+ seller accounts",
                    "Optimize PostgreSQL queries for product search and recommendation engines",
                    "Implement fraud detection and payment reconciliation workflows",
                ],
                "requirements": [
                    "5+ years Python backend experience, 3+ years with Django or FastAPI",
                    "Strong PostgreSQL skills including indexing and query optimization",
                    "Experience with Redis, Celery, and background job processing",
                    "Understanding of e-commerce domain: inventory, orders, payments",
                ],
                "preferred_qualifications": [
                    "Prior e-commerce or marketplace platform experience",
                    "Knowledge of Elasticsearch for product search",
                    "Experience with payment gateway integrations (eSewa, Khalti, IME Pay)",
                ],
                "benefits": [
                    "Monthly salary: NPR 1,50,000 – 2,30,000",
                    "Festival bonuses (Dashain, Tihar)",
                    "Health insurance for family",
                    "Hybrid work: 3 days office, 2 days remote",
                ],
                "shortlist_threshold": 65,
                "evaluation_criteria": [
                    {
                        "key": "backend_depth",
                        "label": "Backend Engineering",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "ecommerce_domain",
                        "label": "E-commerce Domain",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "system_design",
                        "label": "System Design",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "communication",
                        "label": "Communication",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
        ],
    },
    {
        "name": "Verisk Nepal Pvt. Ltd.",
        "industry": "Data Analytics & Insurance Tech",
        "company_size": "501-1000",
        "location": "Thapathali, Kathmandu",
        "website_url": "https://verisk.com/nepal",
        "domain": "verisk.com",
        "cal_booking_url": "https://cal.com/verisk-nepal",
        "cal_organizer_email": "recruitment.nepal@verisk.com",
        "description": (
            "Verisk Nepal is the Kathmandu-based development center for Verisk Analytics, a global "
            "data analytics and risk assessment company serving insurance, energy, and financial services "
            "markets. Our 500+ person engineering team builds predictive models, data pipelines, and "
            "SaaS platforms used by Fortune 500 clients worldwide."
        ),
        "admin": {
            "full_name": "Ramesh Dhakal",
            "email": "ramesh.dhakal@verisk.com",
            "job_title": "Director of Engineering",
        },
        "recruiters": [
            {
                "full_name": "Kritika Pradhan",
                "email": "kritika.pradhan@verisk.com",
                "job_title": "Lead Technical Recruiter",
            },
        ],
        "jobs": [
            {
                "title": "Data Engineer – Insurance Analytics Platform (Spark/Airflow)",
                "location": "Thapathali, Kathmandu",
                "location_type": LocationType.onsite,
                "salary_min": 160000,
                "salary_max": 250000,
                "currency": "NPR",
                "overview": (
                    "Build large-scale data pipelines processing billions of insurance claims, policy "
                    "records, and risk assessment data for US and European insurance carriers."
                ),
                "responsibilities": [
                    "Design and maintain Spark jobs processing 10TB+ daily data volumes",
                    "Build Airflow DAGs for ETL orchestration across 50+ data sources",
                    "Optimize Snowflake warehouse performance and cost efficiency",
                    "Implement data quality checks and monitoring for critical datasets",
                ],
                "requirements": [
                    "4+ years data engineering experience",
                    "Strong Python and SQL skills",
                    "Hands-on Spark (PySpark) and Airflow experience",
                    "Experience with cloud data warehouses (Snowflake, BigQuery, Redshift)",
                ],
                "preferred_qualifications": [
                    "Insurance or healthcare data experience",
                    "Knowledge of dbt for analytics engineering",
                ],
                "benefits": [
                    "Monthly salary: NPR 1,60,000 – 2,50,000",
                    "Annual performance bonus up to 20%",
                    "Comprehensive health insurance",
                    "International training opportunities",
                ],
                "shortlist_threshold": 70,
                "evaluation_criteria": [
                    {
                        "key": "data_eng",
                        "label": "Data Engineering",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "spark_airflow",
                        "label": "Spark & Airflow",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "sql",
                        "label": "SQL & Data Modeling",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "communication",
                        "label": "Communication",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
        ],
    },
    {
        "name": "Khalti Digital Wallet Pvt. Ltd.",
        "industry": "Digital Payments & Fintech",
        "company_size": "51-100",
        "location": "Jawalakhel, Lalitpur",
        "website_url": "https://khalti.com",
        "domain": "khalti.com",
        "cal_booking_url": "https://cal.com/khalti-careers",
        "cal_organizer_email": "jobs@khalti.com",
        "description": (
            "Khalti is Nepal's fastest-growing digital wallet with 5+ million users. We enable "
            "instant payments, bill payments, mobile recharge, and merchant transactions across Nepal. "
            "Our engineering team builds mobile-first payment experiences, fraud detection systems, "
            "and merchant onboarding platforms."
        ),
        "admin": {
            "full_name": "Manish Poudel",
            "email": "manish.poudel@khalti.com",
            "job_title": "CTO",
        },
        "recruiters": [
            {
                "full_name": "Shreya Karmacharya",
                "email": "shreya.karmacharya@khalti.com",
                "job_title": "Talent Acquisition Lead",
            },
        ],
        "jobs": [
            {
                "title": "Mobile Engineer – Flutter (iOS & Android)",
                "location": "Jawalakhel, Lalitpur",
                "location_type": LocationType.hybrid,
                "salary_min": 130000,
                "salary_max": 200000,
                "currency": "NPR",
                "overview": (
                    "Own the Khalti mobile app used by 5 million Nepalis for payments, recharge, "
                    "and bill payments. Build features, optimize performance, and ensure security."
                ),
                "responsibilities": [
                    "Develop and maintain Khalti Flutter app for iOS and Android",
                    "Implement payment flows, QR scanning, and biometric authentication",
                    "Optimize app performance for low-end Android devices",
                    "Integrate with backend APIs and handle offline-first scenarios",
                ],
                "requirements": [
                    "3+ years mobile development experience",
                    "Strong Flutter and Dart skills",
                    "Experience with state management (Riverpod, Bloc, Provider)",
                    "Understanding of mobile security best practices",
                ],
                "preferred_qualifications": [
                    "Fintech or payment app experience",
                    "Knowledge of Nepal's mobile ecosystem",
                ],
                "benefits": [
                    "Monthly salary: NPR 1,30,000 – 2,00,000",
                    "ESOPs for early team members",
                    "Festival bonuses",
                    "Health insurance",
                ],
                "shortlist_threshold": 65,
                "evaluation_criteria": [
                    {
                        "key": "flutter",
                        "label": "Flutter Expertise",
                        "max_score": 10,
                        "weight": 2.0,
                    },
                    {
                        "key": "mobile_perf",
                        "label": "Mobile Performance",
                        "max_score": 10,
                        "weight": 1.5,
                    },
                    {
                        "key": "security",
                        "label": "Security Awareness",
                        "max_score": 10,
                        "weight": 1.0,
                    },
                    {
                        "key": "communication",
                        "label": "Communication",
                        "max_score": 10,
                        "weight": 0.5,
                    },
                ],
            },
        ],
    },
]


# ============================================================================
# CANDIDATE DATA (9 candidates, each with 1-2 resume variants)
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
            {
                "resume_name": "Merchant Integrations & API Platform Profile",
                "headline": "Senior Backend Engineer | API Platforms, Webhooks, and Merchant Integrations",
                "summary": (
                    "Backend engineer with strong product-facing API experience, integration ownership, "
                    "and operational tooling depth. Best aligned to partner APIs, onboarding workflows, "
                    "merchant systems, and platform engineering roles in fintech."
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
    {
        "full_name": "Nischal Kharel",
        "email": "nischal.kharel@gmail.com",
        "years_of_experience": 8,
        "headline": "Staff Platform Engineer | SRE, Observability, and Incident Response",
        "summary": (
            "Platform and reliability engineer with 8 years of experience building internal developer "
            "platforms, production observability stacks, and incident response systems for fintech and "
            "high-growth product teams in Nepal. I have led reliability programs around SLOs, service "
            "ownership, and production debugging. Most recently I owned tracing, alerting quality, and "
            "platform APIs for engineering teams shipping high-volume payment and operations systems."
        ),
        "phone": "+977-9818-445566",
        "location": "Maitidevi, Kathmandu",
        "linkedin_url": "https://linkedin.com/in/nischalkharel",
        "github_url": "https://github.com/nischal-kharel",
        "portfolio_url": None,
        "target_roles": [
            "Staff Platform Engineer",
            "Site Reliability Engineer",
            "Platform Reliability Lead",
        ],
        "is_open_to_work": True,
        "skills": [
            "Python",
            "Go",
            "FastAPI",
            "PostgreSQL",
            "Redis",
            "Kubernetes",
            "Terraform",
            "AWS",
            "Prometheus",
            "Grafana",
            "OpenTelemetry",
            "Incident Management",
            "SLO Design",
            "Linux",
            "System Design",
        ],
        "experiences": [
            {
                "company_name": "CloudFactory Nepal",
                "title": "Staff Platform Engineer",
                "start_date": date(2022, 3, 1),
                "end_date": None,
                "description": [
                    "Led the platform reliability roadmap for internal developer tooling used by 20+ engineering squads",
                    "Introduced OpenTelemetry-based tracing and service health dashboards that cut mean time to detect critical issues by 45%",
                    "Built internal APIs for deployment metadata, release auditability, and ownership tracking",
                    "Facilitated incident reviews and reliability drills across platform and product teams",
                ],
            },
            {
                "company_name": "F1Soft International Pvt. Ltd.",
                "title": "Site Reliability Engineer",
                "start_date": date(2019, 1, 1),
                "end_date": date(2022, 2, 28),
                "description": [
                    "Managed Kubernetes workloads, alerting, and production diagnostics for high-volume digital payment services",
                    "Built Prometheus and Grafana monitoring templates adopted by backend teams across multiple payment products",
                    "Automated incident runbooks and reliability scorecards for engineering leadership",
                ],
            },
            {
                "company_name": "Leapfrog Technology",
                "title": "Systems Engineer",
                "start_date": date(2016, 7, 1),
                "end_date": date(2018, 12, 31),
                "description": [
                    "Maintained AWS environments, CI/CD pipelines, and logging systems for US-based SaaS teams",
                    "Improved release confidence through infrastructure automation and deployment guardrails",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Kathmandu University (KU), Dhulikhel",
                "degree": "Bachelor of Engineering",
                "field_of_study": "Computer Engineering",
                "start_date": date(2011, 8, 1),
                "end_date": date(2015, 8, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Platform Reliability - Staff IC",
                "headline": "Staff Platform Engineer | Reliability, Observability, and Internal APIs",
                "summary": (
                    "Platform engineer focused on observability, incident response, and production tooling. "
                    "Strong background in Kubernetes, metrics, tracing, and reliability-driven developer experience."
                ),
            },
            {
                "resume_name": "SRE and Incident Response Lead",
                "headline": "Site Reliability Engineer | SLOs, Alerting, and Production Operations",
                "summary": (
                    "Reliability engineer with deep hands-on experience in service health, incident operations, "
                    "and platform automation for payment and SaaS environments."
                ),
            },
        ],
    },
    {
        "full_name": "Samikshya Rai",
        "email": "samikshya.rai@gmail.com",
        "years_of_experience": 6,
        "headline": "Senior Frontend Platform Engineer | React, Next.js, Design Systems",
        "summary": (
            "Frontend engineer with 6 years of experience building shared UI foundations, enterprise design "
            "systems, and high-performance React products. I work best at the intersection of product teams "
            "and platform needs: reusable components, accessibility, design tokens, form systems, and frontend "
            "quality standards. I have led major migrations to modern React and Next.js stacks."
        ),
        "phone": "+977-9842-556677",
        "location": "Kupondole, Lalitpur",
        "linkedin_url": "https://linkedin.com/in/samikshyarai",
        "github_url": "https://github.com/samikshya-rai",
        "portfolio_url": "https://samikshyarai.dev",
        "target_roles": [
            "Senior Frontend Engineer",
            "Frontend Platform Engineer",
            "Design Systems Lead",
        ],
        "is_open_to_work": True,
        "skills": [
            "TypeScript",
            "React",
            "Next.js",
            "React Native",
            "Storybook",
            "SCSS",
            "Redux Toolkit",
            "Design Systems",
            "Accessibility",
            "Performance Optimization",
            "Cypress",
            "Playwright",
            "Figma Collaboration",
            "Component Architecture",
        ],
        "experiences": [
            {
                "company_name": "Leapfrog Technology",
                "title": "Senior Frontend Engineer",
                "start_date": date(2022, 4, 1),
                "end_date": None,
                "description": [
                    "Owned a shared component platform and design token system used across multiple client applications",
                    "Led migration from legacy CRA frontends to Next.js with measurable improvements in performance and maintainability",
                    "Standardized accessibility reviews and component-level quality checks across frontend teams",
                ],
            },
            {
                "company_name": "Braindigit IT Solution",
                "title": "Frontend Engineer",
                "start_date": date(2019, 5, 1),
                "end_date": date(2022, 3, 31),
                "description": [
                    "Built dashboard-heavy React and Next.js applications for B2B workflows",
                    "Created reusable form, table, and analytics components used by multiple product squads",
                    "Improved Lighthouse performance and frontend error monitoring coverage",
                ],
            },
            {
                "company_name": "Freelance / Contract",
                "title": "Web and Mobile UI Developer",
                "start_date": date(2018, 1, 1),
                "end_date": date(2019, 4, 30),
                "description": [
                    "Delivered marketing sites, admin tools, and small mobile app features for startup clients",
                ],
            },
        ],
        "educations": [
            {
                "institution": "BSc CSIT, Tribhuvan University",
                "degree": "Bachelor of Science",
                "field_of_study": "Computer Science and Information Technology",
                "start_date": date(2013, 10, 1),
                "end_date": date(2017, 10, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Frontend Platform and Design Systems",
                "headline": "Senior Frontend Platform Engineer | React, Next.js, and Design Systems",
                "summary": (
                    "Frontend engineer specializing in shared UI architecture, accessibility, and product-wide "
                    "component systems for dashboard and workflow applications."
                ),
            },
            {
                "resume_name": "Product Frontend Lead Profile",
                "headline": "Frontend Lead | Product UX, Performance, and React Platforms",
                "summary": (
                    "Experienced React and Next.js engineer with strong product intuition, UI consistency work, "
                    "and a track record of improving frontend delivery quality."
                ),
            },
        ],
    },
    {
        "full_name": "Binod Acharya",
        "email": "binod.acharya@gmail.com",
        "years_of_experience": 6,
        "headline": "Senior Data Engineer | Payments Analytics, Airflow, dbt, and Warehousing",
        "summary": (
            "Data engineer with 6 years of experience building batch and streaming pipelines, analytics models, "
            "and warehouse foundations for fintech and healthcare products. I have worked on payment events, "
            "risk data, reconciliation reporting, and internal BI layers. My strongest areas are SQL modeling, "
            "Airflow, dbt, Kafka-backed ingestion, and production data quality."
        ),
        "phone": "+977-9804-667788",
        "location": "Baneshwor, Kathmandu",
        "linkedin_url": "https://linkedin.com/in/binodacharya",
        "github_url": "https://github.com/binod-acharya",
        "portfolio_url": None,
        "target_roles": [
            "Senior Data Engineer",
            "Analytics Engineer",
            "Data Platform Engineer",
        ],
        "is_open_to_work": True,
        "skills": [
            "Python",
            "SQL",
            "dbt",
            "Apache Airflow",
            "Kafka",
            "Spark",
            "PostgreSQL",
            "Snowflake",
            "BigQuery",
            "Great Expectations",
            "Data Modeling",
            "Looker",
            "Redis",
            "Docker",
            "Terraform",
        ],
        "experiences": [
            {
                "company_name": "F1Soft International Pvt. Ltd.",
                "title": "Senior Data Engineer - Payments Analytics",
                "start_date": date(2022, 1, 1),
                "end_date": None,
                "description": [
                    "Built payment-event ingestion and analytics models used by product, finance, and risk teams",
                    "Maintained Airflow and dbt pipelines for reconciliation, merchant health, and transaction monitoring",
                    "Introduced warehouse quality checks and data lineage practices for critical reporting tables",
                ],
            },
            {
                "company_name": "Cotiviti Nepal",
                "title": "Data Engineer",
                "start_date": date(2019, 2, 1),
                "end_date": date(2021, 12, 31),
                "description": [
                    "Built ETL workflows and curated analytics marts for healthcare claims and operational reporting",
                    "Worked with Airflow, warehouse transforms, and SQL optimization across large reporting datasets",
                ],
            },
            {
                "company_name": "Deerwalk Services",
                "title": "ETL Developer",
                "start_date": date(2017, 7, 1),
                "end_date": date(2019, 1, 31),
                "description": [
                    "Developed ETL jobs, source-system integrations, and reporting table refresh processes",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Pulchowk Campus, Institute of Engineering (IOE), TU",
                "degree": "Bachelor of Engineering",
                "field_of_study": "Electronics and Communication Engineering",
                "start_date": date(2011, 11, 1),
                "end_date": date(2015, 11, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Payments Analytics Platform",
                "headline": "Senior Data Engineer | Payments Analytics, Airflow, dbt, Kafka",
                "summary": (
                    "Senior data engineer focused on fintech analytics, pipeline orchestration, warehouse modeling, "
                    "and production-grade data quality."
                ),
            },
            {
                "resume_name": "Data Platform and Warehousing",
                "headline": "Data Platform Engineer | SQL Modeling, Airflow, and Warehouse Reliability",
                "summary": (
                    "Data engineer with strong warehouse foundations, orchestration practices, and analytics engineering "
                    "experience across large operational datasets."
                ),
            },
        ],
    },
    {
        "full_name": "Prabesh Koirala",
        "email": "prabesh.koirala@gmail.com",
        "years_of_experience": 5,
        "headline": "Senior Backend Engineer | Integrations, APIs, and Merchant Systems",
        "summary": (
            "Backend engineer with 5 years of experience building partner integrations, merchant-facing APIs, "
            "and internal developer tooling for payment and SaaS products. I have owned API security, webhook "
            "reliability, partner onboarding workflows, and operational dashboards for business teams. I enjoy "
            "roles that sit close to product, external integrations, and practical systems design."
        ),
        "phone": "+977-9813-778899",
        "location": "Bhaisepati, Lalitpur",
        "linkedin_url": "https://linkedin.com/in/prabeshkoirala",
        "github_url": "https://github.com/prabesh-koirala",
        "portfolio_url": None,
        "target_roles": [
            "Senior Backend Engineer",
            "Integrations Engineer",
            "API Platform Engineer",
        ],
        "is_open_to_work": True,
        "skills": [
            "Python",
            "FastAPI",
            "Django",
            "PostgreSQL",
            "Redis",
            "RabbitMQ",
            "OAuth 2.0",
            "API Security",
            "Webhook Systems",
            "Docker",
            "AWS",
            "OpenAPI",
            "Pytest",
            "System Design",
        ],
        "experiences": [
            {
                "company_name": "Khalti Digital Wallet",
                "title": "Senior Backend Engineer - Merchant Integrations",
                "start_date": date(2021, 5, 1),
                "end_date": None,
                "description": [
                    "Owned merchant onboarding APIs, settlement webhooks, and partner integration tooling",
                    "Improved partner integration turnaround by standardizing auth flows, documentation, and operational diagnostics",
                    "Built internal dashboards for support and account management teams to triage merchant issues faster",
                ],
            },
            {
                "company_name": "InfoDevelopers Pvt. Ltd.",
                "title": "Software Engineer",
                "start_date": date(2018, 6, 1),
                "end_date": date(2021, 4, 30),
                "description": [
                    "Built backend APIs and service integrations for banking and financial software deployments",
                    "Worked on API contracts, async jobs, and partner-facing integration support",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Kathford International College of Engineering and Management",
                "degree": "Bachelor of Engineering",
                "field_of_study": "Computer Engineering",
                "start_date": date(2012, 9, 1),
                "end_date": date(2016, 9, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Backend Integrations Engineer",
                "headline": "Senior Backend Engineer | APIs, Integrations, and Merchant Workflows",
                "summary": (
                    "Backend engineer focused on partner APIs, reliable integrations, and product workflows "
                    "for merchant and operations teams."
                ),
            },
            {
                "resume_name": "Platform APIs and Merchant Systems",
                "headline": "API Platform Engineer | FastAPI, Webhooks, and Payment Integrations",
                "summary": (
                    "Experienced in developer-facing API design, webhook delivery, and merchant enablement systems "
                    "for payment products."
                ),
            },
        ],
    },
    {
        "full_name": "Nischal Basnet",
        "email": "nischal.basnet@gmail.com",
        "years_of_experience": 4,
        "headline": "Full Stack Engineer | React & Node.js | E-commerce Specialist",
        "summary": (
            "Full stack engineer with 4 years building e-commerce and marketplace platforms. "
            "Strong in React, Node.js, PostgreSQL, and payment gateway integrations. Experience "
            "at Daraz and Sastodeal building seller tools and checkout flows."
        ),
        "phone": "+977-9851-112233",
        "location": "Baluwatar, Kathmandu",
        "linkedin_url": "https://linkedin.com/in/nischalbasnet",
        "github_url": "https://github.com/nischal-basnet",
        "portfolio_url": "https://nischalbasnet.com.np",
        "target_roles": [
            "Full Stack Engineer",
            "Backend Engineer",
            "E-commerce Engineer",
        ],
        "is_open_to_work": True,
        "skills": [
            "JavaScript",
            "TypeScript",
            "React",
            "Node.js",
            "Express",
            "PostgreSQL",
            "MongoDB",
            "Redis",
            "Docker",
            "AWS",
            "Payment Gateways",
            "REST APIs",
            "GraphQL",
            "Jest",
            "Cypress",
        ],
        "experiences": [
            {
                "company_name": "Daraz Nepal",
                "title": "Full Stack Engineer",
                "start_date": date(2022, 1, 1),
                "end_date": None,
                "description": [
                    "Built seller dashboard features for inventory and order management",
                    "Integrated eSewa, Khalti, and IME Pay payment gateways",
                    "Optimized checkout flow reducing cart abandonment by 15%",
                    "Developed GraphQL APIs for mobile app integration",
                ],
            },
            {
                "company_name": "Sastodeal Technology",
                "title": "Junior Full Stack Developer",
                "start_date": date(2020, 6, 1),
                "end_date": date(2021, 12, 31),
                "description": [
                    "Developed product listing and search features using React and Node.js",
                    "Built admin tools for content moderation and seller onboarding",
                    "Implemented Redis caching for product catalog queries",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Kathmandu University (KU), Dhulikhel",
                "degree": "Bachelor of Computer Science",
                "field_of_study": "Computer Science",
                "start_date": date(2016, 8, 1),
                "end_date": date(2020, 8, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Full Stack E-commerce Profile",
                "headline": "Full Stack Engineer | React & Node.js | E-commerce",
                "summary": "Full stack engineer specializing in e-commerce platforms and payment integrations.",
            },
        ],
    },
    {
        "full_name": "Aakriti Shrestha",
        "email": "aakriti.shrestha@gmail.com",
        "years_of_experience": 6,
        "headline": "Senior QA Engineer | Test Automation | Selenium & Cypress",
        "summary": (
            "QA engineer with 6 years experience in test automation, CI/CD integration, "
            "and quality assurance for fintech and e-commerce products. Built automated test "
            "suites reducing regression testing time by 80%."
        ),
        "phone": "+977-9862-334455",
        "location": "Pulchowk, Lalitpur",
        "linkedin_url": "https://linkedin.com/in/aakritishrestha",
        "github_url": "https://github.com/aakriti-shrestha",
        "portfolio_url": None,
        "target_roles": ["Senior QA Engineer", "QA Automation Lead", "SDET"],
        "is_open_to_work": True,
        "skills": [
            "Selenium",
            "Cypress",
            "Playwright",
            "Python",
            "JavaScript",
            "Pytest",
            "Jest",
            "CI/CD",
            "Jenkins",
            "GitHub Actions",
            "API Testing",
            "Postman",
            "JMeter",
            "Performance Testing",
            "Test Strategy",
        ],
        "experiences": [
            {
                "company_name": "F1Soft International Pvt. Ltd.",
                "title": "Senior QA Engineer",
                "start_date": date(2021, 3, 1),
                "end_date": None,
                "description": [
                    "Built automated test suites for eSewa payment flows using Selenium and Pytest",
                    "Reduced regression testing time from 3 days to 4 hours through automation",
                    "Integrated tests into CI/CD pipeline achieving 95% code coverage",
                    "Led QA team of 3 engineers and established testing best practices",
                ],
            },
            {
                "company_name": "Leapfrog Technology",
                "title": "QA Engineer",
                "start_date": date(2018, 7, 1),
                "end_date": date(2021, 2, 28),
                "description": [
                    "Developed Selenium test automation framework for web applications",
                    "Performed manual and automated testing for US-based SaaS clients",
                    "Created API test suites using Postman and Newman",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Tribhuvan University",
                "degree": "Bachelor of Computer Application",
                "field_of_study": "Computer Application",
                "start_date": date(2014, 8, 1),
                "end_date": date(2018, 8, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "QA Automation Specialist",
                "headline": "Senior QA Engineer | Test Automation | Selenium & Cypress",
                "summary": "QA automation specialist with strong fintech testing background.",
            },
        ],
    },
    {
        "full_name": "Bibek Ghimire",
        "email": "bibek.ghimire@gmail.com",
        "years_of_experience": 5,
        "headline": "DevOps Engineer | Kubernetes & AWS | Infrastructure Automation",
        "summary": (
            "DevOps engineer with 5 years managing cloud infrastructure, CI/CD pipelines, "
            "and Kubernetes clusters for high-traffic applications. Strong AWS and Terraform expertise."
        ),
        "phone": "+977-9843-556677",
        "location": "Naxal, Kathmandu",
        "linkedin_url": "https://linkedin.com/in/bibekghimire",
        "github_url": "https://github.com/bibek-ghimire",
        "portfolio_url": None,
        "target_roles": ["DevOps Engineer", "SRE", "Cloud Engineer"],
        "is_open_to_work": True,
        "skills": [
            "Kubernetes",
            "Docker",
            "AWS",
            "Terraform",
            "Ansible",
            "Jenkins",
            "GitHub Actions",
            "Prometheus",
            "Grafana",
            "ELK Stack",
            "Linux",
            "Python",
            "Bash",
            "CI/CD",
            "Infrastructure as Code",
        ],
        "experiences": [
            {
                "company_name": "CloudFactory Nepal",
                "title": "DevOps Engineer",
                "start_date": date(2021, 1, 1),
                "end_date": None,
                "description": [
                    "Managed EKS clusters serving 100+ microservices across multiple environments",
                    "Built Terraform modules for infrastructure provisioning reducing setup time by 70%",
                    "Implemented monitoring and alerting with Prometheus and Grafana",
                    "Automated deployment processes using GitHub Actions and ArgoCD",
                ],
            },
            {
                "company_name": "Leapfrog Technology",
                "title": "Junior DevOps Engineer",
                "start_date": date(2019, 6, 1),
                "end_date": date(2020, 12, 31),
                "description": [
                    "Maintained CI/CD pipelines for multiple client projects using Jenkins",
                    "Automated deployment processes reducing release time by 60%",
                    "Managed AWS infrastructure including EC2, RDS, and S3",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Pulchowk Campus, Institute of Engineering (IOE), TU",
                "degree": "Bachelor of Engineering",
                "field_of_study": "Computer Engineering",
                "start_date": date(2014, 11, 1),
                "end_date": date(2018, 11, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "DevOps & Cloud Infrastructure",
                "headline": "DevOps Engineer | Kubernetes & AWS | Infrastructure Automation",
                "summary": "DevOps engineer specializing in Kubernetes, AWS, and infrastructure automation.",
            },
        ],
    },
    {
        "full_name": "Kritika Adhikari",
        "email": "kritika.adhikari@gmail.com",
        "years_of_experience": 3,
        "headline": "Mobile Developer | Flutter | Cross-platform Apps",
        "summary": (
            "Mobile developer with 3 years building Flutter apps for fintech and e-commerce. "
            "Experience with payment integrations, offline-first architecture, and performance optimization."
        ),
        "phone": "+977-9814-778899",
        "location": "Sanepa, Lalitpur",
        "linkedin_url": "https://linkedin.com/in/kritikaadhikari",
        "github_url": "https://github.com/kritika-adhikari",
        "portfolio_url": "https://kritikaadhikari.dev",
        "target_roles": ["Mobile Developer", "Flutter Developer", "Mobile Engineer"],
        "is_open_to_work": True,
        "skills": [
            "Flutter",
            "Dart",
            "Firebase",
            "REST APIs",
            "State Management",
            "Riverpod",
            "Bloc",
            "SQLite",
            "Git",
            "CI/CD",
            "App Store Deployment",
            "Google Play",
            "Mobile Security",
            "Performance Optimization",
        ],
        "experiences": [
            {
                "company_name": "IME Digital Solution",
                "title": "Flutter Developer",
                "start_date": date(2022, 4, 1),
                "end_date": None,
                "description": [
                    "Developed IME Pay mobile wallet app features for 2M+ users",
                    "Implemented biometric authentication and secure payment flows",
                    "Optimized app performance for low-end Android devices",
                    "Integrated with backend APIs using REST and WebSocket",
                ],
            },
            {
                "company_name": "Sastodeal Technology",
                "title": "Junior Mobile Developer",
                "start_date": date(2021, 3, 1),
                "end_date": date(2022, 3, 31),
                "description": [
                    "Built Sastodeal mobile app features using Flutter",
                    "Implemented product search and cart functionality",
                    "Integrated eSewa and Khalti payment gateways",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Kathmandu University (KU), Dhulikhel",
                "degree": "Bachelor of Computer Engineering",
                "field_of_study": "Computer Engineering",
                "start_date": date(2016, 8, 1),
                "end_date": date(2020, 8, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Flutter Mobile Developer",
                "headline": "Mobile Developer | Flutter | Cross-platform Apps",
                "summary": "Flutter developer specializing in fintech and e-commerce mobile applications.",
            },
        ],
    },
    {
        "full_name": "Rajesh Tamang",
        "email": "rajesh.tamang@gmail.com",
        "years_of_experience": 8,
        "headline": "Engineering Manager | Team Leadership | Fintech & Payments",
        "summary": (
            "Engineering manager with 8 years experience leading backend and platform teams. "
            "Built and scaled engineering teams from 3 to 15 people. Strong technical background "
            "in distributed systems and payment infrastructure."
        ),
        "phone": "+977-9801-998877",
        "location": "Lazimpat, Kathmandu",
        "linkedin_url": "https://linkedin.com/in/rajeshtamang",
        "github_url": "https://github.com/rajesh-tamang",
        "portfolio_url": None,
        "target_roles": ["Engineering Manager", "Tech Lead", "Director of Engineering"],
        "is_open_to_work": True,
        "skills": [
            "Team Leadership",
            "Engineering Management",
            "System Design",
            "Python",
            "Java",
            "Microservices",
            "AWS",
            "Agile",
            "Hiring",
            "Mentoring",
            "Technical Strategy",
            "Stakeholder Management",
        ],
        "experiences": [
            {
                "company_name": "F1Soft International Pvt. Ltd.",
                "title": "Engineering Manager - Payments Platform",
                "start_date": date(2020, 1, 1),
                "end_date": None,
                "description": [
                    "Lead team of 12 engineers building eSewa payment processing platform",
                    "Scaled team from 5 to 12 engineers through strategic hiring",
                    "Drove architectural decisions for microservices migration",
                    "Improved team velocity by 40% through process improvements",
                ],
            },
            {
                "company_name": "Khalti Digital Wallet",
                "title": "Senior Backend Engineer",
                "start_date": date(2017, 6, 1),
                "end_date": date(2019, 12, 31),
                "description": [
                    "Built core payment processing APIs handling 100K+ daily transactions",
                    "Led technical design for merchant onboarding platform",
                    "Mentored 3 junior engineers",
                ],
            },
        ],
        "educations": [
            {
                "institution": "Tribhuvan University, Pulchowk Campus",
                "degree": "Bachelor of Engineering",
                "field_of_study": "Electronics and Communication Engineering",
                "start_date": date(2010, 11, 1),
                "end_date": date(2014, 11, 1),
            }
        ],
        "resume_variants": [
            {
                "resume_name": "Engineering Leadership Profile",
                "headline": "Engineering Manager | Team Leadership | Fintech & Payments",
                "summary": "Engineering manager with proven track record building and scaling high-performing teams.",
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
# candidate_idx: 0=Aashish, 1=Dipika, 2=Suraj, 3=Nisha, 4=Rajan,
#                5=Nischal(old), 6=Samikshya, 7=Binod, 8=Prabesh,
#                9=Nischal(new), 10=Aakriti, 11=Bibek, 12=Kritika, 13=Rajesh
# company_idx: 0=F1Soft, 1=Leapfrog, 2=Sastodeal, 3=Verisk, 4=Khalti
# job_idx: per-company index (0-3 for F1Soft/Leapfrog, 0 for new companies)
# resume_variant_idx: 0 or 1

APPLICATIONS = [
    # --- F1Soft Jobs ---
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
    (
        5,
        0,
        0,
        0,
        88,
        "Strong fit. Nischal brings platform reliability depth, solid fintech production experience, and excellent debugging examples. The panel moved him forward quickly and completed an interview loop on the historical backend opening.",
        ApplicationStatus.interview_booked,
        {},
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
    (
        0,
        0,
        3,
        2,
        33,
        "Weak match. Aashish is a strong backend engineer, but this role requires dedicated QA automation ownership, test strategy leadership, and hands-on browser/API test suite design. His developer testing experience is useful but not enough for a specialist QA role.",
        ApplicationStatus.rejected,
        {"share_avatar": False},
    ),
    # --- Leapfrog AI Jobs ---
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
        0,
        1,
        1,
        2,
        44,
        "Partial overlap. Aashish has strong backend data handling experience and good SQL fundamentals, but the role requires deeper ownership of orchestration, warehouse modeling, and analytics engineering practices than his profile currently demonstrates.",
        ApplicationStatus.rejected,
        {"share_phone": False},
    ),
    (
        5,
        1,
        2,
        1,
        64,
        "Good platform and systems depth, but the panel preferred candidates with stronger direct product feature ownership and frontend collaboration examples for this full-stack SaaS role.",
        ApplicationStatus.rejected,
        {"share_phone": False, "share_links": False},
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
    # --- Sastodeal Jobs ---
    # Job 0: Senior Backend Engineer – Marketplace Platform
    (
        0,
        2,
        0,
        0,
        89,
        "Strong match. Aashish has 7 years backend experience with Python/Django at F1Soft. While his experience is in fintech rather than e-commerce, his technical depth in PostgreSQL, Redis, and API design translates well. Strong candidate for marketplace platform work.",
        ApplicationStatus.offer_accepted,
        {},
    ),
    (
        9,
        2,
        0,
        0,
        92,
        "Excellent match. Nischal has direct e-commerce experience at Daraz and Sastodeal. Built seller dashboards, integrated payment gateways, and optimized checkout flows. Perfect domain fit and strong technical skills in React, Node.js, and PostgreSQL.",
        ApplicationStatus.offer,
        {},
    ),
    (
        8,
        2,
        0,
        0,
        76,
        "Good match. Prabesh has strong backend API and integration experience. While his background is more in merchant APIs than e-commerce, his technical skills align well with marketplace platform needs.",
        ApplicationStatus.interview_completed,
        {},
    ),
    (
        3,
        2,
        0,
        0,
        58,
        "Moderate match. Nisha has full-stack experience but lacks e-commerce domain knowledge and the senior-level depth needed for this role.",
        ApplicationStatus.rejected,
        {},
    ),
    # --- Verisk Jobs ---
    # Job 0: Data Engineer – Insurance Analytics Platform
    (
        7,
        3,
        0,
        0,
        94,
        "Outstanding match. Binod has 6 years data engineering experience with direct fintech analytics background at F1Soft. Deep expertise in Airflow, dbt, Spark, and Snowflake. His payments analytics work translates perfectly to insurance data pipelines.",
        ApplicationStatus.offer_accepted,
        {},
    ),
    (
        2,
        3,
        0,
        0,
        88,
        "Excellent match. Suraj has healthcare data engineering experience at Cotiviti Nepal with Airflow, dbt, and Snowflake expertise. Direct healthcare domain knowledge is a strong advantage for insurance analytics.",
        ApplicationStatus.offer_declined,
        {},
    ),
    (
        0,
        3,
        0,
        0,
        62,
        "Partial match. Aashish has strong backend and SQL skills but lacks the data engineering orchestration and warehouse modeling depth required for this role.",
        ApplicationStatus.screening,
        {},
    ),
    # --- Khalti Jobs ---
    # Job 0: Mobile Engineer – Flutter
    (
        12,
        4,
        0,
        0,
        96,
        "Perfect match. Kritika has 3 years Flutter experience building fintech mobile apps at IME Digital. Direct experience with payment flows, biometric auth, and mobile wallet features. Ideal candidate for Khalti.",
        ApplicationStatus.offer,
        {},
    ),
    (
        6,
        4,
        0,
        0,
        45,
        "Poor match. Samikshya is a frontend web engineer with React and Next.js experience but no mobile development or Flutter background.",
        ApplicationStatus.rejected,
        {},
    ),
    (
        3,
        4,
        0,
        0,
        68,
        "Moderate match. Nisha has some React Native experience from her full-stack work but lacks the Flutter expertise and fintech mobile domain knowledge needed.",
        ApplicationStatus.screening,
        {},
    ),
]


# ============================================================================
# HELPERS
# ============================================================================
EXTRA_COMPANY_JOBS = {
    0: [
        {
            "seed_key": "platform_observability_active",
            "poster_slot": 1,
            "title": "Platform Reliability Engineer (Observability & Internal APIs)",
            "location": "Kathmandu",
            "location_type": LocationType.hybrid,
            "salary_min": 125000,
            "salary_max": 185000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": True,
            "shortlist_threshold": 68,
            "shortlist_status": ShortlistStatus.in_progress,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=12),
            "overview": "Own developer-platform APIs, observability tooling, and production diagnostics that keep F1Soft's payment workloads healthy.",
            "responsibilities": [
                "Build internal platform APIs and tooling for backend teams",
                "Improve tracing, metrics, alerting, and incident diagnostics",
                "Partner with DevOps and backend teams on reliability goals",
                "Reduce mean time to detect and resolve production issues",
            ],
            "requirements": [
                "Strong Python backend fundamentals",
                "Experience with observability stacks such as Grafana and Prometheus",
                "Comfort with PostgreSQL, Redis, and API debugging",
                "Ability to reason about production incidents and root causes",
            ],
            "preferred_qualifications": [
                "Experience supporting fintech or regulated systems",
                "Knowledge of distributed tracing and SLO-driven operations",
            ],
            "benefits": [
                "Hybrid work and internet allowance",
                "Health insurance and festival bonuses",
                "Learning budget for certifications and courses",
            ],
            "evaluation_criteria": [
                {
                    "key": "backend",
                    "label": "Backend Engineering",
                    "max_score": 10,
                    "weight": 1.8,
                },
                {
                    "key": "observability",
                    "label": "Observability & Reliability",
                    "max_score": 10,
                    "weight": 1.6,
                },
                {
                    "key": "debugging",
                    "label": "Debugging & Incident Response",
                    "max_score": 10,
                    "weight": 1.2,
                },
                {
                    "key": "communication",
                    "label": "Communication",
                    "max_score": 10,
                    "weight": 0.8,
                },
            ],
        },
        {
            "seed_key": "frontend_platform_active",
            "poster_slot": 2,
            "title": "Senior Frontend Platform Engineer (Design Systems)",
            "location": "Kathmandu",
            "location_type": LocationType.hybrid,
            "salary_min": 120000,
            "salary_max": 178000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": False,
            "shortlist_threshold": 64,
            "shortlist_status": ShortlistStatus.not_started,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=18),
            "overview": "Lead the shared frontend platform that powers banking portals, recruiter tools, and internal admin surfaces.",
            "responsibilities": [
                "Maintain shared UI foundations across web products",
                "Improve accessibility, form systems, and component APIs",
                "Set performance standards for React and Next.js pages",
            ],
            "requirements": [
                "Advanced React and TypeScript experience",
                "Experience with component libraries and design systems",
                "Strong debugging skills for frontend state and rendering issues",
            ],
            "preferred_qualifications": [
                "Experience in product platforms or multi-app frontend systems",
                "Understanding of analytics and experimentation tooling",
            ],
            "benefits": [
                "Hybrid schedule",
                "Festival bonuses and health insurance",
                "Personal development budget",
            ],
            "evaluation_criteria": [
                {
                    "key": "react",
                    "label": "React & TypeScript",
                    "max_score": 10,
                    "weight": 1.8,
                },
                {
                    "key": "systems",
                    "label": "Design Systems",
                    "max_score": 10,
                    "weight": 1.5,
                },
                {
                    "key": "performance",
                    "label": "Performance",
                    "max_score": 10,
                    "weight": 1.0,
                },
                {
                    "key": "collaboration",
                    "label": "Collaboration",
                    "max_score": 10,
                    "weight": 0.7,
                },
            ],
        },
        {
            "seed_key": "data_platform_draft",
            "poster_slot": 0,
            "title": "Data Platform Engineer (Streaming & Warehousing)",
            "location": "Kathmandu",
            "location_type": LocationType.remote,
            "salary_min": 135000,
            "salary_max": 195000,
            "currency": "NPR",
            "status": JobStatus.draft,
            "auto_shortlist": False,
            "shortlist_threshold": 70,
            "shortlist_status": ShortlistStatus.not_started,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=28),
            "overview": "Draft role for the next wave of payment analytics and streaming infrastructure work.",
            "responsibilities": [
                "Design warehouse ingestion jobs",
                "Own streaming pipelines and quality checks",
            ],
            "requirements": [
                "Strong SQL and Python data tooling experience",
                "Exposure to batch and stream processing systems",
            ],
            "preferred_qualifications": [
                "Fintech analytics background",
            ],
            "benefits": [
                "Remote-friendly setup",
                "Equipment and certification support",
            ],
            "evaluation_criteria": [
                {
                    "key": "data",
                    "label": "Data Engineering",
                    "max_score": 10,
                    "weight": 2.0,
                },
                {
                    "key": "sql",
                    "label": "SQL & Modeling",
                    "max_score": 10,
                    "weight": 1.0,
                },
            ],
        },
        {
            "seed_key": "merchant_integrations_active",
            "poster_slot": 1,
            "title": "Senior Backend Engineer (Merchant Integrations & Partner APIs)",
            "location": "Kathmandu",
            "location_type": LocationType.hybrid,
            "salary_min": 145000,
            "salary_max": 215000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": True,
            "shortlist_threshold": 70,
            "shortlist_status": ShortlistStatus.in_progress,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=16),
            "overview": "Own merchant onboarding APIs, partner integrations, webhook delivery, and the internal tooling that supports commercial rollout for F1Soft's payment products.",
            "responsibilities": [
                "Build and maintain merchant-facing APIs and partner onboarding flows",
                "Own webhook reliability, retry behavior, and integration diagnostics",
                "Collaborate with support and business teams on operational tooling",
                "Design secure auth and API governance patterns for external partners",
            ],
            "requirements": [
                "Strong Python backend experience in production systems",
                "Experience with partner integrations, external APIs, or webhook-based workflows",
                "Good understanding of PostgreSQL, queues, and operational debugging",
                "Ability to work across product, engineering, and business teams",
            ],
            "preferred_qualifications": [
                "Payments, merchant systems, or fintech integration experience",
                "Exposure to OAuth, API security, and external developer experience",
            ],
            "benefits": [
                "Hybrid work and communication allowance",
                "Medical coverage and festival bonuses",
                "Learning budget and internal leadership mentorship",
            ],
            "evaluation_criteria": [
                {
                    "key": "backend",
                    "label": "Backend Engineering",
                    "max_score": 10,
                    "weight": 1.8,
                },
                {
                    "key": "integrations",
                    "label": "Integrations & APIs",
                    "max_score": 10,
                    "weight": 1.6,
                },
                {
                    "key": "product_execution",
                    "label": "Product Execution",
                    "max_score": 10,
                    "weight": 1.0,
                },
                {
                    "key": "communication",
                    "label": "Cross-team Communication",
                    "max_score": 10,
                    "weight": 0.8,
                },
            ],
        },
        {
            "seed_key": "risk_analytics_active",
            "poster_slot": 1,
            "title": "Senior Data Platform Engineer (Risk Analytics)",
            "location": "Kathmandu",
            "location_type": LocationType.hybrid,
            "salary_min": 150000,
            "salary_max": 220000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": True,
            "shortlist_threshold": 72,
            "shortlist_status": ShortlistStatus.in_progress,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=21),
            "overview": "Build the data platform that powers transaction risk analytics, merchant monitoring, and finance-ready reporting across F1Soft's payment operations.",
            "responsibilities": [
                "Develop ingestion and warehouse models for risk and transaction analytics",
                "Own Airflow orchestration, dbt transformations, and data quality checks",
                "Partner with risk, finance, and product teams on reliable analytical datasets",
                "Improve observability and operating standards for production pipelines",
            ],
            "requirements": [
                "Strong SQL and Python data engineering fundamentals",
                "Hands-on experience with Airflow, dbt, and warehouse modeling",
                "Ability to reason about data quality, lineage, and operational reliability",
                "Experience supporting analytics use cases for business stakeholders",
            ],
            "preferred_qualifications": [
                "Fintech or payments analytics experience",
                "Exposure to Kafka, Spark, or event-based ingestion pipelines",
            ],
            "benefits": [
                "Hybrid work and equipment support",
                "Medical insurance and learning budget",
                "Quarterly bonus tied to platform and business impact",
            ],
            "evaluation_criteria": [
                {
                    "key": "data_platform",
                    "label": "Data Platform Engineering",
                    "max_score": 10,
                    "weight": 1.9,
                },
                {
                    "key": "sql_modeling",
                    "label": "SQL & Modeling",
                    "max_score": 10,
                    "weight": 1.4,
                },
                {
                    "key": "quality",
                    "label": "Data Quality & Reliability",
                    "max_score": 10,
                    "weight": 1.1,
                },
                {
                    "key": "stakeholder",
                    "label": "Stakeholder Communication",
                    "max_score": 10,
                    "weight": 0.7,
                },
            ],
        },
        {
            "seed_key": "engineering_manager_active",
            "poster_slot": 0,
            "title": "Engineering Manager (Payments Platform)",
            "location": "Kathmandu",
            "location_type": LocationType.hybrid,
            "salary_min": 190000,
            "salary_max": 285000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": False,
            "shortlist_threshold": 74,
            "shortlist_status": ShortlistStatus.in_progress,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=24),
            "overview": "Lead a cross-functional payments platform team spanning backend services, platform reliability, and delivery execution for F1Soft's core transaction products.",
            "responsibilities": [
                "Lead a multi-disciplinary engineering team delivering payment infrastructure and internal platform capabilities",
                "Own hiring, technical planning, and delivery quality for a core product area",
                "Coach senior engineers and create clear ownership across services and team processes",
                "Partner with product, compliance, and operations leaders on roadmap execution",
            ],
            "requirements": [
                "Strong backend engineering background with proven people leadership experience",
                "Ability to operate across architecture, delivery planning, and hiring",
                "Experience managing high-stakes systems in regulated or workflow-heavy products",
                "Clear communication with senior stakeholders and cross-functional teams",
            ],
            "preferred_qualifications": [
                "Experience in fintech, payments, or banking products",
                "Prior ownership of platform or infrastructure-heavy engineering teams",
            ],
            "benefits": [
                "Leadership bonus and annual performance review upside",
                "Hybrid work, health insurance, and festival bonuses",
                "Executive coaching and conference budget",
            ],
            "evaluation_criteria": [
                {
                    "key": "technical_leadership",
                    "label": "Technical Leadership",
                    "max_score": 10,
                    "weight": 1.7,
                },
                {
                    "key": "people_management",
                    "label": "People Management",
                    "max_score": 10,
                    "weight": 1.5,
                },
                {
                    "key": "delivery",
                    "label": "Execution & Delivery",
                    "max_score": 10,
                    "weight": 1.1,
                },
                {
                    "key": "stakeholder_management",
                    "label": "Stakeholder Management",
                    "max_score": 10,
                    "weight": 0.9,
                },
            ],
        },
    ],
    1: [
        {
            "seed_key": "applied_ai_active",
            "poster_slot": 1,
            "title": "Applied AI Engineer (Search, Ranking & Automation)",
            "location": "Lalitpur",
            "location_type": LocationType.hybrid,
            "salary_min": 150000,
            "salary_max": 230000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": True,
            "shortlist_threshold": 72,
            "shortlist_status": ShortlistStatus.in_progress,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=10),
            "overview": "Build ranking, search, and recruiter-assistant automation features for a fast-growing hiring product.",
            "responsibilities": [
                "Build retrieval and ranking systems for jobs and candidates",
                "Experiment with prompt, evaluation, and agent workflows",
                "Ship production APIs for AI-assisted recruiter experiences",
            ],
            "requirements": [
                "Strong Python skills and experience with production APIs",
                "Experience with search, embeddings, or recommendation systems",
                "Comfort evaluating model quality with concrete metrics",
            ],
            "preferred_qualifications": [
                "Experience with LangGraph or agent orchestration",
                "Product intuition for recruiter workflows",
            ],
            "benefits": [
                "Flexible hybrid setup",
                "Medical coverage and learning stipend",
                "Quarterly performance bonus",
            ],
            "evaluation_criteria": [
                {
                    "key": "python",
                    "label": "Python & APIs",
                    "max_score": 10,
                    "weight": 1.6,
                },
                {
                    "key": "search",
                    "label": "Search & Ranking",
                    "max_score": 10,
                    "weight": 1.5,
                },
                {
                    "key": "ml_product",
                    "label": "Applied ML Product Sense",
                    "max_score": 10,
                    "weight": 1.0,
                },
                {
                    "key": "experimentation",
                    "label": "Evaluation Rigor",
                    "max_score": 10,
                    "weight": 0.9,
                },
            ],
        },
        {
            "seed_key": "qa_automation_active",
            "poster_slot": 2,
            "title": "Staff QA Automation Engineer",
            "location": "Lalitpur",
            "location_type": LocationType.hybrid,
            "salary_min": 110000,
            "salary_max": 165000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": False,
            "shortlist_threshold": 62,
            "shortlist_status": ShortlistStatus.in_progress,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=15),
            "overview": "Strengthen release quality for recruiter tooling, candidate flows, and interview management surfaces.",
            "responsibilities": [
                "Design automation coverage for critical flows",
                "Drive test strategy for frontend and backend changes",
                "Improve flaky-test detection and reporting",
            ],
            "requirements": [
                "Strong API and UI automation experience",
                "Experience with Playwright, Pytest, or similar tooling",
                "Ability to reason about end-to-end release risk",
            ],
            "preferred_qualifications": [
                "Experience testing workflow-heavy B2B products",
            ],
            "benefits": [
                "Hybrid work and equipment support",
                "Health insurance and festival bonuses",
            ],
            "evaluation_criteria": [
                {
                    "key": "automation",
                    "label": "Automation Strategy",
                    "max_score": 10,
                    "weight": 1.8,
                },
                {
                    "key": "api_testing",
                    "label": "API Testing",
                    "max_score": 10,
                    "weight": 1.3,
                },
                {
                    "key": "frontend_testing",
                    "label": "UI Testing",
                    "max_score": 10,
                    "weight": 1.1,
                },
                {
                    "key": "quality_mindset",
                    "label": "Quality Mindset",
                    "max_score": 10,
                    "weight": 0.8,
                },
            ],
        },
        {
            "seed_key": "growth_engineer_draft",
            "poster_slot": 0,
            "title": "Growth Engineer (Candidate Acquisition)",
            "location": "Lalitpur",
            "location_type": LocationType.remote,
            "salary_min": 100000,
            "salary_max": 155000,
            "currency": "NPR",
            "status": JobStatus.draft,
            "auto_shortlist": False,
            "shortlist_threshold": 65,
            "shortlist_status": ShortlistStatus.not_started,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=25),
            "overview": "Draft role focused on acquisition funnels, landing pages, and experiment-driven product growth.",
            "responsibilities": [
                "Ship experiments across landing pages and conversion funnels",
                "Work with product and marketing on measurement loops",
            ],
            "requirements": [
                "Strong full-stack product instincts",
                "Comfort with analytics and experimentation",
            ],
            "preferred_qualifications": [
                "Experience in growth engineering or PLG products",
            ],
            "benefits": [
                "Remote-first collaboration",
                "Learning and wellness stipend",
            ],
            "evaluation_criteria": [
                {
                    "key": "product",
                    "label": "Product Engineering",
                    "max_score": 10,
                    "weight": 1.5,
                },
                {
                    "key": "analytics",
                    "label": "Analytics & Experiments",
                    "max_score": 10,
                    "weight": 1.3,
                },
            ],
        },
    ],
    2: [
        {
            "seed_key": "marketplace_backend_active",
            "poster_slot": 0,
            "title": "Senior Backend Engineer – Marketplace Platform (Python/Django)",
            "location": "Tinkune, Kathmandu",
            "location_type": LocationType.hybrid,
            "salary_min": 150000,
            "salary_max": 230000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": True,
            "shortlist_threshold": 65,
            "shortlist_status": ShortlistStatus.in_progress,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=20),
            "overview": "Build core marketplace systems for Nepal's largest e-commerce platform.",
            "responsibilities": [
                "Design Django REST APIs for catalog and checkout",
                "Build inventory sync for 2,000+ sellers",
                "Optimize PostgreSQL for product search",
            ],
            "requirements": [
                "5+ years Python backend experience",
                "Strong PostgreSQL and Redis skills",
                "E-commerce domain knowledge",
            ],
            "preferred_qualifications": [
                "Prior marketplace experience",
                "Payment gateway integration experience",
            ],
            "benefits": [
                "Hybrid work",
                "Festival bonuses",
                "Health insurance",
            ],
            "evaluation_criteria": [
                {
                    "key": "backend",
                    "label": "Backend Engineering",
                    "max_score": 10,
                    "weight": 2.0,
                },
                {
                    "key": "ecommerce",
                    "label": "E-commerce Domain",
                    "max_score": 10,
                    "weight": 1.5,
                },
            ],
        },
    ],
    3: [
        {
            "seed_key": "insurance_data_eng_active",
            "poster_slot": 0,
            "title": "Data Engineer – Insurance Analytics Platform (Spark/Airflow)",
            "location": "Thapathali, Kathmandu",
            "location_type": LocationType.onsite,
            "salary_min": 160000,
            "salary_max": 250000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": True,
            "shortlist_threshold": 70,
            "shortlist_status": ShortlistStatus.in_progress,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=25),
            "overview": "Build large-scale data pipelines for insurance analytics.",
            "responsibilities": [
                "Design Spark jobs processing 10TB+ daily",
                "Build Airflow DAGs for ETL orchestration",
                "Optimize Snowflake performance",
            ],
            "requirements": [
                "4+ years data engineering experience",
                "Strong Python and SQL",
                "Spark and Airflow expertise",
            ],
            "preferred_qualifications": [
                "Insurance or healthcare data experience",
                "dbt knowledge",
            ],
            "benefits": [
                "Annual performance bonus up to 20%",
                "Comprehensive health insurance",
                "International training",
            ],
            "evaluation_criteria": [
                {
                    "key": "data_eng",
                    "label": "Data Engineering",
                    "max_score": 10,
                    "weight": 2.0,
                },
                {
                    "key": "spark",
                    "label": "Spark & Airflow",
                    "max_score": 10,
                    "weight": 1.5,
                },
            ],
        },
    ],
    4: [
        {
            "seed_key": "flutter_mobile_active",
            "poster_slot": 0,
            "title": "Mobile Engineer – Flutter (iOS & Android)",
            "location": "Jawalakhel, Lalitpur",
            "location_type": LocationType.hybrid,
            "salary_min": 130000,
            "salary_max": 200000,
            "currency": "NPR",
            "status": JobStatus.active,
            "auto_shortlist": True,
            "shortlist_threshold": 65,
            "shortlist_status": ShortlistStatus.in_progress,
            "final_shortlist_completed": False,
            "expires_at": NOW + timedelta(days=18),
            "overview": "Own Khalti mobile app used by 5 million Nepalis.",
            "responsibilities": [
                "Develop Flutter app for iOS and Android",
                "Implement payment flows and biometric auth",
                "Optimize for low-end devices",
            ],
            "requirements": [
                "3+ years mobile development",
                "Strong Flutter and Dart skills",
                "Mobile security best practices",
            ],
            "preferred_qualifications": [
                "Fintech or payment app experience",
                "Nepal mobile ecosystem knowledge",
            ],
            "benefits": [
                "ESOPs for early team",
                "Festival bonuses",
                "Health insurance",
            ],
            "evaluation_criteria": [
                {
                    "key": "flutter",
                    "label": "Flutter Expertise",
                    "max_score": 10,
                    "weight": 2.0,
                },
                {
                    "key": "mobile_perf",
                    "label": "Mobile Performance",
                    "max_score": 10,
                    "weight": 1.5,
                },
            ],
        },
    ],
}

MEMBERSHIP_REQUESTS = {
    0: [
        {
            "full_name": "Sujan Khadka",
            "email": "sujan.khadka@talentmail.dev",
            "job_title": "Recruitment Operations Specialist",
            "status": MembershipStatus.pending,
        },
        {
            "full_name": "Sneha Adhikari",
            "email": "sneha.adhikari@talentmail.dev",
            "job_title": "Campus Recruiter",
            "status": MembershipStatus.pending,
        },
        {
            "full_name": "Prabin Neupane",
            "email": "prabin.neupane@talentmail.dev",
            "job_title": "Agency Recruiter",
            "status": MembershipStatus.rejected,
        },
    ],
    1: [
        {
            "full_name": "Mina Ghimire",
            "email": "mina.ghimire@talentmail.dev",
            "job_title": "Recruiter",
            "status": MembershipStatus.pending,
        },
        {
            "full_name": "Niraj Poudel",
            "email": "niraj.poudel@talentmail.dev",
            "job_title": "Technical Sourcer",
            "status": MembershipStatus.pending,
        },
        {
            "full_name": "Sagar Bhatta",
            "email": "sagar.bhatta@talentmail.dev",
            "job_title": "Contract Recruiter",
            "status": MembershipStatus.rejected,
        },
    ],
}

LIVE_APPLICATIONS = [
    {
        "candidate_index": 4,
        "company_index": 0,
        "job_seed_key": "platform_observability_active",
        "resume_index": 0,
        "score": 71,
        "feedback": "Strong backend fundamentals and clear communication. Needs one more round to verify observability depth and production debugging breadth.",
        "status": ApplicationStatus.screening,
        "created_days_ago": 9,
        "updated_days_ago": 1,
    },
    {
        "candidate_index": 3,
        "company_index": 0,
        "job_seed_key": "platform_observability_active",
        "resume_index": 1,
        "score": 78,
        "feedback": "Good systems mindset and practical platform work. Ready for shortlist review and outreach preparation.",
        "status": ApplicationStatus.shortlisted,
        "created_days_ago": 8,
        "updated_days_ago": 1,
        "email_state": "drafted",
    },
    {
        "candidate_index": 1,
        "company_index": 0,
        "job_seed_key": "platform_observability_active",
        "resume_index": 0,
        "score": 84,
        "feedback": "Excellent fit. Strong engineering leadership and sound incident response examples. Interview invite already prepared.",
        "status": ApplicationStatus.interview_booked,
        "created_days_ago": 10,
        "updated_days_ago": 0,
        "email_state": "sent",
        "interview_days_offset": 0,
        "interview_hour": 11,
    },
    {
        "candidate_index": 2,
        "company_index": 0,
        "job_seed_key": "platform_observability_active",
        "resume_index": 0,
        "score": 54,
        "feedback": "Good technical base, but the profile is more data-platform oriented than reliability engineering. We will not move forward for this role.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 7,
        "updated_days_ago": 1,
        "email_state": "discarded",
    },
    {
        "candidate_index": 0,
        "company_index": 0,
        "job_seed_key": "frontend_platform_active",
        "resume_index": 1,
        "score": None,
        "feedback": None,
        "status": ApplicationStatus.applied,
        "created_days_ago": 4,
        "updated_days_ago": 4,
    },
    {
        "candidate_index": 3,
        "company_index": 0,
        "job_seed_key": "frontend_platform_active",
        "resume_index": 0,
        "score": 63,
        "feedback": "Interesting frontend portfolio and product sense. Still in initial recruiter review.",
        "status": ApplicationStatus.screening,
        "created_days_ago": 5,
        "updated_days_ago": 2,
    },
    {
        "candidate_index": 4,
        "company_index": 0,
        "job_seed_key": "frontend_platform_active",
        "resume_index": 1,
        "score": 57,
        "feedback": "Solid frontend execution, but design-system depth is not yet strong enough for this senior platform role.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 6,
        "updated_days_ago": 1,
        "email_state": "approved",
    },
    {
        "candidate_index": 0,
        "company_index": 0,
        "job_seed_key": "platform_observability_active",
        "resume_index": 0,
        "score": 86,
        "feedback": "Excellent production ownership examples, strong architectural judgment, and clear communication. Interview loop completed successfully and Priya is aligning feedback for final decision.",
        "status": ApplicationStatus.interview_completed,
        "created_days_ago": 13,
        "updated_days_ago": 1,
        "email_state": "sent",
        "interview_days_offset": -1,
        "interview_hour": 15,
        "create_evaluations": True,
        "create_recording": True,
    },
    {
        "candidate_index": 5,
        "company_index": 0,
        "job_seed_key": "platform_observability_active",
        "resume_index": 0,
        "score": 93,
        "feedback": "Top-tier fit for the platform reliability role. Strong observability depth, incident leadership, and practical examples from fintech and SaaS environments. Offer approved by the hiring panel.",
        "status": ApplicationStatus.offer,
        "created_days_ago": 16,
        "updated_days_ago": 0,
        "email_state": "sent",
        "interview_days_offset": -3,
        "interview_hour": 11,
        "create_evaluations": True,
        "create_recording": True,
    },
    {
        "candidate_index": 7,
        "company_index": 0,
        "job_seed_key": "platform_observability_active",
        "resume_index": 1,
        "score": 58,
        "feedback": "Strong data engineering profile, but the team felt the candidate was more aligned to analytics platform work than reliability and observability ownership.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 9,
        "updated_days_ago": 2,
        "email_state": "sent",
    },
    {
        "candidate_index": 8,
        "company_index": 0,
        "job_seed_key": "platform_observability_active",
        "resume_index": 0,
        "score": None,
        "feedback": None,
        "status": ApplicationStatus.applied,
        "created_days_ago": 2,
        "updated_days_ago": 2,
    },
    {
        "candidate_index": 6,
        "company_index": 0,
        "job_seed_key": "frontend_platform_active",
        "resume_index": 0,
        "score": 89,
        "feedback": "Strong design-system depth, clear frontend platform ownership, and excellent examples of cross-team rollout. Priya approved the interview invite immediately after review.",
        "status": ApplicationStatus.interview_booked,
        "created_days_ago": 7,
        "updated_days_ago": 0,
        "email_state": "sent",
        "interview_days_offset": 3,
        "interview_hour": 10,
    },
    {
        "candidate_index": 1,
        "company_index": 0,
        "job_seed_key": "frontend_platform_active",
        "resume_index": 1,
        "score": 41,
        "feedback": "Strong AI profile overall, but this frontend platform role needs hands-on design-system ownership and React architecture depth that are not present here.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 5,
        "updated_days_ago": 2,
        "email_state": "sent",
    },
    {
        "candidate_index": 2,
        "company_index": 0,
        "job_seed_key": "frontend_platform_active",
        "resume_index": 1,
        "score": 47,
        "feedback": "Candidate has good analytical thinking but too little direct frontend engineering depth for this senior platform opening.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 6,
        "updated_days_ago": 3,
        "email_state": "approved",
    },
    {
        "candidate_index": 8,
        "company_index": 0,
        "job_seed_key": "merchant_integrations_active",
        "resume_index": 0,
        "score": 90,
        "feedback": "Excellent fit for partner APIs and merchant operations. Clear experience with webhook reliability, onboarding flows, and business-facing tooling.",
        "status": ApplicationStatus.interview_booked,
        "created_days_ago": 8,
        "updated_days_ago": 0,
        "email_state": "sent",
        "interview_days_offset": 2,
        "interview_hour": 14,
    },
    {
        "candidate_index": 0,
        "company_index": 0,
        "job_seed_key": "merchant_integrations_active",
        "resume_index": 2,
        "score": 84,
        "feedback": "Strong API architecture fundamentals, relevant fintech context, and much better alignment after Priya reviewed the merchant-focused resume variant. Interview booked for a final product-and-integrations round.",
        "status": ApplicationStatus.interview_booked,
        "created_days_ago": 9,
        "updated_days_ago": 0,
        "email_state": "sent",
        "interview_days_offset": 1,
        "interview_hour": 15,
    },
    {
        "candidate_index": 5,
        "company_index": 0,
        "job_seed_key": "merchant_integrations_active",
        "resume_index": 1,
        "score": 69,
        "feedback": "Strong reliability and platform ownership, but Priya is still deciding whether the candidate is product-facing enough for merchant integrations.",
        "status": ApplicationStatus.screening,
        "created_days_ago": 6,
        "updated_days_ago": 1,
    },
    {
        "candidate_index": 6,
        "company_index": 0,
        "job_seed_key": "merchant_integrations_active",
        "resume_index": 1,
        "score": 38,
        "feedback": "Impressive frontend background, but the role is backend-heavy and needs deep API and integration ownership.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 5,
        "updated_days_ago": 2,
        "email_state": "sent",
    },
    {
        "candidate_index": 7,
        "company_index": 0,
        "job_seed_key": "merchant_integrations_active",
        "resume_index": 1,
        "score": None,
        "feedback": None,
        "status": ApplicationStatus.applied,
        "created_days_ago": 3,
        "updated_days_ago": 3,
    },
    {
        "candidate_index": 3,
        "company_index": 0,
        "job_seed_key": "merchant_integrations_active",
        "resume_index": 0,
        "score": 83,
        "feedback": "Strong product engineering and cross-functional communication. Priya completed the interview loop and captured feedback for final calibration.",
        "status": ApplicationStatus.interview_completed,
        "created_days_ago": 11,
        "updated_days_ago": 1,
        "email_state": "sent",
        "interview_days_offset": -4,
        "interview_hour": 16,
        "create_evaluations": True,
        "create_recording": True,
    },
    {
        "candidate_index": 4,
        "company_index": 0,
        "job_seed_key": "merchant_integrations_active",
        "resume_index": 0,
        "score": 46,
        "feedback": "Shows good operations instincts, but the role needs more direct backend API ownership and external integration depth.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 7,
        "updated_days_ago": 2,
        "email_state": "approved",
    },
    {
        "candidate_index": 2,
        "company_index": 0,
        "job_seed_key": "merchant_integrations_active",
        "resume_index": 0,
        "score": 66,
        "feedback": "Interesting systems background and good SQL thinking. Priya kept the profile in screening while validating product-facing API experience.",
        "status": ApplicationStatus.screening,
        "created_days_ago": 4,
        "updated_days_ago": 1,
    },
    {
        "candidate_index": 7,
        "company_index": 0,
        "job_seed_key": "risk_analytics_active",
        "resume_index": 0,
        "score": 95,
        "feedback": "Best fit in the pipeline for risk analytics. Strong fintech data background, warehouse practices, and communication with business stakeholders. Offer prepared after final panel alignment.",
        "status": ApplicationStatus.offer,
        "created_days_ago": 15,
        "updated_days_ago": 0,
        "email_state": "sent",
        "interview_days_offset": -2,
        "interview_hour": 13,
        "create_evaluations": True,
        "create_recording": True,
    },
    {
        "candidate_index": 2,
        "company_index": 0,
        "job_seed_key": "risk_analytics_active",
        "resume_index": 0,
        "score": 84,
        "feedback": "Strong data engineering depth and good stakeholder communication. Interview invite approved and waiting on final scheduling.",
        "status": ApplicationStatus.interview_booked,
        "created_days_ago": 10,
        "updated_days_ago": 1,
        "email_state": "approved",
        "interview_days_offset": 4,
        "interview_hour": 11,
    },
    {
        "candidate_index": 5,
        "company_index": 0,
        "job_seed_key": "risk_analytics_active",
        "resume_index": 0,
        "score": 62,
        "feedback": "Excellent platform engineer, but the role needs deeper analytics engineering and warehouse modeling than the current profile demonstrates.",
        "status": ApplicationStatus.shortlisted,
        "created_days_ago": 7,
        "updated_days_ago": 1,
        "email_state": "drafted",
    },
    {
        "candidate_index": 0,
        "company_index": 0,
        "job_seed_key": "risk_analytics_active",
        "resume_index": 0,
        "score": 68,
        "feedback": "Strong systems thinker with solid SQL fundamentals. Priya is still calibrating whether the candidate is best placed in backend or analytics platform work.",
        "status": ApplicationStatus.screening,
        "created_days_ago": 5,
        "updated_days_ago": 1,
    },
    {
        "candidate_index": 8,
        "company_index": 0,
        "job_seed_key": "risk_analytics_active",
        "resume_index": 1,
        "score": 43,
        "feedback": "Good API and integrations background, but the opening is too data-platform heavy for the candidate's current strengths.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 6,
        "updated_days_ago": 2,
        "email_state": "discarded",
    },
    {
        "candidate_index": 4,
        "company_index": 0,
        "job_seed_key": "risk_analytics_active",
        "resume_index": 1,
        "score": None,
        "feedback": None,
        "status": ApplicationStatus.applied,
        "created_days_ago": 2,
        "updated_days_ago": 2,
    },
    {
        "candidate_index": 1,
        "company_index": 0,
        "job_seed_key": "risk_analytics_active",
        "resume_index": 0,
        "score": 45,
        "feedback": "The ML experience is strong, but this job needs deeper warehouse and analytics platform ownership than model-engineering work.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 7,
        "updated_days_ago": 2,
        "email_state": "sent",
    },
    {
        "candidate_index": 0,
        "company_index": 0,
        "job_seed_key": "engineering_manager_active",
        "resume_index": 1,
        "score": 87,
        "feedback": "Strong technical leadership signals, clear team mentorship examples, and credible fintech depth. Bikash shortlisted the profile while aligning final people-management expectations with the hiring panel.",
        "status": ApplicationStatus.shortlisted,
        "created_days_ago": 12,
        "updated_days_ago": 1,
        "email_state": "drafted",
    },
    {
        "candidate_index": 5,
        "company_index": 0,
        "job_seed_key": "engineering_manager_active",
        "resume_index": 1,
        "score": 73,
        "feedback": "Excellent platform leadership instincts, but Bikash is still deciding whether the profile is people-management ready or stronger as a senior IC leader.",
        "status": ApplicationStatus.screening,
        "created_days_ago": 8,
        "updated_days_ago": 1,
    },
    {
        "candidate_index": 8,
        "company_index": 0,
        "job_seed_key": "engineering_manager_active",
        "resume_index": 1,
        "score": 84,
        "feedback": "Strong stakeholder-facing engineering experience and solid product judgment. Interview scheduled to validate team leadership and organizational planning depth.",
        "status": ApplicationStatus.interview_booked,
        "created_days_ago": 9,
        "updated_days_ago": 0,
        "email_state": "sent",
        "interview_days_offset": 5,
        "interview_hour": 12,
    },
    {
        "candidate_index": 3,
        "company_index": 0,
        "job_seed_key": "engineering_manager_active",
        "resume_index": 0,
        "score": 59,
        "feedback": "Strong product engineer, but the hiring panel decided the role needs more people-management and backend leadership depth than this profile currently shows.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 7,
        "updated_days_ago": 2,
        "email_state": "sent",
    },
    {
        "candidate_index": 6,
        "company_index": 0,
        "job_seed_key": "engineering_manager_active",
        "resume_index": 1,
        "score": 52,
        "feedback": "Impressive frontend leadership background, but this opening requires a backend/platform-oriented manager with fintech systems exposure.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 6,
        "updated_days_ago": 2,
        "email_state": "approved",
    },
    {
        "candidate_index": 4,
        "company_index": 0,
        "job_seed_key": "engineering_manager_active",
        "resume_index": 0,
        "score": None,
        "feedback": None,
        "status": ApplicationStatus.applied,
        "created_days_ago": 2,
        "updated_days_ago": 2,
    },
    {
        "candidate_index": 2,
        "company_index": 1,
        "job_seed_key": "applied_ai_active",
        "resume_index": 0,
        "score": 94,
        "feedback": "Outstanding match. Strong data and ML systems experience, excellent product framing, and direct relevance to ranking and retrieval use cases.",
        "status": ApplicationStatus.offer,
        "created_days_ago": 14,
        "updated_days_ago": 1,
        "email_state": "sent",
        "interview_days_offset": -2,
        "interview_hour": 14,
        "create_evaluations": True,
        "create_recording": True,
    },
    {
        "candidate_index": 0,
        "company_index": 1,
        "job_seed_key": "applied_ai_active",
        "resume_index": 0,
        "score": 79,
        "feedback": "Good backend architecture depth and promising product thinking. Ready for shortlist outreach after one more calibration pass.",
        "status": ApplicationStatus.shortlisted,
        "created_days_ago": 11,
        "updated_days_ago": 2,
        "email_state": "drafted",
    },
    {
        "candidate_index": 4,
        "company_index": 1,
        "job_seed_key": "applied_ai_active",
        "resume_index": 1,
        "score": None,
        "feedback": None,
        "status": ApplicationStatus.applied,
        "created_days_ago": 3,
        "updated_days_ago": 3,
    },
    {
        "candidate_index": 3,
        "company_index": 1,
        "job_seed_key": "qa_automation_active",
        "resume_index": 1,
        "score": 82,
        "feedback": "Clear QA ownership examples and strong automation coverage strategy. Interview completed successfully; evaluation submitted.",
        "status": ApplicationStatus.interview_completed,
        "created_days_ago": 12,
        "updated_days_ago": 0,
        "email_state": "sent",
        "interview_days_offset": 0,
        "interview_hour": 9,
        "create_evaluations": True,
        "create_recording": True,
    },
    {
        "candidate_index": 1,
        "company_index": 1,
        "job_seed_key": "qa_automation_active",
        "resume_index": 1,
        "score": 77,
        "feedback": "Good cross-functional QA communication and reliable automation approach. Interview booked for later this week.",
        "status": ApplicationStatus.interview_booked,
        "created_days_ago": 9,
        "updated_days_ago": 1,
        "email_state": "approved",
        "interview_days_offset": 2,
        "interview_hour": 13,
    },
    {
        "candidate_index": 0,
        "company_index": 1,
        "job_seed_key": "qa_automation_active",
        "resume_index": 1,
        "score": 49,
        "feedback": "Strong engineering profile overall, but not enough direct automation ownership for this staff-level QA opening.",
        "status": ApplicationStatus.rejected,
        "created_days_ago": 8,
        "updated_days_ago": 2,
        "email_state": "sent",
    },
]

AI_DRAFT_BLUEPRINTS = [
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "job-ai-platform-observability",
        "status": "awaiting_human",
        "mode": "create",
        "source_prompt": "Create a backend platform reliability role focused on observability, internal tooling, and developer enablement.",
        "locked_fields": ["location", "currency"],
        "latest_draft": {
            "title": "Senior Platform Reliability Engineer",
            "location": "Kathmandu",
            "location_type": LocationType.hybrid,
            "salary_min": 130000,
            "salary_max": 190000,
            "currency": "NPR",
            "status": JobStatus.draft,
            "shortlist_threshold": 68,
            "overview": "Own reliability tooling, internal platform APIs, and observability for high-throughput engineering teams.",
            "responsibilities": [
                "Improve production diagnostics and alerting quality",
                "Build internal APIs and automation for developer teams",
                "Partner with DevOps and backend leads on reliability goals",
            ],
            "requirements": [
                "Strong Python backend experience",
                "Hands-on observability and production support experience",
                "Solid SQL and systems-debugging fundamentals",
            ],
            "preferred_qualifications": ["Experience in fintech or regulated products"],
            "benefits": ["Hybrid work", "Health insurance", "Learning budget"],
            "auto_shortlist": True,
            "assumptions": [
                "The role will work closely with the core payments team",
                "The team prefers Kathmandu-based collaboration for at least part of the week",
            ],
            "missing_fields": [],
            "warnings": ["On-call expectations should be confirmed before publishing."],
        },
        "salary_research": {
            "role": "Senior Platform Reliability Engineer",
            "country": "Nepal",
            "currency": "NPR",
            "recommended_min": 130000,
            "recommended_max": 190000,
            "confidence": "medium",
            "rationale": "Comparable Kathmandu senior backend and DevOps roles cluster in the 1.3L to 1.9L NPR range.",
            "sources": [
                {
                    "source_name": "Local hiring benchmark",
                    "url": "https://example.com/salary-benchmark/platform-reliability",
                    "country": "Nepal",
                    "currency": "NPR",
                    "quoted_min": 120000,
                    "quoted_max": 185000,
                    "notes": "Used as a directional market signal for senior platform roles.",
                }
            ],
            "insufficient_evidence": False,
        },
        "assumptions": [
            "Hiring manager wants a senior IC rather than a team lead",
        ],
        "warnings": ["Compensation should be validated before publishing."],
        "missing_fields": [],
    },
    {
        "company_index": 1,
        "recruiter_slot": 1,
        "thread_id": "job-ai-growth-engineer",
        "status": "draft_saved",
        "mode": "create",
        "source_prompt": "Draft a growth engineer role for candidate acquisition funnels and experiment-driven product growth.",
        "locked_fields": [],
        "latest_draft": {
            "title": "Growth Engineer",
            "location": "Lalitpur",
            "location_type": LocationType.remote,
            "salary_min": 100000,
            "salary_max": 155000,
            "currency": "NPR",
            "status": JobStatus.draft,
            "shortlist_threshold": 65,
            "overview": "Ship acquisition experiments, landing page improvements, and measurement loops that help grow candidate supply.",
            "responsibilities": [
                "Build growth experiments end to end",
                "Instrument and analyze candidate funnel performance",
                "Collaborate with product and marketing on iteration cycles",
            ],
            "requirements": [
                "Strong product engineering instincts",
                "Comfort with analytics and experimentation",
                "Ability to move quickly with clear measurement",
            ],
            "preferred_qualifications": ["Marketplace or PLG experience"],
            "benefits": ["Remote-first setup", "Health insurance", "Growth bonus"],
            "auto_shortlist": False,
            "assumptions": ["The role will report into product, not marketing."],
            "missing_fields": ["Exact interview loop"],
            "warnings": ["Success metrics should be finalized before publishing."],
        },
        "salary_research": None,
        "assumptions": [
            "This role will be measured primarily on conversion efficiency."
        ],
        "warnings": [
            "Compensation band may need calibration against product engineering roles."
        ],
        "missing_fields": ["Hiring manager"],
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "job-ai-risk-analytics-lead",
        "status": "awaiting_human",
        "mode": "create",
        "source_prompt": "Draft a senior risk analytics platform role for F1Soft's transaction monitoring, reconciliation, and finance reporting stack.",
        "locked_fields": ["currency", "location"],
        "latest_draft": {
            "title": "Senior Risk Analytics Platform Engineer",
            "location": "Kathmandu",
            "location_type": LocationType.hybrid,
            "salary_min": 155000,
            "salary_max": 225000,
            "currency": "NPR",
            "status": JobStatus.draft,
            "shortlist_threshold": 72,
            "overview": "Build the data platform behind transaction monitoring, merchant risk analytics, and finance-grade reporting across payment operations.",
            "responsibilities": [
                "Own warehouse models and orchestration for risk and finance analytics",
                "Improve quality, lineage, and stakeholder trust in operational datasets",
                "Partner with product, finance, and risk teams on metric definitions",
            ],
            "requirements": [
                "Strong SQL and Python data engineering background",
                "Hands-on Airflow and dbt experience",
                "Good product judgment when working with business metrics",
            ],
            "preferred_qualifications": [
                "Fintech analytics or reconciliation experience"
            ],
            "benefits": ["Hybrid work", "Health insurance", "Quarterly bonus"],
            "auto_shortlist": True,
            "assumptions": [
                "The role should sit between data platform and business analytics ownership."
            ],
            "missing_fields": ["Final reporting line"],
            "warnings": [
                "The panel may want to split this into platform and analytics tracks later."
            ],
        },
        "salary_research": {
            "role": "Senior Risk Analytics Platform Engineer",
            "country": "Nepal",
            "currency": "NPR",
            "recommended_min": 155000,
            "recommended_max": 225000,
            "confidence": "medium",
            "rationale": "Comparable fintech data platform roles in Kathmandu tend to cluster in the upper senior IC range.",
            "sources": [
                {
                    "source_name": "Internal recruiter benchmark",
                    "url": "https://example.com/salary-benchmark/data-platform-nepal",
                    "country": "Nepal",
                    "currency": "NPR",
                    "quoted_min": 145000,
                    "quoted_max": 220000,
                    "notes": "Directional benchmark used during recruiter calibration.",
                }
            ],
            "insufficient_evidence": False,
        },
        "assumptions": [
            "Priya intends to keep this role senior IC rather than people-manager."
        ],
        "warnings": [
            "Compensation needs final approval from finance before the role is published."
        ],
        "missing_fields": ["Hiring manager", "Interview panel"],
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "job-ai-merchant-platform-followup",
        "status": "draft_saved",
        "mode": "create",
        "source_prompt": "Draft a follow-up backend role focused on merchant platform tooling, partner enablement, and operational integrations for F1Soft.",
        "locked_fields": ["currency"],
        "latest_draft": {
            "title": "Backend Engineer (Merchant Platform Tooling)",
            "location": "Kathmandu",
            "location_type": LocationType.hybrid,
            "salary_min": 135000,
            "salary_max": 198000,
            "currency": "NPR",
            "status": JobStatus.draft,
            "shortlist_threshold": 68,
            "overview": "Build the internal APIs, onboarding workflows, and operational support tools that help F1Soft scale merchant integrations cleanly.",
            "responsibilities": [
                "Ship partner enablement APIs and merchant tooling improvements",
                "Improve diagnostics and internal workflows for merchant operations teams",
                "Collaborate with commercial and support stakeholders on integration quality",
            ],
            "requirements": [
                "Strong backend API development experience",
                "Comfort working across product and business-facing workflows",
                "Good debugging and operational ownership instincts",
            ],
            "preferred_qualifications": ["Payments or merchant platform experience"],
            "benefits": ["Hybrid work", "Health insurance", "Festival bonuses"],
            "auto_shortlist": True,
            "assumptions": [
                "Priya intends this role to support the main merchant integrations team rather than replace it."
            ],
            "missing_fields": ["Hiring manager", "Final level calibration"],
            "warnings": [
                "This role overlaps with the existing merchant integrations opening and may need scope clarification."
            ],
        },
        "salary_research": None,
        "assumptions": [
            "The role should be positioned as a platform extension role rather than a customer-facing integrations lead."
        ],
        "warnings": [
            "The team should avoid opening this role until the current merchant integrations pipeline is resolved."
        ],
        "missing_fields": ["Approval status", "Team placement"],
    },
]

CHAT_SESSION_BLUEPRINTS = [
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-payments-overview",
        "title": "Backend hiring pipeline review",
        "last_interaction_offset_hours": 4,
    },
    {
        "company_index": 0,
        "recruiter_slot": 1,
        "thread_id": "recruiter-chat-frontend-salary-research",
        "title": "Frontend compensation research",
        "last_interaction_offset_hours": 26,
    },
    {
        "company_index": 1,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-ai-role-summary",
        "title": "AI engineer candidate search",
        "last_interaction_offset_hours": 8,
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-platform-calibration",
        "title": "Platform reliability calibration notes",
        "last_interaction_offset_hours": 2,
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-merchant-shortlist-batch",
        "title": "Merchant integrations shortlist batch",
        "last_interaction_offset_hours": 6,
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-risk-analytics-forecast",
        "title": "Risk analytics hiring forecast",
        "last_interaction_offset_hours": 12,
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-offer-prep-nischal",
        "title": "Offer prep for Nischal Kharel",
        "last_interaction_offset_hours": 18,
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-outreach-approval-queue",
        "title": "Outreach approval queue review",
        "last_interaction_offset_hours": 1,
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-interview-reschedule-log",
        "title": "Interview reschedule and follow-up log",
        "last_interaction_offset_hours": 9,
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-rejection-copy-notes",
        "title": "Rejection copy and candidate notes",
        "last_interaction_offset_hours": 14,
    },
    {
        "company_index": 0,
        "recruiter_slot": 0,
        "thread_id": "recruiter-chat-eng-manager-panel-sync",
        "title": "Engineering manager panel sync",
        "last_interaction_offset_hours": 21,
    },
]

RESUME_IMPORT_TASK_BLUEPRINTS = [
    {
        "candidate_index": 0,
        "status": "completed",
        "source_file_name": "aashish-basnet-backend-resume.pdf",
        "result_data": {
            "headline": "Senior Backend Engineer | Payments & Platform Reliability",
            "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "AWS"],
            "summary": "Imported successfully with strong alignment to backend platform roles.",
        },
    },
    {
        "candidate_index": 0,
        "status": "completed",
        "source_file_name": "aashish-basnet-merchant-integrations.pdf",
        "result_data": {
            "headline": "Senior Backend Engineer | Merchant APIs and Integration Workflows",
            "skills": [
                "Python",
                "FastAPI",
                "PostgreSQL",
                "Redis",
                "API Security",
                "Webhook Systems",
            ],
            "summary": "Imported successfully and used as a targeted resume for merchant integration opportunities.",
        },
    },
    {
        "candidate_index": 0,
        "status": "failed",
        "source_file_name": "aashish-basnet-old-scan.pdf",
        "error_message": "The uploaded scan was low quality and several sections could not be extracted reliably.",
    },
    {
        "candidate_index": 4,
        "status": "failed",
        "source_file_name": "richa-product-designer-resume.pdf",
        "error_message": "The uploaded file was incomplete and could not be parsed end to end.",
    },
    {
        "candidate_index": 5,
        "status": "completed",
        "source_file_name": "nischal-kharel-sre-resume.pdf",
        "result_data": {
            "headline": "Staff Platform Engineer | Reliability and Observability",
            "skills": [
                "Kubernetes",
                "Prometheus",
                "Grafana",
                "OpenTelemetry",
                "Python",
            ],
            "summary": "Imported successfully with strong alignment to platform reliability openings.",
        },
    },
]


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
    user_id,
    company_id,
    role: MembershipRole,
    job_title: str,
    status: MembershipStatus = MembershipStatus.active,
) -> CompanyMembership:
    return CompanyMembership(
        user_id=user_id,
        company_id=company_id,
        role=role,
        status=status,
        job_title=job_title,
    )


def make_job(
    company_id,
    posted_by,
    data: dict,
    *,
    status: JobStatus = JobStatus.expired,
    auto_shortlist: bool = False,
    shortlist_status: ShortlistStatus = ShortlistStatus.completed,
    final_shortlist_completed: bool = True,
    hiring_completed: bool = False,
    expires_at: datetime | None = EXPIRED_DATE,
) -> Job:
    return Job(
        company_id=company_id,
        posted_by=posted_by,
        title=data["title"],
        location=data["location"],
        location_type=data["location_type"],
        salary_min=data["salary_min"],
        salary_max=data["salary_max"],
        currency=data["currency"],
        status=status,
        overview=data["overview"],
        responsibilities=data["responsibilities"],
        requirements=data["requirements"],
        preferred_qualifications=data["preferred_qualifications"],
        benefits=data["benefits"],
        auto_shortlist=auto_shortlist,
        shortlist_threshold=data.get("shortlist_threshold", 70),
        shortlist_status=shortlist_status,
        final_shortlist_completed=final_shortlist_completed,
        hiring_completed=hiring_completed,
        expires_at=expires_at,
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


async def ensure_schema() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


async def clear_existing_data() -> None:
    table_names = [f'"{table.name}"' for table in reversed(Base.metadata.sorted_tables)]
    if not table_names:
        return

    async with engine.begin() as connection:
        await connection.execute(
            text(f"TRUNCATE TABLE {', '.join(table_names)} RESTART IDENTITY CASCADE")
        )


def build_credentials_document() -> dict:
    accounts: list[dict] = []

    for company in COMPANIES:
        accounts.append(
            {
                "full_name": company["admin"]["full_name"],
                "email": company["admin"]["email"],
                "primary_role": UserRole.recruiter_admin.value,
                "company": company["name"],
                "membership_role": MembershipRole.admin.value,
                "membership_status": MembershipStatus.active.value,
                "job_title": company["admin"]["job_title"],
            }
        )

        for recruiter in company["recruiters"]:
            accounts.append(
                {
                    "full_name": recruiter["full_name"],
                    "email": recruiter["email"],
                    "primary_role": UserRole.recruiter.value,
                    "company": company["name"],
                    "membership_role": MembershipRole.recruiter.value,
                    "membership_status": MembershipStatus.active.value,
                    "job_title": recruiter["job_title"],
                }
            )

    for candidate in CANDIDATES:
        accounts.append(
            {
                "full_name": candidate["full_name"],
                "email": candidate["email"],
                "primary_role": UserRole.candidate.value,
            }
        )

    for company_index, requests in MEMBERSHIP_REQUESTS.items():
        company_name = COMPANIES[company_index]["name"]
        for request in requests:
            accounts.append(
                {
                    "full_name": request["full_name"],
                    "email": request["email"],
                    "primary_role": UserRole.recruiter.value,
                    "company": company_name,
                    "membership_role": MembershipRole.recruiter.value,
                    "membership_status": request["status"].value,
                    "job_title": request["job_title"],
                }
            )

    return {
        "generated_from": "backend/seed_data.py",
        "default_password": DEFAULT_LOGIN_PASSWORD,
        "notes": [
            "All seeded accounts use the default password unless the seed script is changed.",
            "Pending and rejected recruiter membership users are included for completeness, but their company access reflects the membership_status field.",
        ],
        "accounts": accounts,
    }


def write_credentials_file() -> Path:
    credentials_path = Path(__file__).with_name("credentials.json")
    credentials_path.write_text(
        json.dumps(build_credentials_document(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return credentials_path


def get_historical_job_dates(
    company_index: int, job_index: int
) -> tuple[datetime, datetime]:
    """Spread completed hiring cycles across multiple years for realistic trend data."""

    days_ago = 150 + (company_index * 540) + (job_index * 140)
    expires_at = NOW - timedelta(days=days_ago)
    created_at = expires_at - timedelta(days=45 + (job_index * 6))
    return created_at, expires_at


async def create_job_with_schema(
    db,
    company_id,
    posted_by,
    data: dict,
    *,
    status: JobStatus,
    auto_shortlist: bool,
    shortlist_status: ShortlistStatus,
    final_shortlist_completed: bool,
    expires_at: datetime | None,
    hiring_completed: bool = False,
) -> Job:
    job = make_job(
        company_id,
        posted_by,
        data,
        status=status,
        auto_shortlist=auto_shortlist,
        shortlist_status=shortlist_status,
        final_shortlist_completed=final_shortlist_completed,
        hiring_completed=hiring_completed,
        expires_at=expires_at,
    )
    db.add(job)
    await db.flush()

    eval_criteria = data.get("evaluation_criteria", [])
    if eval_criteria:
        db.add(
            JobEvaluationSchema(
                job_id=job.id,
                version=1,
                criteria=eval_criteria,
                human_weight=0.6,
                llm_weight=0.4,
            )
        )
        await db.flush()

    return job


def build_shared_snapshot(
    candidate_user: User, candidate_data: dict, share: dict
) -> dict:
    return {
        "shared_full_name": candidate_user.full_name,
        "shared_email_value": candidate_user.email if share["share_email"] else None,
        "shared_phone_value": candidate_data["phone"] if share["share_phone"] else None,
        "shared_location_value": candidate_data["location"]
        if share["share_location"]
        else None,
        "shared_headline_value": candidate_data["headline"]
        if share["share_headline_summary"]
        else None,
        "shared_summary_value": candidate_data["summary"]
        if share["share_headline_summary"]
        else None,
        "shared_linkedin_url": candidate_data.get("linkedin_url")
        if share["share_links"]
        else None,
        "shared_github_url": candidate_data.get("github_url")
        if share["share_links"]
        else None,
        "shared_portfolio_url": candidate_data.get("portfolio_url")
        if share["share_links"]
        else None,
        "shared_avatar_url": None,
    }


# ============================================================================
# SEEDING FUNCTIONS
# ============================================================================


async def seed_company(
    db, company_index: int, company_data: dict
) -> tuple[Company, list[Job], dict[str, Job], User, list[User]]:
    """Seed a single company and return company context for downstream seed steps."""

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
    print(f"  ✓ Company created: {company.name} ({company.industry})")

    db.add(
        make_membership(
            admin.id, company.id, MembershipRole.admin, admin_info["job_title"]
        )
    )
    print(f"    • Admin: {admin.full_name} ({admin.email})")

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
        print(f"    • Recruiter: {r.full_name} ({r.email})")

    created_jobs: list[Job] = []
    extra_jobs: dict[str, Job] = {}
    posters = [admin] + recruiter_users
    print(f"  ✓ Creating {len(company_data['jobs'])} jobs for {company.name}...")
    for i, job_data in enumerate(company_data["jobs"]):
        job_created_at, job_expires_at = get_historical_job_dates(company_index, i)
        job = await create_job_with_schema(
            db,
            company.id,
            posters[i % len(posters)].id,
            job_data,
            status=JobStatus.expired,
            auto_shortlist=False,
            shortlist_status=ShortlistStatus.completed,
            final_shortlist_completed=True,
            expires_at=job_expires_at,
        )
        job.created_at = job_created_at
        job.updated_at = job_expires_at - timedelta(days=1)
        created_jobs.append(job)
        print(f"      • Job {i + 1}: {job.title[:60]}... (status: {job.status.value})")

    for request in MEMBERSHIP_REQUESTS.get(company_index, []):
        request_user = make_user(
            request["full_name"], request["email"], UserRole.recruiter
        )
        db.add(request_user)
        await db.flush()
        db.add(
            make_membership(
                request_user.id,
                company.id,
                MembershipRole.recruiter,
                request["job_title"],
                status=request["status"],
            )
        )

    for job_data in EXTRA_COMPANY_JOBS.get(company_index, []):
        poster = posters[job_data["poster_slot"] % len(posters)]
        job = await create_job_with_schema(
            db,
            company.id,
            poster.id,
            job_data,
            status=job_data["status"],
            auto_shortlist=job_data.get("auto_shortlist", False),
            shortlist_status=job_data.get(
                "shortlist_status", ShortlistStatus.not_started
            ),
            final_shortlist_completed=job_data.get("final_shortlist_completed", False),
            expires_at=job_data.get("expires_at"),
            hiring_completed=job_data.get("hiring_completed", False),
        )
        job.created_at = NOW - timedelta(
            days=55 + (company_index * 15) + (job_data["poster_slot"] * 6)
        )
        job.updated_at = NOW - timedelta(days=max(1, 8 - job_data["poster_slot"]))
        extra_jobs[job_data["seed_key"]] = job

    print(
        f"  ✓ {company_data['name']}: 1 admin, {len(recruiter_users)} recruiters, "
        f"{len(created_jobs)} completed jobs, {len(extra_jobs)} live/draft jobs"
    )
    return company, created_jobs, extra_jobs, admin, recruiter_users


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
        f"  ✓ Candidate: {data['full_name']} ({data['email']}) — profile + {len(resumes)} resume(s)"
    )
    return user, resumes


async def seed_applications(
    db,
    candidate_users: list[tuple[User, list[Resume]]],
    company_jobs: list[list[Job]],
    company_data_list: list[dict],
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

        cand_data = CANDIDATES[cand_idx]
        shared_snapshot = build_shared_snapshot(candidate_user, cand_data, share)

        # Application history follows each completed job's own timeline.
        days_before_expiry = 7 + (application_counter * 3) % 21
        job_expiry = job.expires_at or EXPIRED_DATE
        app_created = job_expiry - timedelta(days=days_before_expiry)
        app_updated = min(NOW - timedelta(days=1), job_expiry - timedelta(days=1))

        application = Application(
            job_id=job.id,
            user_id=candidate_user.id,
            resume_id=resume.id,
            score=score,
            feedback=feedback,
            status=target_status,
            shortlist_notified=True,
            created_at=app_created,
            updated_at=app_updated,
            # Share settings
            share_profile_all=share["share_profile_all"],
            share_avatar=share["share_avatar"],
            share_email=share["share_email"],
            share_phone=share["share_phone"],
            share_location=share["share_location"],
            share_links=share["share_links"],
            share_headline_summary=share["share_headline_summary"],
            **shared_snapshot,
        )
        db.add(application)
        await db.flush()
        db.add(
            ApplicationSyncEvent(
                application_id=application.id, action=SyncAction.UPSERT
            )
        )
        application_counter += 1

        # Log application creation
        status_emoji = {
            ApplicationStatus.applied: "📝",
            ApplicationStatus.screening: "🔍",
            ApplicationStatus.shortlisted: "⭐",
            ApplicationStatus.rejected: "❌",
            ApplicationStatus.interview_booked: "📅",
            ApplicationStatus.interview_completed: "✅",
            ApplicationStatus.offer: "🎁",
            ApplicationStatus.offer_accepted: "🎉",
            ApplicationStatus.offer_declined: "🙅",
        }
        emoji = status_emoji.get(target_status, "•")
        print(
            f"    {emoji} {CANDIDATES[cand_idx]['full_name']} → {job.title[:50]}... "
            f"[score={score}, status={target_status.value}]"
        )

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
            interview_base = app_created + timedelta(
                days=4 + (interview_counter % 4),
                hours=10 + (interview_counter % 3),
            )
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


async def seed_live_pipeline_data(
    db,
    candidate_users: list[tuple[User, list[Resume]]],
    company_contexts: list[dict],
) -> None:
    print(
        "\n📈 Seeding active pipeline applications, drafts, evaluations, and recordings..."
    )

    application_counter = 0
    interview_counter = 0
    evaluation_counter = 0
    recording_counter = 0
    draft_counter = 0

    for spec in LIVE_APPLICATIONS:
        candidate_user, candidate_resumes = candidate_users[spec["candidate_index"]]
        candidate_data = CANDIDATES[spec["candidate_index"]]
        company_context = company_contexts[spec["company_index"]]
        company_data = company_context["company_data"]
        job = company_context["extra_jobs"][spec["job_seed_key"]]
        resume = candidate_resumes[spec["resume_index"]]

        share = {
            "share_profile_all": True,
            "share_avatar": True,
            "share_email": True,
            "share_phone": True,
            "share_location": True,
            "share_links": True,
            "share_headline_summary": True,
        }
        share.update(spec.get("share_overrides", {}))

        created_at = NOW - timedelta(days=spec["created_days_ago"])
        updated_at = NOW - timedelta(days=spec["updated_days_ago"])
        shared_snapshot = build_shared_snapshot(candidate_user, candidate_data, share)

        application = Application(
            job_id=job.id,
            user_id=candidate_user.id,
            resume_id=resume.id,
            score=spec.get("score"),
            feedback=spec.get("feedback"),
            status=spec["status"],
            shortlist_notified=spec.get("email_state") == "sent",
            created_at=created_at,
            updated_at=updated_at,
            share_profile_all=share["share_profile_all"],
            share_avatar=share["share_avatar"],
            share_email=share["share_email"],
            share_phone=share["share_phone"],
            share_location=share["share_location"],
            share_links=share["share_links"],
            share_headline_summary=share["share_headline_summary"],
            **shared_snapshot,
        )
        db.add(application)
        await db.flush()
        db.add(
            ApplicationSyncEvent(
                application_id=application.id, action=SyncAction.UPSERT
            )
        )
        application_counter += 1

        email_state = spec.get("email_state")
        if email_state:
            if spec["status"] == ApplicationStatus.rejected:
                subject, body = generate_rejection_email(
                    candidate_user.full_name,
                    job.title,
                    company_data["name"],
                    spec.get("feedback") or "Thank you for your time and interest.",
                )
            else:
                subject, body = generate_shortlist_email(
                    candidate_user.full_name,
                    job.title,
                    company_data["name"],
                    company_data["cal_booking_url"],
                )

            db.add(
                EmailDraft(
                    application_id=application.id,
                    subject=subject,
                    body=body,
                    is_approved=email_state in {"approved", "sent"},
                    is_sent=email_state == "sent",
                    is_discarded=email_state == "discarded",
                )
            )
            draft_counter += 1

        interview_days_offset = spec.get("interview_days_offset")
        if interview_days_offset is not None:
            interview_start = NOW.replace(
                hour=spec.get("interview_hour", 11)
            ) + timedelta(days=interview_days_offset)
            db.add(
                Interview(
                    application_id=application.id,
                    cal_booking_uid=f"cal-booking-live-{uuid.uuid4().hex[:12]}",
                    candidate_name=candidate_user.full_name,
                    candidate_email=candidate_user.email,
                    start_time=interview_start,
                    end_time=interview_start + timedelta(minutes=50),
                    timezone="Asia/Kathmandu",
                    location="Google Meet",
                    title=f"Interview: {candidate_user.full_name} – {job.title}",
                )
            )
            interview_counter += 1

        if spec.get("create_evaluations"):
            schema = await db.scalar(
                select(JobEvaluationSchema).where(JobEvaluationSchema.job_id == job.id)
            )
            if schema is not None:
                candidate_score = float(spec.get("score") or 75)
                human_scores = {
                    item["key"]: min(10.0, round(candidate_score / 10, 1))
                    for item in schema.criteria
                }
                llm_scores = {
                    item["key"]: max(
                        5.0, min(10.0, round((candidate_score - 4) / 10, 1))
                    )
                    for item in schema.criteria
                }

                db.add(
                    CandidateEvaluationScore(
                        application_id=application.id,
                        job_id=job.id,
                        schema_id=schema.id,
                        schema_version=schema.version,
                        evaluator_type="human",
                        scores=human_scores,
                        criteria_snapshot=schema.criteria,
                        notes="Human interview panel found strong evidence of role alignment and practical execution.",
                        weighted_total=round(candidate_score / 10, 2),
                        submitted_by_user_id=company_context["recruiters"][0].id,
                    )
                )
                db.add(
                    CandidateEvaluationScore(
                        application_id=application.id,
                        job_id=job.id,
                        schema_id=schema.id,
                        schema_version=schema.version,
                        evaluator_type="llm",
                        scores=llm_scores,
                        criteria_snapshot=schema.criteria,
                        notes="LLM evaluation mirrored the strongest signals from the interview transcript and structured answers.",
                        weighted_total=round(max(candidate_score - 4, 50) / 10, 2),
                        submitted_by_user_id=None,
                    )
                )
                evaluation_counter += 2

        if spec.get("create_recording"):
            db.add(
                InterviewRecording(
                    application_id=application.id,
                    s3_audio_url=f"https://demo-bucket.example.com/interviews/{application.id}.mp3",
                    s3_audio_key=f"interviews/{application.id}.mp3",
                    transcript="Candidate walked through architecture tradeoffs, testing strategy, and practical decision-making with strong clarity.",
                    evaluation="Communication was clear, examples were concrete, and answers mapped well to the role's core expectations.",
                    status=RecordingStatus.evaluated,
                    duration_seconds=2840,
                )
            )
            recording_counter += 1

    await db.flush()
    print(f"  ✓ Live applications: {application_counter}")
    print(f"  ✓ Live email drafts: {draft_counter}")
    print(f"  ✓ Live interviews: {interview_counter}")
    print(f"  ✓ Evaluation records: {evaluation_counter}")
    print(f"  ✓ Interview recordings: {recording_counter}")


def _seed_chat_history_message(
    role: str,
    content: str,
    *,
    hours_ago: int,
    response_type: str | None = None,
    data: dict | None = None,
) -> dict:
    return {
        "role": role,
        "content": content,
        "created_at": (NOW - timedelta(hours=hours_ago)).isoformat(),
        "response_type": response_type,
        "data": data,
    }


def _build_chat_session_state(blueprint: dict) -> dict:
    title = blueprint["title"].lower()
    base_history = [
        _seed_chat_history_message(
            "user",
            blueprint["title"],
            hours_ago=blueprint["last_interaction_offset_hours"] + 2,
        ),
    ]

    if "salary" in title or "compensation" in title:
        base_history.append(
            _seed_chat_history_message(
                "assistant",
                "I compiled the latest frontend compensation benchmark for Nepal and nearby remote markets.",
                hours_ago=blueprint["last_interaction_offset_hours"],
                response_type="salary_answer",
                data={
                    "role": "Frontend Engineer",
                    "country": "Nepal",
                    "currency": "NPR",
                    "recommended_min": 1800000,
                    "recommended_max": 2600000,
                },
            )
        )
    elif "edit" in title or "calibration" in title or "panel sync" in title:
        base_history.append(
            _seed_chat_history_message(
                "assistant",
                "I prepared a safe job update preview for review before anything is applied.",
                hours_ago=blueprint["last_interaction_offset_hours"],
                response_type="job_edit_preview",
                data={
                    "job_id": str(uuid.uuid4()),
                    "job_title": "Platform Reliability Engineer",
                    "summary": "Update the requirements and tighten the reliability ownership language.",
                    "patch": {"title": "Senior Platform Reliability Engineer"},
                    "diffs": [
                        {
                            "field": "title",
                            "before": "Platform Reliability Engineer",
                            "after": "Senior Platform Reliability Engineer",
                        }
                    ],
                },
            )
        )
    else:
        base_history.append(
            _seed_chat_history_message(
                "assistant",
                "Here is a company job query summary with the roles that need attention next.",
                hours_ago=blueprint["last_interaction_offset_hours"],
                response_type="job_list",
                data={
                    "total": 3,
                    "counts": {"active": 2, "draft": 1, "expired": 0},
                    "jobs": [],
                },
            )
        )

    return {
        "mode": "idle",
        "history": base_history,
        "salary_slots": {
            "role": "Frontend Engineer" if "salary" in title else None,
            "country": "Nepal" if "salary" in title else None,
            "period": "yearly" if "salary" in title else None,
            "year": NOW.year if "salary" in title else None,
        },
        "pending_job_match": None,
        "pending_edit": None,
        "default_scope": "company",
        "seeded": True,
        "title": blueprint["title"],
    }


def _status_activity_copy(
    status: ApplicationStatus, company_name: str, job_title: str
) -> tuple[str, str]:
    if status == ApplicationStatus.screening:
        return (
            f"{company_name} is reviewing your application",
            f"Your {job_title} application moved into screening.",
        )
    if status == ApplicationStatus.shortlisted:
        return (
            f"Shortlisted for {job_title}",
            f"{company_name} shortlisted you for the next stage.",
        )
    if status == ApplicationStatus.interview_booked:
        return (
            f"Interview stage opened for {job_title}",
            f"{company_name} moved your application into the interview stage.",
        )
    if status == ApplicationStatus.interview_completed:
        return (
            f"Interview completed for {job_title}",
            f"Your interview loop for {job_title} has been completed.",
        )
    if status == ApplicationStatus.offer:
        return (
            f"Offer stage reached for {job_title}",
            f"{company_name} recorded an offer outcome for your application.",
        )
    return (
        f"Application closed for {job_title}",
        f"{company_name} closed your application after review.",
    )


async def seed_preferences_and_activity(
    db,
    company_contexts: list[dict],
) -> None:
    print("\n🔔 Seeding recruiter preferences, activity events, and notifications...")

    preference_counter = 0
    activity_counter = 0

    company_context_by_id = {
        context["company"].id: context for context in company_contexts
    }
    active_member_ids_by_company = {
        context["company"].id: [
            context["admin"].id,
            *[member.id for member in context["recruiters"]],
        ]
        for context in company_contexts
    }
    notifications_enabled_by_user_id = {
        member_id: True
        for member_ids in active_member_ids_by_company.values()
        for member_id in member_ids
    }

    async def create_seed_event(*, created_at: datetime, **kwargs):
        event = ActivityEvent(
            id=uuid.uuid4(),
            event_type=kwargs["event_type"],
            audience=kwargs["audience"],
            title=kwargs["title"],
            description=kwargs.get("description"),
            href=kwargs.get("href"),
            user_id=kwargs.get("user_id"),
            company_id=kwargs.get("company_id"),
            application_id=kwargs.get("application_id"),
            job_id=kwargs.get("job_id"),
            interview_id=kwargs.get("interview_id"),
            draft_id=kwargs.get("draft_id"),
            actor_user_id=kwargs.get("actor_user_id"),
            metadata_json=kwargs.get("metadata"),
        )
        event.created_at = created_at
        db.add(event)

        notification_targets: list[uuid.UUID] = []
        if kwargs.get("user_id") is not None:
            target_user_id = kwargs["user_id"]
            if notifications_enabled_by_user_id.get(target_user_id, True):
                notification_targets.append(target_user_id)
        elif kwargs.get("company_id") is not None:
            notification_targets.extend(
                user_id
                for user_id in active_member_ids_by_company.get(
                    kwargs["company_id"], []
                )
                if notifications_enabled_by_user_id.get(user_id, True)
            )

        for target_user_id in notification_targets:
            notification = Notification(
                kind=kwargs["event_type"],
                title=kwargs["title"],
                body=kwargs.get("description") or kwargs["title"],
                href=kwargs.get("href"),
                user_id=target_user_id,
                company_id=kwargs.get("company_id"),
                activity_event_id=event.id,
            )
            notification.created_at = created_at
            db.add(notification)
        return event

    for company_index, company_context in enumerate(company_contexts):
        members = [company_context["admin"], *company_context["recruiters"]]
        for member_index, member in enumerate(members):
            db.add(
                RecruiterPreference(
                    user_id=member.id,
                    timezone="Asia/Kathmandu",
                    notification_email_enabled=True,
                    notification_in_app_enabled=True,
                    default_interview_duration_minutes=45 + (member_index * 15),
                    default_interview_buffer_minutes=15 if member_index == 0 else 10,
                    outreach_signature=(
                        f"{member.full_name}\n"
                        f"{company_context['company_data']['name']}\n"
                        "ConvexHire Recruiting Team"
                    ),
                    chat_default_scope="company"
                    if company_index == 0
                    else "candidates",
                )
            )
            preference_counter += 1

    await db.flush()
    await db.commit()

    with db.no_autoflush:
        applications_result = await db.execute(
            select(Application, Job, Company, User)
            .join(Job, Job.id == Application.job_id)
            .join(Company, Company.id == Job.company_id)
            .join(User, User.id == Application.user_id)
            .order_by(Application.created_at.asc())
        )
    for application, job, company, candidate in applications_result.all():
        company_context = company_context_by_id.get(company.id)
        if company_context is None:
            continue

        actors = [company_context["admin"], *company_context["recruiters"]]
        actor = next(
            (member for member in actors if member.id == job.posted_by), actors[0]
        )

        await create_seed_event(
            created_at=application.created_at,
            event_type="application_applied",
            audience="candidate",
            title=f"Applied to {job.title}",
            description=f"You submitted your application to {company.name}.",
            href=f"/candidate/applications/{application.id}",
            user_id=candidate.id,
            company_id=company.id,
            application_id=application.id,
            job_id=job.id,
            actor_user_id=actor.id,
            metadata={"status": ApplicationStatus.applied.value},
        )
        activity_counter += 1

        await create_seed_event(
            created_at=application.created_at,
            event_type="application_received",
            audience="recruiter",
            title=f"New application from {candidate.full_name}",
            description=f"{candidate.full_name} applied to {job.title}.",
            href=f"/recruiter/candidates/{application.id}",
            company_id=company.id,
            application_id=application.id,
            job_id=job.id,
            actor_user_id=candidate.id,
            metadata={"candidate_name": candidate.full_name},
        )
        activity_counter += 1

        if application.score is not None or application.feedback:
            review_at = max(
                application.created_at + timedelta(hours=18),
                application.updated_at - timedelta(days=1),
            )
            await create_seed_event(
                created_at=review_at,
                event_type="application_review_updated",
                audience="recruiter",
                title=f"Review captured for {candidate.full_name}",
                description=f"Score and feedback were saved for {job.title}.",
                href=f"/recruiter/candidates/{application.id}",
                company_id=company.id,
                application_id=application.id,
                job_id=job.id,
                actor_user_id=actor.id,
                metadata={"score": application.score},
            )
            activity_counter += 1

            await create_seed_event(
                created_at=review_at,
                event_type="application_review_ready",
                audience="candidate",
                title=f"Review updated for {job.title}",
                description=f"{company.name} added review details to your application.",
                href=f"/candidate/applications/{application.id}",
                user_id=candidate.id,
                company_id=company.id,
                application_id=application.id,
                job_id=job.id,
                actor_user_id=actor.id,
                metadata={"score": application.score},
            )
            activity_counter += 1

        if application.status != ApplicationStatus.applied:
            candidate_title, candidate_description = _status_activity_copy(
                application.status,
                company.name,
                job.title,
            )
            await create_seed_event(
                created_at=application.updated_at,
                event_type=f"application_{application.status.value}",
                audience="candidate",
                title=candidate_title,
                description=candidate_description,
                href=f"/candidate/applications/{application.id}",
                user_id=candidate.id,
                company_id=company.id,
                application_id=application.id,
                job_id=job.id,
                actor_user_id=actor.id,
                metadata={"status": application.status.value},
            )
            activity_counter += 1

            await create_seed_event(
                created_at=application.updated_at,
                event_type=f"candidate_{application.status.value}",
                audience="recruiter",
                title=f"{candidate.full_name}: {application.status.value.replace('_', ' ')}",
                description=f"{candidate.full_name} is now {application.status.value.replace('_', ' ')} for {job.title}.",
                href=f"/recruiter/candidates/{application.id}",
                company_id=company.id,
                application_id=application.id,
                job_id=job.id,
                actor_user_id=actor.id,
                metadata={"status": application.status.value},
            )
            activity_counter += 1

        # Commit every 50 events to avoid deadlock
        if activity_counter % 50 == 0:
            await db.commit()

    await db.commit()

    with db.no_autoflush:
        drafts_result = await db.execute(
            select(EmailDraft, Application, Job, Company, User)
            .join(Application, Application.id == EmailDraft.application_id)
            .join(Job, Job.id == Application.job_id)
            .join(Company, Company.id == Job.company_id)
            .join(User, User.id == Application.user_id)
            .order_by(EmailDraft.created_at.asc())
        )
    for draft, application, job, company, candidate in drafts_result.all():
        company_context = company_context_by_id.get(company.id)
        if company_context is None:
            continue
        actors = [company_context["admin"], *company_context["recruiters"]]
        actor = next(
            (member for member in actors if member.id == job.posted_by), actors[0]
        )

        generated_at = max(
            application.created_at + timedelta(days=1),
            application.updated_at - timedelta(hours=20),
        )
        draft.generated_by_user_id = draft.generated_by_user_id or actor.id
        draft.approved_by_user_id = draft.approved_by_user_id or (
            actor.id if draft.is_approved or draft.is_sent else None
        )
        draft.sent_by_user_id = draft.sent_by_user_id or (
            actor.id if draft.is_sent else None
        )
        draft.discarded_by_user_id = draft.discarded_by_user_id or (
            actor.id if draft.is_discarded else None
        )
        draft.approved_at = draft.approved_at or (
            generated_at + timedelta(hours=6)
            if draft.is_approved or draft.is_sent
            else None
        )
        draft.sent_at = draft.sent_at or (
            generated_at + timedelta(hours=8) if draft.is_sent else None
        )
        draft.discarded_at = draft.discarded_at or (
            generated_at + timedelta(hours=5) if draft.is_discarded else None
        )

        await create_seed_event(
            created_at=generated_at,
            event_type="outreach_draft_generated",
            audience="recruiter",
            title=f"Outreach draft prepared for {candidate.full_name}",
            description=f"{job.title} draft is ready for review.",
            href=f"/recruiter/candidates/{application.id}",
            company_id=company.id,
            application_id=application.id,
            job_id=job.id,
            draft_id=draft.id,
            actor_user_id=actor.id,
        )
        activity_counter += 1

        if draft.is_approved or draft.is_sent:
            await create_seed_event(
                created_at=draft.approved_at or generated_at,
                event_type="outreach_draft_approved",
                audience="recruiter",
                title=f"Outreach approved for {candidate.full_name}",
                description=f"{job.title} outreach has been approved.",
                href="/recruiter/outreach",
                company_id=company.id,
                application_id=application.id,
                job_id=job.id,
                draft_id=draft.id,
                actor_user_id=actor.id,
            )
            activity_counter += 1

        if draft.is_sent:
            sent_time = draft.sent_at or generated_at
            await create_seed_event(
                created_at=sent_time,
                event_type="outreach_email_sent",
                audience="recruiter",
                title=f"Outreach sent to {candidate.full_name}",
                description=f"{job.title} email was delivered to the candidate.",
                href="/recruiter/outreach",
                company_id=company.id,
                application_id=application.id,
                job_id=job.id,
                draft_id=draft.id,
                actor_user_id=actor.id,
            )
            activity_counter += 1

            await create_seed_event(
                created_at=sent_time,
                event_type="outreach_email_sent",
                audience="candidate",
                title=f"Email update for {job.title}",
                description=f"{company.name} sent you an application update.",
                href=f"/candidate/applications/{application.id}",
                user_id=candidate.id,
                company_id=company.id,
                application_id=application.id,
                job_id=job.id,
                draft_id=draft.id,
                actor_user_id=actor.id,
            )
            activity_counter += 1

        if draft.is_discarded:
            await create_seed_event(
                created_at=draft.discarded_at or generated_at,
                event_type="outreach_draft_discarded",
                audience="recruiter",
                title=f"Draft discarded for {candidate.full_name}",
                description=f"{job.title} outreach was intentionally discarded.",
                href="/recruiter/outreach",
                company_id=company.id,
                application_id=application.id,
                job_id=job.id,
                draft_id=draft.id,
                actor_user_id=actor.id,
            )
            activity_counter += 1

        # Commit every 50 events to avoid deadlock
        if activity_counter % 50 == 0:
            await db.commit()

    await db.commit()

    with db.no_autoflush:
        interviews_result = await db.execute(
            select(Interview, Application, Job, Company, User)
            .join(Application, Application.id == Interview.application_id)
            .join(Job, Job.id == Application.job_id)
            .join(Company, Company.id == Job.company_id)
            .join(User, User.id == Application.user_id)
            .order_by(Interview.created_at.asc())
        )
    for interview, application, job, company, candidate in interviews_result.all():
        company_context = company_context_by_id.get(company.id)
        if company_context is None:
            continue
        actors = [company_context["admin"], *company_context["recruiters"]]
        actor = next(
            (member for member in actors if member.id == job.posted_by), actors[0]
        )

        await create_seed_event(
            created_at=interview.created_at,
            event_type="interview_booked",
            audience="candidate",
            title=f"Interview booked for {job.title}",
            description="Your interview has been scheduled.",
            href=f"/candidate/applications/{application.id}",
            user_id=candidate.id,
            company_id=company.id,
            application_id=application.id,
            interview_id=interview.id,
            job_id=job.id,
            actor_user_id=actor.id,
            metadata={"start_time": interview.start_time.isoformat()},
        )
        activity_counter += 1

        await create_seed_event(
            created_at=interview.created_at,
            event_type="interview_booked",
            audience="recruiter",
            title=f"Interview scheduled with {candidate.full_name}",
            description=f"{candidate.full_name} booked an interview for {job.title}.",
            href=f"/recruiter/candidates/{application.id}",
            company_id=company.id,
            application_id=application.id,
            interview_id=interview.id,
            job_id=job.id,
            actor_user_id=actor.id,
            metadata={"start_time": interview.start_time.isoformat()},
        )
        activity_counter += 1

        # Commit every 50 events to avoid deadlock
        if activity_counter % 50 == 0:
            await db.commit()

    await db.commit()

    with db.no_autoflush:
        memberships_result = await db.execute(
            select(CompanyMembership, Company, User)
            .join(Company, Company.id == CompanyMembership.company_id)
            .join(User, User.id == CompanyMembership.user_id)
            .where(
                CompanyMembership.role == MembershipRole.recruiter,
                CompanyMembership.status.in_(
                [MembershipStatus.pending, MembershipStatus.rejected]
            ),
        )
    )
    for membership, company, recruiter in memberships_result.all():
        await create_seed_event(
            created_at=membership.created_at,
            event_type="join_request_submitted",
            audience="admin",
            title=f"{recruiter.full_name} requested recruiter access",
            description=f"{recruiter.email} requested access to {company.name}.",
            href="/recruiter/recruiters",
            company_id=company.id,
            actor_user_id=recruiter.id,
            metadata={
                "membership_id": str(membership.id),
                "status": membership.status.value,
            },
        )
        activity_counter += 1

        if membership.status == MembershipStatus.rejected:
            await create_seed_event(
                created_at=membership.created_at + timedelta(hours=6),
                event_type="membership_rejected",
                audience="recruiter",
                title="Recruiter access request declined",
                description=f"{company.name} declined your recruiter access request.",
                href="/login",
                user_id=recruiter.id,
                company_id=company.id,
                actor_user_id=company_context_by_id[company.id]["admin"].id,
                metadata={"membership_id": str(membership.id)},
            )
            activity_counter += 1

        # Commit every 50 events to avoid deadlock
        if activity_counter % 50 == 0:
            await db.commit()

    await db.commit()
    print(f"  ✓ Recruiter preferences: {preference_counter}")
    print(f"  ✓ Activity events: {activity_counter}")


async def seed_ai_artifacts(db, company_contexts: list[dict]) -> None:
    print("\n🤖 Seeding recruiter AI drafts and chat sessions...")

    for blueprint in AI_DRAFT_BLUEPRINTS:
        company_context = company_contexts[blueprint["company_index"]]
        recruiter = company_context["recruiters"][blueprint["recruiter_slot"]]
        db.add(
            JobAIDraft(
                recruiter_id=recruiter.id,
                company_id=company_context["company"].id,
                thread_id=blueprint["thread_id"],
                status=blueprint["status"],
                mode=blueprint["mode"],
                source_prompt=blueprint["source_prompt"],
                source_text=None,
                locked_fields=blueprint["locked_fields"],
                latest_draft=blueprint["latest_draft"],
                salary_research=blueprint["salary_research"],
                assumptions=blueprint["assumptions"],
                warnings=blueprint["warnings"],
                missing_fields=blueprint["missing_fields"],
                last_interrupt=None,
            )
        )

    for blueprint in CHAT_SESSION_BLUEPRINTS:
        company_context = company_contexts[blueprint["company_index"]]
        recruiter = company_context["recruiters"][blueprint["recruiter_slot"]]
        db.add(
            RecruiterChatSession(
                recruiter_id=recruiter.id,
                company_id=company_context["company"].id,
                thread_id=blueprint["thread_id"],
                title=blueprint["title"],
                last_interaction_at=NOW
                - timedelta(hours=blueprint["last_interaction_offset_hours"]),
                state_json=_build_chat_session_state(blueprint),
            )
        )

    await db.flush()
    print(f"  ✓ AI drafts: {len(AI_DRAFT_BLUEPRINTS)}")
    print(f"  ✓ Chat sessions: {len(CHAT_SESSION_BLUEPRINTS)}")


async def seed_candidate_import_tasks(
    db, candidate_users: list[tuple[User, list[Resume]]]
) -> None:
    print("\n📄 Seeding resume import task history...")

    for blueprint in RESUME_IMPORT_TASK_BLUEPRINTS:
        user, _resumes = candidate_users[blueprint["candidate_index"]]
        db.add(
            ResumeImportTask(
                user_id=user.id,
                status=blueprint["status"],
                source_file_name=blueprint["source_file_name"],
                result_data=blueprint.get("result_data"),
                error_message=blueprint.get("error_message"),
            )
        )

    await db.flush()
    print(f"  ✓ Resume import tasks: {len(RESUME_IMPORT_TASK_BLUEPRINTS)}")


async def seed_audit_history(
    db,
    company_contexts: list[dict],
    candidate_users: list[tuple[User, list[Resume]]],
) -> None:
    print("\nAudit history seeding...")

    await db.execute(delete(AuditLog))
    await db.flush()

    audit_counter = 0
    candidate_data_by_email = {
        candidate["email"]: candidate for candidate in CANDIDATES
    }
    membership_map: dict[tuple[uuid.UUID, uuid.UUID], CompanyMembership] = {}
    actor_by_user_id: dict[uuid.UUID, User] = {}

    memberships_result = await db.execute(select(CompanyMembership))
    for membership in memberships_result.scalars().all():
        membership_map[(membership.user_id, membership.company_id)] = membership

    for context in company_contexts:
        actor_by_user_id[context["admin"].id] = context["admin"]
        for recruiter in context["recruiters"]:
            actor_by_user_id[recruiter.id] = recruiter

    for candidate_user, _resumes in candidate_users:
        actor_by_user_id[candidate_user.id] = candidate_user

    candidate_user_ids = [candidate_user.id for candidate_user, _ in candidate_users]
    profiles = (
        (
            await db.execute(
                select(Profile).where(Profile.user_id.in_(candidate_user_ids))
            )
        )
        .scalars()
        .all()
    )
    profiles_by_user_id = {profile.user_id: profile for profile in profiles}
    profile_ids = [profile.id for profile in profiles]
    profile_experiences_by_profile_id: dict[uuid.UUID, list[ProfileExperience]] = (
        defaultdict(list)
    )
    profile_educations_by_profile_id: dict[uuid.UUID, list[ProfileEducation]] = (
        defaultdict(list)
    )
    profile_skills_by_profile_id: dict[uuid.UUID, list[ProfileSkill]] = defaultdict(
        list
    )
    if profile_ids:
        for experience in (
            (
                await db.execute(
                    select(ProfileExperience).where(
                        ProfileExperience.profile_id.in_(profile_ids)
                    )
                )
            )
            .scalars()
            .all()
        ):
            profile_experiences_by_profile_id[experience.profile_id].append(experience)
        for education in (
            (
                await db.execute(
                    select(ProfileEducation).where(
                        ProfileEducation.profile_id.in_(profile_ids)
                    )
                )
            )
            .scalars()
            .all()
        ):
            profile_educations_by_profile_id[education.profile_id].append(education)
        for skill in (
            (
                await db.execute(
                    select(ProfileSkill).where(ProfileSkill.profile_id.in_(profile_ids))
                )
            )
            .scalars()
            .all()
        ):
            profile_skills_by_profile_id[skill.profile_id].append(skill)

    resumes = (
        (await db.execute(select(Resume).where(Resume.user_id.in_(candidate_user_ids))))
        .scalars()
        .all()
    )
    resume_ids = [resume.id for resume in resumes]
    resume_experiences_by_resume_id: dict[uuid.UUID, list[ResumeExperience]] = (
        defaultdict(list)
    )
    resume_educations_by_resume_id: dict[uuid.UUID, list[ResumeEducation]] = (
        defaultdict(list)
    )
    resume_skills_by_resume_id: dict[uuid.UUID, list[ResumeSkill]] = defaultdict(list)
    if resume_ids:
        for experience in (
            (
                await db.execute(
                    select(ResumeExperience).where(
                        ResumeExperience.resume_id.in_(resume_ids)
                    )
                )
            )
            .scalars()
            .all()
        ):
            resume_experiences_by_resume_id[experience.resume_id].append(experience)
        for education in (
            (
                await db.execute(
                    select(ResumeEducation).where(
                        ResumeEducation.resume_id.in_(resume_ids)
                    )
                )
            )
            .scalars()
            .all()
        ):
            resume_educations_by_resume_id[education.resume_id].append(education)
        for skill in (
            (
                await db.execute(
                    select(ResumeSkill).where(ResumeSkill.resume_id.in_(resume_ids))
                )
            )
            .scalars()
            .all()
        ):
            resume_skills_by_resume_id[skill.resume_id].append(skill)

    jobs = (
        (await db.execute(select(Job).order_by(Job.created_at.asc()))).scalars().all()
    )
    jobs_by_id = {job.id: job for job in jobs}
    applications = (
        (await db.execute(select(Application).order_by(Application.created_at.asc())))
        .scalars()
        .all()
    )
    applications_by_id = {application.id: application for application in applications}
    interviews = (await db.execute(select(Interview))).scalars().all()
    interview_by_application_id = {
        interview.application_id: interview for interview in interviews
    }
    email_drafts = (await db.execute(select(EmailDraft))).scalars().all()
    recordings = (await db.execute(select(InterviewRecording))).scalars().all()
    scores = (await db.execute(select(CandidateEvaluationScore))).scalars().all()
    evaluation_schemas = (await db.execute(select(JobEvaluationSchema))).scalars().all()
    preferences = (await db.execute(select(RecruiterPreference))).scalars().all()
    ai_drafts = (await db.execute(select(JobAIDraft))).scalars().all()
    chat_sessions = (await db.execute(select(RecruiterChatSession))).scalars().all()
    import_tasks = (
        (
            await db.execute(
                select(ResumeImportTask).order_by(ResumeImportTask.created_at.asc())
            )
        )
        .scalars()
        .all()
    )

    def record(**kwargs) -> None:
        nonlocal audit_counter
        _queue_seed_audit_log(db, **kwargs)
        audit_counter += 1

    def queue_user_bootstrap(
        user: User,
        *,
        created_at: datetime,
        company_id: uuid.UUID | None = None,
        actor: User | None = None,
        is_onboarded: bool | None = None,
    ) -> None:
        record(
            created_at=created_at - timedelta(minutes=20),
            entity_type="user",
            action_type="signup_requested",
            target_user_id=user.id,
            company_id=company_id,
            metadata={
                "email": user.email,
                "primary_role": user.primary_role.value,
            },
            request_path="/auth/signup",
            request_method="POST",
        )
        created_user_after = _serialize_audit_entity(user)
        created_user_after["is_email_verified"] = False
        if is_onboarded is not None:
            created_user_after["is_onboarded"] = is_onboarded
        record(
            created_at=created_at - timedelta(minutes=10),
            entity_type="user",
            entity_id=user.id,
            action_type="create",
            actor=actor,
            target_user_id=user.id,
            company_id=company_id,
            after_json=created_user_after,
            request_path="/auth/verify-email",
            request_method="POST",
        )
        verify_before, verify_after, verify_diff = _build_audit_snapshots(
            user,
            before_overrides={"is_email_verified": False},
        )
        if is_onboarded is not None:
            verify_before["is_onboarded"] = _audit_serialize_value(is_onboarded)
            verify_after["is_onboarded"] = _audit_serialize_value(is_onboarded)
        record(
            created_at=created_at,
            entity_type="user",
            entity_id=user.id,
            action_type="verify_email",
            actor=user,
            target_user_id=user.id,
            company_id=company_id,
            before_json=verify_before,
            after_json=verify_after,
            diff_json=verify_diff,
            request_path="/auth/verify-email",
            request_method="POST",
        )
        record(
            created_at=created_at + timedelta(minutes=25),
            entity_type="auth_session",
            entity_id=f"seed-session-{uuid.uuid4().hex[:14]}",
            action_type="login",
            actor=user,
            target_user_id=user.id,
            company_id=company_id,
            metadata={"email": user.email},
            request_path="/auth/login",
            request_method="POST",
        )

    for company_index, context in enumerate(company_contexts):
        company = context["company"]
        all_jobs = [*context["primary_jobs"], *context["extra_jobs"].values()]
        company_anchor = min(job.created_at for job in all_jobs) - timedelta(days=180)
        admin = context["admin"]
        admin_membership = membership_map[(admin.id, company.id)]

        queue_user_bootstrap(
            admin,
            created_at=company_anchor - timedelta(days=3),
            company_id=company.id,
            actor=admin,
            is_onboarded=True,
        )
        record(
            created_at=company_anchor,
            entity_type="company",
            entity_id=company.id,
            action_type="create",
            actor=admin,
            company_id=company.id,
            after_json=_serialize_audit_entity(company),
            request_path="/companies/register",
            request_method="POST",
        )
        company_before, company_after, company_diff = _build_audit_snapshots(
            company,
            before_overrides={
                "website_url": None,
                "cal_booking_url": None,
                "description": f"{company.name} initial company profile.",
            },
        )
        record(
            created_at=company_anchor + timedelta(days=45),
            entity_type="company",
            entity_id=company.id,
            action_type="update",
            actor=admin,
            company_id=company.id,
            before_json=company_before,
            after_json=company_after,
            diff_json=company_diff,
            request_path="/companies/me",
            request_method="PATCH",
        )
        record(
            created_at=company_anchor + timedelta(minutes=10),
            entity_type="membership",
            entity_id=admin_membership.id,
            action_type="create",
            actor=admin,
            target_user_id=admin.id,
            company_id=company.id,
            parent_entity_type="company",
            parent_entity_id=company.id,
            after_json=_serialize_audit_entity(admin_membership),
            request_path="/companies/register",
            request_method="POST",
        )

        for recruiter_index, recruiter in enumerate(context["recruiters"]):
            recruiter_membership = membership_map[(recruiter.id, company.id)]
            recruiter_anchor = company_anchor + timedelta(
                days=14 + (recruiter_index * 32)
            )
            queue_user_bootstrap(
                recruiter,
                created_at=recruiter_anchor,
                company_id=company.id,
                actor=admin,
                is_onboarded=True,
            )
            membership_pending = _serialize_audit_entity(recruiter_membership)
            membership_pending["status"] = MembershipStatus.pending.value
            record(
                created_at=recruiter_anchor + timedelta(minutes=8),
                entity_type="membership",
                entity_id=recruiter_membership.id,
                action_type="create",
                actor=recruiter,
                target_user_id=recruiter.id,
                company_id=company.id,
                parent_entity_type="company",
                parent_entity_id=company.id,
                after_json=membership_pending,
                request_path="/companies/join",
                request_method="POST",
            )
            membership_before, membership_after, membership_diff = (
                _build_audit_snapshots(
                    recruiter_membership,
                    before_overrides={"status": MembershipStatus.pending},
                )
            )
            record(
                created_at=recruiter_anchor + timedelta(hours=3),
                entity_type="membership",
                entity_id=recruiter_membership.id,
                action_type="status_transition",
                actor=admin,
                target_user_id=recruiter.id,
                company_id=company.id,
                parent_entity_type="company",
                parent_entity_id=company.id,
                before_json=membership_before,
                after_json=membership_after,
                diff_json=membership_diff,
                request_path="/companies/memberships/approve",
                request_method="POST",
            )

        company_requests_result = await db.execute(
            select(CompanyMembership, User)
            .join(User, User.id == CompanyMembership.user_id)
            .where(
                CompanyMembership.company_id == company.id,
                CompanyMembership.status.in_(
                    [MembershipStatus.pending, MembershipStatus.rejected]
                ),
            )
        )
        for request_index, (membership, recruiter) in enumerate(
            company_requests_result.all()
        ):
            request_anchor = company_anchor + timedelta(days=95 + (request_index * 18))
            queue_user_bootstrap(
                recruiter,
                created_at=request_anchor,
                company_id=company.id,
                actor=None,
                is_onboarded=True,
            )
            pending_snapshot = _serialize_audit_entity(membership)
            pending_snapshot["status"] = MembershipStatus.pending.value
            record(
                created_at=request_anchor + timedelta(minutes=10),
                entity_type="membership",
                entity_id=membership.id,
                action_type="create",
                actor=recruiter,
                target_user_id=recruiter.id,
                company_id=company.id,
                parent_entity_type="company",
                parent_entity_id=company.id,
                after_json=pending_snapshot,
                request_path="/companies/join",
                request_method="POST",
            )
            if membership.status == MembershipStatus.rejected:
                rejected_before, rejected_after, rejected_diff = _build_audit_snapshots(
                    membership,
                    before_overrides={"status": MembershipStatus.pending},
                )
                record(
                    created_at=request_anchor + timedelta(hours=6),
                    entity_type="membership",
                    entity_id=membership.id,
                    action_type="reject",
                    actor=admin,
                    target_user_id=recruiter.id,
                    company_id=company.id,
                    parent_entity_type="company",
                    parent_entity_id=company.id,
                    before_json=rejected_before,
                    after_json=rejected_after,
                    diff_json=rejected_diff,
                    request_path="/companies/memberships/reject",
                    request_method="POST",
                )

        deleted_job_id = uuid.uuid4()
        record(
            created_at=NOW - timedelta(days=120 + (company_index * 35)),
            entity_type="job",
            entity_id=deleted_job_id,
            action_type="delete",
            actor=admin,
            target_user_id=admin.id,
            company_id=company.id,
            before_json={
                "id": str(deleted_job_id),
                "company_id": str(company.id),
                "posted_by": str(admin.id),
                "title": "Legacy Integration Engineer",
                "location": company.location,
                "location_type": LocationType.hybrid.value,
                "salary_min": 110000,
                "salary_max": 155000,
                "currency": "NPR",
                "status": JobStatus.draft.value,
                "overview": "Legacy role removed before publishing.",
            },
            request_path=f"/jobs/{deleted_job_id}",
            request_method="DELETE",
        )

    for candidate_index, (candidate_user, resumes) in enumerate(candidate_users):
        candidate_data = candidate_data_by_email[candidate_user.email]
        candidate_anchor = NOW - timedelta(days=860 - (candidate_index * 45))
        queue_user_bootstrap(
            candidate_user,
            created_at=candidate_anchor,
            actor=candidate_user,
            is_onboarded=False,
        )
        record(
            created_at=candidate_anchor + timedelta(days=1),
            entity_type="user",
            entity_id=candidate_user.id,
            action_type="status_transition",
            actor=candidate_user,
            target_user_id=candidate_user.id,
            before_json={"is_onboarded": False},
            after_json={"is_onboarded": True},
            diff_json={"is_onboarded": {"before": False, "after": True}},
            request_path="/profiles/onboarding",
            request_method="POST",
        )

        profile = profiles_by_user_id.get(candidate_user.id)
        if profile is not None:
            record(
                created_at=candidate_anchor + timedelta(days=2),
                entity_type="profile",
                entity_id=profile.id,
                action_type="create",
                actor=candidate_user,
                target_user_id=candidate_user.id,
                after_json=_serialize_audit_entity(profile),
                request_path="/profiles/me",
                request_method="POST",
            )
            profile_before, profile_after, profile_diff = _build_audit_snapshots(
                profile,
                before_overrides={
                    "headline": None,
                    "linkedin_url": None,
                    "github_url": None,
                    "portfolio_url": None,
                    "target_roles": [],
                    "is_open_to_work": False,
                },
            )
            record(
                created_at=candidate_anchor + timedelta(days=35),
                entity_type="profile",
                entity_id=profile.id,
                action_type="update",
                actor=candidate_user,
                target_user_id=candidate_user.id,
                before_json=profile_before,
                after_json=profile_after,
                diff_json=profile_diff,
                request_path="/profiles/me",
                request_method="PATCH",
            )

            profile_experiences = profile_experiences_by_profile_id.get(profile.id, [])
            for offset, experience in enumerate(profile_experiences):
                record(
                    created_at=candidate_anchor + timedelta(days=3, hours=offset),
                    entity_type="profile_experience",
                    entity_id=experience.id,
                    action_type="create",
                    actor=candidate_user,
                    target_user_id=candidate_user.id,
                    parent_entity_type="profile",
                    parent_entity_id=profile.id,
                    after_json=_serialize_audit_entity(experience),
                    request_path="/profiles/me",
                    request_method="PATCH",
                )

            profile_educations = profile_educations_by_profile_id.get(profile.id, [])
            for offset, education in enumerate(profile_educations):
                record(
                    created_at=candidate_anchor + timedelta(days=4, hours=offset),
                    entity_type="profile_education",
                    entity_id=education.id,
                    action_type="create",
                    actor=candidate_user,
                    target_user_id=candidate_user.id,
                    parent_entity_type="profile",
                    parent_entity_id=profile.id,
                    after_json=_serialize_audit_entity(education),
                    request_path="/profiles/me",
                    request_method="PATCH",
                )

            profile_skills = profile_skills_by_profile_id.get(profile.id, [])
            for offset, skill in enumerate(profile_skills):
                record(
                    created_at=candidate_anchor + timedelta(days=5, hours=offset),
                    entity_type="profile_skill",
                    entity_id=skill.id,
                    action_type="create",
                    actor=candidate_user,
                    target_user_id=candidate_user.id,
                    parent_entity_type="profile",
                    parent_entity_id=profile.id,
                    after_json=_serialize_audit_entity(skill),
                    request_path="/profiles/me",
                    request_method="PATCH",
                )

        for resume_index, resume in enumerate(resumes):
            resume_anchor = candidate_anchor + timedelta(days=6 + (resume_index * 6))
            record(
                created_at=resume_anchor,
                entity_type="resume",
                entity_id=resume.id,
                action_type="create",
                actor=candidate_user,
                target_user_id=candidate_user.id,
                after_json=_serialize_audit_entity(resume),
                request_path="/resumes",
                request_method="POST",
            )
            resume_before, resume_after, resume_diff = _build_audit_snapshots(
                resume,
                before_overrides={
                    "headline": candidate_data["headline"].split("|")[0].strip(),
                    "summary": "Initial imported resume summary.",
                },
            )
            record(
                created_at=resume_anchor + timedelta(days=25),
                entity_type="resume",
                entity_id=resume.id,
                action_type="update",
                actor=candidate_user,
                target_user_id=candidate_user.id,
                before_json=resume_before,
                after_json=resume_after,
                diff_json=resume_diff,
                request_path=f"/resumes/{resume.id}",
                request_method="PATCH",
            )

            resume_experiences = resume_experiences_by_resume_id.get(resume.id, [])
            for offset, experience in enumerate(resume_experiences):
                record(
                    created_at=resume_anchor + timedelta(hours=offset + 1),
                    entity_type="resume_experience",
                    entity_id=experience.id,
                    action_type="create",
                    actor=candidate_user,
                    target_user_id=candidate_user.id,
                    parent_entity_type="resume",
                    parent_entity_id=resume.id,
                    after_json=_serialize_audit_entity(experience),
                    request_path=f"/resumes/{resume.id}",
                    request_method="PATCH",
                )

            resume_educations = resume_educations_by_resume_id.get(resume.id, [])
            for offset, education in enumerate(resume_educations):
                record(
                    created_at=resume_anchor + timedelta(hours=offset + 2),
                    entity_type="resume_education",
                    entity_id=education.id,
                    action_type="create",
                    actor=candidate_user,
                    target_user_id=candidate_user.id,
                    parent_entity_type="resume",
                    parent_entity_id=resume.id,
                    after_json=_serialize_audit_entity(education),
                    request_path=f"/resumes/{resume.id}",
                    request_method="PATCH",
                )

            resume_skills = resume_skills_by_resume_id.get(resume.id, [])
            for offset, skill in enumerate(resume_skills):
                record(
                    created_at=resume_anchor + timedelta(hours=offset + 3),
                    entity_type="resume_skill",
                    entity_id=skill.id,
                    action_type="create",
                    actor=candidate_user,
                    target_user_id=candidate_user.id,
                    parent_entity_type="resume",
                    parent_entity_id=resume.id,
                    after_json=_serialize_audit_entity(skill),
                    request_path=f"/resumes/{resume.id}",
                    request_method="PATCH",
                )

        if candidate_index == 0 and resumes:
            deleted_resume_id = uuid.uuid4()
            deleted_resume_snapshot = _serialize_audit_entity(resumes[0]) | {
                "id": str(deleted_resume_id),
                "resume_name": "Legacy Internship Resume",
            }
            record(
                created_at=candidate_anchor + timedelta(days=120),
                entity_type="resume",
                entity_id=deleted_resume_id,
                action_type="delete",
                actor=candidate_user,
                target_user_id=candidate_user.id,
                before_json=deleted_resume_snapshot,
                request_path=f"/resumes/{deleted_resume_id}",
                request_method="DELETE",
            )

    for job in jobs:
        actor = actor_by_user_id.get(job.posted_by)
        record(
            created_at=job.created_at,
            entity_type="job",
            entity_id=job.id,
            action_type="create",
            actor=actor,
            target_user_id=job.posted_by,
            company_id=job.company_id,
            after_json=_serialize_audit_entity(job),
            request_path="/jobs",
            request_method="POST",
        )
        job_update_before, job_update_after, job_update_diff = _build_audit_snapshots(
            job,
            before_overrides={
                "salary_min": max((job.salary_min or 0) - 15000, 0) or None,
                "salary_max": max((job.salary_max or 0) - 20000, 0) or None,
                "overview": "Initial draft of the role description.",
            },
        )
        record(
            created_at=job.created_at + timedelta(hours=6),
            entity_type="job",
            entity_id=job.id,
            action_type="update",
            actor=actor,
            target_user_id=job.posted_by,
            company_id=job.company_id,
            before_json=job_update_before,
            after_json=job_update_after,
            diff_json=job_update_diff,
            request_path=f"/jobs/{job.id}",
            request_method="PATCH",
        )
        if job.status != JobStatus.draft:
            active_before, active_after, active_diff = _build_audit_snapshots(
                job,
                before_overrides={"status": JobStatus.draft},
                after_overrides={"status": JobStatus.active},
            )
            record(
                created_at=job.created_at + timedelta(hours=1),
                entity_type="job",
                entity_id=job.id,
                action_type="status_transition",
                actor=actor,
                target_user_id=job.posted_by,
                company_id=job.company_id,
                before_json=active_before,
                after_json=active_after,
                diff_json=active_diff,
                request_path=f"/jobs/{job.id}",
                request_method="PATCH",
            )
        if job.status == JobStatus.expired and job.expires_at is not None:
            expired_before, expired_after, expired_diff = _build_audit_snapshots(
                job,
                before_overrides={"status": JobStatus.active},
            )
            record(
                created_at=job.expires_at,
                entity_type="job",
                entity_id=job.id,
                action_type="status_transition",
                actor=actor,
                target_user_id=job.posted_by,
                company_id=job.company_id,
                before_json=expired_before,
                after_json=expired_after,
                diff_json=expired_diff,
                request_path=f"/jobs/{job.id}/expire",
                request_method="POST",
            )
        if job.hiring_completed:
            hiring_before, hiring_after, hiring_diff = _build_audit_snapshots(
                job,
                before_overrides={"hiring_completed": False},
            )
            record(
                created_at=(job.updated_at or job.created_at) + timedelta(hours=2),
                entity_type="job",
                entity_id=job.id,
                action_type="mark_complete",
                actor=actor,
                target_user_id=job.posted_by,
                company_id=job.company_id,
                before_json=hiring_before,
                after_json=hiring_after,
                diff_json=hiring_diff,
                request_path=f"/jobs/{job.id}/hiring-complete",
                request_method="POST",
            )

    for schema in evaluation_schemas:
        job = jobs_by_id.get(schema.job_id)
        actor = actor_by_user_id.get(job.posted_by) if job is not None else None
        record(
            created_at=(job.created_at if job is not None else NOW)
            + timedelta(hours=2),
            entity_type="job_evaluation_schema",
            entity_id=schema.id,
            action_type="create",
            actor=actor,
            target_user_id=job.posted_by if job is not None else None,
            company_id=job.company_id if job is not None else None,
            parent_entity_type="job",
            parent_entity_id=schema.job_id,
            after_json=_serialize_audit_entity(schema),
            request_path=f"/jobs/{schema.job_id}/evaluation-schema",
            request_method="POST",
        )

    for application in applications:
        job = jobs_by_id.get(application.job_id)
        candidate = actor_by_user_id.get(application.user_id)
        actor = actor_by_user_id.get(job.posted_by) if job is not None else None
        interview = interview_by_application_id.get(application.id)

        apply_after = _serialize_audit_entity(application)
        apply_after["status"] = ApplicationStatus.applied.value
        apply_after["score"] = None
        apply_after["feedback"] = None
        apply_after["shortlist_notified"] = False
        record(
            created_at=application.created_at,
            entity_type="application",
            entity_id=application.id,
            action_type="create",
            actor=candidate,
            target_user_id=application.user_id,
            company_id=job.company_id if job is not None else None,
            parent_entity_type="job",
            parent_entity_id=application.job_id,
            after_json=apply_after,
            request_path="/applications",
            request_method="POST",
        )
        if application.score is not None or application.feedback:
            review_before, review_after, review_diff = _build_audit_snapshots(
                application,
                before_overrides={"score": None, "feedback": None},
            )
            record(
                created_at=application.created_at + timedelta(hours=18),
                entity_type="application",
                entity_id=application.id,
                action_type="update",
                actor=actor,
                target_user_id=application.user_id,
                company_id=job.company_id if job is not None else None,
                parent_entity_type="job",
                parent_entity_id=application.job_id,
                before_json=review_before,
                after_json=review_after,
                diff_json=review_diff,
                request_path=f"/applications/{application.id}/review",
                request_method="PATCH",
            )

        status_path: list[ApplicationStatus] = []
        if application.status in {
            ApplicationStatus.screening,
            ApplicationStatus.shortlisted,
            ApplicationStatus.rejected,
            ApplicationStatus.interview_booked,
            ApplicationStatus.interview_completed,
            ApplicationStatus.offer,
        }:
            status_path.append(ApplicationStatus.screening)
        if application.status in {
            ApplicationStatus.shortlisted,
            ApplicationStatus.rejected,
            ApplicationStatus.interview_booked,
            ApplicationStatus.interview_completed,
            ApplicationStatus.offer,
        }:
            status_path.append(ApplicationStatus.shortlisted)
        if application.status in {
            ApplicationStatus.interview_booked,
            ApplicationStatus.interview_completed,
            ApplicationStatus.offer,
        }:
            status_path.append(ApplicationStatus.interview_booked)
        if application.status in {
            ApplicationStatus.interview_completed,
            ApplicationStatus.offer,
        }:
            status_path.append(ApplicationStatus.interview_completed)
        if application.status == ApplicationStatus.rejected:
            if interview is not None:
                status_path.extend(
                    [
                        ApplicationStatus.interview_booked,
                        ApplicationStatus.interview_completed,
                    ]
                )
            status_path.append(ApplicationStatus.rejected)
        if application.status == ApplicationStatus.offer:
            status_path.append(ApplicationStatus.offer)

        status_path = list(dict.fromkeys(status_path))
        transition_time = application.created_at + timedelta(days=1)
        previous_status = ApplicationStatus.applied
        for next_status in status_path:
            before_json, after_json, diff_json = _build_audit_snapshots(
                application,
                before_overrides={"status": previous_status},
                after_overrides={"status": next_status},
            )
            record(
                created_at=transition_time,
                entity_type="application",
                entity_id=application.id,
                action_type="status_transition",
                actor=actor,
                target_user_id=application.user_id,
                company_id=job.company_id if job is not None else None,
                parent_entity_type="job",
                parent_entity_id=application.job_id,
                before_json=before_json,
                after_json=after_json,
                diff_json=diff_json,
                request_path=f"/applications/{application.id}/status",
                request_method="PATCH",
            )
            previous_status = next_status
            transition_time += timedelta(days=2)

    for draft in email_drafts:
        application = applications_by_id.get(draft.application_id)
        if application is None:
            continue
        job = jobs_by_id.get(application.job_id)
        _actor_key = draft.generated_by_user_id or (
            job.posted_by if job is not None else None
        )
        actor = actor_by_user_id.get(_actor_key) if _actor_key is not None else None
        company_id = job.company_id if job is not None else None
        generated_at = (
            draft.approved_at
            or draft.sent_at
            or draft.discarded_at
            or application.updated_at
            or application.created_at
        ) - timedelta(hours=8)

        create_after = _serialize_audit_entity(draft)
        create_after.update(
            {
                "is_approved": False,
                "is_sent": False,
                "is_discarded": False,
                "approved_at": None,
                "sent_at": None,
                "discarded_at": None,
            }
        )
        record(
            created_at=generated_at,
            entity_type="email_draft",
            entity_id=draft.id,
            action_type="create",
            actor=actor,
            target_user_id=application.user_id,
            company_id=company_id,
            parent_entity_type="application",
            parent_entity_id=application.id,
            after_json=create_after,
            request_path="/outreach/generate",
            request_method="POST",
        )
        if draft.is_approved or draft.is_sent:
            approve_before, approve_after, approve_diff = _build_audit_snapshots(
                draft,
                before_overrides={
                    "is_approved": False,
                    "approved_by_user_id": None,
                    "approved_at": None,
                },
            )
            record(
                created_at=draft.approved_at or (generated_at + timedelta(hours=3)),
                entity_type="email_draft",
                entity_id=draft.id,
                action_type="approve",
                actor=actor_by_user_id.get(draft.approved_by_user_id) or actor,
                target_user_id=application.user_id,
                company_id=company_id,
                parent_entity_type="application",
                parent_entity_id=application.id,
                before_json=approve_before,
                after_json=approve_after,
                diff_json=approve_diff,
                request_path=f"/outreach/{draft.id}/approve",
                request_method="POST",
            )
        if draft.is_sent:
            send_before, send_after, send_diff = _build_audit_snapshots(
                draft,
                before_overrides={
                    "is_sent": False,
                    "sent_by_user_id": None,
                    "sent_at": None,
                },
            )
            record(
                created_at=draft.sent_at or (generated_at + timedelta(hours=5)),
                entity_type="email_draft",
                entity_id=draft.id,
                action_type="send",
                actor=actor_by_user_id.get(draft.sent_by_user_id) or actor,
                target_user_id=application.user_id,
                company_id=company_id,
                parent_entity_type="application",
                parent_entity_id=application.id,
                before_json=send_before,
                after_json=send_after,
                diff_json=send_diff,
                request_path=f"/outreach/{draft.id}/send",
                request_method="POST",
            )
        if draft.is_discarded:
            discard_before, discard_after, discard_diff = _build_audit_snapshots(
                draft,
                before_overrides={
                    "is_discarded": False,
                    "discarded_by_user_id": None,
                    "discarded_at": None,
                },
            )
            record(
                created_at=draft.discarded_at or (generated_at + timedelta(hours=4)),
                entity_type="email_draft",
                entity_id=draft.id,
                action_type="discard",
                actor=actor_by_user_id.get(draft.discarded_by_user_id) or actor,
                target_user_id=application.user_id,
                company_id=company_id,
                parent_entity_type="application",
                parent_entity_id=application.id,
                before_json=discard_before,
                after_json=discard_after,
                diff_json=discard_diff,
                request_path=f"/outreach/{draft.id}/discard",
                request_method="POST",
            )

    for interview in interview_by_application_id.values():
        application = applications_by_id.get(interview.application_id)
        if application is None:
            continue
        job = jobs_by_id.get(application.job_id)
        actor = actor_by_user_id.get(job.posted_by) if job is not None else None
        company_id = job.company_id if job is not None else None
        record(
            created_at=interview.created_at,
            entity_type="interview",
            entity_id=interview.id,
            action_type="create",
            actor=actor,
            target_user_id=application.user_id,
            company_id=company_id,
            parent_entity_type="application",
            parent_entity_id=application.id,
            after_json=_serialize_audit_entity(interview),
            request_path="/interviews/webhook/booked",
            request_method="POST",
        )
        if (
            application.status
            in {
                ApplicationStatus.interview_completed,
                ApplicationStatus.offer,
                ApplicationStatus.rejected,
            }
            and interview.end_time <= NOW
        ):
            record(
                created_at=interview.end_time,
                entity_type="interview",
                entity_id=interview.id,
                action_type="mark_complete",
                actor=actor,
                target_user_id=application.user_id,
                company_id=company_id,
                parent_entity_type="application",
                parent_entity_id=application.id,
                before_json={"state": "booked", "ended_at": None},
                after_json={
                    "state": "completed",
                    "ended_at": interview.end_time.isoformat(),
                },
                diff_json={
                    "state": {"before": "booked", "after": "completed"},
                    "ended_at": {
                        "before": None,
                        "after": interview.end_time.isoformat(),
                    },
                },
                request_path=f"/interviews/{interview.id}/complete",
                request_method="POST",
            )

    for recording in recordings:
        application = applications_by_id.get(recording.application_id)
        if application is None:
            continue
        job = jobs_by_id.get(application.job_id)
        actor = actor_by_user_id.get(job.posted_by) if job is not None else None
        company_id = job.company_id if job is not None else None
        create_after = _serialize_audit_entity(recording)
        create_after.update(
            {
                "status": RecordingStatus.uploaded.value,
                "transcript": None,
                "evaluation": None,
            }
        )
        record(
            created_at=recording.created_at,
            entity_type="interview_recording",
            entity_id=recording.id,
            action_type="create",
            actor=actor,
            target_user_id=application.user_id,
            company_id=company_id,
            parent_entity_type="application",
            parent_entity_id=application.id,
            after_json=create_after,
            request_path="/interviews/recordings",
            request_method="POST",
        )
        if recording.status != RecordingStatus.uploaded:
            recording_before, recording_after, recording_diff = _build_audit_snapshots(
                recording,
                before_overrides={
                    "status": RecordingStatus.uploaded,
                    "transcript": None,
                    "evaluation": None,
                },
            )
            record(
                created_at=(recording.updated_at or recording.created_at)
                + timedelta(minutes=20),
                entity_type="interview_recording",
                entity_id=recording.id,
                action_type="status_transition",
                actor=actor,
                target_user_id=application.user_id,
                company_id=company_id,
                parent_entity_type="application",
                parent_entity_id=application.id,
                before_json=recording_before,
                after_json=recording_after,
                diff_json=recording_diff,
                request_path=f"/interviews/recordings/{recording.id}",
                request_method="PATCH",
            )

    for score in scores:
        application = applications_by_id.get(score.application_id)
        if application is None:
            continue
        job = jobs_by_id.get(score.job_id)
        _actor_key = score.submitted_by_user_id or (
            job.posted_by if job is not None else None
        )
        actor = actor_by_user_id.get(_actor_key) if _actor_key is not None else None
        record(
            created_at=(application.updated_at or application.created_at)
            + timedelta(hours=4),
            entity_type="candidate_evaluation_score",
            entity_id=score.id,
            action_type="create",
            actor=actor,
            target_user_id=application.user_id,
            company_id=job.company_id if job is not None else None,
            parent_entity_type="application",
            parent_entity_id=application.id,
            after_json=_serialize_audit_entity(score),
            request_path=f"/interviews/evaluations/{application.id}",
            request_method="POST",
        )

    for preference in preferences:
        actor = actor_by_user_id.get(preference.user_id)
        company_id = None
        for (member_user_id, member_company_id), membership in membership_map.items():
            if (
                member_user_id == preference.user_id
                and membership.status == MembershipStatus.active
            ):
                company_id = member_company_id
                break
        preference_anchor = NOW - timedelta(days=180)
        record(
            created_at=preference_anchor,
            entity_type="recruiter_preference",
            entity_id=preference.id,
            action_type="create",
            actor=actor,
            target_user_id=preference.user_id,
            company_id=company_id,
            after_json=_serialize_audit_entity(preference),
            request_path="/recruiter/preferences",
            request_method="POST",
        )
        preference_before, preference_after, preference_diff = _build_audit_snapshots(
            preference,
            before_overrides={
                "default_interview_duration_minutes": max(
                    30, preference.default_interview_duration_minutes - 15
                ),
                "chat_default_scope": "jobs",
            },
        )
        record(
            created_at=preference_anchor + timedelta(days=21),
            entity_type="recruiter_preference",
            entity_id=preference.id,
            action_type="update",
            actor=actor,
            target_user_id=preference.user_id,
            company_id=company_id,
            before_json=preference_before,
            after_json=preference_after,
            diff_json=preference_diff,
            request_path="/recruiter/preferences",
            request_method="PATCH",
        )

    for draft in ai_drafts:
        actor = actor_by_user_id.get(draft.recruiter_id)
        record(
            created_at=draft.created_at,
            entity_type="job_ai_draft",
            entity_id=draft.id,
            action_type="create",
            actor=actor,
            target_user_id=draft.recruiter_id,
            company_id=draft.company_id,
            after_json=_serialize_audit_entity(draft),
            request_path="/job-ai/drafts",
            request_method="POST",
        )
        draft_before, draft_after, draft_diff = _build_audit_snapshots(
            draft,
            before_overrides={"status": "drafting", "warnings": []},
        )
        record(
            created_at=(draft.updated_at or draft.created_at) + timedelta(hours=1),
            entity_type="job_ai_draft",
            entity_id=draft.id,
            action_type="update",
            actor=actor,
            target_user_id=draft.recruiter_id,
            company_id=draft.company_id,
            before_json=draft_before,
            after_json=draft_after,
            diff_json=draft_diff,
            request_path=f"/job-ai/drafts/{draft.id}",
            request_method="PATCH",
        )

    first_chat_session = None
    for session in chat_sessions:
        actor = actor_by_user_id.get(session.recruiter_id)
        if first_chat_session is None:
            first_chat_session = session
        record(
            created_at=session.created_at,
            entity_type="chat_session",
            entity_id=session.id,
            action_type="create",
            actor=actor,
            target_user_id=session.recruiter_id,
            company_id=session.company_id,
            after_json=_serialize_audit_entity(session),
            request_path="/recruiter-chat/sessions",
            request_method="POST",
        )
        session_before, session_after, session_diff = _build_audit_snapshots(
            session,
            before_overrides={"title": "Untitled recruiter chat"},
        )
        record(
            created_at=(session.updated_at or session.created_at) + timedelta(hours=2),
            entity_type="chat_session",
            entity_id=session.id,
            action_type="update",
            actor=actor,
            target_user_id=session.recruiter_id,
            company_id=session.company_id,
            before_json=session_before,
            after_json=session_after,
            diff_json=session_diff,
            request_path=f"/recruiter-chat/sessions/{session.id}",
            request_method="PATCH",
        )

    if first_chat_session is not None:
        deleted_chat_id = uuid.uuid4()
        deleted_chat_snapshot = _serialize_audit_entity(first_chat_session) | {
            "id": str(deleted_chat_id),
            "title": "Old recruiter sync notes",
        }
        record(
            created_at=NOW - timedelta(days=40),
            entity_type="chat_session",
            entity_id=deleted_chat_id,
            action_type="delete",
            actor=actor_by_user_id.get(first_chat_session.recruiter_id),
            target_user_id=first_chat_session.recruiter_id,
            company_id=first_chat_session.company_id,
            before_json=deleted_chat_snapshot,
            request_path=f"/recruiter-chat/sessions/{deleted_chat_id}",
            request_method="DELETE",
        )

    for task_index, task in enumerate(import_tasks):
        actor = actor_by_user_id.get(task.user_id)
        task_anchor = NOW - timedelta(days=28 - task_index)
        create_after = _serialize_audit_entity(task)
        create_after["status"] = "pending"
        create_after["error_message"] = None
        create_after["result_data"] = None
        record(
            created_at=task_anchor,
            entity_type="resume_import_task",
            entity_id=task.id,
            action_type="create",
            actor=actor,
            target_user_id=task.user_id,
            after_json=create_after,
            request_path="/resumes/import",
            request_method="POST",
        )
        if task.status != "pending":
            task_before, task_after, task_diff = _build_audit_snapshots(
                task,
                before_overrides={
                    "status": "pending",
                    "error_message": None,
                    "result_data": None,
                },
            )
            record(
                created_at=task_anchor + timedelta(minutes=25),
                entity_type="resume_import_task",
                entity_id=task.id,
                action_type="status_transition",
                actor=actor,
                target_user_id=task.user_id,
                before_json=task_before,
                after_json=task_after,
                diff_json=task_diff,
                request_path=f"/resumes/import/{task.id}",
                request_method="PATCH",
            )

    await db.flush()
    print(f"  Seeded audit logs: {audit_counter}")


# ============================================================================
# MAIN
# ============================================================================


async def seed() -> None:
    await ensure_schema()
    await clear_existing_data()

    async with AsyncSessionLocal() as db:
        db.sync_session.info["audit_logs_disabled"] = True
        print("\n🚀 Seeding ConvexHire – Nepal IT Hiring Platform\n")
        print(f"📊 Data Overview:")
        print(f"   • Companies: {len(COMPANIES)}")
        print(f"   • Candidates: {len(CANDIDATES)}")
        print(f"   • Applications: {len(APPLICATIONS)}")
        print()

        # --- Companies, Admins, Recruiters, Jobs ---
        print(
            "📦 Seeding companies, admins, recruiters, jobs, and evaluation schemas..."
        )
        all_jobs: list[list[Job]] = []
        company_contexts: list[dict] = []
        for company_index, company_data in enumerate(COMPANIES):
            company, jobs, extra_jobs, admin, recruiters = await seed_company(
                db, company_index, company_data
            )
            all_jobs.append(jobs)
            company_contexts.append(
                {
                    "company": company,
                    "company_data": company_data,
                    "primary_jobs": jobs,
                    "extra_jobs": extra_jobs,
                    "admin": admin,
                    "recruiters": recruiters,
                }
            )

        # Queue all jobs for vector sync
        for company_context in company_contexts:
            for job in [
                *company_context["primary_jobs"],
                *company_context["extra_jobs"].values(),
            ]:
                db.add(JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT))

        # --- Candidates ---
        print("\n👤 Seeding candidates with profiles and resumes...")
        candidate_users: list[tuple[User, list[Resume]]] = []
        for idx, candidate_data in enumerate(CANDIDATES):
            print(f"  [{idx+1}/{len(CANDIDATES)}] Processing: {candidate_data['full_name']}...")
            user_resume_pair = await seed_candidate(db, candidate_data)
            candidate_users.append(user_resume_pair)

        # --- Applications, Screening, Shortlisting, Outreach, Interviews ---
        await seed_applications(db, candidate_users, all_jobs, COMPANIES)
        await seed_live_pipeline_data(db, candidate_users, company_contexts)
        await seed_ai_artifacts(db, company_contexts)
        await seed_candidate_import_tasks(db, candidate_users)
        await seed_preferences_and_activity(db, company_contexts)
        await seed_audit_history(db, company_contexts, candidate_users)

        await db.commit()
        credentials_path = write_credentials_file()

        # --- Summary ---
        total_jobs = await db.scalar(select(func.count(Job.id))) or 0
        active_jobs = (
            await db.scalar(
                select(func.count(Job.id)).where(Job.status == JobStatus.active)
            )
        ) or 0
        draft_jobs = (
            await db.scalar(
                select(func.count(Job.id)).where(Job.status == JobStatus.draft)
            )
        ) or 0
        expired_jobs = (
            await db.scalar(
                select(func.count(Job.id)).where(Job.status == JobStatus.expired)
            )
        ) or 0
        total_resumes = await db.scalar(select(func.count(Resume.id))) or 0
        total_applications = await db.scalar(select(func.count(Application.id))) or 0
        shortlisted = (
            await db.scalar(
                select(func.count(Application.id)).where(
                    Application.status.in_(
                        [
                            ApplicationStatus.shortlisted,
                            ApplicationStatus.interview_booked,
                            ApplicationStatus.interview_completed,
                            ApplicationStatus.offer,
                        ]
                    )
                )
            )
        ) or 0
        rejected = (
            await db.scalar(
                select(func.count(Application.id)).where(
                    Application.status == ApplicationStatus.rejected
                )
            )
        ) or 0
        total_email_drafts = await db.scalar(select(func.count(EmailDraft.id))) or 0
        total_interviews = await db.scalar(select(func.count(Interview.id))) or 0
        total_eval_schemas = (
            await db.scalar(select(func.count(JobEvaluationSchema.id)))
        ) or 0
        total_eval_scores = (
            await db.scalar(select(func.count(CandidateEvaluationScore.id)))
        ) or 0
        total_recordings = (
            await db.scalar(select(func.count(InterviewRecording.id)))
        ) or 0
        total_ai_drafts = await db.scalar(select(func.count(JobAIDraft.id))) or 0
        total_chat_sessions = (
            await db.scalar(select(func.count(RecruiterChatSession.id)))
        ) or 0
        total_import_tasks = (
            await db.scalar(select(func.count(ResumeImportTask.id)))
        ) or 0
        total_activity_events = (
            await db.scalar(text("select count(*) from activity_events"))
        ) or 0
        total_notifications = (
            await db.scalar(text("select count(*) from notifications"))
        ) or 0
        total_preferences = (
            await db.scalar(text("select count(*) from recruiter_preferences"))
        ) or 0
        total_audit_logs = await db.scalar(text("select count(*) from audit_logs")) or 0
        pending_requests = (
            await db.scalar(
                select(func.count(CompanyMembership.id)).where(
                    CompanyMembership.status == MembershipStatus.pending
                )
            )
        ) or 0

        print("\n" + "=" * 70)
        print("✅ SEEDING COMPLETE!")
        print("=" * 70)
        print(f"  Companies           : {len(COMPANIES)}")
        print(f"  Admins              : {len(COMPANIES)}")
        print(f"  Recruiters          : {sum(len(c['recruiters']) for c in COMPANIES)}")
        print(f"  Membership requests : {pending_requests} pending")
        print(
            f"  Jobs                : {total_jobs} "
            f"({active_jobs} active, {draft_jobs} draft, {expired_jobs} expired)"
        )
        print(f"  Evaluation schemas  : {total_eval_schemas}")
        print(f"  Evaluation scores   : {total_eval_scores}")
        print(f"  Candidates          : {len(CANDIDATES)}")
        print(f"  Resumes             : {total_resumes}")
        print(f"  Applications        : {total_applications}")
        print(f"    → Shortlisted     : {shortlisted} (with interview bookings)")
        print(f"    → Rejected        : {rejected} (with rejection emails)")

        # Count offer states
        offer_accepted_count = (
            await db.scalar(
                select(func.count(Application.id)).where(
                    Application.status == ApplicationStatus.offer_accepted
                )
            )
        ) or 0
        offer_declined_count = (
            await db.scalar(
                select(func.count(Application.id)).where(
                    Application.status == ApplicationStatus.offer_declined
                )
            )
        ) or 0
        offer_pending_count = (
            await db.scalar(
                select(func.count(Application.id)).where(
                    Application.status == ApplicationStatus.offer
                )
            )
        ) or 0

        print(f"    → Offers          : {offer_pending_count} pending, {offer_accepted_count} accepted, {offer_declined_count} declined")
        print(f"  Email drafts        : {total_email_drafts}")
        print(f"  Interview bookings  : {total_interviews}")
        print(f"  Interview recordings: {total_recordings}")
        print(f"  AI job drafts       : {total_ai_drafts}")
        print(f"  Chat sessions       : {total_chat_sessions}")
        print(f"  Resume import tasks : {total_import_tasks}")
        print(f"  Activity events     : {total_activity_events}")
        print(f"  Notifications       : {total_notifications}")
        print(f"  Audit logs          : {total_audit_logs}")
        print(f"  Recruiter prefs     : {total_preferences}")
        print(f"  Credentials file    : {credentials_path}")
        print()
        print(f"  🔑 Login credentials for all accounts: {DEFAULT_LOGIN_PASSWORD}")
        print()
        print("  📧 Recruiter Admin logins:")
        for c in COMPANIES:
            print(f"     • {c['admin']['email']} ({c['name']})")
        print()
        print("  📧 Recruiter logins:")
        for c in COMPANIES:
            for r in c["recruiters"]:
                print(f"     • {r['email']} ({c['name']})")
        print()
        print("  📧 Candidate logins:")
        for c in CANDIDATES:
            print(f"     • {c['email']} ({c['headline'][:50]}...)")
        print("=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(seed())
