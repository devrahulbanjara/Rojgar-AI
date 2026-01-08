from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models import ApplicationStatus


class JobSummary(BaseModel):
    job_id: str
    title: str
    location_city: str | None
    employment_type: str | None
    model_config = ConfigDict(from_attributes=True)


class OrganizationSummary(BaseModel):
    organization_id: str
    organization_name: str
    organization_logo: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    application_id: str
    current_status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime

    # Nested Objects
    job: JobSummary
    organization: OrganizationSummary

    model_config = ConfigDict(from_attributes=True)
