from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ProfileCreateRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    picture: str | None = None

    phone: str | None = None
    location_city: str | None = None
    location_country: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    professional_headline: str | None = None
    professional_summary: str | None = None


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    picture: str | None = None

    phone: str | None = None
    location_city: str | None = None
    location_country: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    professional_headline: str | None = None
    professional_summary: str | None = None


class WorkExperienceCreateRequest(BaseModel):
    job_title: str
    company: str
    location: str | None = None
    start_date: date
    end_date: date | None = None
    is_current: bool = False
    master_description: str


class WorkExperienceUpdateRequest(BaseModel):
    job_title: str | None = None
    company: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    master_description: str | None = None


class EducationCreateRequest(BaseModel):
    school_university: str
    degree: str
    field_of_study: str
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool = False
    gpa: str | None = None
    honors: str | None = None


class EducationUpdateRequest(BaseModel):
    school_university: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    gpa: str | None = None
    honors: str | None = None


class CertificationCreateRequest(BaseModel):
    name: str
    issuing_body: str
    credential_id: str | None = None
    credential_url: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None
    does_not_expire: bool = False


class CertificationUpdateRequest(BaseModel):
    name: str | None = None
    issuing_body: str | None = None
    credential_id: str | None = None
    credential_url: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None
    does_not_expire: bool | None = None


class SkillCreateRequest(BaseModel):
    skill_name: str
    proficiency_level: str = "Intermediate"
    years_of_experience: int | None = None


class SkillUpdateRequest(BaseModel):
    skill_name: str | None = None
    proficiency_level: str | None = None
    years_of_experience: int | None = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    phone: str | None = None
    location_city: str | None = None
    location_country: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    professional_headline: str | None = None
    professional_summary: str | None = None
    created_at: datetime
    updated_at: datetime

    user_name: str | None = None
    user_email: str | None = None
    user_picture: str | None = None

    work_experiences: list["WorkExperienceResponse"] = []
    education_records: list["EducationRecordResponse"] = []
    certifications: list["CertificationResponse"] = []
    skills: list["ProfileSkillResponse"] = []


class WorkExperienceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: str
    job_title: str
    company: str
    location: str | None = None
    start_date: date
    end_date: date | None = None
    is_current: bool
    master_description: str
    created_at: datetime
    updated_at: datetime


class EducationRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: str
    school_university: str
    degree: str
    field_of_study: str
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool
    gpa: str | None = None
    honors: str | None = None
    created_at: datetime
    updated_at: datetime


class CertificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: str
    name: str
    issuing_body: str
    credential_id: str | None = None
    credential_url: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None
    does_not_expire: bool
    created_at: datetime
    updated_at: datetime


class ProfileSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    profile_id: str
    skill_name: str
    proficiency_level: str
    years_of_experience: int | None = None
    created_at: datetime
    updated_at: datetime
