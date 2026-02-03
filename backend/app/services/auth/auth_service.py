import uuid
from urllib.parse import urlencode

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import (
    UnauthorizedError,
    create_token,
    hash_password,
    settings,
    verify_password,
)
from app.models import CandidateProfile, User, UserGoogle, UserRole
from app.schemas import CreateUserRequest, GoogleUserInfo
from app.schemas.shared import ErrorCode


class AuthService:
    @staticmethod
    async def get_user_by_email(email: str, db: AsyncSession) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    @staticmethod
    async def get_user_by_google_id(google_id: str, db: AsyncSession) -> User | None:
        result = await db.execute(
            select(UserGoogle).where(UserGoogle.user_google_id == google_id)
        )
        user_google = result.scalar_one_or_none()
        if user_google:
            return user_google.user
        return None

    @staticmethod
    async def create_user(user_data: CreateUserRequest, db: AsyncSession) -> User:
        new_user = User(
            user_id=uuid.uuid4(),
            organization_id=user_data.organization_id,
            email=user_data.email,
            name=user_data.name,
            picture=user_data.picture,
            role=user_data.role.value,
        )
        db.add(new_user)
        await db.flush()
        if new_user.role == UserRole.CANDIDATE.value:
            new_profile = CandidateProfile(
                profile_id=uuid.uuid4(), user_id=new_user.user_id
            )
            db.add(new_profile)
        if user_data.password:
            new_user.password = hash_password(user_data.password)
        if user_data.google_id:
            new_google_user = UserGoogle(
                user_google_id=user_data.google_id, user_id=new_user.user_id
            )
            db.add(new_google_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    def verify_user_password(user: User, password: str) -> bool:
        if not user.password:
            return False
        return verify_password(password, user.password)

    @staticmethod
    def create_access_token(
        user_id: uuid.UUID, remember_me: bool = False
    ) -> tuple[str, int]:
        user_id_str = str(user_id)
        if remember_me:
            token = create_token(
                user_id_str, entity_type="user", expires_minutes=30 * 24 * 60
            )
            max_age = 30 * 24 * 60 * 60
        else:
            token = create_token(user_id_str, entity_type="user")
            max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return (token, max_age)

    @staticmethod
    def generate_google_auth_url() -> str:
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
                raise UnauthorizedError(
                    message="Google authentication failed",
                    error_code=ErrorCode.INVALID_CREDENTIALS,
                    details={
                        "reason": "token_exchange_failed",
                        "status_code": token_response.status_code,
                    },
                )
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            user_response = await client.get(
                f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={access_token}"
            )
            if user_response.status_code != 200:
                raise UnauthorizedError(
                    message="Failed to get user info from Google",
                    error_code=ErrorCode.INVALID_CREDENTIALS,
                    details={
                        "reason": "user_info_fetch_failed",
                        "status_code": user_response.status_code,
                    },
                )
            return GoogleUserInfo(**user_response.json())

    @staticmethod
    async def get_or_create_google_user(
        google_user: GoogleUserInfo, db: AsyncSession
    ) -> User:
        user = await AuthService.get_user_by_google_id(google_user.id, db)
        if not user:
            existing_user_by_email = await AuthService.get_user_by_email(
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
                await db.commit()
                await db.refresh(existing_user_by_email)
                return existing_user_by_email
            create_user_data = CreateUserRequest(
                email=google_user.email,
                name=google_user.name,
                google_id=google_user.id,
                picture=google_user.picture,
                role=UserRole.CANDIDATE,
            )
            user = await AuthService.create_user(create_user_data, db)
        return user

    @staticmethod
    def get_redirect_url_for_user(user: User) -> str:
        if user.role == UserRole.CANDIDATE.value:
            return f"{settings.FRONTEND_URL}/dashboard/candidate"
        elif user.role == UserRole.RECRUITER.value:
            return f"{settings.FRONTEND_URL}/dashboard/recruiter"
        else:
            return f"{settings.FRONTEND_URL}/dashboard/candidate"
