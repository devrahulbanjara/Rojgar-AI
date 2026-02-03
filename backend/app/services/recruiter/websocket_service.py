from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_token
from app.db.models.user import User, UserRole


async def authenticate_websocket_user(
    websocket: WebSocket, db: AsyncSession
) -> User | None:
    token = websocket.query_params.get("token") or dict(websocket.cookies).get(
        "auth_token"
    )
    if not token:
        raise ValueError("Not authenticated")
    try:
        user_id, entity_type = verify_token(token)
        if entity_type != "user":
            raise ValueError("Invalid token type")
    except Exception:
        raise ValueError("Invalid token")
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")
    if not user.organization_id:
        raise ValueError("User does not belong to an organization")
    if user.role != UserRole.RECRUITER.value:
        raise ValueError("Only recruiters can access activity feed")
    return user
