"""
Common utility functions
"""

import uuid


def generate_user_id() -> str:
    """Generate a unique user ID"""
    return str(uuid.uuid4())


