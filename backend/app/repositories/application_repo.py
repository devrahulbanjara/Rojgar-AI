import json
import os
from datetime import datetime
from typing import List, Optional

from app.models.application import Application, ApplicationStage, ApplicationStatus

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


class ApplicationRepository:
    @staticmethod
    def _load_applications() -> List[dict]:
        try:
            with open(APPLICATIONS_FILE, "r") as f:
                data = json.load(f)
                return data.get("applications", [])
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    @staticmethod
    def _save_applications(applications: List[dict]) -> None:
        with open(APPLICATIONS_FILE, "w") as f:
            json.dump({"applications": applications}, f, indent=2)

    @classmethod
    def get_all(cls) -> List[Application]:
        applications_data = cls._load_applications()
        return [Application.from_dict(app) for app in applications_data]

    @classmethod
    def get_by_user_id(cls, user_id: int) -> List[Application]:
        applications_data = cls._load_applications()
        user_applications = [
            app for app in applications_data if app["user_id"] == user_id
        ]
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
        user_id: int,
        description: Optional[str] = None,
    ) -> Application:
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
            "applied_date": now.isoformat(),
            "stage": ApplicationStage.APPLIED,
            "status": ApplicationStatus.PENDING,
            "description": description,
            "updated_at": now.isoformat(),
        }

        applications_data.append(new_application)
        cls._save_applications(applications_data)

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
    def get_application_tracking_board(cls, user_id: int) -> dict:
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
        return {
            state: [app.to_dict() for app in apps]
            for state, apps in board.items()
        }
