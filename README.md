<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="frontend/public/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="frontend/public/logo-light.svg">
    <img src="frontend/public/logo-light.svg" alt="ConvexHire Logo" width="400"/>
  </picture>
  
  ### Use AI to Recruit Humans
  
  *An intelligent recruitment system that automates your entire hiring pipeline—from job posting to offer letters—using AI agents while keeping humans in control.*
  
  <br/>
  
  <p align="center">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" width="50" height="50"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" alt="FastAPI" width="50" height="50"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" alt="Next.js" width="50" height="50"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg" alt="AWS" width="50" height="50"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt="Docker" width="50" height="50"/>
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="PostgreSQL" width="50" height="50"/>
  </p>
  
</div>

---

> [!NOTE]
> **Currently in Development** – Features are being actively built and tested. Expect breaking changes.

---

## 📝 What is ConvexHire?

ConvexHire is an AI-powered recruitment platform that automates your hiring workflow from end to end. Built with modern AI agents and LLM orchestration, it streamlines the entire recruitment process while keeping humans in control.

### ✨ Key Features

**🤖 AI-Powered Job Management**
- Generate professional job descriptions using AI agents
- Reference-based JD generation for consistency
- Multi-step wizard with AI assistance

**🎯 Intelligent Candidate Screening**
- Dual AI agent evaluation system (HR + Technical perspectives)
- Automated resume parsing and analysis
- Semantic search using vector embeddings
- Shortlisting with detailed reasoning

**📧 Automated Communication**
- Smart email composition for candidates
- Interview scheduling and reminders
- Automated follow-ups and status updates

**🔍 Advanced Search & Filtering**
- Vector-based semantic candidate search
- Filter by skills, experience, and qualifications
- Searchable talent database

**📊 Analytics & Insights**
- Real-time recruitment metrics
- Application tracking and status monitoring
- AI decision transparency and audit trails

**👥 Role-Based Access**
- Separate dashboards for recruiters and candidates
- Secure authentication and authorization
- Organization-level data isolation

---

## 🚀 Quick Setup

> [!IMPORTANT]
> **Prerequisites:** 
> - [uv](https://docs.astral.sh/uv/getting-started/installation/) - Fast Python package installer
> - Node.js 18+ and npm
> - Docker and Docker Compose
> - [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) - For Amazon Bedrock access
> - PostgreSQL (via Docker)

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/devrahulbanjara/ConvexHire.git
cd ConvexHire

# 2. Configure AWS credentials (for Bedrock)
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (e.g., us-east-1)

# 3. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Backend Configuration

Edit `backend/.env` with your credentials:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/convexhire

# LLM Providers
GROQ_API_KEY=your_groq_api_key
AWS_REGION=us-east-1

# Observability
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=convexhire
LOGFIRE_TOKEN=your_logfire_token

# Web Search
TAVILY_API_KEY=your_tavily_api_key

# Security
SECRET_KEY=your_secret_key_here
```

### Frontend Configuration

Edit `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Start the Application

```bash
# 4. Start infrastructure (PostgreSQL, Redis, Qdrant)
docker-compose up -d

# 5. Run database migrations
cd backend
uv sync
uv run alembic upgrade head

# 6. Start backend (http://localhost:8000)
uv run fastapi dev

# 7. In a new terminal, start frontend (http://localhost:3000)
cd frontend
npm install
npm run dev
```

> [!TIP]
> Access the API documentation at `http://localhost:8000/docs` after starting the backend.

> [!IMPORTANT]
> Make sure all API keys are configured before running the application. Missing keys will cause AI features to fail.

---

### AI Agent Workflow

The platform uses **LangGraph** to orchestrate multi-agent workflows:

1. **Job Description Generator** - Creates tailored JDs from requirements
2. **HR Screening Agent** - Evaluates cultural fit and soft skills
3. **Technical Screening Agent** - Assesses technical qualifications
4. **Critique Agent** - Reviews and refines agent decisions
5. **Email Composer** - Generates personalized candidate communications

All agent interactions are traced and logged via **LangSmith** for debugging and optimization.

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Query](https://tanstack.com/query)** - Data fetching and state management
- **[Shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern Python web framework
- **[SQLAlchemy](https://www.sqlalchemy.org/)** - SQL toolkit and ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database
- **[Alembic](https://alembic.sqlalchemy.org/)** - Database migration tool
- **[Pydantic](https://docs.pydantic.dev/)** - Data validation using Python type hints

### AI & LLM
- **[LangGraph](https://langchain-ai.github.io/langgraph/)** - Multi-agent workflow orchestration
- **[LangChain](https://www.langchain.com/)** - LLM application framework
- **[Groq](https://groq.com/)** - Fast LLM inference
- **[Amazon Bedrock](https://aws.amazon.com/bedrock/)** - Managed foundation models
- **[Tavily](https://tavily.com/)** - AI-powered web search API

### Observability & Logging
- **[LangSmith](https://smith.langchain.com/)** - LLM observability, request/response tracing, and debugging
- **[Pydantic Logfire](https://pydantic.dev/logfire)** - Structured logging and observability platform
- **[Loguru](https://github.com/Delgan/loguru)** - Python logging made simple

### Infrastructure & DevOps
- **[Docker](https://www.docker.com/)** - Containerization
- **[APScheduler](https://apscheduler.readthedocs.io/)** - Advanced Python scheduler for cron jobs
- **[Redis](https://redis.io/)** - In-memory data store for caching
- **[Qdrant](https://qdrant.tech/)** - Vector database for semantic search

---

## 📁 Project Structure

```
ConvexHire/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── agents/            # LangGraph AI agents
│   │   │   ├── jd_generator/  # Job description generation
│   │   │   ├── shortlisting/  # Candidate screening agents
│   │   │   └── scheduler/     # Email & scheduling automation
│   │   ├── api/               # API routes
│   │   │   ├── v1/            # API version 1
│   │   │   ├── auth.py        # Authentication endpoints
│   │   │   └── dependencies.py
│   │   ├── core/              # Core configurations
│   │   │   ├── config.py      # Settings management
│   │   │   ├── security.py    # Auth & security
│   │   │   └── logging_config.py
│   │   ├── db/                # Database layer
│   │   │   ├── models/        # SQLAlchemy models
│   │   │   ├── repositories/  # Data access layer
│   │   │   └── session.py     # DB session management
│   │   └── services/          # Business logic
│   ├── alembic/               # Database migrations
│   ├── tests/                 # Test suite
│   └── main.py                # Application entry point
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # App router pages
│   │   │   ├── recruiter/     # Recruiter dashboard
│   │   │   └── candidate/     # Candidate portal
│   │   ├── components/        # React components
│   │   │   ├── ui/            # Reusable UI components
│   │   │   ├── recruiter/     # Recruiter-specific components
│   │   │   └── candidate/     # Candidate-specific components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client services
│   │   ├── types/             # TypeScript type definitions
│   │   └── lib/               # Utility functions
│   ├── public/                # Static assets
│   └── tailwind.config.ts     # Tailwind configuration
│
├── docker-compose.yml          # Infrastructure setup
└── README.md                   # This file
```

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=devrahulbanjara/ConvexHire&type=date&legend=top-left)](https://www.star-history.com/#devrahulbanjara/ConvexHire&type=date&legend=top-left)

---

<div align="center">
  
### Built with ❤️ by [Rahul Dev Banjara](https://github.com/devrahulbanjara)

**ConvexHire** • Where AI meets Human Judgment

[⭐ Star this repo](https://github.com/devrahulbanjara/ConvexHire) if you believe hiring should be intelligent, not manual.

</div>