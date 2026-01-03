<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/ConvexHire.png" />
    <source media="(prefers-color-scheme: light)" srcset="docs/ConvexHire_transparent.png" />
    <img src="docs/ConvexHire_transparent.png" alt="ConvexHire Logo" width="400"/>
  </picture>

  <h1>ConvexHire</h1>
  <p><i>AI-Powered Recruitment Platform with Multi-Agent Intelligence</i></p>

  <!-- Repo Status -->
  <p>
    <img src="https://img.shields.io/github/stars/devrahulbanjara/ConvexHire?style=social" alt="GitHub Stars" />
    <img src="https://img.shields.io/github/forks/devrahulbanjara/ConvexHire?style=social" alt="GitHub Forks" />
    <br/>
    <img src="https://img.shields.io/github/license/devrahulbanjara/ConvexHire?style=flat-square&color=blue" alt="License" />
    <img src="https://img.shields.io/github/last-commit/devrahulbanjara/ConvexHire?style=flat-square&color=orange" alt="Last Commit" />
    <img src="https://img.shields.io/github/repo-size/devrahulbanjara/ConvexHire?style=flat-square&color=red" alt="Repo Size" />
  </p>

  <p>
    <a href="#-overview">Overview</a> •
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-tech-stack">Tech Stack</a>
  </p>
</div>

---

## Overview

ConvexHire is an intelligent recruitment automation platform that leverages Multi-Agent Systems (MAS) and Retrieval-Augmented Generation (RAG) to streamline hiring workflows. Built with transparency and bias-awareness at its core, it provides explainable AI-driven candidate matching while keeping humans in the loop for critical decisions.

### The Problem

Traditional ATS platforms rely on opaque keyword matching, often disqualifying qualified candidates without explanation. ConvexHire uses semantic understanding and transparent scoring to bridge this gap.

## Features

<table>
<tr>
<td width="50%">

**AI-Powered Automation**
- Intelligent resume screening and analysis
- Semantic candidate matching with vector search
- Automated job description generation
- Smart interview scheduling

</td>
<td width="50%">

**Transparent & Fair**
- Explainable AI decision-making
- Bias-aware algorithms
- Clear match scoring with reasoning
- Human-in-the-loop oversight

</td>
</tr>
<tr>
<td width="50%">

**Advanced Document Processing**
- Multi-column CV parsing with Docling
- Layout-preserving OCR
- Support for scanned documents
- High accuracy text extraction

</td>
<td width="50%">

**Seamless Integration**
- Gmail and Google Calendar sync
- RESTful API architecture
- Real-time updates
- Vector-based semantic search

</td>
</tr>
</table>

## Quick Start

### Option 1: Docker (Recommended)

**Prerequisites:** [Docker](https://docs.docker.com/get-docker/) installed on your system

```bash
# Clone repository
git clone https://github.com/devrahulbanjara/ConvexHire.git
cd ConvexHire

# Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.local frontend/.env

# Start all services
docker compose up -d
```

**Services:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

### Option 2: Local Development

**Prerequisites:**
- Node.js 18+
- Python 3.10+
- [UV Package Manager](https://docs.astral.sh/uv/getting-started/installation/)

<table>
<tr>
<td width="50%">

**Backend Setup**

```bash
# Clone repository
git clone https://github.com/devrahulbanjara/ConvexHire.git
cd ConvexHire/backend

# Setup environment
cp .env.example .env

# Install dependencies and run
uv sync
uv run fastapi dev
```

Backend runs on `http://localhost:8000`  
API documentation at `http://localhost:8000/docs`

</td>
<td width="50%">

**Frontend Setup**

```bash
# Navigate to frontend
cd ../frontend

# Setup environment
cp .env.local .env

# Install dependencies and run
npm install
npm run dev
```

Application runs on `http://localhost:3000`

</td>
</tr>
</table>

## Tech Stack

### Core Technologies

<div align="center">

<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.svg" width="48" alt="Python"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg" width="48" alt="Next.js"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/fastapi/fastapi-original.svg" width="48" alt="FastAPI"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/docker/docker-original.svg" width="48" alt="Docker"/>
<img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg" width="48" alt="PostgreSQL"/>

</div>

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.118+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

</div>

### AI and Data Layer

<div align="center">

![LangChain](https://img.shields.io/badge/LangChain-Framework-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Orchestration-1C3C3C?style=for-the-badge)
![LangSmith](https://img.shields.io/badge/LangSmith-Observability-1C3C3C?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-Inference-F55036?style=for-the-badge)
![Google Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC244C?style=for-the-badge)
![Hugging Face](https://img.shields.io/badge/Hugging_Face-Embeddings-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![Docling](https://img.shields.io/badge/Docling-OCR-052FAD?style=for-the-badge)

</div>

### Technology Roles

| Component | Technology | Purpose |
|:----------|:-----------|:--------|
| **Backend API** | FastAPI | High-performance REST API server |
| **Frontend** | Next.js | Server-side rendered React application |
| **Orchestration** | LangGraph | Multi-agent workflow management |
| **LLM Framework** | LangChain | LLM application development |
| **Observability** | LangSmith | Debugging and monitoring |
| **Inference** | Groq | Ultra-low latency LLM processing |
| **Multimodal AI** | Google Gemini | Complex reasoning tasks |
| **Vector Store** | Qdrant | Semantic search and matching |
| **Embeddings** | Hugging Face | Text vectorization models |
| **Document Processing** | Docling | OCR and layout-preserving parsing |
| **Database** | Supabase | PostgreSQL database with real-time features |
| **Integration** | Gmail / Google Calendar | Communication and scheduling |

## Acknowledgements

This project leverages **Docling** by IBM Research for efficient document conversion and OCR processing.

**Citation:**

> Livathinos, N., Auer, C., Lysak, M., Nassar, A., Dolfi, M., Vagenas, P., Berrospi Ramis, C., Omenetti, M., Dinkla, K., Kim, Y., Gupta, S., de Lima, R. T., Weber, V., Morin, L., Meijer, I., Kuropiatnyk, V., & Staar, P. W. J. (2025). *Docling: An Efficient Open-Source Toolkit for AI-driven Document Conversion*. arXiv preprint arXiv:2501.17887. https://arxiv.org/abs/2501.17887

```bibtex
@misc{livathinos2025docling,
      title={Docling: An Efficient Open-Source Toolkit for AI-driven Document Conversion},
      author={Nikolaos Livathinos and Christoph Auer and Maksym Lysak and Ahmed Nassar and Michele Dolfi and Panos Vagenas and Cesar Berrospi Ramis and Matteo Omenetti and Kasper Dinkla and Yusik Kim and Shubham Gupta and Rafael Teixeira de Lima and Valery Weber and Lucas Morin and Ingmar Meijer and Viktor Kuropiatnyk and Peter W. J. Staar},
      year={2025},
      eprint={2501.17887},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2501.17887}
}
```

## Star History

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=devrahulbanjara/ConvexHire&type=Date)](https://star-history.com/#devrahulbanjara/ConvexHire&Date)

**Like this project? Give us a star!**

</div>

---

<div align="center">

### Made with passion by [@devrahulbanjara](https://github.com/devrahulbanjara)

[Report Bug](https://github.com/devrahulbanjara/ConvexHire/issues) • [Request Feature](https://github.com/devrahulbanjara/ConvexHire/issues) • [Contribute](CONTRIBUTING.md)

</div>
