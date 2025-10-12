from datetime import datetime
from typing import List, Optional, Dict
from sqlmodel import Session, select
from app.models.application import Application, ApplicationStage, ApplicationStatus
from app.schemas.application import ApplicationCreate, ApplicationUpdate
from app.core.database import engine
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class ApplicationRepository:
    """Repository for application data operations with proper error handling"""

    @staticmethod
    def get_all() -> List[Application]:
        """Get all applications"""
        try:
            with Session(engine) as session:
                statement = select(Application)
                applications = list(session.exec(statement).all())
                logger.info(f"Retrieved {len(applications)} applications from database")
                return applications
        except Exception as e:
            logger.error(f"Error retrieving all applications: {e}")
            return []

    @staticmethod
    def get_by_user_id(user_id: str) -> List[Application]:
        """Get all applications for a specific user"""
        try:
            with Session(engine) as session:
                statement = select(Application).where(Application.user_id == user_id)
                user_applications = list(session.exec(statement).all())
                logger.info(
                    f"Found {len(user_applications)} applications for user {user_id}"
                )
                return user_applications
        except Exception as e:
            logger.error(f"Error retrieving applications for user {user_id}: {e}")
            return []

    @staticmethod
    def get_by_id(application_id: int) -> Optional[Application]:
        """Get a specific application by ID"""
        try:
            with Session(engine) as session:
                application = session.get(Application, application_id)
                if application:
                    logger.info(f"Retrieved application {application_id} from database")
                else:
                    logger.warning(
                        f"Application {application_id} not found in database"
                    )
                return application
        except Exception as e:
            logger.error(f"Error retrieving application {application_id}: {e}")
            return None

    @staticmethod
    def create(application_data: ApplicationCreate, user_id: str) -> Application:
        """Create a new application from ApplicationCreate model"""
        try:
            with Session(engine) as session:
                # Use model_validate to create Application table model from ApplicationCreate
                # This is type-safe and handles all field mappings automatically
                new_application = Application.model_validate(
                    application_data,
                    update={
                        "user_id": user_id,
                        "stage": ApplicationStage.APPLIED,
                        "status": ApplicationStatus.PENDING,
                    },
                )
                session.add(new_application)
                session.commit()
                session.refresh(new_application)
                logger.info(
                    f"Created new application {new_application.id} for user {user_id}"
                )
                return new_application
        except Exception as e:
            logger.error(f"Error creating application: {e}")
            raise

    @staticmethod
    def update(
        application_id: int, update_data: ApplicationUpdate
    ) -> Optional[Application]:
        """Update an application from ApplicationUpdate model"""
        try:
            with Session(engine) as session:
                application = session.get(Application, application_id)
                if application:
                    # Use model_dump to get only the fields that were explicitly set
                    update_dict = update_data.model_dump(exclude_unset=True)

                    # Update only provided fields - this is type-safe now
                    for key, value in update_dict.items():
                        if hasattr(application, key) and value is not None:
                            setattr(application, key, value)

                    # Always update the updated_at timestamp
                    application.updated_at = datetime.utcnow()

                    session.add(application)
                    session.commit()
                    session.refresh(application)
                    logger.info(f"Updated application {application_id}")
                    return application
                else:
                    logger.warning(f"Application {application_id} not found for update")
                    return None
        except Exception as e:
            logger.error(f"Error updating application {application_id}: {e}")
            return None

    @staticmethod
    def delete(application_id: int) -> bool:
        """Delete an application"""
        try:
            with Session(engine) as session:
                application = session.get(Application, application_id)
                if application:
                    session.delete(application)
                    session.commit()
                    logger.info(f"Deleted application {application_id}")
                    return True
                else:
                    logger.warning(
                        f"Application {application_id} not found for deletion"
                    )
                    return False
        except Exception as e:
            logger.error(f"Error deleting application {application_id}: {e}")
            return False

    @staticmethod
    def get_application_tracking_board(user_id: str) -> Dict[str, List[dict]]:
        """Get applications organized by stage for the tracking board"""
        try:
            applications = ApplicationRepository.get_by_user_id(user_id)

            # Group applications into 3 broader states
            board = {
                "applied": [],  # Applied + Screening
                "interviewing": [],  # Interviewing
                "outcome": [],  # Offer + Decision
            }

            for app in applications:
                # Convert to dict
                app_dict = {
                    "id": app.id,
                    "job_title": app.job_title,
                    "company_name": app.company_name,
                    "user_id": app.user_id,
                    "applied_date": app.applied_date.isoformat(),
                    "stage": app.stage.value,
                    "status": app.status.value,
                    "description": app.description,
                    "updated_at": app.updated_at.isoformat(),
                }

                # Map old stages to new broader states
                if app.stage in [ApplicationStage.APPLIED, ApplicationStage.SCREENING]:
                    board["applied"].append(app_dict)
                elif app.stage == ApplicationStage.INTERVIEWING:
                    board["interviewing"].append(app_dict)
                elif app.stage in [ApplicationStage.OFFER, ApplicationStage.DECISION]:
                    board["outcome"].append(app_dict)

            logger.info(
                f"Generated tracking board for user {user_id} with {len(applications)} applications"
            )
            return board
        except Exception as e:
            logger.error(f"Error generating tracking board for user {user_id}: {e}")
            return {
                "applied": [],
                "interviewing": [],
                "outcome": [],
            }
