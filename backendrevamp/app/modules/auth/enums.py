from enum import Enum


class UserRole(str, Enum):
    candidate = "candidate"
    recruiter = "recruiter"
    company = "company"
    admin = "admin"


class MembershipRole(str, Enum):
    admin = "admin"
    recruiter = "recruiter"


class MembershipStatus(str, Enum):
    pending = "pending"
    active = "active"
    rejected = "rejected"
