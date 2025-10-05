"""
User repository for JSON-based storage operations
"""

import json
import os
from typing import List, Optional
from datetime import datetime
from app.models.user import User
from app.schemas.user import UserRole

# Path to the JSON data file
DATA_FILE = "data/users.json"


class UserRepository:
    """Repository for user data operations using JSON file"""

    def __init__(self):
        self._ensure_data_file()

    def _ensure_data_file(self):
        """Ensure the data directory and file exist"""
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        if not os.path.exists(DATA_FILE):
            with open(DATA_FILE, "w") as f:
                json.dump([], f)

    def _load_users(self) -> List[User]:
        """Load all users from JSON file"""
        try:
            with open(DATA_FILE, "r") as f:
                data = json.load(f)
                return [User.from_dict(user_data) for user_data in data]
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def _save_users(self, users: List[User]):
        """Save all users to JSON file"""
        with open(DATA_FILE, "w") as f:
            user_dicts = [user.to_dict() for user in users]
            json.dump(user_dicts, f, indent=2)

    def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        users = self._load_users()
        return next((user for user in users if user.id == user_id), None)

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        users = self._load_users()
        return next((user for user in users if user.email == email), None)

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        users = self._load_users()
        return next((user for user in users if user.google_id == google_id), None)

    def create(self, user: User) -> User:
        """Create a new user"""
        users = self._load_users()
        users.append(user)
        self._save_users(users)
        return user

    def update(self, user_id: str, **updates) -> Optional[User]:
        """Update user by ID"""
        users = self._load_users()
        user = next((u for u in users if u.id == user_id), None)

        if user:
            for key, value in updates.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            user.updated_at = datetime.utcnow()
            self._save_users(users)
            return user
        return None

    def delete(self, user_id: str) -> bool:
        """Delete user by ID"""
        users = self._load_users()
        original_count = len(users)
        users = [user for user in users if user.id != user_id]

        if len(users) < original_count:
            self._save_users(users)
            return True
        return False

    def get_all(self) -> List[User]:
        """Get all users"""
        return self._load_users()


# Global repository instance
user_repo = UserRepository()
