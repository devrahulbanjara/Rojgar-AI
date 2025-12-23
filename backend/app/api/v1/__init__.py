"""
API v1 package - Centralized router management
"""

from fastapi import APIRouter

from app.api.v1.routes import auth, users, candidate, resume, candidate_applications, jobs

# Create master router for v1 API
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(candidate.router, prefix="/candidate", tags=["candidate"])
api_router.include_router(resume.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(candidate_applications.router, prefix="/candidate", tags=["candidate-applications"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])