from typing import List, Optional, Dict
from datetime import datetime
import logging

from app.models.application import Application, ApplicationStage, ApplicationStatus
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationRead
from app.repositories.application_repo import ApplicationRepository

# Configure logging
logger = logging.getLogger(__name__)


class ApplicationService:
    """Service layer for application business logic"""
    @staticmethod
    def get_all_applications() -> List[ApplicationRead]:
        applications = ApplicationRepository.get_all()
        return [ApplicationRead.model_validate(app) for app in applications]

    @staticmethod
    def get_user_applications(user_id: str) -> List[ApplicationRead]:
        """Get all applications for a specific user"""
        logger.info(f"Fetching applications for user: {user_id}")
        applications = ApplicationRepository.get_by_user_id(user_id)
        return [ApplicationRead.model_validate(app) for app in applications]

    @staticmethod
    def get_application(application_id: int) -> Optional[ApplicationRead]:
        application = ApplicationRepository.get_by_id(application_id)
        return ApplicationRead.model_validate(application) if application else None

    @staticmethod
    def create_application(
        user_id: str, application_data: ApplicationCreate
    ) -> ApplicationRead:
        """Create a new application for a user"""
        logger.info(f"Creating application for user {user_id}: {application_data.job_title} at {application_data.company_name}")
        # Repository now accepts ApplicationCreate directly - type-safe and clean!
        application = ApplicationRepository.create(application_data, user_id)
        return ApplicationRead.model_validate(application)

    @staticmethod
    def update_application(
        application_id: int, update_data: ApplicationUpdate
    ) -> Optional[ApplicationRead]:
        """Update an application - repository now handles ApplicationUpdate directly"""
        # Repository now accepts ApplicationUpdate directly - no need to convert to dict!
        # The repository handles the model_dump and validation internally
        application = ApplicationRepository.update(application_id, update_data)
        return ApplicationRead.model_validate(application) if application else None

    @staticmethod
    def delete_application(application_id: int) -> bool:
        return ApplicationRepository.delete(application_id)

    @staticmethod
    def get_application_tracking_board(user_id: str) -> Dict[str, List[dict]]:
        """Get applications organized by stage for the tracking board"""
        logger.info(f"Generating tracking board for user: {user_id}")
        return ApplicationRepository.get_application_tracking_board(user_id)

    @staticmethod
    def get_application_stats(user_id: str) -> Dict[str, int]:
        """Get application statistics for the user"""
        logger.info(f"Getting application stats for user: {user_id}")
        return ApplicationRepository.get_application_stats(user_id)
