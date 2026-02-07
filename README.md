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

> [!WARNING]
> **Currently in Development** – Features are being actively built and tested. Expect breaking changes.

---

## 📝 What is ConvexHire?

ConvexHire is an AI-powered recruitment platform that automates your hiring workflow:

- **AI Job Descriptions** – Generate tailored job postings
- **Smart Resume Screening** – Automated candidate evaluation with dual AI agents
- **Semantic Search** – Find candidates using vector-based matching
- **Interview Coordination** – Automated scheduling and reminders
- **Voice Analysis** – AI-powered interview assessment
- **Human Oversight** – Keep recruiters in control of final decisions
- **Talent Database** – Searchable archive of all candidates

---

## 🚀 Quick Setup

> [!IMPORTANT]
> **Prerequisites:** 
> - [uv](https://docs.astral.sh/uv/getting-started/installation/) - Fast Python package installer
> - Node.js 18+
> - Docker
> - [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) - Required for AI services

```bash
# 1. Clone the repository
git clone https://github.com/devrahulbanjara/ConvexHire.git
cd ConvexHire

# 2. Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (e.g., us-east-1)

# 3. Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Start infrastructure
docker-compose up -d

# 5. Run backend (http://localhost:8000)
cd backend && uv sync && uv run fastapi dev

# 6. Run frontend (http://localhost:3000)
cd frontend && bun install && bun run dev
```

> [!TIP]
> Make sure to configure your API keys in the `.env` files before running the application.

> [!NOTE]
> The backend runs on port 8000 and the frontend on port 3000 by default.

---

## 🎨 Design System

<table>
<tr>
<td width="80" align="center">
<img src="frontend/public/logo-icon.svg" width="40" height="40" alt="ConvexHire"/>
</td>
<td>
ConvexHire uses a clean, premium, modern design system.
</td>
</tr>
</table>

> 📖 **[View Full Design Documentation →](./DESIGN.md)** Logo, typography, colors, spacing, shadows, animations, dark mode, and component patterns.

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=devrahulbanjara/ConvexHire&type=date&legend=top-left)](https://www.star-history.com/#devrahulbanjara/ConvexHire&type=date&legend=top-left)

---

<div align="center">
  
### Built with ❤️ by [Rahul Dev Banjara](https://github.com/devrahulbanjara)

**ConvexHire** • Where AI meets Human Judgment

[⭐ Star this repo](https://github.com/devrahulbanjara/ConvexHire) if you believe hiring should be intelligent, not manual.

</div>