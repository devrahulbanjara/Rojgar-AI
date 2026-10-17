from datetime import date

from sqlalchemy import Date, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column


@declarative_mixin
class ExperienceMixin:
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[list[str]] = mapped_column(ARRAY(String), server_default="{}")


@declarative_mixin
class EducationMixin:
    institution: Mapped[str] = mapped_column(String(255), nullable=False)
    degree: Mapped[str | None] = mapped_column(String(255))
    field_of_study: Mapped[str | None] = mapped_column(String(255))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)


@declarative_mixin
class SkillMixin:
    skill_name: Mapped[str] = mapped_column(String(100), nullable=False)
