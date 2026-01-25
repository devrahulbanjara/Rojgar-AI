from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.core.limiter import limiter
from app.schemas import (
    CertificationBase,
    EducationBase,
    ResumeCertificationResponse,
    ResumeCertificationUpdate,
    ResumeEducationResponse,
    ResumeEducationUpdate,
    ResumeSkillResponse,
    ResumeSkillUpdate,
    ResumeWorkExperienceResponse,
    ResumeWorkExperienceUpdate,
    SkillBase,
    WorkExperienceBase,
)
from app.schemas import resume as schemas
from app.services.candidate.resume_service import ResumeService

router = APIRouter()


@router.get("/", response_model=list[schemas.ResumeListResponse])
@limiter.limit("10/minute")
def list_resumes(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.list_resumes(db, user_id)


@router.post(
    "/", response_model=schemas.ResumeResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("10/minute")
def create_resume(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    data: schemas.ResumeCreate,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.create_resume_fork(db, user_id, data)


@router.get("/{resume_id}", response_model=schemas.ResumeResponse)
@limiter.limit("10/minute")
def get_resume(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.get_resume(db, user_id, resume_id)


@router.patch("/{resume_id}", response_model=schemas.ResumeResponse)
@limiter.limit("10/minute")
def update_resume_details(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    data: schemas.ResumeUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.update_resume(db, user_id, resume_id, data)


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("10/minute")
def delete_resume(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
):
    ResumeService.delete_resume(db, user_id, resume_id)
    return {"message": "Resume deleted successfully"}


@router.post(
    "/{resume_id}/experience", response_model=schemas.ResumeWorkExperienceResponse
)
@limiter.limit("10/minute")
def add_resume_experience(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    data: WorkExperienceBase,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.add_experience(db, user_id, resume_id, data)


@router.delete("/{resume_id}/experience/{item_id}")
@limiter.limit("10/minute")
def delete_resume_experience(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    ResumeService.delete_experience(db, user_id, resume_id, item_id)
    return {"message": "Resume experience deleted successfully"}


@router.post(
    "/{resume_id}/education",
    response_model=ResumeEducationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
def add_resume_education(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    data: EducationBase,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.add_education(db, user_id, resume_id, data)


@router.delete(
    "/{resume_id}/education/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("10/minute")
def delete_resume_education(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    ResumeService.delete_education(db, user_id, resume_id, item_id)
    return {"message": "Resume education deleted successfully"}


@router.post(
    "/{resume_id}/skills",
    response_model=ResumeSkillResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
def add_resume_skill(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    data: SkillBase,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.add_skill(db, user_id, resume_id, data)


@router.delete(
    "/{resume_id}/skills/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("10/minute")
def delete_resume_skill(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    ResumeService.delete_skill(db, user_id, resume_id, item_id)
    return {"message": "Resume skill deleted successfully"}


@router.post(
    "/{resume_id}/certifications",
    response_model=ResumeCertificationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
def add_resume_certification(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    data: CertificationBase,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.add_certification(db, user_id, resume_id, data)


@router.delete(
    "/{resume_id}/certifications/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("10/minute")
def delete_resume_certification(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    item_id: str,
    user_id: str = Depends(get_current_user_id),
):
    ResumeService.delete_certification(db, user_id, resume_id, item_id)
    return {"message": "Resume certification deleted successfully"}


@router.patch(
    "/{resume_id}/experience/{item_id}", response_model=ResumeWorkExperienceResponse
)
@limiter.limit("10/minute")
def update_resume_experience(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    item_id: str,
    data: ResumeWorkExperienceUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.update_experience(db, user_id, resume_id, item_id, data)


@router.patch(
    "/{resume_id}/education/{item_id}", response_model=ResumeEducationResponse
)
@limiter.limit("10/minute")
def update_resume_education(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    item_id: str,
    data: ResumeEducationUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.update_education(db, user_id, resume_id, item_id, data)


@router.patch("/{resume_id}/skills/{item_id}", response_model=ResumeSkillResponse)
@limiter.limit("10/minute")
def update_resume_skill(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    item_id: str,
    data: ResumeSkillUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.update_skill(db, user_id, resume_id, item_id, data)


@router.patch(
    "/{resume_id}/certifications/{item_id}", response_model=ResumeCertificationResponse
)
@limiter.limit("10/minute")
def update_resume_certification(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    resume_id: str,
    item_id: str,
    data: ResumeCertificationUpdate,
    user_id: str = Depends(get_current_user_id),
):
    return ResumeService.update_certification(db, user_id, resume_id, item_id, data)
