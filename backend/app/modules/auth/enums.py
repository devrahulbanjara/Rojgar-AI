from enum import Enum


class MembershipRole(str, Enum):
    """A person's role inside one business."""

    owner = "owner"
    manager = "manager"
    interviewer = "interviewer"


class MembershipStatus(str, Enum):
    """``active`` marks the business a person is working in right now.

    A person can belong to several businesses but has at most one active
    membership (partial unique index), so every business-scoped query can
    filter on ``status == active``. Switching business flips the flags.
    """

    active = "active"
    inactive = "inactive"


class BusinessStatus(str, Enum):
    pending = "pending"
    active = "active"
    suspended = "suspended"
    rejected = "rejected"
