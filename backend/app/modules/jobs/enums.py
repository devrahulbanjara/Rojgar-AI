import enum


class SyncAction(str, enum.Enum):
    UPSERT = "UPSERT"
    DELETE = "DELETE"


class SyncStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
