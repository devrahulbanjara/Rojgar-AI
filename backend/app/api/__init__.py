from fastapi import APIRouter

from app.api import (
    auth,
    candidate,
    candidate_applications,
    jobs,
    jobs_crud,
    resume,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(candidate.router, prefix="/candidate", tags=["candidate"])
api_router.include_router(resume.router, prefix="/resumes", tags=["resumes"])
api_router.include_router(
    candidate_applications.router, prefix="/candidate", tags=["candidate-applications"]
)
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(jobs_crud.router, prefix="/jobs", tags=["jobs"])
