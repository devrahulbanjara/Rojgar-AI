import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import get_datetime
from app.core.security import hash_password
from app.models import User, UserRole
from app.schemas.organization import UpdateRecruiterRequest
from app.services.auth.auth_service import AuthService
from app.services.auth.organization_auth_service import OrganizationAuthService


class RecruiterCRUD:
    @staticmethod
    def create_recruiter(
        organization_id: str, email: str, name: str, password: str, db: Session
    ) -> User:
        existing_user = AuthService.get_user_by_email(email, db)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered to ConvexHire previously.",
            )

        existing_in_org = OrganizationAuthService.get_organization_by_email(email, db)
        if existing_in_org:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recruiter email already registered to ConvexHire previously.",
            )

        now = get_datetime()
        new_recruiter = User(
            user_id=str(uuid.uuid4()),
            organization_id=organization_id,
            email=email,
            name=name,
            role=UserRole.RECRUITER.value,
            password=hash_password(password),
            created_at=now,
            updated_at=now,
        )

        db.add(new_recruiter)
        db.commit()
        db.refresh(new_recruiter)
        return new_recruiter

    @staticmethod
    def get_recruiter_by_id(recruiter_id: str, db: Session) -> User | None:
        return db.execute(
            select(User).where(User.user_id == recruiter_id)
        ).scalar_one_or_none()

    @staticmethod
    def get_recruiters_by_organization(organization_id: str, db: Session) -> list[User]:
        return list(
            db.execute(select(User).where(User.organization_id == organization_id))
            .scalars()
            .all()
        )

    @staticmethod
    def update_recruiter(
        recruiter_id: str, update_data: UpdateRecruiterRequest, db: Session
    ) -> User:
        recruiter = RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
        if not recruiter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recruiter not found",
            )

        if update_data.name is not None:
            recruiter.name = update_data.name

        if update_data.email is not None:
            existing_user = db.execute(
                select(User).where(
                    User.email == update_data.email, User.user_id != recruiter_id
                )
            ).scalar_one_or_none()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use",
                )
            recruiter.email = update_data.email

        recruiter.updated_at = get_datetime()

        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)
        return recruiter

    @staticmethod
    def delete_recruiter(recruiter_id: str, db: Session) -> None:
        recruiter = RecruiterCRUD.get_recruiter_by_id(recruiter_id, db)
        if not recruiter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recruiter not found",
            )

        db.delete(recruiter)
        db.commit()
