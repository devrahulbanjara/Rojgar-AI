from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.limiter import limiter
from app.schemas import candidate as schemas
from app.schemas import job as job_schemas
from app.services.candidate import CandidateService
from app.services.candidate.saved_job_service import SavedJobService
from app.services.job_service import map_job_to_response

router = APIRouter()


@router.get("/me", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit("50/minute")
def get_my_profile(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_id: str = Depends(get_current_user_id),
):
    profile = CandidateService.get_full_profile(db, user_id)

    social_links = [
        schemas.SocialLinkResponse.model_validate(item) for item in profile.social_links
    ]
    work_experiences = [
        schemas.WorkExperienceResponse.model_validate(item)
        for item in profile.work_experiences
    ]
    educations = [
        schemas.EducationResponse.model_validate(item) for item in profile.educations
    ]
    certifications = [
        schemas.CertificationResponse.model_validate(item)
        for item in profile.certifications
    ]
    skills = [schemas.SkillResponse.model_validate(item) for item in profile.skills]

    return schemas.CandidateProfileFullResponse(
        profile_id=profile.profile_id,
        user_id=profile.user_id,
        full_name=profile.user.name,
        email=profile.user.email,
        picture=profile.user.picture,
        phone=profile.phone,
        location_city=profile.location_city,
        location_country=profile.location_country,
        professional_headline=profile.professional_headline,
        professional_summary=profile.professional_summary,
        social_links=social_links,
        work_experiences=work_experiences,
        educations=educations,
        certifications=certifications,
        skills=skills,
    )


@router.patch("/me", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit("50/minute")
def update_candidate_personal_information(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.CandidateProfileUpdate,
    user_id: str = Depends(get_current_user_id),
):
    CandidateService.update_basic_info(db, user_id, data)
    return get_my_profile(request, db, user_id)


@router.post("/experience", response_model=schemas.WorkExperienceResponse)
@limiter.limit("50/minute")
def add_experience(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.WorkExperienceBase,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.add_experience(db, user_id, data)


@router.delete("/experience/{item_id}")
@limiter.limit("50/minute")
def delete_experience(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    CandidateService.delete_experience(db, user_id, item_id)
    return {"message": "Experience deleted successfully"}


@router.patch("/experience/{item_id}", response_model=schemas.WorkExperienceResponse)
@limiter.limit("50/minute")
def update_experience(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    data: schemas.WorkExperienceUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.update_experience(db, user_id, item_id, data)


@router.post("/education", response_model=schemas.EducationResponse)
@limiter.limit("50/minute")
def add_education(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.EducationBase,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.add_education(db, user_id, data)


@router.delete("/education/{item_id}")
@limiter.limit("50/minute")
def delete_education(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    CandidateService.delete_education(db, user_id, item_id)
    return {"message": "Education deleted successfully"}


@router.patch("/education/{item_id}", response_model=schemas.EducationResponse)
@limiter.limit("50/minute")
def update_education(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    data: schemas.EducationUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.update_education(db, user_id, item_id, data)


@router.post("/skills", response_model=schemas.SkillResponse)
@limiter.limit("50/minute")
def add_skill(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.SkillBase,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.add_skill(db, user_id, data)


@router.delete("/skills/{item_id}")
@limiter.limit("50/minute")
def delete_skill(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    CandidateService.delete_skill(db, user_id, item_id)
    return {"message": "Skill deleted successfully"}


@router.patch("/skills/{item_id}", response_model=schemas.SkillResponse)
@limiter.limit("50/minute")
def update_skill(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    data: schemas.SkillUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.update_skill(db, user_id, item_id, data)


@router.post("/certifications", response_model=schemas.CertificationResponse)
@limiter.limit("50/minute")
def add_certification(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.CertificationBase,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.add_certification(db, user_id, data)


@router.delete("/certifications/{item_id}")
@limiter.limit("50/minute")
def delete_certification(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    CandidateService.delete_certification(db, user_id, item_id)
    return {"message": "Certification deleted successfully"}


@router.patch("/certifications/{item_id}", response_model=schemas.CertificationResponse)
@limiter.limit("50/minute")
def update_certification(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    data: schemas.CertificationUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.update_certification(db, user_id, item_id, data)


@router.post("/social-links", response_model=schemas.SocialLinkResponse)
@limiter.limit("50/minute")
def add_social_link(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.SocialLinkBase,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.add_social_link(db, user_id, data)


@router.delete("/social-links/{item_id}")
@limiter.limit("50/minute")
def delete_social_link(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    CandidateService.delete_social_link(db, user_id, item_id)
    return {"message": "Social link deleted successfully"}


@router.patch("/social-links/{item_id}", response_model=schemas.SocialLinkResponse)
@limiter.limit("50/minute")
def update_social_link(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    item_id: str,
    data: schemas.SocialLinkBase,
    user_id: str = Depends(get_current_user_id),
):
    return CandidateService.update_social_link(db, user_id, item_id, data)


@router.post("/jobs/{job_id}/save")
@limiter.limit("50/minute")
def toggle_save_job(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    job_id: str,
    user_id: str = Depends(get_current_user_id),
):
    try:
        result = SavedJobService.toggle_save_job(db, user_id, job_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle save status: {str(e)}",
        )


@router.get("/saved-jobs", response_model=job_schemas.JobListResponse)
@limiter.limit("50/minute")
def get_saved_jobs(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_id: str = Depends(get_current_user_id),
    page: int = 1,
    limit: int = 10,
):
    try:
        saved_jobs = SavedJobService.get_my_saved_jobs(db, user_id)

        total = len(saved_jobs)
        start = (page - 1) * limit
        end = start + limit
        paginated_jobs = saved_jobs[start:end]
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        return {
            "jobs": [map_job_to_response(job) for job in paginated_jobs],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "has_next": end < total,
            "has_prev": page > 1,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve saved jobs: {str(e)}",
        )
