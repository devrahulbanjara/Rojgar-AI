from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models import ApplicationStatus


class ApplicationCreate(BaseModel):
    job_id: UUID
    resume_id: UUID


class JobSummary(BaseModel):
    job_id: UUID
    title: Annotated[str, "Job title"]
    location_city: Annotated[str | None, "City of the job"] = None
    employment_type: Annotated[
        str | None, "Employment type (full-time, part-time, etc.)"
    ] = None

    model_config = ConfigDict(from_attributes=True)


class OrganizationSummary(BaseModel):
    organization_id: UUID
    name: Annotated[str, "Organization name"]
    organization_logo: Annotated[str | None, "URL of organization logo"] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationResponse(BaseModel):
    application_id: UUID
    current_status: Annotated[ApplicationStatus, "Current application status"]
    applied_at: datetime
    updated_at: datetime

    job: Annotated[JobSummary, "Job details"]
    organization: Annotated[OrganizationSummary, "Organization details"]

    model_config = ConfigDict(from_attributes=True)
