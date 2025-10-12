from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
from app.models.user import User, UserRole
from app.core.database import engine


class UserRepository:
    """Repository for user data operations using SQLModel"""

    def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        with Session(engine) as session:
            return session.get(User, user_id)

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        with Session(engine) as session:
            statement = select(User).where(User.email == email)
            return session.exec(statement).first()

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        with Session(engine) as session:
            statement = select(User).where(User.google_id == google_id)
            return session.exec(statement).first()

    def create(self, user: User) -> User:
        """Create a new user"""
        with Session(engine) as session:
            session.add(user)
            session.commit()
            session.refresh(user)
            return user

    def update(self, user_id: str, **updates) -> Optional[User]:
        """Update user by ID"""
        with Session(engine) as session:
            user = session.get(User, user_id)
            if user:
                for key, value in updates.items():
                    if hasattr(user, key):
                        setattr(user, key, value)
                user.updated_at = datetime.utcnow()
                session.add(user)
                session.commit()
                session.refresh(user)
                return user
            return None

    def delete(self, user_id: str) -> bool:
        """Delete user by ID"""
        with Session(engine) as session:
            user = session.get(User, user_id)
            if user:
                session.delete(user)
                session.commit()
                return True
            return False

    def get_all(self) -> List[User]:
        """Get all users"""
        with Session(engine) as session:
            statement = select(User)
            return list(session.exec(statement).all())


# Global repository instance
user_repo = UserRepository()
