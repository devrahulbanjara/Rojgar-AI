"""
Schemas package - Pydantic models for API data contracts
Separates API data contracts from database models
"""

# Import all schemas for easy access
from .user import *
from .profile import *
from .job import *
from .resume import *
from .application import *
from .skill import *

# Rebuild models to resolve forward references
from .resume import rebuild_models
rebuild_models()
