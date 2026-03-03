from fastapi import APIRouter, Depends

from app.core.responses import ResponseBuilder
from app.modules.auth.dependencies import require_candidate, require_recruiter
from app.modules.auth.models import User

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("/candidate")
async def get_candidate_dashboard(
    current_user: User = Depends(require_candidate),
):
    # Accessing the user ID and other info
    candidate_id = current_user.id

    # Simulating a DB call for dashboard stats
    dummy_stats = {
        "user_id": str(candidate_id),
        "full_name": current_user.full_name,
        "applied_jobs": 12,
        "interviews_scheduled": 2,
        "profile_completion": "85%",
    }

    return ResponseBuilder.success(
        data=dummy_stats, message="Candidate dashboard data retrieved"
    )


@router.get("/recruiter")
async def get_recruiter_dashboard(current_user: User = Depends(require_recruiter)):
    # Accessing the user ID
    recruiter_id = current_user.id

    # Simulating a DB call for recruiter stats
    dummy_stats = {
        "user_id": str(recruiter_id),
        "company_name": "Tech Corp",  # In real life, you'd fetch this from current_user.memberships
        "active_postings": 5,
        "total_applicants": 145,
        "unread_messages": 3,
    }

    return ResponseBuilder.success(
        data=dummy_stats, message="Recruiter dashboard data retrieved"
    )
