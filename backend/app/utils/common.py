"""
Common utility functions
"""

import uuid
from datetime import datetime


def generate_user_id() -> str:
    """Generate a unique user ID"""
    return str(uuid.uuid4())


def get_current_timestamp() -> datetime:
    """Get current UTC timestamp"""
    return datetime.utcnow()
