from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status
from starlette.websockets import WebSocketState

from app.core.database import AsyncSessionLocal
from app.core.logging_config import logger
from app.core.websocket_manager import manager
from app.services.recruiter.websocket_service import authenticate_websocket_user

router = APIRouter()


@router.websocket("/ws/activity")
async def websocket_activity(websocket: WebSocket):
    organization_id = None

    async with AsyncSessionLocal() as db:
        try:
            user = await authenticate_websocket_user(websocket, db)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed"
                )
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

        except (HTTPException, ValueError) as e:
            if isinstance(e, HTTPException):
                message = str(e.detail) if isinstance(e.detail, str) else "Connection refused"
            else:
                message = str(e)
            logger.warning(f"WS Connection Refused: {message}")
            if websocket.client_state != WebSocketState.DISCONNECTED:
                await websocket.close(code=1008)

        except WebSocketDisconnect:
            if organization_id:
                manager.disconnect(websocket, organization_id)

        except Exception as e:
            logger.error(f"WS Unexpected System Error: {e}")
            if organization_id:
                manager.disconnect(websocket, organization_id)
            if websocket.client_state != WebSocketState.DISCONNECTED:
                await websocket.close(code=1011)
