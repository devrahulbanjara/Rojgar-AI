import uuid

from fastapi import WebSocket

from app.core.logging_config import logger


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[uuid.UUID, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, organization_id: uuid.UUID):
        await websocket.accept()
        self.active_connections.setdefault(organization_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, organization_id: uuid.UUID):
        if organization_id in self.active_connections:
            if websocket in self.active_connections[organization_id]:
                self.active_connections[organization_id].remove(websocket)
            if not self.active_connections[organization_id]:
                del self.active_connections[organization_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_organization(
        self, message: dict, organization_id: uuid.UUID
    ):
        if organization_id not in self.active_connections:
            logger.warning(
                f"No active WebSocket connections for organization {organization_id}. "
                f"Message will not be delivered: {message.get('event', 'unknown')}"
            )
            return
        targets = self.active_connections[organization_id][:]
        logger.info(
            f"Broadcasting {message.get('event', 'unknown')} to {len(targets)} "
            f"connection(s) for organization {organization_id}"
        )
        for connection in targets:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"WS Broadcast Error: {e}")
                self.disconnect(connection, organization_id)


manager = ConnectionManager()
