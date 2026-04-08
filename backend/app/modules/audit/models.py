from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, nullable=True, index=True
    )
    actor_role: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, nullable=True, index=True
    )
    company_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, nullable=True, index=True
    )
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parent_entity_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    parent_entity_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    request_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )
    request_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    request_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(
        String(30), nullable=False, default="system", server_default="system"
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    success: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true", index=True
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    before_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    after_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    diff_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    metadata_json: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
