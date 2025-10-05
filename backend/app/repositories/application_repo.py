"""
Application Repository
Clean, production-ready data access layer for applications
"""

import json
import os
import logging
from datetime import datetime
from typing import List, Optional, Dict

from app.models.application import Application, ApplicationStage, ApplicationStatus

# Configure logging
logger = logging.getLogger(__name__)

# Data file configuration
DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data"
)
APPLICATIONS_FILE = os.path.join(DATA_DIR, "applications.json")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Create applications.json if it doesn't exist
if not os.path.exists(APPLICATIONS_FILE):
    with open(APPLICATIONS_FILE, "w") as f:
        json.dump({"applications": []}, f)
        logger.info("Created new applications.json file")


class ApplicationRepository:
    """Repository for application data operations with proper error handling"""
    
    @staticmethod
    def _load_applications() -> List[dict]:
        """Load applications from JSON file with error handling"""
        try:
            with open(APPLICATIONS_FILE, "r") as f:
                data = json.load(f)
                applications = data.get("applications", [])
                logger.debug(f"Loaded {len(applications)} applications from file")
                return applications
        except FileNotFoundError:
            logger.warning("Applications file not found, returning empty list")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing applications JSON: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error loading applications: {e}")
            return []

    @staticmethod
    def _save_applications(applications: List[dict]) -> None:
        """Save applications to JSON file with error handling"""
        try:
            with open(APPLICATIONS_FILE, "w") as f:
                json.dump({"applications": applications}, f, indent=2)
                logger.debug(f"Saved {len(applications)} applications to file")
        except Exception as e:
            logger.error(f"Error saving applications: {e}")
            raise

    @classmethod
    def get_all(cls) -> List[Application]:
        applications_data = cls._load_applications()
        return [Application.from_dict(app) for app in applications_data]

    @classmethod
    def get_by_user_id(cls, user_id: str) -> List[Application]:
        """Get all applications for a specific user"""
        applications_data = cls._load_applications()
        user_applications = [
            app for app in applications_data if app["user_id"] == user_id
        ]
        logger.info(f"Found {len(user_applications)} applications for user {user_id}")
        return [Application.from_dict(app) for app in user_applications]

    @classmethod
    def get_by_id(cls, application_id: int) -> Optional[Application]:
        applications_data = cls._load_applications()
        for app_data in applications_data:
            if app_data["id"] == application_id:
                return Application.from_dict(app_data)
        return None

    @classmethod
    def create(
        cls,
        job_title: str,
        company_name: str,
        user_id: str,
        description: Optional[str] = None,
    ) -> Application:
        """Create a new application"""
        applications_data = cls._load_applications()

        # Generate new ID
        new_id = 1
        if applications_data:
            new_id = max(app["id"] for app in applications_data) + 1

        now = datetime.now()

        new_application = {
            "id": new_id,
            "job_title": job_title,
            "company_name": company_name,
            "user_id": user_id,
            "applied_date": now.strftime("%Y-%m-%d"),
            "stage": ApplicationStage.APPLIED.value,
            "status": ApplicationStatus.PENDING.value,
            "description": description,
            "updated_at": now.isoformat(),
        }

        applications_data.append(new_application)
        cls._save_applications(applications_data)
        
        logger.info(f"Created new application {new_id} for user {user_id}")
        return Application.from_dict(new_application)

    @classmethod
    def update(cls, application_id: int, update_data: dict) -> Optional[Application]:
        applications_data = cls._load_applications()

        for i, app in enumerate(applications_data):
            if app["id"] == application_id:
                # Update only provided fields
                for key, value in update_data.items():
                    if key in app and value is not None:
                        app[key] = value

                # Always update the updated_at timestamp
                app["updated_at"] = datetime.now().isoformat()

                applications_data[i] = app
                cls._save_applications(applications_data)
                return Application.from_dict(app)

        return None

    @classmethod
    def delete(cls, application_id: int) -> bool:
        applications_data = cls._load_applications()
        initial_count = len(applications_data)

        applications_data = [
            app for app in applications_data if app["id"] != application_id
        ]

        if len(applications_data) < initial_count:
            cls._save_applications(applications_data)
            return True

        return False

    @classmethod
    def get_application_tracking_board(cls, user_id: str) -> Dict[str, List[dict]]:
        """Get applications organized by stage for the tracking board"""
        applications = cls.get_by_user_id(user_id)

        # Group applications into 3 broader states
        board = {
            "applied": [],      # Applied + Screening
            "interviewing": [], # Interviewing
            "outcome": [],      # Offer + Decision
        }

        for app in applications:
            # Map old stages to new broader states
            if app.stage in [ApplicationStage.APPLIED, ApplicationStage.SCREENING]:
                board["applied"].append(app)
            elif app.stage == ApplicationStage.INTERVIEWING:
                board["interviewing"].append(app)
            elif app.stage in [ApplicationStage.OFFER, ApplicationStage.DECISION]:
                board["outcome"].append(app)

        # Convert to dictionary format
        result = {
            state: [app.to_dict() for app in apps]
            for state, apps in board.items()
        }
        
        logger.info(f"Generated tracking board for user {user_id} with {len(applications)} applications")
        return result
