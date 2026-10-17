from enum import Enum


class LocationType(str, Enum):
    remote = "remote"
    onsite = "onsite"
    hybrid = "hybrid"


class JobStatus(str, Enum):
    draft = "draft"
    active = "active"
    expired = "expired"


class ApplicationStatus(str, Enum):
    applied = "applied"
    shortlisted = "shortlisted"
    rejected = "rejected"
    interview_booked = "interview_booked"
    interview_completed = "interview_completed"
    offer = "offer"
    offer_accepted = "offer_accepted"
    offer_declined = "offer_declined"


class ShortlistStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"


class SyncAction(str, Enum):
    UPSERT = "UPSERT"
    DELETE = "DELETE"


class SyncStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
