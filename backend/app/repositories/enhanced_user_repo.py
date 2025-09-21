"""
Enhanced user repository with proper error handling and logging
"""

import json
import os
from typing import List, Optional
from datetime import datetime

from app.models.user import User
from app.core.exceptions import NotFoundError, ValidationError
from app.core.logging import LoggerMixin


class EnhancedUserRepository(LoggerMixin):
    """Enhanced repository for user data operations using JSON file storage"""

    DATA_FILE = "data/users.json"

    def __init__(self):
        self._ensure_data_file()

    def _ensure_data_file(self) -> None:
        """Ensure the data file exists"""
        try:
            os.makedirs(os.path.dirname(self.DATA_FILE), exist_ok=True)
            if not os.path.exists(self.DATA_FILE):
                with open(self.DATA_FILE, "w") as f:
                    json.dump([], f)
        except (OSError, IOError) as e:
            self.logger.error(f"Failed to ensure data file exists: {e}")
            raise ValidationError("Failed to initialize data storage")

    def _load_users(self) -> List[dict]:
        """Load users from JSON file"""
        try:
            with open(self.DATA_FILE, "r") as f:
                data = json.load(f)
                if not isinstance(data, list):
                    self.logger.warning(
                        "Data file contains invalid format, resetting to empty list"
                    )
                    return []
                return data
        except (json.JSONDecodeError, FileNotFoundError) as e:
            self.logger.warning(f"Failed to load users data: {e}, returning empty list")
            return []
        except (OSError, IOError) as e:
            self.logger.error(f"Failed to read data file: {e}")
            raise ValidationError("Failed to read user data")

    def _save_users(self, users: List[dict]) -> None:
        """Save users to JSON file"""
        try:
            with open(self.DATA_FILE, "w") as f:
                json.dump(users, f, indent=2, default=str)
        except (OSError, IOError) as e:
            self.logger.error(f"Failed to save users data: {e}")
            raise ValidationError("Failed to save user data")

    def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        if not user_id:
            raise ValidationError("User ID cannot be empty")

        users = self._load_users()
        for user_data in users:
            if user_data.get("id") == user_id:
                try:
                    return User.from_dict(user_data)
                except Exception as e:
                    self.logger.error(f"Failed to deserialize user {user_id}: {e}")
                    continue
        return None

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        if not email:
            raise ValidationError("Email cannot be empty")

        users = self._load_users()
        for user_data in users:
            if user_data.get("email", "").lower() == email.lower():
                try:
                    return User.from_dict(user_data)
                except Exception as e:
                    self.logger.error(
                        f"Failed to deserialize user with email {email}: {e}"
                    )
                    continue
        return None

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        if not google_id:
            raise ValidationError("Google ID cannot be empty")

        users = self._load_users()
        for user_data in users:
            if user_data.get("google_id") == google_id:
                try:
                    return User.from_dict(user_data)
                except Exception as e:
                    self.logger.error(
                        f"Failed to deserialize user with Google ID {google_id}: {e}"
                    )
                    continue
        return None

    def create(self, user: User) -> User:
        """Create a new user"""
        if not user:
            raise ValidationError("User cannot be None")

        # Check if user already exists
        if self.get_by_email(user.email):
            raise ValidationError(f"User with email {user.email} already exists")

        if user.google_id and self.get_by_google_id(user.google_id):
            raise ValidationError(
                f"User with Google ID {user.google_id} already exists"
            )

        users = self._load_users()
        try:
            user_dict = user.to_dict()
            users.append(user_dict)
            self._save_users(users)
            self.logger.info(f"Created user: {user.email}")
            return user
        except Exception as e:
            self.logger.error(f"Failed to create user {user.email}: {e}")
            raise ValidationError("Failed to create user")

    def update(self, user: User) -> User:
        """Update an existing user"""
        if not user or not user.id:
            raise ValidationError("User and user ID cannot be None")

        users = self._load_users()
        for i, user_data in enumerate(users):
            if user_data.get("id") == user.id:
                try:
                    users[i] = user.to_dict()
                    self._save_users(users)
                    self.logger.info(f"Updated user: {user.email}")
                    return user
                except Exception as e:
                    self.logger.error(f"Failed to update user {user.id}: {e}")
                    raise ValidationError("Failed to update user")

        raise NotFoundError(f"User with ID {user.id} not found")

    def delete(self, user_id: str) -> bool:
        """Delete a user by ID"""
        if not user_id:
            raise ValidationError("User ID cannot be empty")

        users = self._load_users()
        for i, user_data in enumerate(users):
            if user_data.get("id") == user_id:
                try:
                    del users[i]
                    self._save_users(users)
                    self.logger.info(f"Deleted user: {user_id}")
                    return True
                except Exception as e:
                    self.logger.error(f"Failed to delete user {user_id}: {e}")
                    raise ValidationError("Failed to delete user")
        return False

    def get_all(self) -> List[User]:
        """Get all users"""
        users = self._load_users()
        result = []
        for user_data in users:
            try:
                result.append(User.from_dict(user_data))
            except Exception as e:
                self.logger.error(f"Failed to deserialize user: {e}")
                continue
        return result

    def count(self) -> int:
        """Get total number of users"""
        return len(self._load_users())

    def exists(self, user_id: str) -> bool:
        """Check if user exists by ID"""
        return self.get_by_id(user_id) is not None
