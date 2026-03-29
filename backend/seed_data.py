import asyncio
from datetime import date

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.auth.enums import MembershipRole, MembershipStatus, UserRole
from app.modules.auth.models import User
from app.modules.companies.models import Company, CompanyMembership
from app.modules.jobs.enums import SyncAction
from app.modules.jobs.models import Job, JobSyncEvent
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
from app.shared.enums import JobStatus, LocationType

COMMON_PW = hash_password("Password@123")


# ---------------------------------------------------------------------------
# COMPANY DATA
# ---------------------------------------------------------------------------

COMPANIES = [
    {
        "name": "Pinnacle Tech Nepal Pvt. Ltd.",
        "industry": "Fintech & Digital Banking",
        "company_size": "201-500",
        "location": "Hattisar, Kathmandu",
        "website_url": "https://pinnacletech.com.np",
        "domain": "pinnacletech.com.np",
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
                "status": JobStatus.active,
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
            },
            {
                "title": "Lead Frontend Engineer – Mobile Banking Platform (React Native / Next.js)",
                "location": "Hattisar, Kathmandu",
                "location_type": LocationType.onsite,
                "salary_min": 140000,
                "salary_max": 210000,
                "currency": "NPR",
                "status": JobStatus.active,
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
            },
            {
                "title": "DevOps & Cloud Infrastructure Engineer (AWS / Kubernetes)",
                "location": "Kathmandu / Remote (Nepal)",
                "location_type": LocationType.remote,
                "salary_min": 130000,
                "salary_max": 200000,
                "currency": "NPR",
                "status": JobStatus.active,
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
                "status": JobStatus.active,
                "overview": (
                    "NovaMind is building a Nepali-language AI assistant for the public health sector, "
                    "funded by the Ministry of Health and Population. We need a Machine Learning Engineer "
                    "with hands-on experience in LLM fine-tuning and NLP to join the core model team. "
                    "You will work on Nepali language tokenization, fine-tuning open-weight models like "
                    "LLaMA and Mistral on domain-specific corpora, and deploying inference pipelines at scale. "
                    "This is a rare opportunity to work on something that genuinely matters for Nepal."
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
            },
            {
                "title": "Data Engineer – Healthcare Analytics Pipeline (Spark / dbt / Airflow)",
                "location": "Kumaripati, Lalitpur",
                "location_type": LocationType.onsite,
                "salary_min": 120000,
                "salary_max": 185000,
                "currency": "NPR",
                "status": JobStatus.active,
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
            },
            {
                "title": "Full Stack Engineer – AI Product Platform (FastAPI + React)",
                "location": "Kumaripati, Lalitpur / Remote Nepal",
                "location_type": LocationType.hybrid,
                "salary_min": 110000,
                "salary_max": 175000,
                "currency": "NPR",
                "status": JobStatus.active,
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
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# CANDIDATE DATA
# ---------------------------------------------------------------------------

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
                    "Fine-tuned BERT and RoBERTa models for clinical NER (Named Entity Recognition) on US healthcare datasets — achieving 91% F1 on discharge summary extraction tasks",
                    "Built a Nepali-language text classification pipeline for social media content moderation; curated a 50k-sentence annotated dataset",
                    "Developed a crop disease detection model using YOLOv8, deployed on Raspberry Pi 4 for offline inference at agriculture extension offices in Kavre district",
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
                "resume_name": "AI Research & Data Science Profile",
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
                    "Migrated 15 legacy SQL stored procedures to dbt models, improving test coverage from 0% to 85% and cutting pipeline debugging time by 50%",
                    "Implemented Great Expectations data quality suite across the ingestion layer; reduced data quality incidents reaching downstream ML teams by 70%",
                    "Built a FHIR R4 data ingestion adapter that parses HL7 FHIR bundles from EHR APIs into a normalised Snowflake schema",
                    "Collaborated with the US-based data architecture team on schema design and naming conventions for a new enterprise data warehouse migration",
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
                    "Participated in on-call rotation for pipeline failures; resolved P1 incidents with SLA response times",
                ],
            },
            {
                "company_name": "Leapfrog Technology Inc.",
                "title": "Software Engineer (Data Focus)",
                "start_date": date(2019, 7, 1),
                "end_date": date(2020, 8, 31),
                "description": [
                    "Developed backend data APIs and reporting modules for a US-based healthtech SaaS client",
                    "Built automated report generation system using Python/Pandas that replaced manual Excel workflows",
                    "Wrote database migration scripts and managed schema changes for a PostgreSQL production database",
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
                    "Deep expertise in Airflow, dbt, and Snowflake. Strong data quality and documentation culture. "
                    "Looking for a senior role at a data-driven company."
                ),
            },
            {
                "resume_name": "Analytics Engineering / Data Platform Profile",
                "headline": "Analytics Engineer | dbt · SQL · Python | Data Platform Design",
                "summary": (
                    "Analytics engineer bridging data engineering and BI, with strong dbt skills and "
                    "4 years of hands-on Snowflake experience. Interested in analytics engineering and "
                    "data platform roles that require close collaboration with product and data science teams."
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
            "I'm a quick learner who thrives in small, autonomous teams. I'm particularly interested "
            "in roles at product companies working on AI-powered tools or developer productivity."
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
                    "Core engineer on 'SanoBazar', a B2B e-commerce platform for FMCG distribution in Nepal — built with Next.js 14 and FastAPI; serves 200+ merchant accounts",
                    "Designed and built the real-time order tracking module using WebSockets and PostgreSQL triggers",
                    "Developed a React Native companion app for field sales agents, enabling offline order entry with background sync",
                    "Built a multi-tenant RBAC system supporting distributor admin, sales rep, and merchant roles",
                    "Improved Lighthouse performance score from 54 to 91 by implementing image optimisation, lazy loading, and proper caching headers",
                    "Set up the CI/CD pipeline using GitHub Actions and Docker Compose on an AWS EC2 instance",
                ],
            },
            {
                "company_name": "Braindigit IT Solutions Pvt. Ltd.",
                "title": "Junior Software Engineer",
                "start_date": date(2021, 3, 1),
                "end_date": date(2021, 12, 31),
                "description": [
                    "Built UI components for a real estate listing portal using React and REST APIs",
                    "Wrote FastAPI endpoint handlers for a property search feature with full-text search",
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
                    "applications for real users in Nepal. Looking for a product company with a strong "
                    "design culture."
                ),
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------


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
        status=data["status"],
        overview=data["overview"],
        responsibilities=data["responsibilities"],
        requirements=data["requirements"],
        preferred_qualifications=data["preferred_qualifications"],
        benefits=data["benefits"],
        auto_shortlist=False,
    )


async def seed_company(db, company_data: dict) -> list[Job]:
    """Seed a single company: admin + recruiters + jobs. Returns the created jobs."""

    # Admin user
    admin_info = company_data["admin"]
    admin = make_user(
        admin_info["full_name"], admin_info["email"], UserRole.recruiter_admin
    )
    db.add(admin)
    await db.flush()

    # Company
    company = Company(
        name=company_data["name"],
        industry=company_data["industry"],
        company_size=company_data["company_size"],
        location=company_data["location"],
        website_url=company_data["website_url"],
        domain=company_data["domain"],
        description=company_data["description"],
    )
    db.add(company)
    await db.flush()

    db.add(
        make_membership(
            admin.id, company.id, MembershipRole.admin, admin_info["job_title"]
        )
    )

    # Recruiters
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

    # Jobs — distribute posting across admin and recruiters
    created_jobs = []
    posters = [admin] + recruiter_users
    for i, job_data in enumerate(company_data["jobs"]):
        job = make_job(company.id, posters[i % len(posters)].id, job_data)
        db.add(job)
        await db.flush()
        created_jobs.append(job)

    print(
        f"  ✓ {company_data['name']}: 1 admin, {len(recruiter_users)} recruiters, {len(created_jobs)} jobs"
    )
    return created_jobs


async def seed_candidate(db, data: dict) -> None:
    """Seed a single candidate: user + profile + 2 resumes."""

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

    # --- Profile ---
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

    # --- 2 Resume Variants ---
    for variant in data["resume_variants"]:
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
        db.add(resume)
        await db.flush()

        for exp in data["experiences"]:
            db.add(
                ResumeExperience(
                    resume_id=resume.id,
                    company_name=exp["company_name"],
                    title=exp["title"],
                    start_date=exp["start_date"],
                    end_date=exp.get("end_date"),
                    description=exp["description"],
                )
            )

        for edu in data["educations"]:
            db.add(
                ResumeEducation(
                    resume_id=resume.id,
                    institution=edu["institution"],
                    degree=edu.get("degree"),
                    field_of_study=edu.get("field_of_study"),
                    start_date=edu.get("start_date"),
                    end_date=edu.get("end_date"),
                )
            )

        for skill_name in data["skills"]:
            db.add(ResumeSkill(resume_id=resume.id, skill_name=skill_name))

    print(
        f"  ✓ Candidate: {data['full_name']} ({data['email']}) — profile + {len(data['resume_variants'])} resumes"
    )


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        print("\n🚀 Seeding Nepal Tech Industry Data...\n")

        # --- Companies, Admins, Recruiters, Jobs ---
        print("📦 Seeding companies, admins, recruiters, and jobs...")
        all_jobs: list[Job] = []
        for company_data in COMPANIES:
            jobs = await seed_company(db, company_data)
            all_jobs.extend(jobs)

        # Queue all jobs for vector sync via outbox
        for job in all_jobs:
            db.add(JobSyncEvent(job_id=job.id, action=SyncAction.UPSERT))

        # --- Candidates ---
        print("\n👤 Seeding candidates with profiles and resumes...")
        for candidate_data in CANDIDATES:
            await seed_candidate(db, candidate_data)

        await db.commit()

        print("\n" + "=" * 60)
        print("✅ Seeding complete!")
        print("=" * 60)
        print(f"  Companies  : {len(COMPANIES)}")
        print(f"  Admins     : {len(COMPANIES)}")
        print(f"  Recruiters : {sum(len(c['recruiters']) for c in COMPANIES)}")
        print(f"  Jobs       : {len(all_jobs)} (queued for vectorisation)")
        print(f"  Candidates : {len(CANDIDATES)}")
        print(f"  Resumes    : {sum(len(c['resume_variants']) for c in CANDIDATES)}")
        print("\n  Login credentials for all accounts: Password@123")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    asyncio.run(seed())
