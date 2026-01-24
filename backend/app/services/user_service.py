from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import User
from app.schemas import UserResponse
from app.schemas.user import OrganizationInUserResponse


class UserService:
    @staticmethod
    def get_user_by_id(user_id: str, db: Session) -> User | None:
        return db.execute(
            select(User)
            .where(User.user_id == user_id)
            .options(selectinload(User.organization))
        ).scalar_one_or_none()

    @staticmethod
    def to_user_response(user: User) -> UserResponse:
        organization_data = None
        if user.organization:
            organization_data = OrganizationInUserResponse(
                id=user.organization.organization_id,
                name=user.organization.name,
                location_city=user.organization.location_city,
                location_country=user.organization.location_country,
                website=user.organization.website,
                industry=user.organization.industry,
            )

        return UserResponse(
            id=user.user_id,
            email=user.email,
            name=user.name,
            picture=user.picture,
            google_id=user.google_id,
            role=user.role,
            organization_id=user.organization_id,
            organization=organization_data,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
