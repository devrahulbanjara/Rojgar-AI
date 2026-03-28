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
    submitted = "submitted"
    screening = "screening"
    interview_booked = "interview_booked"
    interview = "interview"
    offered = "offered"
    hired = "hired"
    rejected = "rejected"
    withdrawn = "withdrawn"


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
