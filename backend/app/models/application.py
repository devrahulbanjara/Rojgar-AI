from datetime import datetime
from typing import Optional
from enum import Enum


class ApplicationStage(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    DECISION = "decision"


class ApplicationStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    OFFER_EXTENDED = "offer_extended"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Application:
    def __init__(
        self,
        id: int,
        job_title: str,
        company_name: str,
        user_id: str,
        applied_date: datetime,
        stage: ApplicationStage = ApplicationStage.APPLIED,
        status: ApplicationStatus = ApplicationStatus.PENDING,
        description: Optional[str] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.job_title = job_title
        self.company_name = company_name
        self.user_id = user_id
        self.applied_date = applied_date
        self.stage = stage
        self.status = status
        self.description = description
        self.updated_at = updated_at or applied_date

    @classmethod
    def from_dict(cls, data: dict):
        # Parse applied_date - handle both date and datetime formats
        applied_date_str = data["applied_date"]
        if "T" in applied_date_str:
            applied_date = datetime.fromisoformat(applied_date_str)
        else:
            applied_date = datetime.fromisoformat(applied_date_str + "T00:00:00")
        
        # Parse updated_at - handle both date and datetime formats
        updated_at = None
        if "updated_at" in data:
            updated_at_str = data["updated_at"]
            # Remove 'Z' suffix if present
            if updated_at_str.endswith('Z'):
                updated_at_str = updated_at_str[:-1]
            
            if "T" in updated_at_str:
                updated_at = datetime.fromisoformat(updated_at_str)
            else:
                updated_at = datetime.fromisoformat(updated_at_str + "T00:00:00")
        
        return cls(
            id=data["id"],
            job_title=data["job_title"],
            company_name=data["company_name"],
            user_id=data["user_id"],
            applied_date=applied_date,
            stage=ApplicationStage(data["stage"]),
            status=ApplicationStatus(data["status"]),
            description=data.get("description"),
            updated_at=updated_at,
        )

    def to_dict(self):
        return {
            "id": self.id,
            "job_title": self.job_title,
            "company_name": self.company_name,
            "user_id": self.user_id,
            "applied_date": self.applied_date.isoformat(),
            "stage": self.stage.value,
            "status": self.status.value,
            "description": self.description,
            "updated_at": self.updated_at.isoformat(),
        }
