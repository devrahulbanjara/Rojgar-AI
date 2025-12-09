from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.schemas import UserResponse



class UserService:
    """
    Service for managing User entities.
    Handles user retrieval and response formatting.
    """

    @staticmethod
    def get_user_by_id(user_id: str, db: Session) -> User | None:
        """
        Retrieve a user by their ID.

        Args:
            user_id: The ID of the user to retrieve
            db: Database session

        Returns:
            User object if found, None otherwise
        """
        return db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()

    @staticmethod
    def to_user_response(user: User) -> UserResponse:
        """
        Convert a SQLAlchemy User model to a Pydantic UserResponse schema.

        Args:
            user: The User database model

        Returns:
            UserResponse Pydantic model
        """
        return UserResponse.model_validate(user)
