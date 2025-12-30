from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import ApplicationStatus


class JobSummary(BaseModel):
    job_id: str
    title: str
    location_city: str | None
    employment_type: str | None
    model_config = ConfigDict(from_attributes=True)


class CompanySummary(BaseModel):
    company_id: str
    company_name: str
    company_logo: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    application_id: str
    current_status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime

    # Nested Objects
    job: JobSummary
    company: CompanySummary

    model_config = ConfigDict(from_attributes=True)
