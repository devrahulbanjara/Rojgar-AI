import uuid
from datetime import datetime

from app.core.websocket_manager import manager


class ActivityEventEmitter:
    @staticmethod
    async def emit_application_created(
        organization_id: uuid.UUID,
        candidate_name: str,
        job_title: str,
        application_id: uuid.UUID,
        job_id: uuid.UUID,
        timestamp: datetime,
    ):
        await manager.broadcast_to_organization(
            {
                "type": "activity",
                "event": "application_created",
                "data": {
                    "id": str(application_id),
                    "type": "application",
                    "user": candidate_name,
                    "action": "applied for",
                    "target": job_title,
                    "timestamp": timestamp.isoformat(),
                    "metadata": {
                        "application_id": str(application_id),
                        "job_id": str(job_id),
                        "status": "applied",
                    },
                },
            },
            organization_id,
        )

    @staticmethod
    async def emit_status_changed(
        organization_id: uuid.UUID,
        candidate_name: str,
        job_title: str,
        application_id: uuid.UUID,
        job_id: uuid.UUID,
        old_status: str,
        new_status: str,
        timestamp: datetime,
    ):
        await manager.broadcast_to_organization(
            {
                "type": "activity",
                "event": "status_changed",
                "data": {
                    "id": str(application_id),
                    "type": "status_change",
                    "user": candidate_name,
                    "action": f"updated status to {new_status}",
                    "target": job_title,
                    "timestamp": timestamp.isoformat(),
                    "metadata": {
                        "application_id": str(application_id),
                        "job_id": str(job_id),
                        "old_status": old_status,
                        "status": new_status,
                    },
                },
            },
            organization_id,
        )

    @staticmethod
    async def emit_job_created(
        organization_id: uuid.UUID,
        recruiter_name: str,
        job_title: str,
        job_id: uuid.UUID,
        timestamp: datetime,
    ):
        await manager.broadcast_to_organization(
            {
                "type": "activity",
                "event": "job_created",
                "data": {
                    "id": str(job_id),
                    "type": "job_post",
                    "user": recruiter_name or "System",
                    "action": "posted new job",
                    "target": job_title,
                    "timestamp": timestamp.isoformat(),
                    "metadata": {"job_id": str(job_id)},
                },
            },
            organization_id,
        )


activity_emitter = ActivityEventEmitter()
