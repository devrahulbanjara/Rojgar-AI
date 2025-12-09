"""
Base service with common validation and helper methods for resume operations.
"""

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Profile, Resume


class BaseResumeService:
    """
    Base class providing common validation methods for resume services.
    Eliminates repeated profile/resume verification code across all operations.
    """

    def __init__(self, db: Session):
        """
        Initialize the base service.

        Args:
            db: Database session
        """
        self.db = db

    def get_profile_or_404(self, user_id: str) -> Profile:
        """
        Get a user's profile or raise 404.

        Args:
            user_id: The ID of the user

        Returns:
            Profile object

        Raises:
            HTTPException: 404 if profile not found
        """
        profile = self.db.execute(
            select(Profile).where(Profile.user_id == user_id)
        ).scalar_one_or_none()

        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")

        return profile

    def get_resume_or_404(
        self, user_id: str, resume_id: str, *, profile: Profile | None = None
    ) -> tuple[Profile, Resume]:
        """
        Get a resume by ID ensuring ownership, or raise 404.

        Args:
            user_id: The ID of the user
            resume_id: The ID of the resume
            profile: Optional pre-fetched profile to avoid duplicate query

        Returns:
            Tuple of (Profile, Resume)

        Raises:
            HTTPException: 404 if profile or resume not found
        """
        if profile is None:
            profile = self.get_profile_or_404(user_id)

        resume = self.db.execute(
            select(Resume)
            .where(Resume.id == resume_id)
            .where(Resume.profile_id == profile.id)
        ).scalar_one_or_none()

        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")

        return profile, resume

    @staticmethod
    def format_location(city: str | None, country: str | None) -> str | None:
        """
        Format city and country into a location string.

        Args:
            city: City name
            country: Country name

        Returns:
            Formatted location string or None
        """
        if not city and not country:
            return None
        if city and country:
            return f"{city}, {country}"
        return city or country
