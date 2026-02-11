import uuid
from urllib.parse import urlencode

import httpx

from app.core import create_token, hash_password, settings, verify_password
from app.db.models.candidate import CandidateProfile
from app.db.models.user import User, UserGoogle, UserRole
from app.db.repositories.candidate_repo import CandidateProfileRepository
from app.db.repositories.user_repo import UserGoogleRepository, UserRepository
from app.schemas import CreateUserRequest, GoogleUserInfo


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        user_google_repo: UserGoogleRepository,
        candidate_profile_repo: CandidateProfileRepository,
    ):
        self.user_repo = user_repo
        self.user_google_repo = user_google_repo
        self.candidate_profile_repo = candidate_profile_repo

    async def get_user_by_email(self, email: str) -> User | None:
        """Get user by email with related data"""
        return await self.user_repo.get_by_email(email)

    async def get_user_by_google_id(self, google_id: str) -> User | None:
        """Get user by Google ID"""
        user_google = await self.user_google_repo.get_with_user(google_id)
        return user_google.user if user_google else None

    async def create_user(self, user_data: CreateUserRequest) -> User:
        """Create a new user"""
        new_user = User(
            user_id=uuid.uuid4(),
            organization_id=user_data.organization_id,
            email=user_data.email,
            name=user_data.name,
            picture=user_data.picture,
            role=user_data.role.value,
        )
        if user_data.password:
            new_user.password = hash_password(user_data.password)

        await self.user_repo.create(new_user)

        # Create candidate profile if candidate
        if new_user.role == UserRole.CANDIDATE.value:
            new_profile = CandidateProfile(
                profile_id=uuid.uuid4(), user_id=new_user.user_id
            )
            await self.candidate_profile_repo.create(new_profile)

        # Create Google account link if provided
        if user_data.google_id:
            new_google_user = UserGoogle(
                user_google_id=user_data.google_id, user_id=new_user.user_id
            )
            await self.user_google_repo.create(new_google_user)

        return await self.get_user_by_email(new_user.email)

    def verify_user_password(self, user: User, password: str) -> bool:
        """Verify user password"""
        if not user.password:
            return False
        return verify_password(password, user.password)

    def create_access_token(
        self, user_id: uuid.UUID, remember_me: bool = False
    ) -> tuple[str, int]:
        """Create access token for user"""
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

    def generate_google_auth_url(self) -> str:
        """Generate Google OAuth URL"""
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

    async def exchange_google_code(self, code: str) -> GoogleUserInfo:
        """Exchange Google OAuth code for user info"""
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
                raise ValueError("Google authentication failed")
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            user_response = await client.get(
                f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={access_token}"
            )
            if user_response.status_code != 200:
                raise ValueError("Failed to get user info from Google")
            return GoogleUserInfo(**user_response.json())

    async def get_or_create_google_user(self, google_user: GoogleUserInfo) -> User:
        """Get or create user from Google OAuth"""
        user = await self.get_user_by_google_id(google_user.id)
        if not user:
            existing_user_by_email = await self.get_user_by_email(google_user.email)
            if existing_user_by_email:
                # Link Google account to existing user
                new_google_link = UserGoogle(
                    user_google_id=google_user.id,
                    user_id=existing_user_by_email.user_id,
                )
                await self.user_google_repo.create(new_google_link)

                # Update user info if needed
                update_data = {}
                if existing_user_by_email.name == "User" and google_user.name:
                    update_data["name"] = google_user.name
                if not existing_user_by_email.picture and google_user.picture:
                    update_data["picture"] = google_user.picture

                if update_data:
                    await self.user_repo.update(
                        existing_user_by_email.user_id, **update_data
                    )
                    existing_user_by_email = await self.user_repo.get(
                        existing_user_by_email.user_id
                    )

                return existing_user_by_email

            # Create new user
            create_user_data = CreateUserRequest(
                email=google_user.email,
                name=google_user.name,
                google_id=google_user.id,
                picture=google_user.picture,
                role=UserRole.CANDIDATE,
            )
            user = await self.create_user(create_user_data)
        return user

    def get_redirect_url_for_user(self, user: User) -> str:
        """Get redirect URL based on user role"""
        if user.role == UserRole.CANDIDATE.value:
            return f"{settings.FRONTEND_URL}/candidate/dashboard"
        elif user.role == UserRole.RECRUITER.value:
            return f"{settings.FRONTEND_URL}/recruiter/dashboard"
        else:
            return f"{settings.FRONTEND_URL}/organization/dashboard"
