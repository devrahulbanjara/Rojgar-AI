"""
Application service - Business logic for application operations
"""

from typing import List, Dict, Optional
from datetime import datetime
from sqlmodel import Session, select

from app.models.application import (
    Application,
    ApplicationStage,
    ApplicationStatus,
    ApplicationResponse,
)


class ApplicationService:
    """Service for handling application-related business logic"""
    
    @staticmethod
    def to_response(app: Application) -> ApplicationResponse:
        """Convert Application model to ApplicationResponse"""
        return ApplicationResponse(
            id=app.id,
            user_id=app.user_id,
            job_title=app.job_title,
            company_name=app.company_name,
            description=app.description,
            applied_date=app.applied_date,
            stage=app.stage,
            status=app.status,
            updated_at=app.updated_at,
        )
    
    @staticmethod
    def get_user_applications(user_id: str, db: Session) -> List[Application]:
        """Get all applications for a user"""
        return db.exec(
            select(Application).where(Application.user_id == user_id)
        ).all()
    
    @staticmethod
    def get_tracking_board(user_id: str, db: Session) -> Dict[str, List[dict]]:
        """
        Get applications organized by stage for the tracking board
        Organizes into 3 columns: applied, interviewing, outcome
        """
        applications = ApplicationService.get_user_applications(user_id, db)
        
        # Organize into board columns
        board = {
            "applied": [],       # Applied + Screening
            "interviewing": [],  # Interviewing
            "outcome": [],       # Offer + Decision
        }
        
        for app in applications:
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
            
            # Put in right column based on stage
            if app.stage in [ApplicationStage.APPLIED, ApplicationStage.SCREENING]:
                board["applied"].append(app_dict)
            elif app.stage == ApplicationStage.INTERVIEWING:
                board["interviewing"].append(app_dict)
            elif app.stage in [ApplicationStage.OFFER, ApplicationStage.DECISION]:
                board["outcome"].append(app_dict)
        
        return board
    
    @staticmethod
    def get_application_stats(user_id: str, db: Session) -> Dict[str, int]:
        """Get statistics about user's applications"""
        applications = ApplicationService.get_user_applications(user_id, db)
        
        # Calculate stats
        total = len(applications)
        active = sum(
            1 for app in applications
            if app.status not in [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED]
        )
        interviews = sum(
            1 for app in applications
            if app.status == ApplicationStatus.INTERVIEW_SCHEDULED
        )
        offers = sum(
            1 for app in applications
            if app.status == ApplicationStatus.OFFER_EXTENDED
        )
        
        # Response rate (applications that got a response)
        responded = sum(
            1 for app in applications
            if app.status != ApplicationStatus.PENDING
        )
        response_rate = int((responded / total) * 100) if total > 0 else 0
        
        return {
            "totalApplications": total,
            "activeApplications": active,
            "interviewsScheduled": interviews,
            "offersReceived": offers,
            "responseRate": response_rate,
        }
    
    @staticmethod
    def create_application(
        user_id: str,
        job_title: str,
        company_name: str,
        description: Optional[str],
        db: Session
    ) -> Application:
        """Create a new job application"""
        new_app = Application(
            user_id=user_id,
            job_title=job_title,
            company_name=company_name,
            description=description,
            stage=ApplicationStage.APPLIED,
            status=ApplicationStatus.PENDING,
        )
        
        db.add(new_app)
        db.commit()
        db.refresh(new_app)
        
        return new_app
    
    @staticmethod
    def get_application_by_id(application_id: int, db: Session) -> Optional[Application]:
        """Get a specific application"""
        return db.get(Application, application_id)
    
    @staticmethod
    def update_application(
        application: Application,
        stage: Optional[ApplicationStage] = None,
        status: Optional[ApplicationStatus] = None,
        description: Optional[str] = None,
        db: Session = None
    ) -> Application:
        """Update an application"""
        if stage is not None:
            application.stage = stage
        if status is not None:
            application.status = status
        if description is not None:
            application.description = description
        
        application.updated_at = datetime.utcnow()
        
        db.add(application)
        db.commit()
        db.refresh(application)
        
        return application
    
    @staticmethod
    def delete_application(application: Application, db: Session) -> None:
        """Delete an application"""
        db.delete(application)
        db.commit()
    
    @staticmethod
    def verify_ownership(application: Application, user_id: str) -> bool:
        """Check if user owns the application"""
        return application.user_id == user_id

