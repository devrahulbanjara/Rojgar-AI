from typing import List, Dict, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.application import Application, ApplicationStage, ApplicationStatus


class ApplicationService:

    @staticmethod
    def get_user_applications(user_id: str, db: Session) -> List[Application]:
        return (
            db.execute(select(Application).where(Application.user_id == user_id))
            .scalars()
            .all()
        )

    @staticmethod
    def get_tracking_board(user_id: str, db: Session) -> Dict[str, List[dict]]:
        applications = ApplicationService.get_user_applications(user_id, db)

        board = {
            "applied": [],  # Applied + Screening
            "interviewing": [],  # Interviewing
            "outcome": [],  # Offer + Decision
        }

        for app in applications:
            app_dict = {
                "id": app.id,
                "job_title": app.job_title,
                "company_name": app.company_name,
                "user_id": app.user_id,
                "applied_date": app.applied_date.isoformat(),
                "stage": app.stage,
                "status": app.status,
                "description": app.description,
                "updated_at": app.updated_at.isoformat(),
            }

            if app.stage in [
                ApplicationStage.APPLIED.value,
                ApplicationStage.SCREENING.value,
            ]:
                board["applied"].append(app_dict)
            elif app.stage == ApplicationStage.INTERVIEWING.value:
                board["interviewing"].append(app_dict)
            elif app.stage in [
                ApplicationStage.OFFER.value,
                ApplicationStage.DECISION.value,
            ]:
                board["outcome"].append(app_dict)

        return board

    @staticmethod
    def get_application_stats(user_id: str, db: Session) -> Dict[str, int]:
        applications = ApplicationService.get_user_applications(user_id, db)

        total = len(applications)
        active = sum(
            1
            for app in applications
            if app.status
            not in [ApplicationStatus.ACCEPTED.value, ApplicationStatus.REJECTED.value]
        )
        interviews = sum(
            1
            for app in applications
            if app.status == ApplicationStatus.INTERVIEW_SCHEDULED.value
        )
        offers = sum(
            1
            for app in applications
            if app.status == ApplicationStatus.OFFER_EXTENDED.value
        )

        responded = sum(
            1 for app in applications if app.status != ApplicationStatus.PENDING.value
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
        db: Session,
    ) -> Application:
        new_app = Application(
            user_id=user_id,
            job_title=job_title,
            company_name=company_name,
            description=description,
            stage=ApplicationStage.APPLIED.value,
            status=ApplicationStatus.PENDING.value,
        )

        db.add(new_app)
        db.commit()
        db.refresh(new_app)

        return new_app

    @staticmethod
    def get_application_by_id(
        application_id: int, db: Session
    ) -> Optional[Application]:
        return db.execute(
            select(Application).where(Application.id == application_id)
        ).scalar_one_or_none()

    @staticmethod
    def update_application(
        application: Application,
        stage: Optional[ApplicationStage] = None,
        status: Optional[ApplicationStatus] = None,
        description: Optional[str] = None,
        db: Session = None,
    ) -> Application:
        if stage is not None:
            application.stage = stage.value
        if status is not None:
            application.status = status.value
        if description is not None:
            application.description = description

        application.updated_at = datetime.now(timezone.utc)

        db.add(application)
        db.commit()
        db.refresh(application)

        return application

    @staticmethod
    def delete_application(application: Application, db: Session) -> None:
        db.delete(application)
        db.commit()

    @staticmethod
    def verify_ownership(application: Application, user_id: str) -> bool:
        return application.user_id == user_id
