from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import BusinessLogicError, ForbiddenError, UnauthorizedError
from app.core.security import verify_token
from app.models.user import User, UserRole


async def authenticate_websocket_user(websocket: WebSocket, db: AsyncSession) -> User:
    token = websocket.query_params.get("token") or dict(websocket.cookies).get(
        "auth_token"
    )
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        raise UnauthorizedError(
            message="Not authenticated",
            details={
                "reason": "no_token_provided",
            },
        )
    try:
        user_id, entity_type = verify_token(token)
        if entity_type != "user":
            await websocket.close(code=1008, reason="Invalid token type")
            raise UnauthorizedError(
                message="Invalid token type",
                details={
                    "entity_type": entity_type,
                    "expected": "user",
                },
            )
    except Exception as e:
        await websocket.close(code=1008, reason="Invalid token")
        raise UnauthorizedError(
            message="Invalid token",
            details={
                "reason": "token_verification_failed",
                "error_type": type(e).__name__,
            },
        )
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        await websocket.close(code=1008, reason="User not found")
        raise UnauthorizedError(
            message="User not found",
            details={
                "user_id": str(user_id),
            },
            user_id=user_id,
        )
    if not user.organization_id:
        await websocket.close(
            code=1008, reason="User does not belong to an organization"
        )
        raise BusinessLogicError(
            message="User does not belong to an organization",
            details={
                "user_id": str(user.user_id),
                "user_role": user.role,
            },
            user_id=user.user_id,
        )
    if user.role != UserRole.RECRUITER.value:
        await websocket.close(
            code=1008, reason="Only recruiters can access activity feed"
        )
        raise ForbiddenError(
            message="Only recruiters can access activity feed",
            details={
                "user_id": str(user.user_id),
                "user_role": user.role,
                "required_role": UserRole.RECRUITER.value,
            },
            user_id=user.user_id,
        )
    return user
