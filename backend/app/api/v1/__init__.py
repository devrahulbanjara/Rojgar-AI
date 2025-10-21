"""
API v1 package - Centralized router management
"""

from fastapi import APIRouter

from app.api.v1.routes import auth, users, applications, jobs, skills, profile, resume

# Create master router for v1 API
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(resume.router, prefix="/resumes", tags=["resumes"])