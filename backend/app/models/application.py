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
        user_id: int,
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
        return cls(
            id=data["id"],
            job_title=data["job_title"],
            company_name=data["company_name"],
            user_id=data["user_id"],
            applied_date=datetime.fromisoformat(data["applied_date"]),
            stage=ApplicationStage(data["stage"]),
            status=ApplicationStatus(data["status"]),
            description=data.get("description"),
            updated_at=(
                datetime.fromisoformat(data["updated_at"])
                if "updated_at" in data
                else None
            ),
        )

    def to_dict(self):
        return {
            "id": self.id,
            "job_title": self.job_title,
            "company_name": self.company_name,
            "user_id": self.user_id,
            "applied_date": self.applied_date.isoformat(),
            "stage": self.stage,
            "status": self.status,
            "description": self.description,
            "updated_at": self.updated_at.isoformat(),
        }
