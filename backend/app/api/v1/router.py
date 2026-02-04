from fastapi import APIRouter

from app.api import auth, users
from app.api.v1 import jobs as public_jobs
from app.api.v1.candidate import applications, profile, resumes
from app.api.v1.recruiter import candidates, jobs, organization, stats, websocket

v1_router = APIRouter()

# Authentication & User Management (top-level)
v1_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
v1_router.include_router(users.router, prefix="/users", tags=["users"])

# Public Job Browsing (for candidates)
v1_router.include_router(public_jobs.router, prefix="/jobs", tags=["jobs"])

# Candidate Domain
v1_router.include_router(
    profile.router, prefix="/candidate/me", tags=["candidate-profile"]
)
v1_router.include_router(
    applications.router, prefix="/candidate", tags=["candidate-applications"]
)
v1_router.include_router(
    resumes.router, prefix="/candidate/resumes", tags=["candidate-resumes"]
)

# Recruiter Domain
v1_router.include_router(jobs.router, prefix="/recruiter/jobs", tags=["recruiter-jobs"])
v1_router.include_router(
    candidates.router,
    prefix="/recruiter/candidates",
    tags=["recruiter-candidates"],
)
v1_router.include_router(
    organization.router,
    prefix="/recruiter/organization",
    tags=["recruiter-organization"],
)
v1_router.include_router(
    stats.router, prefix="/recruiter/stats", tags=["recruiter-stats"]
)
v1_router.include_router(websocket.router, tags=["websocket"])
