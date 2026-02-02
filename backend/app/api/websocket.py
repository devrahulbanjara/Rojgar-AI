from contextlib import asynccontextmanager

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core import get_db
from app.core.logging_config import logger
from app.core.websocket_manager import manager
from app.services.recruiter.websocket_service import authenticate_websocket_user

router = APIRouter()


@asynccontextmanager
async def get_db_context():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()


@router.websocket("/ws/activity")
async def websocket_activity(websocket: WebSocket):
    organization_id = None
    async with get_db_context() as db:
        try:
            user = await authenticate_websocket_user(websocket, db)
            organization_id = user.organization_id
            await manager.connect(websocket, organization_id)
            await manager.send_personal_message(
                {
                    "type": "connection",
                    "status": "connected",
                    "organization_id": str(organization_id),
                },
                websocket,
            )
            while True:
                data = await websocket.receive_text()
                if data == "ping":
                    await websocket.send_text("pong")
        except WebSocketDisconnect:
            if organization_id:
                manager.disconnect(websocket, organization_id)
        except Exception as e:
            logger.error(f"WS Unexpected Error: {e}")
            if organization_id:
                manager.disconnect(websocket, organization_id)
            await websocket.close(code=1011)
