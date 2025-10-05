"""
User data model (JSON-based storage)
"""

from typing import Optional
from datetime import datetime
from dataclasses import dataclass, asdict
from app.schemas.user import UserRole


@dataclass
class User:
    """User model for JSON storage"""

    id: str
    email: str
    name: str
    google_id: Optional[str] = None
    password_hash: Optional[str] = None
    picture: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: bool = True
    created_at: datetime = None
    updated_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        # Convert datetime to ISO format
        data["created_at"] = self.created_at.isoformat() if self.created_at else None
        data["updated_at"] = self.updated_at.isoformat() if self.updated_at else None
        # Convert enum to string
        data["role"] = self.role.value if self.role else None
        return data

    @classmethod
    def from_dict(cls, data: dict) -> "User":
        """Create User instance from dictionary"""
        # Convert ISO format to datetime
        if data.get("created_at"):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if data.get("updated_at"):
            data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        # Convert string to enum
        if data.get("role"):
            data["role"] = UserRole(data["role"])
        return cls(**data)
