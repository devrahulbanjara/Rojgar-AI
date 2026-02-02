from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import BusinessLogicError, ForbiddenError, UnauthorizedError
from app.core.security import verify_token
from app.models.user import User, UserRole


async def authenticate_websocket_user(websocket: WebSocket, db: Session) -> User:
    token = websocket.query_params.get("token") or dict(websocket.cookies).get(
        "auth_token"
    )
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        raise UnauthorizedError("Not authenticated")
    try:
        user_id, entity_type = verify_token(token)
        if entity_type != "user":
            await websocket.close(code=1008, reason="Invalid token type")
            raise UnauthorizedError("Invalid token type")
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        raise UnauthorizedError("Invalid token")
    user = db.scalar(select(User).where(User.user_id == user_id))
    if not user:
        await websocket.close(code=1008, reason="User not found")
        raise UnauthorizedError("User not found")
    if not user.organization_id:
        await websocket.close(
            code=1008, reason="User does not belong to an organization"
        )
        raise BusinessLogicError("User does not belong to an organization")
    if user.role != UserRole.RECRUITER.value:
        await websocket.close(
            code=1008, reason="Only recruiters can access activity feed"
        )
        raise ForbiddenError("Only recruiters can access activity feed")
    return user
