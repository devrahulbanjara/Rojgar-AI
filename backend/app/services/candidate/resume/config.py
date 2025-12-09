"""
Configuration classes for resume section types.
Defines how each section type (Experience, Education, Certification, Skill) behaves.
"""

from dataclasses import dataclass, field
from typing import Any

from app.models import (
    Certification,
    EducationRecord,
    ProfileSkill,
    ResumeCertification,
    ResumeEducation,
    ResumeExperience,
    ResumeSkill,
    WorkExperience,
)
from app.schemas import (
    ResumeCertificationResponse,
    ResumeEducationResponse,
    ResumeExperienceResponse,
    ResumeSkillResponse,
)


@dataclass
class SectionConfig:
    """
    Configuration for a resume section type.
    Defines models, fields, and behavior for generic CRUD operations.
    """

    # Model classes
    profile_model: type
    """The profile-level model (e.g., WorkExperience)"""

    link_model: type
    """The resume-link model (e.g., ResumeExperience)"""

    response_model: type
    """The Pydantic response model"""

    # Foreign key field names
    profile_fk_field: str
    """FK field name on link model pointing to profile entity (e.g., 'work_experience_id')"""

    # Display names for error messages
    entity_name: str
    """Human-readable name for error messages (e.g., 'Work experience')"""

    already_added_message: str
    """Error message when item is already added to resume"""

    # Fields that can be updated on the link model
    updatable_fields: list[str] = field(default_factory=list)
    """Fields that can be updated directly on the link model"""

    # Date fields requiring string->date parsing
    date_fields: list[str] = field(default_factory=list)
    """Fields that need date string parsing (format: YYYY-MM-DD)"""

    # For creating new profile entities from resume
    profile_entity_fields: dict[str, Any] = field(default_factory=dict)
    """Mapping of field names for creating profile entity from request data"""


# Section configurations for each type
EXPERIENCE_CONFIG = SectionConfig(
    profile_model=WorkExperience,
    link_model=ResumeExperience,
    response_model=ResumeExperienceResponse,
    profile_fk_field="work_experience_id",
    entity_name="Work experience",
    already_added_message="Experience already added to this resume",
    updatable_fields=[
        "custom_description",
        "job_title",
        "company",
        "location",
        "is_current",
        "master_description",
    ],
    date_fields=["start_date", "end_date"],
    profile_entity_fields={
        "job_title": "job_title",
        "company": "company",
        "location": "location",
        "start_date": "start_date",
        "end_date": "end_date",
        "is_current": "is_current",
        "master_description": "master_description",
    },
)

EDUCATION_CONFIG = SectionConfig(
    profile_model=EducationRecord,
    link_model=ResumeEducation,
    response_model=ResumeEducationResponse,
    profile_fk_field="education_record_id",
    entity_name="Education record",
    already_added_message="Education already added to this resume",
    updatable_fields=[
        "school_university",
        "degree",
        "field_of_study",
        "location",
        "is_current",
        "gpa",
        "honors",
    ],
    date_fields=["start_date", "end_date"],
    profile_entity_fields={
        "school_university": "school_university",
        "degree": "degree",
        "field_of_study": "field_of_study",
        "location": "location",
        "start_date": "start_date",
        "end_date": "end_date",
        "is_current": "is_current",
        "gpa": "gpa",
        "honors": "honors",
    },
)

CERTIFICATION_CONFIG = SectionConfig(
    profile_model=Certification,
    link_model=ResumeCertification,
    response_model=ResumeCertificationResponse,
    profile_fk_field="certification_id",
    entity_name="Certification",
    already_added_message="Certification already added to this resume",
    updatable_fields=[
        "name",
        "issuing_body",
        "credential_id",
        "credential_url",
        "does_not_expire",
    ],
    date_fields=["issue_date", "expiration_date"],
    profile_entity_fields={
        "name": "name",
        "issuing_body": "issuing_body",
        "credential_id": "credential_id",
        "credential_url": "credential_url",
        "issue_date": "issue_date",
        "expiration_date": "expiration_date",
        "does_not_expire": "does_not_expire",
    },
)

SKILL_CONFIG = SectionConfig(
    profile_model=ProfileSkill,
    link_model=ResumeSkill,
    response_model=ResumeSkillResponse,
    profile_fk_field="profile_skill_id",
    entity_name="Profile skill",
    already_added_message="Skill already added to this resume",
    updatable_fields=[
        "skill_name",
        "proficiency_level",
        "years_of_experience",
    ],
    date_fields=[],
    profile_entity_fields={
        "skill_name": "skill_name",
        "proficiency_level": "proficiency_level",
        "years_of_experience": "years_of_experience",
    },
)
