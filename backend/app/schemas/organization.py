from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrganizationSignupRequest(BaseModel):
    email: Annotated[EmailStr, "Organization email"]
    password: Annotated[str, "Organization password"]
    name: Annotated[str, "Organization name"]
    location_city: Annotated[str | None, "City where the organization is located"] = (
        None
    )
    location_country: Annotated[
        str | None, "Country where the organization is located"
    ] = None
    website: Annotated[str | None, "Organization website URL"] = None
    description: Annotated[str | None, "Organization description"] = None
    industry: Annotated[str | None, "Industry domain"] = None
    founded_year: Annotated[int | None, "Year the organization was founded"] = None


class OrganizationLoginRequest(BaseModel):
    email: Annotated[EmailStr, "Organization email"]
    password: Annotated[str, "Organization password"]
    remember_me: Annotated[bool, "Persist login session"] = False


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Annotated[UUID, Field(description="Organization ID")]
    email: Annotated[EmailStr, "Organization email"]
    name: Annotated[str, "Organization name"]
    location_city: Annotated[str | None, "City where the organization is located"] = (
        None
    )
    location_country: Annotated[
        str | None, "Country where the organization is located"
    ] = None
    website: Annotated[str | None, "Organization website URL"] = None
    description: Annotated[str | None, "Organization description"] = None
    industry: Annotated[str | None, "Industry domain"] = None
    founded_year: Annotated[int | None, "Year the organization was founded"] = None
    created_at: Annotated[
        datetime, Field(description="Organization creation timestamp")
    ]
    updated_at: Annotated[
        datetime, Field(description="Organization last update timestamp")
    ]


class OrganizationUpdateRequest(BaseModel):
    name: Annotated[str | None, "Organization name"] = None
    location_city: Annotated[str | None, "City where the organization is located"] = (
        None
    )
    location_country: Annotated[
        str | None, "Country where the organization is located"
    ] = None
    website: Annotated[str | None, "Organization website URL"] = None
    description: Annotated[str | None, "Organization description"] = None
    industry: Annotated[str | None, "Industry domain"] = None
    founded_year: Annotated[int | None, "Year the organization was founded"] = None


class CreateRecruiterRequest(BaseModel):
    email: Annotated[EmailStr, "Recruiter email"]
    name: Annotated[str, "Recruiter name"]
    password: Annotated[str, "Recruiter password"]


class UpdateRecruiterRequest(BaseModel):
    email: Annotated[EmailStr | None, "Recruiter email"] = None
    name: Annotated[str | None, "Recruiter name"] = None
    password: Annotated[str | None, "Recruiter password"] = None


class RecruiterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: Annotated[EmailStr, "Recruiter email"]
    name: Annotated[str, "Recruiter name"]
    organization_id: UUID | None = None
    created_at: Annotated[datetime, Field(description="Recruiter creation timestamp")]
    updated_at: Annotated[
        datetime, Field(description="Recruiter last update timestamp")
    ]


class OrganizationTokenResponse(BaseModel):
    access_token: Annotated[str, "JWT access token"]
    token_type: Annotated[str, "Token type"]
    organization: Annotated[OrganizationResponse, "Authenticated organization details"]
