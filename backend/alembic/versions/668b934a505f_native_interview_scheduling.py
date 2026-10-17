"""Native interview scheduling replaces Cal.com; human scorecards replace
recordings, transcription and AI interview evaluation.

- interviews: cal_booking_uid -> ics_uid, + company, interviewer, status,
  sequence, reminders; many interviews per application (one live).
- new: interviewer_availability, interview_invites, scorecards.
- human evaluation scores become scorecards (ratings scaled to 1-4).
- dropped: interview_recordings, candidate_evaluation_scores,
  job_evaluation_schemas, companies.cal_booking_url / cal_organizer_email.

Revision ID: 668b934a505f
Revises: 05b5ba8c8acd
Create Date: 2026-10-17
"""

import json
import math
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "668b934a505f"
down_revision: Union[str, None] = "05b5ba8c8acd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_WEEK = {d: [["10:00", "17:00"]] for d in ("sun", "mon", "tue", "wed", "thu", "fri")}
_WEEK["sat"] = []


def _recommendation(total) -> str:
    if total is None:
        return "yes"
    if total >= 75:
        return "strong_yes"
    if total >= 50:
        return "yes"
    if total >= 25:
        return "no"
    return "strong_no"


def upgrade() -> None:
    # --- interviews ---------------------------------------------------------
    op.alter_column("interviews", "cal_booking_uid", new_column_name="ics_uid")
    op.drop_index("ix_interviews_application_id", table_name="interviews")
    op.create_index("ix_interviews_application_id", "interviews", ["application_id"])
    op.drop_index("ix_interviews_candidate_email", table_name="interviews")
    op.add_column("interviews", sa.Column("company_id", sa.Uuid(), nullable=True))
    op.add_column(
        "interviews", sa.Column("interviewer_user_id", sa.Uuid(), nullable=True)
    )
    op.add_column(
        "interviews",
        sa.Column("status", sa.String(20), nullable=False, server_default="booked"),
    )
    op.add_column(
        "interviews",
        sa.Column("sequence", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column("interviews", sa.Column("cancelled_by", sa.String(20)))
    op.add_column(
        "interviews", sa.Column("reminder_24h_sent_at", sa.DateTime(timezone=True))
    )
    op.add_column(
        "interviews", sa.Column("reminder_1h_sent_at", sa.DateTime(timezone=True))
    )
    op.add_column(
        "interviews",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.execute(
        """
        UPDATE interviews i SET company_id = j.company_id,
            status = CASE WHEN a.status = 'interview_completed' OR i.end_time < now()
                          THEN 'done' ELSE 'booked' END,
            -- Cal.com already reminded people about these bookings.
            reminder_24h_sent_at = now(), reminder_1h_sent_at = now(),
            timezone = coalesce(i.timezone, 'Asia/Kathmandu'),
            location = coalesce(i.location, ''),
            title = coalesce(i.title, 'Interview')
        FROM applications a JOIN jobs j ON j.id = a.job_id
        WHERE a.id = i.application_id
        """
    )
    op.alter_column("interviews", "company_id", nullable=False)
    op.alter_column("interviews", "timezone", type_=sa.String(64), nullable=False)
    op.alter_column("interviews", "location", type_=sa.String(500), nullable=False)
    op.alter_column("interviews", "title", nullable=False)
    op.create_foreign_key(
        "fk_interviews_company_id",
        "interviews",
        "companies",
        ["company_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_interviews_interviewer_user_id",
        "interviews",
        "users",
        ["interviewer_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_interviews_company_id", "interviews", ["company_id"])
    op.create_index(
        "ix_interviews_interviewer_user_id", "interviews", ["interviewer_user_id"]
    )
    op.create_index(
        "uq_interviews_application_booked",
        "interviews",
        ["application_id"],
        unique=True,
        postgresql_where=sa.text("status = 'booked'"),
    )
    op.create_index(
        "uq_interviews_interviewer_start_booked",
        "interviews",
        ["interviewer_user_id", "start_time"],
        unique=True,
        postgresql_where=sa.text("status = 'booked'"),
    )

    # --- new tables ---------------------------------------------------------
    op.create_table(
        "interviewer_availability",
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("timezone", sa.String(64), nullable=False),
        sa.Column("weekly_hours", postgresql.JSONB(), nullable=False),
        sa.Column("interview_minutes", sa.Integer(), nullable=False),
        sa.Column("buffer_minutes", sa.Integer(), nullable=False),
        sa.Column("meeting_link", sa.String(500), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_table(
        "interview_invites",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "application_id",
            sa.Uuid(),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "interviewer_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_by_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_table(
        "scorecards",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "interview_id",
            sa.Uuid(),
            sa.ForeignKey("interviews.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "author_user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL")
        ),
        sa.Column("ratings", postgresql.JSONB(), nullable=False),
        sa.Column("recommendation", sa.String(20), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "interview_id", "author_user_id", name="uq_scorecard_author"
        ),
    )
    op.create_index("ix_scorecards_interview_id", "scorecards", ["interview_id"])

    # --- human evaluation scores -> scorecards --------------------------------
    bind = op.get_bind()
    has_scores = bind.scalar(
        sa.text("SELECT to_regclass('candidate_evaluation_scores')")
    )
    rows = (
        []
        if has_scores is None
        else bind.execute(
            sa.text(
                """
            SELECT DISTINCT ON (iv.id, s.submitted_by_user_id)
                   iv.id AS interview_id, s.submitted_by_user_id, s.scores,
                   s.criteria_snapshot, s.notes, s.weighted_total
            FROM candidate_evaluation_scores s
            JOIN interviews iv ON iv.application_id = s.application_id
            WHERE s.evaluator_type = 'human'
            ORDER BY iv.id, s.submitted_by_user_id, s.updated_at DESC
            """
            )
        ).mappings()
    )
    for row in rows:
        criteria = {c.get("key"): c for c in (row["criteria_snapshot"] or [])}
        ratings = []
        for key, value in (row["scores"] or {}).items():
            criterion = criteria.get(key) or {}
            max_score = criterion.get("max_score") or 100
            if value is None:
                continue
            rating = min(4, max(1, math.ceil(float(value) / max_score * 4)))
            ratings.append({"criterion": criterion.get("label", key), "rating": rating})
        bind.execute(
            sa.text(
                "INSERT INTO scorecards (id, interview_id, author_user_id, ratings,"
                " recommendation, notes) VALUES (:id, :iv, :author,"
                " CAST(:ratings AS jsonb), :rec, :notes)"
            ),
            {
                "id": uuid.uuid4(),
                "iv": row["interview_id"],
                "author": row["submitted_by_user_id"],
                "ratings": json.dumps(ratings),
                "rec": _recommendation(row["weighted_total"]),
                "notes": row["notes"],
            },
        )

    # --- removed features ---------------------------------------------------
    op.execute("DROP TABLE IF EXISTS interview_recordings CASCADE")
    op.execute("DROP TYPE IF EXISTS recordingstatus")
    op.execute("DROP TABLE IF EXISTS candidate_evaluation_scores CASCADE")
    op.execute("DROP TABLE IF EXISTS job_evaluation_schemas CASCADE")
    op.execute(
        "ALTER TABLE companies DROP CONSTRAINT IF EXISTS uq_companies_cal_organizer_email"
    )
    op.drop_column("companies", "cal_organizer_email")
    op.drop_column("companies", "cal_booking_url")


def downgrade() -> None:
    # Recordings, AI evaluations and Cal settings are gone for good; this only
    # restores the columns so older code can start.
    op.add_column("companies", sa.Column("cal_booking_url", sa.String(500)))
    op.add_column("companies", sa.Column("cal_organizer_email", sa.String(255)))
    op.drop_table("scorecards")
    op.drop_table("interview_invites")
    op.drop_table("interviewer_availability")
    op.execute("DELETE FROM interviews WHERE status = 'cancelled'")
    op.drop_index("uq_interviews_interviewer_start_booked", table_name="interviews")
    op.drop_index("uq_interviews_application_booked", table_name="interviews")
    op.drop_index("ix_interviews_interviewer_user_id", table_name="interviews")
    op.drop_index("ix_interviews_company_id", table_name="interviews")
    op.drop_constraint("fk_interviews_interviewer_user_id", "interviews")
    op.drop_constraint("fk_interviews_company_id", "interviews")
    for column in (
        "updated_at",
        "reminder_1h_sent_at",
        "reminder_24h_sent_at",
        "cancelled_by",
        "sequence",
        "status",
        "interviewer_user_id",
        "company_id",
    ):
        op.drop_column("interviews", column)
    op.drop_index("ix_interviews_application_id", table_name="interviews")
    op.create_index(
        "ix_interviews_application_id", "interviews", ["application_id"], unique=True
    )
    op.create_index("ix_interviews_candidate_email", "interviews", ["candidate_email"])
    op.alter_column("interviews", "ics_uid", new_column_name="cal_booking_uid")
