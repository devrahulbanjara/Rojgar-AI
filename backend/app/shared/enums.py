from enum import Enum


class LocationType(str, Enum):
    remote = "remote"
    onsite = "onsite"
    hybrid = "hybrid"


class JobStatus(str, Enum):
    draft = "draft"
    open = "open"
    closed = "closed"
    archived = "archived"


class ApplicationStatus(str, Enum):
    submitted = "submitted"
    screening = "screening"
    interview = "interview"
    offered = "offered"
    hired = "hired"
    rejected = "rejected"
    withdrawn = "withdrawn"
