"""Data model v2: application stage, reviews, events; one-field job description.

Maps existing rows exactly (docs/RECRUITER_FLOW.md "Migration from the current
schema"):

  status applied -> stage new; interview_booked/completed -> interview (an
  interview_done event records "completed"); offer_accepted -> hired;
  offer_declined -> withdrawn (stage_changed event "declined offer").
  job active/expired/draft -> open/closed(expired)/draft; hiring_completed ->
  closed(hired). score/strengths/weaknesses -> Review (summary = first
  strength, fit from score bands >=75 strong, 50-74 possible, <50 weak).
  overview + arrays -> description (headed Markdown sections);
  requirements -> must_haves (first 6); preferred -> nice_to_haves (first 6);
  required_years_of_experience -> a must-have.

Applications may now come without a CV (resume_id NULL) and people without an
email (users.email NULL, users.phone in E.164).

The previous AI fields are kept verbatim in a `review_done` event payload
(`legacy`) so the downgrade restores them exactly. Sent outreach drafts become
`email_sent` events; unsent drafts are dropped (decisions now send email).

Revision ID: 2017037b521a
Revises: b0acfd8bc7d7
Create Date: 2026-10-17
"""

from __future__ import annotations

import re
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "2017037b521a"
down_revision: Union[str, None] = "b0acfd8bc7d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STAGES = ("new", "shortlisted", "interview", "offer", "hired", "rejected", "withdrawn")
CATEGORIES = (
    "banking_finance",
    "healthcare",
    "education",
    "hospitality_tourism",
    "sales_retail",
    "manufacturing",
    "logistics_driving",
    "it_software",
    "ngo_ingo",
    "government_public",
    "office_admin",
    "construction_engineering",
    "other",
)
EMPLOYMENT_TYPES = ("full_time", "part_time", "contract", "internship")
OLD_STATUSES = (
    "applied",
    "shortlisted",
    "rejected",
    "interview_booked",
    "interview_completed",
    "offer",
    "offer_accepted",
    "offer_declined",
)

# Headed sections the description is built from (and parsed back on downgrade).
SECTIONS = (
    ("responsibilities", "Responsibilities"),
    ("requirements", "Requirements"),
    ("preferred_qualifications", "Nice to have"),
    ("benefits", "Benefits"),
)


def _description_sql() -> str:
    parts = ["nullif(btrim(coalesce(overview, '')), '')"]
    for column, heading in SECTIONS:
        parts.append(
            f"CASE WHEN cardinality({column}) > 0 THEN '## {heading}' || E'\\n- ' || "
            f"array_to_string({column}, E'\\n- ') END"
        )
    return "coalesce(concat_ws(E'\\n\\n', " + ", ".join(parts) + "), '')"


