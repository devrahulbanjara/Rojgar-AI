# CI/CD Setup

## Flow

```
push to main → CI (lint + test) → passes → CD (build image → deploy to ECS)
push to dev / feat/** → CI only
```

## Workflows

| File | Trigger | Does |
|------|---------|------|
| `.github/workflows/ci.yml` | push/PR to `main`, `dev`, `feat/**` | Ruff lint, format check, pytest, frontend type-check + build |
| `.github/workflows/backend-cd.yml` | CI passes on `main` | Build Docker image → push to ECR → deploy to ECS |

---

## GitHub Secrets

> Settings → Secrets and variables → Actions → Secrets

| Secret | What |
|--------|------|
| `AWS_ROLE_ARN` | IAM role ARN for OIDC auth (no static keys needed for deploy) |
| `AWS_ACCESS_KEY_ID` | S3 / general AWS access |
| `AWS_SECRET_ACCESS_KEY` | S3 / general AWS secret |
| `AWS_ACCESS_KEY_ID_SHORTLISTING` | Bedrock shortlisting access |
| `AWS_SECRET_ACCESS_KEY_SHORTLISTING` | Bedrock shortlisting secret |
| `S3_BUCKET_NAME` | Resume/media S3 bucket |
| `GROQ_API_KEY` | LLM inference (chat, job draft, gap analysis) |
| `QDRANT_URL` | Vector DB URL |
| `QDRANT_API_KEY` | Vector DB key |
| `REDIS_URL` | Redis connection URL |

---

## GitHub Variables

> Settings → Secrets and variables → Actions → Variables

| Variable | Example | What |
|----------|---------|------|
| `AWS_REGION` | `us-east-1` | AWS region |
| `ECR_REPOSITORY` | `convexhire-backend` | ECR repo name |
| `ECS_CLUSTER` | `convexhire-cluster` | ECS cluster name |
| `ECS_SERVICE` | `convexhire-backend` | ECS service name |
| `ECS_TASK_DEFINITION` | `default-convexhire-backend` | Task def family name (no revision suffix) |
| `ECS_CONTAINER_NAME` | `backend` | Container name inside task def |

---

## IAM Role (for CD)

Role needs OIDC trust with `token.actions.githubusercontent.com` and permissions:
- `ecr:GetAuthorizationToken`, `ecr:BatchCheckLayerAvailability`, `ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`
- `ecs:DescribeTaskDefinition`, `ecs:RegisterTaskDefinition`, `ecs:UpdateService`, `ecs:DescribeServices`
- `iam:PassRole` (for task execution role)

---

## Local Test DB (for running pytest locally)

Start test DB:
```bash
docker compose up -d
```

Run tests:
```bash
cd backend
uv run pytest -v
```

Requires `TEST_DB_*` vars in `backend/.env` pointing to local postgres-test on port 5433.
