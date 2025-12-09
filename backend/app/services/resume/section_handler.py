"""
Generic section handler for resume sections.
Handles all CRUD operations for Experience, Education, Certification, and Skill sections.
"""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Profile, Resume

from .config import SectionConfig


class ResumeSectionHandler:
    """
    Generic handler for resume section operations.
    Handles add, update, remove, and create operations for any section type.
    """

    def __init__(self, db: Session, config: SectionConfig):
        """
        Initialize the section handler.

        Args:
            db: Database session
            config: Section configuration defining models and fields
        """
        self.db = db
        self.config = config

    def add_to_resume(
        self,
        profile: Profile,
        resume: Resume,
        source_id: str,
        extra_fields: dict[str, Any] | None = None,
    ) -> BaseModel:
        """
        Add an existing profile entity to a resume.

        Args:
            profile: The user's profile
            resume: The target resume
            source_id: ID of the profile entity to link
            extra_fields: Optional extra fields (e.g., custom_description for experience)

        Returns:
            Response model instance
        """
        cfg = self.config

        # Verify source entity exists and belongs to profile
        source_entity = self.db.execute(
            select(cfg.profile_model)
            .where(cfg.profile_model.id == source_id)
            .where(cfg.profile_model.profile_id == profile.id)
        ).scalar_one_or_none()

        if not source_entity:
            raise HTTPException(status_code=404, detail=f"{cfg.entity_name} not found")

        # Check if already added
        existing = self.db.execute(
            select(cfg.link_model)
            .where(cfg.link_model.resume_id == resume.id)
            .where(getattr(cfg.link_model, cfg.profile_fk_field) == source_id)
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(status_code=400, detail=cfg.already_added_message)

        # Calculate next display order
        max_order = self.db.execute(
            select(cfg.link_model.display_order)
            .where(cfg.link_model.resume_id == resume.id)
            .order_by(cfg.link_model.display_order.desc())
        ).scalar()
        next_order = (max_order or 0) + 1

        # Create link entity
        link_data = {
            "id": str(uuid.uuid4()),
            "resume_id": resume.id,
            cfg.profile_fk_field: source_id,
            "display_order": next_order,
        }

        # Add any extra fields (e.g., custom_description for experience)
        if extra_fields:
            link_data.update(extra_fields)

        link_entity = cfg.link_model(**link_data)
        self.db.add(link_entity)
        self.db.flush()
        self.db.refresh(link_entity)

        return cfg.response_model.model_validate(link_entity)

    def update_in_resume(
        self,
        resume: Resume,
        link_id: str,
        update_data: dict[str, Any],
    ) -> BaseModel:
        """
        Update a resume section entry.

        Args:
            resume: The resume
            link_id: ID of the link entity to update
            update_data: Dictionary of fields to update

        Returns:
            Updated response model instance
        """
        cfg = self.config

        # Get the link entity
        link_entity = self.db.execute(
            select(cfg.link_model)
            .where(cfg.link_model.id == link_id)
            .where(cfg.link_model.resume_id == resume.id)
        ).scalar_one_or_none()

        if not link_entity:
            raise HTTPException(
                status_code=404, detail=f"Resume {cfg.entity_name.lower()} not found"
            )

        # Update regular fields
        for field_name in cfg.updatable_fields:
            if update_data.get(field_name) is not None:
                setattr(link_entity, field_name, update_data[field_name])

        # Handle date fields
        for date_field in cfg.date_fields:
            if update_data.get(date_field):
                parsed_date = datetime.strptime(
                    update_data[date_field], "%Y-%m-%d"
                ).date()
                setattr(link_entity, date_field, parsed_date)

        link_entity.updated_at = datetime.now(UTC)

        self.db.flush()
        self.db.refresh(link_entity)

        return cfg.response_model.model_validate(link_entity)

    def remove_from_resume(
        self,
        resume: Resume,
        link_id: str,
    ) -> bool:
        """
        Remove a section entry from a resume.

        Args:
            resume: The resume
            link_id: ID of the link entity to remove

        Returns:
            True if removed successfully
        """
        cfg = self.config

        link_entity = self.db.execute(
            select(cfg.link_model)
            .where(cfg.link_model.id == link_id)
            .where(cfg.link_model.resume_id == resume.id)
        ).scalar_one_or_none()

        if not link_entity:
            raise HTTPException(
                status_code=404, detail=f"Resume {cfg.entity_name.lower()} not found"
            )

        self.db.delete(link_entity)
        self.db.flush()
        return True

    def create_for_resume(
        self,
        resume: Resume,
        entity_data: dict[str, Any],
    ) -> BaseModel:
        """
        Create a new profile entity and link it to the resume.
        Also adds the entity to the user's profile.

        Args:
            resume: The target resume
            entity_data: Dictionary of entity details

        Returns:
            Response model instance
        """
        cfg = self.config

        # Parse date fields
        parsed_data = {}
        for key, value in entity_data.items():
            if key in cfg.date_fields and value:
                parsed_data[key] = datetime.strptime(value, "%Y-%m-%d").date()
            else:
                parsed_data[key] = value

        # Build profile entity fields
        profile_entity_data = {
            "id": str(uuid.uuid4()),
            "profile_id": resume.profile_id,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }

        for entity_field, data_field in cfg.profile_entity_fields.items():
            if data_field in parsed_data:
                profile_entity_data[entity_field] = parsed_data[data_field]
            elif data_field in entity_data:
                profile_entity_data[entity_field] = entity_data.get(data_field)

        # Create profile entity
        profile_entity = cfg.profile_model(**profile_entity_data)

        # Build link entity data
        link_data = {
            "id": str(uuid.uuid4()),
            "resume_id": resume.id,
            cfg.profile_fk_field: profile_entity.id,
            "display_order": 0,
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }

        # For experience, copy master_description to custom_description
        if cfg.profile_fk_field == "work_experience_id":
            link_data["custom_description"] = entity_data.get("master_description", "")

        link_entity = cfg.link_model(**link_data)

        self.db.add(profile_entity)
        self.db.add(link_entity)
        self.db.flush()

        # Build response with nested profile entity
        return self._build_create_response(link_entity, profile_entity)

    def _build_create_response(
        self, link_entity: Any, profile_entity: Any
    ) -> BaseModel:
        """
        Build response for create operation with nested profile entity.

        Args:
            link_entity: The created link entity
            profile_entity: The created profile entity

        Returns:
            Response model instance
        """
        cfg = self.config

        # Map the nested relationship field name
        nested_field_map = {
            "work_experience_id": "work_experience",
            "education_record_id": "education_record",
            "certification_id": "certification",
            "profile_skill_id": "profile_skill",
        }

        nested_field = nested_field_map.get(cfg.profile_fk_field)

        response_data = {
            "id": link_entity.id,
            "resume_id": link_entity.resume_id,
            cfg.profile_fk_field: getattr(link_entity, cfg.profile_fk_field),
            "display_order": link_entity.display_order,
            "created_at": link_entity.created_at,
            "updated_at": link_entity.updated_at,
        }

        # Add custom_description for experience
        if hasattr(link_entity, "custom_description"):
            response_data["custom_description"] = link_entity.custom_description

        # Add nested profile entity
        if nested_field:
            response_data[nested_field] = profile_entity

        return cfg.response_model(**response_data)
