"""
Application Service
Clean, production-ready business logic layer for applications
"""

from typing import List, Optional, Dict
from datetime import datetime
import logging

from app.models.application import Application, ApplicationStage, ApplicationStatus
from app.repositories.application_repo import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationUpdate

# Configure logging
logger = logging.getLogger(__name__)


class ApplicationService:
    """Service layer for application business logic"""
    @staticmethod
    def get_all_applications() -> List[Application]:
        return ApplicationRepository.get_all()

    @staticmethod
    def get_user_applications(user_id: str) -> List[Application]:
        """Get all applications for a specific user"""
        logger.info(f"Fetching applications for user: {user_id}")
        return ApplicationRepository.get_by_user_id(user_id)

    @staticmethod
    def get_application(application_id: int) -> Optional[Application]:
        return ApplicationRepository.get_by_id(application_id)

    @staticmethod
    def create_application(
        user_id: str, application_data: ApplicationCreate
    ) -> Application:
        """Create a new application for a user"""
        logger.info(f"Creating application for user {user_id}: {application_data.job_title} at {application_data.company_name}")
        return ApplicationRepository.create(
            job_title=application_data.job_title,
            company_name=application_data.company_name,
            user_id=user_id,
            description=application_data.description,
        )

    @staticmethod
    def update_application(
        application_id: int, update_data: ApplicationUpdate
    ) -> Optional[Application]:
        # Convert Pydantic model to dict, excluding None values
        update_dict = update_data.dict(exclude_unset=True)

        # Convert enum values to strings for storage
        if "stage" in update_dict and update_dict["stage"] is not None:
            update_dict["stage"] = update_dict["stage"].value

        if "status" in update_dict and update_dict["status"] is not None:
            update_dict["status"] = update_dict["status"].value

        return ApplicationRepository.update(application_id, update_dict)

    @staticmethod
    def delete_application(application_id: int) -> bool:
        return ApplicationRepository.delete(application_id)

    @staticmethod
    def get_application_tracking_board(user_id: str) -> Dict[str, List[dict]]:
        """Get applications organized by stage for the tracking board"""
        logger.info(f"Generating tracking board for user: {user_id}")
        return ApplicationRepository.get_application_tracking_board(user_id)
