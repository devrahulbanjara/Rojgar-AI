from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core import get_current_user_id, get_db
from app.schemas.resume import *
from app.services import ProfileService, ResumeService

router = APIRouter()


@router.get("/", response_model=list[ResumeResponse])
async def get_resumes(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    """Get all resumes for the current user"""
    service = ResumeService(db)
    return service.get_resumes_by_user_id(user_id)


@router.get("/autofill-data", response_model=ResumeAutofillData)
async def get_resume_autofill_data(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    """Get comprehensive profile data for resume autofill"""
    profile_service = ProfileService(db)
    autofill_data = profile_service.get_profile_data_for_autofill(user_id)
    return ResumeAutofillData(**autofill_data)


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a specific resume by ID"""
    service = ResumeService(db)
    resume = service.get_resume_by_id(user_id, resume_id)

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )

    return resume


@router.post("/", response_model=ResumeResponse)
async def create_resume(
    resume_data: ResumeCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new resume"""
    service = ResumeService(db)
    resume = service.create_resume(user_id, resume_data.model_dump())
    service.db.commit()
    return resume


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: str,
    resume_data: ResumeUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a resume"""
    service = ResumeService(db)
    resume = service.update_resume(
        user_id, resume_id, resume_data.model_dump(exclude_unset=True)
    )
    service.db.commit()
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a resume"""
    service = ResumeService(db)
    service.delete_resume(user_id, resume_id)
    service.db.commit()


# Experience Management for Resume
@router.post("/{resume_id}/experiences", response_model=ResumeExperienceResponse)
async def add_experience_to_resume(
    resume_id: str,
    experience_data: AddExperienceToResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a work experience to a resume with custom description"""
    service = ResumeService(db)
    exp = service.add_experience_to_resume(
        user_id,
        resume_id,
        experience_data.work_experience_id,
        experience_data.custom_description,
    )
    service.db.commit()
    return exp


@router.put(
    "/{resume_id}/experiences/{resume_experience_id}",
    response_model=ResumeExperienceResponse,
)
async def update_experience_in_resume(
    resume_id: str,
    resume_experience_id: str,
    experience_data: UpdateExperienceInResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update an experience in a resume - can update both resume-specific and underlying work experience data"""
    service = ResumeService(db)
    exp = service.update_experience_in_resume(
        user_id,
        resume_id,
        resume_experience_id,
        experience_data.model_dump(exclude_unset=True),
    )
    service.db.commit()
    return exp


@router.delete(
    "/{resume_id}/experiences/{resume_experience_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_experience_from_resume(
    resume_id: str,
    resume_experience_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Remove an experience from a resume"""
    service = ResumeService(db)
    service.remove_experience_from_resume(user_id, resume_id, resume_experience_id)
    service.db.commit()


# Education Management for Resume
@router.post("/{resume_id}/education", response_model=ResumeEducationResponse)
async def add_education_to_resume(
    resume_id: str,
    education_data: AddEducationToResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add an education record to a resume"""
    service = ResumeService(db)
    edu = service.add_education_to_resume(
        user_id, resume_id, education_data.education_record_id
    )
    service.db.commit()
    return edu


@router.put(
    "/{resume_id}/education/{resume_education_id}",
    response_model=ResumeEducationResponse,
)
async def update_education_in_resume(
    resume_id: str,
    resume_education_id: str,
    education_data: UpdateEducationInResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update an education record in a resume"""
    service = ResumeService(db)
    edu = service.update_education_in_resume(
        user_id,
        resume_id,
        resume_education_id,
        education_data.model_dump(exclude_unset=True),
    )
    service.db.commit()
    return edu


@router.delete(
    "/{resume_id}/education/{resume_education_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_education_from_resume(
    resume_id: str,
    resume_education_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Remove an education record from a resume"""
    service = ResumeService(db)
    service.remove_education_from_resume(user_id, resume_id, resume_education_id)
    service.db.commit()


# Certification Management for Resume
@router.post("/{resume_id}/certifications", response_model=ResumeCertificationResponse)
async def add_certification_to_resume(
    resume_id: str,
    certification_data: AddCertificationToResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a certification to a resume"""
    service = ResumeService(db)
    cert = service.add_certification_to_resume(
        user_id, resume_id, certification_data.certification_id
    )
    service.db.commit()
    return cert


@router.put(
    "/{resume_id}/certifications/{resume_certification_id}",
    response_model=ResumeCertificationResponse,
)
async def update_certification_in_resume(
    resume_id: str,
    resume_certification_id: str,
    certification_data: UpdateCertificationInResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a certification in a resume"""
    service = ResumeService(db)
    cert = service.update_certification_in_resume(
        user_id,
        resume_id,
        resume_certification_id,
        certification_data.model_dump(exclude_unset=True),
    )
    service.db.commit()
    return cert


@router.delete(
    "/{resume_id}/certifications/{resume_certification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_certification_from_resume(
    resume_id: str,
    resume_certification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Remove a certification from a resume"""
    service = ResumeService(db)
    service.remove_certification_from_resume(
        user_id, resume_id, resume_certification_id
    )
    service.db.commit()


# Skills Management for Resume
@router.post("/{resume_id}/skills", response_model=ResumeSkillResponse)
async def add_skill_to_resume(
    resume_id: str,
    skill_data: AddSkillToResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a skill to a resume"""
    service = ResumeService(db)
    skill = service.add_skill_to_resume(user_id, resume_id, skill_data.profile_skill_id)
    service.db.commit()
    return skill


@router.put("/{resume_id}/skills/{resume_skill_id}", response_model=ResumeSkillResponse)
async def update_skill_in_resume(
    resume_id: str,
    resume_skill_id: str,
    skill_data: UpdateSkillInResumeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a skill in a resume"""
    service = ResumeService(db)
    skill = service.update_skill_in_resume(
        user_id, resume_id, resume_skill_id, skill_data.model_dump(exclude_unset=True)
    )
    service.db.commit()
    return skill


@router.delete(
    "/{resume_id}/skills/{resume_skill_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_skill_from_resume(
    resume_id: str,
    resume_skill_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Remove a skill from a resume"""
    service = ResumeService(db)
    service.remove_skill_from_resume(user_id, resume_id, resume_skill_id)
    service.db.commit()


# Resume-specific section creation endpoints (don't affect profile)
@router.post("/{resume_id}/experiences/create", response_model=ResumeExperienceResponse)
async def create_experience_for_resume(
    resume_id: str,
    experience_data: CreateResumeExperienceRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new work experience directly for this resume (doesn't affect profile)"""
    service = ResumeService(db)
    exp = service.create_experience_for_resume(
        user_id, resume_id, experience_data.model_dump()
    )
    service.db.commit()
    return exp


@router.post("/{resume_id}/education/create", response_model=ResumeEducationResponse)
async def create_education_for_resume(
    resume_id: str,
    education_data: CreateResumeEducationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new education record directly for this resume (doesn't affect profile)"""
    service = ResumeService(db)
    edu = service.create_education_for_resume(
        user_id, resume_id, education_data.model_dump()
    )
    service.db.commit()
    return edu


@router.post(
    "/{resume_id}/certifications/create", response_model=ResumeCertificationResponse
)
async def create_certification_for_resume(
    resume_id: str,
    certification_data: CreateResumeCertificationRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new certification directly for this resume (doesn't affect profile)"""
    service = ResumeService(db)
    cert = service.create_certification_for_resume(
        user_id, resume_id, certification_data.model_dump()
    )
    service.db.commit()
    return cert


@router.post("/{resume_id}/skills/create", response_model=ResumeSkillResponse)
async def create_skill_for_resume(
    resume_id: str,
    skill_data: CreateResumeSkillRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new skill directly for this resume (doesn't affect profile)"""
    service = ResumeService(db)
    skill = service.create_skill_for_resume(user_id, resume_id, skill_data.model_dump())
    service.db.commit()
    return skill
