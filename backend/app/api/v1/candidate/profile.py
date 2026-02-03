import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_profile_service
from app.core import get_current_active_user
from app.core.config import settings
from app.core.limiter import limiter
from app.db.models.user import User
from app.schemas import candidate as schemas
from app.services.candidate.profile_service import ProfileService

router = APIRouter()


@router.get("", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def get_my_profile(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    profile = await profile_service.get_full_profile(current_user)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found"
        )
    return profile


@router.patch("", response_model=schemas.CandidateProfileFullResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_candidate_personal_information(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    data: schemas.CandidateProfileUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    profile = await profile_service.update_basic_info(current_user, data)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate profile not found"
        )
    return profile


@router.post("/experience", response_model=schemas.WorkExperienceResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_experience(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    data: schemas.WorkExperienceBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    experience = await profile_service.add_experience(current_user, data)
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return experience


@router.delete("/experience/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_experience(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    success = await profile_service.delete_experience(current_user, item_id)
    item = None if not success else {"id": item_id}
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work experience record not found",
        )
    return {"message": "Experience deleted successfully"}


@router.patch("/experience/{item_id}", response_model=schemas.WorkExperienceResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_experience(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    data: schemas.WorkExperienceUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    experience = await profile_service.update_experience(current_user, item_id, data)
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work experience record not found",
        )
    return experience


@router.post("/education", response_model=schemas.EducationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_education(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    data: schemas.EducationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    education = await profile_service.add_education(current_user, data)
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return education


@router.delete("/education/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_education(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    success = await profile_service.delete_education(current_user, item_id)
    item = None if not success else {"id": item_id}
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Education record not found"
        )
    return {"message": "Education deleted successfully"}


@router.patch("/education/{item_id}", response_model=schemas.EducationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_education(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    data: schemas.EducationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    education = await profile_service.update_education(current_user, item_id, data)
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Education record not found"
        )
    return education


@router.post("/skills", response_model=schemas.SkillResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_skill(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    data: schemas.SkillBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    skill = await profile_service.add_skill(current_user, data)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return skill


@router.delete("/skills/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_skill(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    success = await profile_service.delete_skill(current_user, item_id)
    item = None if not success else {"id": item_id}
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Skill record not found"
        )
    return {"message": "Skill deleted successfully"}


@router.patch("/skills/{item_id}", response_model=schemas.SkillResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_skill(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    data: schemas.SkillUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    skill = await profile_service.update_skill(current_user, item_id, data)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Skill record not found"
        )
    return skill


@router.post("/certifications", response_model=schemas.CertificationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_certification(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    data: schemas.CertificationBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    certification = await profile_service.add_certification(current_user, data)
    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return certification


@router.delete("/certifications/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_certification(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    success = await profile_service.delete_certification(current_user, item_id)
    item = None if not success else {"id": item_id}
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification record not found",
        )
    return {"message": "Certification deleted successfully"}


@router.patch("/certifications/{item_id}", response_model=schemas.CertificationResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_certification(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    data: schemas.CertificationUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    certification = await profile_service.update_certification(
        current_user, item_id, data
    )
    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification record not found",
        )
    return certification


@router.post("/social-links", response_model=schemas.SocialLinkResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def add_social_link(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    data: schemas.SocialLinkBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    social_link = await profile_service.add_social_link(current_user, data)
    if not social_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return social_link


@router.delete("/social-links/{item_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def delete_social_link(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    success = await profile_service.delete_social_link(current_user, item_id)
    item = None if not success else {"id": item_id}
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Social link record not found"
        )
    return {"message": "Social link deleted successfully"}


@router.patch("/social-links/{item_id}", response_model=schemas.SocialLinkResponse)
@limiter.limit(settings.RATE_LIMIT_API)
async def update_social_link(
    request: Request,
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
    item_id: uuid.UUID,
    data: schemas.SocialLinkBase,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    social_link = await profile_service.update_social_link(current_user, item_id, data)
    if not social_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Social link record not found"
        )
    return social_link