def upgrade() -> None:
    bind = op.get_bind()

    # ---- people: phone-only candidates --------------------------------
    op.alter_column("users", "email", existing_type=sa.String(255), nullable=True)
    op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))
    op.create_unique_constraint("uq_users_phone", "users", ["phone"])

    # ---- applications: stage + decision fields -------------------------
    op.alter_column("applications", "resume_id", existing_type=sa.Uuid(), nullable=True)
    stage_enum = postgresql.ENUM(*STAGES, name="applicationstage")
    stage_enum.create(bind)
    op.add_column(
        "applications",
        sa.Column("stage", stage_enum, nullable=True),
    )
    op.execute(
        """
        UPDATE applications SET stage = (CASE status::text
            WHEN 'applied' THEN 'new'
            WHEN 'shortlisted' THEN 'shortlisted'
            WHEN 'interview_booked' THEN 'interview'
            WHEN 'interview_completed' THEN 'interview'
            WHEN 'offer' THEN 'offer'
            WHEN 'offer_accepted' THEN 'hired'
            WHEN 'offer_declined' THEN 'withdrawn'
            WHEN 'rejected' THEN 'rejected'
        END)::applicationstage
        """
    )
    op.alter_column(
        "applications", "stage", nullable=False, server_default=sa.text("'new'")
    )
    op.create_index("ix_applications_stage", "applications", ["stage"])
    op.add_column(
        "applications",
        sa.Column(
            "decided_by",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "applications",
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "applications", sa.Column("rejected_reason", sa.String(20), nullable=True)
    )
    op.create_table(
        "job_referrers",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "job_id",
            sa.Uuid(),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("token", sa.String(32), nullable=False, unique=True),
        sa.Column(
            "created_by",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_job_referrers_job_id", "job_referrers", ["job_id"])
    op.add_column(
        "applications",
        sa.Column(
            "referrer_id",
            sa.Uuid(),
            sa.ForeignKey("job_referrers.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_applications_referrer_id", "applications", ["referrer_id"])
    op.execute(
        "UPDATE applications SET decided_at = updated_at WHERE status::text <> 'applied'"
    )
    op.execute(
        "UPDATE applications SET rejected_reason = 'position_filled' "
        "FROM jobs WHERE jobs.id = applications.job_id "
        "AND applications.status::text = 'rejected' AND jobs.hiring_completed"
    )

    # ---- events --------------------------------------------------------
    op.create_table(
        "application_events",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "application_id",
            sa.Uuid(),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column(
            "actor_user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "payload",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_application_events_application_id", "application_events", ["application_id"]
    )
    op.create_index("ix_application_events_type", "application_events", ["type"])
    op.create_index(
        "ix_application_events_created_at", "application_events", ["created_at"]
    )
    op.execute(
        """
        INSERT INTO application_events (id, application_id, type, payload, created_at)
        SELECT gen_random_uuid(), id, 'applied',
               jsonb_build_object('source', source), created_at
        FROM applications
        """
    )
    # "platform" (signed-in apply) is now "direct"; the applied event keeps it.
    op.execute("UPDATE applications SET source = 'direct' WHERE source = 'platform'")
    op.alter_column("applications", "source", server_default="direct")
    op.execute(
        """
        INSERT INTO application_events (id, application_id, type, payload, created_at)
        SELECT gen_random_uuid(), i.application_id, 'interview_booked',
               jsonb_build_object('interview_id', i.id::text,
                                  'starts_at', i.start_time), i.created_at
        FROM interviews i
        """
    )
    op.execute(
        """
        INSERT INTO application_events (id, application_id, type, payload, created_at)
        SELECT gen_random_uuid(), id, 'interview_done',
               jsonb_build_object('legacy_status', 'interview_completed'), updated_at
        FROM applications WHERE status::text = 'interview_completed'
        """
    )
    op.execute(
        """
        INSERT INTO application_events (id, application_id, type, payload, created_at)
        SELECT gen_random_uuid(), id, 'stage_changed',
               jsonb_build_object('from', 'offer', 'to', 'withdrawn',
                                  'note', 'declined offer',
                                  'legacy_status', 'offer_declined'),
               updated_at
        FROM applications WHERE status::text = 'offer_declined'
        """
    )
    op.execute(
        """
        INSERT INTO application_events
            (id, application_id, type, actor_user_id, payload, created_at)
        SELECT gen_random_uuid(), d.application_id, 'email_sent', d.sent_by_user_id,
               jsonb_build_object('status', 'sent', 'template', 'legacy',
                                  'subject', d.subject, 'html', d.body,
                                  'sent_at', d.sent_at),
               coalesce(d.sent_at, d.updated_at)
        FROM email_drafts d WHERE d.is_sent
        """
    )

    # ---- reviews -------------------------------------------------------
    op.create_table(
        "application_reviews",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "application_id",
            sa.Uuid(),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "state", sa.String(20), nullable=False, server_default=sa.text("'pending'")
        ),
        sa.Column("fit", sa.String(10), nullable=True),
        sa.Column("summary", sa.String(140), nullable=True),
        sa.Column(
            "checks",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("flag_reason", sa.Text(), nullable=True),
        sa.Column("rank_score", sa.Float(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("triage", sa.String(20), nullable=True),
        sa.Column("tokens_in", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokens_out", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cost_npr", sa.Float(), nullable=False, server_default="0"),
        sa.Column("model", sa.String(120), nullable=True),
        sa.Column("prompt_version", sa.String(40), nullable=True),
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
    op.create_index(
        "ix_application_reviews_application_id",
        "application_reviews",
        ["application_id"],
        unique=True,
    )
    op.create_index("ix_application_reviews_fit", "application_reviews", ["fit"])
    op.execute(
        """
        INSERT INTO application_reviews
            (id, application_id, state, fit, summary, flag_reason, rank_score,
             attempts, model, prompt_version, created_at, updated_at)
        SELECT gen_random_uuid(), a.id,
            CASE
                WHEN a.ai_review_status = 'needs_human_review' THEN 'needs_person'
                WHEN a.ai_review_status = 'failed' THEN 'failed'
                WHEN a.ai_review_status = 'completed' THEN 'done'
                WHEN a.score IS NOT NULL OR a.strengths IS NOT NULL
                     OR a.weaknesses IS NOT NULL THEN 'done'
                ELSE 'pending'
            END,
            CASE
                WHEN a.score IS NULL THEN NULL
                WHEN a.score >= 75 THEN 'strong'
                WHEN a.score >= 50 THEN 'possible'
                ELSE 'weak'
            END,
            left(a.strengths ->> 0, 140),
            a.ai_flag_reason,
            a.score::float,
            a.ai_review_attempts,
            CASE WHEN a.score IS NULL AND a.strengths IS NULL THEN NULL
                 ELSE 'legacy' END,
            CASE WHEN a.score IS NULL AND a.strengths IS NULL THEN NULL
                 ELSE 'legacy-v1' END,
            a.created_at, a.updated_at
        FROM applications a
        """
    )
    # Exact copy of the old AI fields, for the timeline and the downgrade.
    op.execute(
        """
        INSERT INTO application_events (id, application_id, type, payload, created_at)
        SELECT gen_random_uuid(), id, 'review_done',
               jsonb_build_object('legacy', jsonb_build_object(
                   'score', score, 'strengths', strengths, 'weaknesses', weaknesses,
                   'ml_bouncer_score', ml_bouncer_score,
                   'ai_review_status', ai_review_status,
                   'ai_review_attempts', ai_review_attempts,
                   'ai_flag_reason', ai_flag_reason,
                   'shortlist_notified', shortlist_notified)),
               updated_at
        FROM applications
        WHERE score IS NOT NULL OR strengths IS NOT NULL OR weaknesses IS NOT NULL
           OR ml_bouncer_score IS NOT NULL OR ai_review_status IS NOT NULL
           OR shortlist_notified
        """
    )

    op.drop_index("ix_applications_score", table_name="applications")
    for column in (
        "status",
        "score",
        "strengths",
        "weaknesses",
        "ml_bouncer_score",
        "ai_review_status",
        "ai_review_attempts",
        "ai_flag_reason",
        "shortlist_notified",
    ):
        op.drop_column("applications", column)
    op.execute("DROP TYPE applicationstatus")

    # ---- outreach drafts -> decision emails -----------------------------
    op.drop_constraint(
        "activity_events_draft_id_fkey", "activity_events", type_="foreignkey"
    )
    op.execute("DROP INDEX IF EXISTS ix_activity_events_draft_id")
    op.drop_column("activity_events", "draft_id")
    op.drop_table("email_drafts")

    # ---- jobs ----------------------------------------------------------
    category_enum = postgresql.ENUM(*CATEGORIES, name="jobcategory")
    category_enum.create(bind)
    employment_enum = postgresql.ENUM(*EMPLOYMENT_TYPES, name="employmenttype")
    employment_enum.create(bind)
    op.add_column(
        "jobs",
        sa.Column(
            "category",
            category_enum,
            nullable=False,
            server_default=sa.text("'other'"),
        ),
    )
    op.create_index("ix_jobs_category", "jobs", ["category"])
    op.add_column(
        "jobs",
        sa.Column(
            "employment_type",
            employment_enum,
            nullable=False,
            server_default=sa.text("'full_time'"),
        ),
    )
    op.add_column(
        "jobs", sa.Column("description", sa.Text(), nullable=False, server_default="")
    )
    op.execute(f"UPDATE jobs SET description = {_description_sql()}")
    for column in ("must_haves", "nice_to_haves"):
        op.add_column(
            "jobs",
            sa.Column(
                column,
                postgresql.ARRAY(sa.String()),
                nullable=False,
                server_default="{}",
            ),
        )
    op.execute(
        """
        UPDATE jobs SET
            must_haves = (
                CASE WHEN required_years_of_experience IS NOT NULL THEN
                    ARRAY[required_years_of_experience || '+ years of relevant experience']
                ELSE '{}'::varchar[] END || requirements
            )[1:6],
            nice_to_haves = preferred_qualifications[1:6]
        """
    )
    op.add_column(
        "jobs",
        sa.Column(
            "questions",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.execute(
        """
        UPDATE jobs SET questions = coalesce((
            SELECT jsonb_agg(jsonb_build_object(
                'label', q, 'type', 'short_text', 'required', true) ORDER BY n)
            FROM unnest(screening_questions) WITH ORDINALITY AS t(q, n)
        ), '[]'::jsonb)
        """
    )
    op.add_column("jobs", sa.Column("closed_reason", sa.String(20), nullable=True))
    op.add_column(
        "jobs", sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "jobs", sa.Column("closes_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.execute("ALTER TYPE jobstatus RENAME TO jobstatus_v1")
    status_enum = postgresql.ENUM("draft", "open", "closed", name="jobstatus")
    status_enum.create(bind)
    op.add_column("jobs", sa.Column("status_v2", status_enum, nullable=True))
    op.execute(
        """
        UPDATE jobs SET
            status_v2 = (CASE
                WHEN hiring_completed THEN 'closed'
                WHEN status::text = 'draft' THEN 'draft'
                WHEN status::text = 'expired' THEN 'closed'
                WHEN expires_at IS NOT NULL AND expires_at <= now() THEN 'closed'
                ELSE 'open'
            END)::jobstatus,
            closed_reason = CASE
                WHEN hiring_completed THEN 'hired'
                WHEN status::text = 'expired' THEN 'expired'
                WHEN status::text = 'active' AND expires_at IS NOT NULL
                     AND expires_at <= now() THEN 'expired'
            END,
            closed_at = CASE
                WHEN hiring_completed THEN coalesce(hired_at, updated_at)
                WHEN status::text = 'expired'
                     OR (status::text = 'active' AND expires_at <= now())
                THEN coalesce(expires_at, updated_at)
            END,
            closes_at = CASE WHEN status::text = 'expired' OR hiring_completed
                             THEN NULL ELSE expires_at END
        """
    )
    op.drop_column("jobs", "status")
    op.alter_column("jobs", "status_v2", new_column_name="status")
    op.alter_column("jobs", "status", nullable=False, server_default=sa.text("'draft'"))
    op.create_index("ix_jobs_status", "jobs", ["status"])
    op.create_index("ix_jobs_closes_at", "jobs", ["closes_at"])
    op.create_index("ix_jobs_closed_at", "jobs", ["closed_at"])
    op.execute("DROP TYPE jobstatus_v1")
    op.drop_index("ix_jobs_expires_at", table_name="jobs")
    op.drop_index("ix_jobs_hired_at", table_name="jobs")
    for column in (
        "overview",
        "responsibilities",
        "requirements",
        "preferred_qualifications",
        "benefits",
        "screening_questions",
        "auto_shortlist",
        "shortlist_threshold",
        "shortlist_status",
        "final_shortlist_completed",
        "hiring_completed",
        "hired_at",
        "required_years_of_experience",
        "expires_at",
    ):
        op.drop_column("jobs", column)
    op.execute("DROP TYPE shortliststatus")
    op.alter_column("jobs", "currency", server_default="NPR")


_HEADING_TO_COLUMN = {heading: column for column, heading in SECTIONS}
_YEARS_RE = re.compile(r"^(\d+)\+ years of relevant experience$")


def _parse_description(text: str) -> dict:
    """Inverse of `_description_sql` for descriptions it produced."""
    out: dict = {column: [] for column, _ in SECTIONS}
    overview: list[str] = []
    current: str | None = None
    for block in (text or "").split("\n\n"):
        first, _, rest = block.partition("\n")
        heading = first[3:] if first.startswith("## ") else None
        if heading in _HEADING_TO_COLUMN:
            current = _HEADING_TO_COLUMN[heading]
            out[current] = [
                line[2:] for line in rest.split("\n") if line.startswith("- ")
            ]
        else:
            current = None
            overview.append(block)
    out["overview"] = "\n\n".join(overview) or None
    return out


def downgrade() -> None:
    bind = op.get_bind()

    # ---- jobs ----------------------------------------------------------
    shortlist_enum = postgresql.ENUM(
        "not_started", "in_progress", "completed", "failed", name="shortliststatus"
    )
    shortlist_enum.create(bind)
    op.add_column("jobs", sa.Column("overview", sa.Text(), nullable=True))
    for column, _ in SECTIONS:
        op.add_column(
            "jobs",
            sa.Column(
                column,
                postgresql.ARRAY(sa.String()),
                nullable=False,
                server_default="{}",
            ),
        )
    op.add_column(
        "jobs",
        sa.Column(
            "screening_questions",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "jobs",
        sa.Column(
            "auto_shortlist", sa.Boolean(), nullable=False, server_default="false"
        ),
    )
    op.add_column(
        "jobs",
        sa.Column(
            "shortlist_threshold", sa.Integer(), nullable=False, server_default="70"
        ),
    )
    op.add_column(
        "jobs",
        sa.Column(
            "shortlist_status",
            shortlist_enum,
            nullable=False,
            server_default=sa.text("'not_started'"),
        ),
    )
    op.add_column(
        "jobs",
        sa.Column(
            "final_shortlist_completed",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )
    op.add_column(
        "jobs",
        sa.Column(
            "hiring_completed", sa.Boolean(), nullable=False, server_default="false"
        ),
    )
    op.add_column("jobs", sa.Column("hired_at", sa.DateTime(timezone=True)))
    op.add_column("jobs", sa.Column("required_years_of_experience", sa.Integer()))
    op.add_column("jobs", sa.Column("expires_at", sa.DateTime(timezone=True)))

    rows = bind.execute(
        sa.text(
            "SELECT id, description, must_haves, nice_to_haves, questions FROM jobs"
        )
    ).all()
    for job_id, description, must_haves, nice_to_haves, questions in rows:
        parsed = _parse_description(description or "")
        years = None
        if must_haves:
            match = _YEARS_RE.match(must_haves[0])
            if match:
                years = int(match.group(1))
        if not parsed["requirements"]:
            parsed["requirements"] = [
                m for m in must_haves or [] if not _YEARS_RE.match(m)
            ]
        if not parsed["preferred_qualifications"]:
            parsed["preferred_qualifications"] = list(nice_to_haves or [])
        bind.execute(
            sa.text(
                "UPDATE jobs SET overview = :overview, responsibilities = :resp, "
                "requirements = :req, preferred_qualifications = :pref, "
                "benefits = :benefits, screening_questions = :questions, "
                "required_years_of_experience = :years WHERE id = :id"
            ),
            {
                "id": job_id,
                "overview": parsed["overview"],
                "resp": parsed["responsibilities"],
                "req": parsed["requirements"],
                "pref": parsed["preferred_qualifications"],
                "benefits": parsed["benefits"],
                "questions": [q.get("label", "") for q in (questions or [])],
                "years": years,
            },
        )

    op.execute("ALTER TYPE jobstatus RENAME TO jobstatus_v2")
    status_enum = postgresql.ENUM("draft", "active", "expired", name="jobstatus")
    status_enum.create(bind)
    op.add_column("jobs", sa.Column("status_v1", status_enum, nullable=True))
    op.execute(
        """
        UPDATE jobs SET
            status_v1 = (CASE status::text
                WHEN 'draft' THEN 'draft'
                WHEN 'open' THEN 'active'
                ELSE 'expired' END)::jobstatus,
            hiring_completed = coalesce(closed_reason = 'hired', false),
            hired_at = CASE WHEN closed_reason = 'hired' THEN closed_at END,
            final_shortlist_completed = (status::text = 'closed'),
            shortlist_status = (CASE WHEN status::text = 'closed'
                THEN 'completed' ELSE 'not_started' END)::shortliststatus,
            expires_at = CASE
                WHEN status::text = 'closed'
                     AND closed_reason IS DISTINCT FROM 'hired' THEN closed_at
                ELSE closes_at END
        """
    )
    op.drop_index("ix_jobs_status", table_name="jobs")
    op.drop_index("ix_jobs_closes_at", table_name="jobs")
    op.drop_index("ix_jobs_closed_at", table_name="jobs")
    op.drop_index("ix_jobs_category", table_name="jobs")
    for column in (
        "status",
        "closed_reason",
        "closed_at",
        "closes_at",
        "description",
        "must_haves",
        "nice_to_haves",
        "questions",
        "category",
        "employment_type",
    ):
        op.drop_column("jobs", column)
    op.alter_column("jobs", "status_v1", new_column_name="status")
    op.alter_column("jobs", "status", nullable=False, server_default=sa.text("'draft'"))
    op.execute("DROP TYPE jobstatus_v2")
    op.execute("DROP TYPE jobcategory")
    op.execute("DROP TYPE employmenttype")
    op.create_index("ix_jobs_expires_at", "jobs", ["expires_at"])
    op.create_index("ix_jobs_hired_at", "jobs", ["hired_at"])
    op.alter_column("jobs", "currency", server_default="USD")

    # ---- outreach drafts ------------------------------------------------
    op.create_table(
        "email_drafts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "application_id",
            sa.Uuid(),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("subject", sa.String(255)),
        sa.Column("body", sa.Text()),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_sent", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_discarded", sa.Boolean(), nullable=False, server_default="false"),
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
        sa.Column(
            "generated_by_user_id",
            sa.Uuid(),
            sa.ForeignKey(
                "users.id",
                ondelete="SET NULL",
                name="fk_email_drafts_generated_by_user",
            ),
        ),
        sa.Column(
            "approved_by_user_id",
            sa.Uuid(),
            sa.ForeignKey(
                "users.id", ondelete="SET NULL", name="fk_email_drafts_approved_by_user"
            ),
        ),
        sa.Column("approved_at", sa.DateTime(timezone=True)),
        sa.Column(
            "sent_by_user_id",
            sa.Uuid(),
            sa.ForeignKey(
                "users.id", ondelete="SET NULL", name="fk_email_drafts_sent_by_user"
            ),
        ),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column(
            "discarded_by_user_id",
            sa.Uuid(),
            sa.ForeignKey(
                "users.id",
                ondelete="SET NULL",
                name="fk_email_drafts_discarded_by_user",
            ),
        ),
        sa.Column("discarded_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("application_id", name="uq_email_draft_application"),
    )
    op.create_index(
        "ix_email_drafts_application_id",
        "email_drafts",
        ["application_id"],
        unique=True,
    )
    op.execute(
        """
        INSERT INTO email_drafts (id, application_id, subject, body, is_approved,
            is_sent, sent_by_user_id, sent_at, created_at, updated_at)
        SELECT DISTINCT ON (application_id) gen_random_uuid(), application_id,
            left(payload ->> 'subject', 255), payload ->> 'html', true, true,
            actor_user_id, created_at, created_at, created_at
        FROM application_events WHERE type = 'email_sent'
        ORDER BY application_id, created_at DESC
        """
    )
    op.add_column(
        "activity_events",
        sa.Column(
            "draft_id",
            sa.Uuid(),
            sa.ForeignKey(
                "email_drafts.id",
                ondelete="CASCADE",
                name="activity_events_draft_id_fkey",
            ),
            nullable=True,
        ),
    )
    op.create_index("ix_activity_events_draft_id", "activity_events", ["draft_id"])

    # ---- applications ---------------------------------------------------
    status_enum = postgresql.ENUM(*OLD_STATUSES, name="applicationstatus")
    status_enum.create(bind)
    op.add_column("applications", sa.Column("status", status_enum, nullable=True))
    op.add_column("applications", sa.Column("score", sa.Integer()))
    op.add_column("applications", sa.Column("strengths", postgresql.JSONB()))
    op.add_column("applications", sa.Column("weaknesses", postgresql.JSONB()))
    op.add_column("applications", sa.Column("ml_bouncer_score", sa.Float()))
    op.add_column("applications", sa.Column("ai_review_status", sa.Text()))
    op.add_column(
        "applications",
        sa.Column(
            "ai_review_attempts", sa.Integer(), nullable=False, server_default="0"
        ),
    )
    op.add_column("applications", sa.Column("ai_flag_reason", sa.Text()))
    op.add_column(
        "applications",
        sa.Column(
            "shortlist_notified", sa.Boolean(), nullable=False, server_default="false"
        ),
    )
    op.execute(
        """
        UPDATE applications a SET status = (CASE a.stage::text
            WHEN 'new' THEN 'applied'
            WHEN 'shortlisted' THEN 'shortlisted'
            WHEN 'interview' THEN CASE WHEN EXISTS (
                SELECT 1 FROM application_events e
                WHERE e.application_id = a.id AND e.type = 'interview_done')
                THEN 'interview_completed' ELSE 'interview_booked' END
            WHEN 'offer' THEN 'offer'
            WHEN 'hired' THEN 'offer_accepted'
            WHEN 'withdrawn' THEN CASE WHEN EXISTS (
                SELECT 1 FROM application_events e
                WHERE e.application_id = a.id AND e.type = 'stage_changed'
                  AND e.payload ->> 'legacy_status' = 'offer_declined')
                THEN 'offer_declined' ELSE 'rejected' END
            ELSE 'rejected' END)::applicationstatus
        """
    )
    # Review fields: exact legacy copy where present, else from the review.
    op.execute(
        """
        UPDATE applications a SET
            score = r.rank_score::int,
            strengths = CASE WHEN r.summary IS NOT NULL
                             THEN jsonb_build_array(r.summary) END,
            ai_review_status = CASE r.state
                WHEN 'done' THEN 'completed'
                WHEN 'needs_person' THEN 'needs_human_review'
                WHEN 'failed' THEN 'failed'
                ELSE NULL END,
            ai_review_attempts = r.attempts,
            ai_flag_reason = r.flag_reason
        FROM application_reviews r WHERE r.application_id = a.id
          AND (r.model IS NULL OR r.model <> 'legacy')
          AND r.state <> 'pending'
        """
    )
    op.execute(
        """
        UPDATE applications a SET
            score = (l ->> 'score')::int,
            strengths = CASE WHEN jsonb_typeof(l -> 'strengths') = 'null'
                             THEN NULL ELSE l -> 'strengths' END,
            weaknesses = CASE WHEN jsonb_typeof(l -> 'weaknesses') = 'null'
                              THEN NULL ELSE l -> 'weaknesses' END,
            ml_bouncer_score = (l ->> 'ml_bouncer_score')::float,
            ai_review_status = l ->> 'ai_review_status',
            ai_review_attempts = coalesce((l ->> 'ai_review_attempts')::int, 0),
            ai_flag_reason = l ->> 'ai_flag_reason',
            shortlist_notified = coalesce((l ->> 'shortlist_notified')::bool, false)
        FROM (
            SELECT application_id, payload -> 'legacy' AS l
            FROM application_events
            WHERE type = 'review_done' AND payload ? 'legacy'
        ) e WHERE e.application_id = a.id
        """
    )
    op.alter_column(
        "applications",
        "status",
        nullable=False,
        server_default=sa.text("'applied'"),
    )
    op.create_index("ix_applications_score", "applications", ["score"])
    op.drop_index("ix_applications_stage", table_name="applications")
    op.execute(
        """
        UPDATE applications a SET source = 'platform' FROM application_events e
        WHERE e.application_id = a.id AND e.type = 'applied'
          AND e.payload ->> 'source' = 'platform'
        """
    )
    op.execute(
        "UPDATE applications SET source = 'other' WHERE source NOT IN "
        "('linkedin', 'facebook', 'merojob', 'direct', 'other', 'platform')"
    )
    op.alter_column("applications", "source", server_default="platform")
    op.drop_index("ix_applications_referrer_id", table_name="applications")
    for column in (
        "stage",
        "decided_by",
        "decided_at",
        "rejected_reason",
        "referrer_id",
    ):
        op.drop_column("applications", column)
    op.execute("DROP TYPE applicationstage")
    op.drop_table("application_reviews")
    op.drop_table("application_events")
    op.drop_table("job_referrers")
    # Answers-only applications have no resume and cannot exist in v1.
    op.execute("DELETE FROM applications WHERE resume_id IS NULL")
    op.alter_column(
        "applications", "resume_id", existing_type=sa.Uuid(), nullable=False
    )

    # ---- people ---------------------------------------------------------
    op.drop_constraint("uq_users_phone", "users", type_="unique")
    op.drop_column("users", "phone")
    op.execute("DELETE FROM users WHERE email IS NULL")
    op.alter_column("users", "email", existing_type=sa.String(255), nullable=False)
