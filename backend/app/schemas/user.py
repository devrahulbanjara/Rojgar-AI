from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.user import UserRole


class ProfileUpdateRequest(BaseModel):
    name: str


class OrganizationInUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Annotated[UUID, Field(alias="organization_id")]
    name: Annotated[str, "Organization name"]
    location_city: Annotated[str | None, "City"] = None
    location_country: Annotated[str | None, "Country"] = None
    website: Annotated[str | None, "Website URL"] = None
    industry: Annotated[str | None, "Industry"] = None


class SignupRequest(BaseModel):
    email: Annotated[str, "User email"]
    password: Annotated[str, "User password"]
    name: Annotated[str, "User full name"]
    picture: Annotated[str | None, "Profile picture URL"] = None


class CreateUserRequest(BaseModel):
    email: Annotated[str, "User email"]
    name: Annotated[str, "User full name"]
    password: Annotated[str | None, "User password"] = None
    google_id: Annotated[str | None, "Google account ID"] = None
    picture: Annotated[str | None, "Profile picture URL"] = None
    role: Annotated[UserRole | None, "User role"] = None
    organization_id: Annotated[UUID | None, "Associated organization ID"] = None


class LoginRequest(BaseModel):
    email: Annotated[str, "User email"]
    password: Annotated[str, "User password"]
    remember_me: Annotated[bool, "Persist login session"] = False


class GoogleUserInfo(BaseModel):
    id: Annotated[str, "Google user ID"]
    email: Annotated[str, "Google account email"]
    name: Annotated[str, "Google account name"]
    picture: Annotated[str | None, "Google profile picture URL"] = None
    verified_email: Annotated[bool, "Whether the email is verified by Google"]


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Annotated[UUID, Field(alias="user_id")]
    email: Annotated[str, "User email"]
    name: Annotated[str | None, "User full name"] = None
    picture: Annotated[str | None, "Profile picture URL"] = None
    google_id: Annotated[str | None, "Google account ID"] = None
    role: Annotated[UserRole | None, "User role"] = None
    organization_id: Annotated[UUID | None, "Associated organization ID"] = None
    organization: Annotated[
        OrganizationInUserResponse | None, "Organization details"
    ] = None
    created_at: Annotated[datetime, Field(description="User creation timestamp")]
    updated_at: Annotated[datetime, Field(description="User last update timestamp")]


class TokenResponse(BaseModel):
    access_token: Annotated[str, "JWT access token"]
    token_type: Annotated[str, "Token type"]
    user: Annotated[UserResponse, "Authenticated user details"]
