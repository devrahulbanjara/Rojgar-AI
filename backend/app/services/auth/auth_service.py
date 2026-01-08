import uuid

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import create_token, hash_password, settings, verify_password
from app.models import CandidateProfile, User, UserGoogle, UserRole
from app.schemas import CreateUserRequest, GoogleUserInfo, UserResponse


class AuthService:
    @staticmethod
    def create_user_response(user: User) -> UserResponse:
        return UserResponse.model_validate(user)

    @staticmethod
    def get_user_by_email(email: str, db: Session) -> User | None:
        return db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    @staticmethod
    def get_user_by_google_id(google_id: str, db: Session) -> User | None:
        user_google = db.execute(
            select(UserGoogle).where(UserGoogle.user_google_id == google_id)
        ).scalar_one_or_none()
        if user_google:
            return user_google.user
        return None

    @staticmethod
    def create_user(user_data: CreateUserRequest, db: Session) -> User:
        if user_data.role == UserRole.RECRUITER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recruiters cannot sign up publicly. Must be created by an organization.",
            )

        new_user = User(
            user_id=str(uuid.uuid4()),
            organization_id=user_data.organization_id,
            email=user_data.email,
            name=user_data.name if user_data.name else "User",
            picture=user_data.picture,
            role=user_data.role.value if user_data.role else None,
        )

        db.add(new_user)
        db.flush()

        if new_user.role == UserRole.CANDIDATE.value:
            new_profile = CandidateProfile(
                profile_id=str(uuid.uuid4()),
                user_id=new_user.user_id,
            )
            db.add(new_profile)

        if user_data.password:
            new_user.password = hash_password(user_data.password)

        if user_data.google_id:
            new_google_user = UserGoogle(
                user_google_id=user_data.google_id, user_id=new_user.user_id
            )
            db.add(new_google_user)

        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def verify_user_password(user: User, password: str) -> bool:
        if not user.password:
            return False
        return verify_password(password, user.password)

    @staticmethod
    def create_access_token(user_id: str, remember_me: bool = False) -> tuple[str, int]:
        if remember_me:
            token = create_token(
                user_id, entity_type="user", expires_minutes=30 * 24 * 60
            )
            max_age = 30 * 24 * 60 * 60
        else:
            token = create_token(user_id, entity_type="user")
            max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return token, max_age

    @staticmethod
    def generate_google_auth_url() -> str:
        from urllib.parse import urlencode

        google_auth_url = "https://accounts.google.com/o/oauth2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/google/callback",
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent",
        }

        return f"{google_auth_url}?{urlencode(params)}"

    @staticmethod
    async def exchange_google_code(code: str) -> GoogleUserInfo:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": f"{settings.BACKEND_URL}/api/v1/auth/google/callback",
                },
            )

            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get Google token",
                )

            tokens = token_response.json()
            access_token = tokens.get("access_token")

            user_response = await client.get(
                f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={access_token}"
            )

            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user info from Google",
                )

            return GoogleUserInfo(**user_response.json())

    @staticmethod
    def get_or_create_google_user(google_user: GoogleUserInfo, db: Session) -> User:
        user = AuthService.get_user_by_google_id(google_user.id, db)

        if not user:
            existing_user_by_email = AuthService.get_user_by_email(
                google_user.email, db
            )
            if existing_user_by_email:
                new_google_link = UserGoogle(
                    user_google_id=google_user.id,
                    user_id=existing_user_by_email.user_id,
                )
                db.add(new_google_link)

                if existing_user_by_email.name == "User" and google_user.name:
                    existing_user_by_email.name = google_user.name
                    db.add(existing_user_by_email)

                if not existing_user_by_email.picture and google_user.picture:
                    existing_user_by_email.picture = google_user.picture
                    db.add(existing_user_by_email)

                db.commit()
                db.refresh(existing_user_by_email)
                return existing_user_by_email

            create_user_data = CreateUserRequest(
                email=google_user.email,
                name=google_user.name,
                google_id=google_user.id,
                picture=google_user.picture,
                role=None,
            )
            user = AuthService.create_user(create_user_data, db)

        return user

    @staticmethod
    def assign_role_and_create_profile(user: User, role: UserRole, db: Session) -> User:
        if user.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role already selected",
            )

        if role == UserRole.RECRUITER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recruiters cannot sign up publicly. Must be created by an organization.",
            )

        user.role = role.value
        db.add(user)
        db.flush()

        if role == UserRole.CANDIDATE:
            new_profile = CandidateProfile(
                profile_id=str(uuid.uuid4()),
                user_id=user.user_id,
            )
            db.add(new_profile)

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def get_redirect_url_for_user(user: User) -> str:
        if user.role == UserRole.CANDIDATE.value:
            return f"{settings.FRONTEND_URL}/dashboard/candidate"
        elif user.role == UserRole.RECRUITER.value:
            return f"{settings.FRONTEND_URL}/dashboard/recruiter"
        else:
            return f"{settings.FRONTEND_URL}/onboarding/select-role"
