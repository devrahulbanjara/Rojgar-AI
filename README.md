<div align="center">
  <img src="docs/ConvexHire.png" alt="ConvexHire Logo" width="400"/>
  
  ### The AI-Native Recruitment Operating System
  
  *From job posting to offer letter—fully orchestrated by intelligent agents.*
  
  <br/>
  
  ![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
  ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
  ![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)
  ![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=for-the-badge)
  ![Groq](https://img.shields.io/badge/Groq-f55036?style=for-the-badge)
  
  [Live Demo](#) • [Documentation](#) • [Architecture](#-architecture)
  
</div>

---

## 🎯 Vision

**ConvexHire replaces your entire hiring pipeline with AI agents that think, evaluate, and decide—while keeping humans in control.**

Instead of juggling spreadsheets, email threads, and calendar chaos, recruiters work with a system that:
- Writes job descriptions tailored to your company
- Discovers talent semantically (not just keyword matching)
- Evaluates candidates like a veteran CTO + HR manager
- Schedules interviews, analyzes conversations, and sends offer letters

**All orchestrated. All auditable. All privacy-first.**

---

## ⚡ What This Does

```mermaid
%%{init: {'theme': 'neutral'}}%%
graph TD
    ROOT[ConvexHire]
    
    ROOT --> JD[AI Job Description Generation]
    ROOT --> SCREEN[Automated Resume Screening]
    ROOT --> SEARCH[Vector-Based Talent Search]
    ROOT --> SCHEDULE[Interview Scheduling & Emails]
    ROOT --> VOICE[Voice Interview Analysis]
    ROOT --> DECIDE[Human-in-Loop Decision Making]
    ROOT --> ARCHIVE[Searchable Candidate Database]
    
    style ROOT fill:#667eea,stroke:#764ba2,stroke-width:4px,color:#fff
    style JD fill:#f093fb,stroke:#f5576c,stroke-width:2px
    style SCREEN fill:#4facfe,stroke:#00f2fe,stroke-width:2px
    style SEARCH fill:#43e97b,stroke:#38f9d7,stroke-width:2px
    style SCHEDULE fill:#fa709a,stroke:#fee140,stroke-width:2px
    style VOICE fill:#30cfd0,stroke:#330867,stroke-width:2px
    style DECIDE fill:#a8edea,stroke:#fed6e3,stroke-width:2px
    style ARCHIVE fill:#ff9a9e,stroke:#fecfef,stroke-width:2px
```

---

## 🏗️ Architecture

```mermaid
%%{init: {'theme': 'neutral'}}%%
flowchart TB
    subgraph Input["📝 Talent Acquisition"]
        JD[Job Description Agent] -->|Generates & Refines| POST[Job Posting]
        POST -->|Embeds| QDRANT[(Vector Database)]
    end
    
    subgraph Pipeline["🤖 Intelligent Screening"]
        APPLY[Candidate Applies] -->|Resume| PARSE[Document Extraction]
        PARSE -->|PII Redaction| GUARD[Privacy Layer]
        GUARD --> EVAL{Dual Evaluation}
        EVAL -->|Technical| CTO[Virtual CTO]
        EVAL -->|Culture| HR[Virtual HR Manager]
        CTO & HR --> CRITIQUE[Quality Audit]
        CRITIQUE -->|Scored| HITL[👤 HR Decision]
    end
    
    subgraph Execution["📅 Interview & Selection"]
        HITL -->|Approved| SCHEDULE[Scheduling Agent]
        SCHEDULE -->|Calendar Sync| INTERVIEW[In-Office Interview]
        INTERVIEW -->|Audio Recording| VOICE[Voice Analysis]
        VOICE --> FINAL{Final Verdict}
        FINAL -->|Selected| OFFER[Automated Offer Letter]
        FINAL -->|Rejected| REJECT[Rejection Email with Feedback]
    end
    
    subgraph Discovery["🔍 Talent Discovery"]
        OFFER --> ARCHIVE[(All Candidates Archive)]
        REJECT --> ARCHIVE
        ARCHIVE -->|RAG Search| RECRUITER[Recruiter Search Interface]
    end
    
    style CRITIQUE fill:#e1bee7,stroke:#8e24aa,stroke-width:2px
    style HITL fill:#fff59d,stroke:#f57f17,stroke-width:3px
    style VOICE fill:#80cbc4,stroke:#00796b,stroke-width:2px
    style ARCHIVE fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
```

---

## 🔄 Complete Hiring Lifecycle

```mermaid
%%{init: {'theme': 'neutral'}}%%
timeline
    title End-to-End Recruitment Journey
    section Job Creation
        JD Generator Agent : Generate from reference docs
                           : Get recruiter approval
                           : Publish to portal
    section Discovery
        Vector Search : Semantic candidate matching
                     : RAG over historical database
                     : Find past candidates for new roles
    section Screening
        Shortlist Agent : Auto-parse resume
                       : Privacy protection
                       : Dual AI evaluation
                       : HR final review
    section Coordination
        Scheduling Agent : Personalized outreach
                        : Calendar integration
                        : Automated reminders
    section Assessment
        Voice Evaluation : Record interview
                        : Generate transcript
                        : Knowledge scoring
                        : AI + Human verdict
    section Closure
        Final Workflow : Offer letter OR rejection email
                      : Transparent feedback to candidate
                      : Archive with detailed notes
```

---

## 🛠️ Tech Stack

```mermaid
%%{init: {'theme': 'neutral'}}%%
graph LR
    subgraph AI["🤖 AI Orchestration"]
        LC[Agent Framework]
        LG[State Graphs]
        LLM[LLM Inference]
        QD[(Vector Store)]
    end
    
    subgraph Backend["⚙️ Backend"]
        FA[API Framework]
        SA[ORM Layer]
        PD[Validation]
        LO[Logging]
    end
    
    subgraph Frontend["🎨 Frontend"]
        NX[React Framework]
        TS[TypeScript]
        TW[Styling System]
        UI[Component Library]
        AN[Animations]
    end
    
    subgraph Intelligence["🧠 Intelligence"]
        LP[Document Parser]
        LLG[Privacy Guard]
        DD[Web Search]
    end
    
    subgraph Infra["🐳 Infrastructure"]
        DK[Containers]
        DB[(Relational DB)]
        CACHE[(Cache Layer)]
        CAL[Scheduling API]
    end
    
    AI --> Backend
    Backend --> Frontend
    Intelligence --> AI
    Infra --> Backend
    
    style AI fill:#e3f2fd,stroke:#1976d2
    style Backend fill:#f3e5f5,stroke:#7b1fa2
    style Frontend fill:#fff9c4,stroke:#f57f17
    style Intelligence fill:#e8f5e9,stroke:#388e3c
    style Infra fill:#fce4ec,stroke:#c2185b
```

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/devrahulbanjara/ConvexHire.git
cd ConvexHire

# 2. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start infrastructure
docker-compose up -d

# 4. Run backend (http://localhost:8000)
cd backend && uv sync && uv run fastapi dev

# 5. Run frontend (http://localhost:3000)
cd frontend && bun install && bun run dev
```

**Prerequisites:** Python 3.12+, Node.js 18+, Docker

---

## 📊 Key Features

### 🔍 Semantic Talent Discovery
```mermaid
%%{init: {'theme': 'neutral'}}%%
graph TB
    RECRUITER[New Job: Senior Backend Engineer] --> SEARCH{Vector Search}
    SEARCH --> DB[(Historical Candidate Database)]
    DB --> R1[Candidate A: Rejected 6 months ago<br/>Reason: Junior at the time<br/>Skills: Python, FastAPI, PostgreSQL]
    DB --> R2[Candidate B: Not shortlisted<br/>Reason: Lacked distributed systems exp<br/>Skills: Django, Redis, Docker]
    DB --> R3[Candidate C: Interview rejected<br/>Reason: Poor communication skills<br/>Skills: Go, Kubernetes, gRPC]
    
    R1 --> MATCH[✅ Now matches: Has 6 more months exp]
    R2 --> NOMATCH[❌ Still lacks required skills]
    R3 --> NOMATCH2[❌ Communication still a concern]
    
    style SEARCH fill:#e1bee7,stroke:#8e24aa,stroke-width:2px
    style DB fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    style MATCH fill:#a5d6a7,stroke:#388e3c,stroke-width:2px
```

**Find past candidates who are now qualified for new roles based on skills and previous feedback.**

---

### 👥 Human-in-the-Loop Control

```mermaid
%%{init: {'theme': 'neutral'}}%%
stateDiagram-v2
    [*] --> AI_Evaluation
    AI_Evaluation --> Critique_Node
    Critique_Node --> HR_Review: Scored
    HR_Review --> Approved: ✅ Accept
    HR_Review --> Rejected: ❌ Decline
    HR_Review --> Re_Evaluate: 🔄 Request Changes
    Re_Evaluate --> AI_Evaluation
    Approved --> [*]
    Rejected --> [*]
    
    note right of HR_Review
        AI suggests
        Humans decide
    end note
```

---

### 🎯 Transparent Rejection Feedback

```mermaid
%%{init: {'theme': 'neutral'}}%%
graph TD
    A[Candidate Interview] --> B[AI + Human Evaluation]
    B --> C{Decision}
    C -->|Selected| D[Offer Letter]
    C -->|Rejected| E[Rejection Email]
    
    E --> F[Transparent Feedback:<br/>Technical gaps identified<br/>Areas for improvement<br/>Encouragement to reapply]
    
    D --> G[Archive with positive notes]
    F --> H[Archive with constructive feedback]
    
    style C fill:#fff59d,stroke:#f57f17,stroke-width:2px
    style F fill:#ffccbc,stroke:#d84315,stroke-width:2px
    style H fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

<div align="center">
  
### Built with ❤️ by [Rahul Dev Banjara](https://github.com/devrahulbanjara)

**ConvexHire** • Where AI meets Human Judgment

[⭐ Star this repo](https://github.com/devrahulbanjara/ConvexHire) if you believe hiring should be intelligent, not manual.

</div>
