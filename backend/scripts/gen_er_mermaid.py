"""Generate per-subsystem Mermaid erDiagram blocks from SQLAlchemy metadata.

Run:
    uv run python backend/scripts/gen_er_mermaid.py
"""

from __future__ import annotations

import importlib
import sys
from pathlib import Path

# Make `app` importable when run from repo root or backend/.
REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Import every module that registers tables with Base.metadata.
MODEL_MODULES = [
    "app.modules.auth.models",
    "app.modules.companies.models",
    "app.modules.profiles.models",
    "app.modules.resumes.models",
    "app.modules.jobs.models",
    "app.modules.applications.models",
    "app.modules.job_ai.models",
    "app.modules.interviews.models",
    "app.modules.interviews.recording_model",
    "app.modules.interviews.evaluation_models",
    "app.modules.outreach.models",
    "app.modules.recruiter_chat.models",
    "app.modules.recruiter_preferences.models",
    "app.modules.notifications.models",
    "app.modules.audit.models",
    "app.modules.activity.models",
]
for mod in MODEL_MODULES:
    try:
        importlib.import_module(mod)
    except Exception as exc:  # pragma: no cover
        print(f"# WARN: failed to import {mod}: {exc}", file=sys.stderr)

from app.core.database import Base  # noqa: E402

SUBSYSTEMS: list[tuple[str, list[str]]] = [
    (
        "Subsystem 1 - Authentication, User and Company Management",
        [
            "users",
            "oauth_accounts",
            "refresh_tokens",
            "companies",
            "company_memberships",
        ],
    ),
    (
        "Subsystem 2 - Shortlisting (Jobs and Applications)",
        ["jobs", "applications", "job_sync_events"],
    ),
    (
        "Subsystem 3 - Recruiter Chat",
        ["recruiter_chat_sessions", "recruiter_preferences"],
    ),
    (
        "Subsystem 4 - Resumes and Profiles",
        [
            "profiles",
            "profile_experiences",
            "profile_educations",
            "profile_skills",
            "resumes",
            "resume_experiences",
            "resume_educations",
            "resume_skills",
            "resume_import_tasks",
        ],
    ),
    (
        "Subsystem 5 - Interview Recording and Evaluation",
        [
            "interview_recordings",
            "job_evaluation_schemas",
            "candidate_evaluation_scores",
        ],
    ),
    (
        "Subsystem 6 - AI Job Drafting",
        ["job_ai_drafts"],
    ),
    (
        "Subsystem 7 - Outreach and Interview Scheduling",
        ["email_drafts", "interviews"],
    ),
    (
        "Cross-cutting - Notifications, Audit, Activity",
        ["notifications", "audit_logs", "activity_events"],
    ),
]


def _col_type(col) -> str:
    type_name = type(col.type).__name__.upper()
    return type_name.replace(" ", "_")[:24]


def _safe(name: str) -> str:
    # Mermaid erDiagram entity names must be alnum/underscore.
    return name


MAX_COLS_PER_TABLE = 10
BUSINESS_KEY_NAMES = {
    "status",
    "role",
    "type",
    "state",
    "mode",
    "action",
    "evaluator_type",
    "primary_role",
    "shortlist_status",
    "auto_shortlist",
    "is_email_verified",
    "is_onboarded",
    "is_deleted",
    "is_approved",
    "is_sent",
    "is_discarded",
    "is_open_to_work",
    "title",
    "name",
    "email",
    "expires_at",
    "score",
    "ml_bouncer_score",
    "weighted_total",
    "shortlist_threshold",
    "human_weight",
    "llm_weight",
    "start_time",
    "end_time",
    "cal_booking_uid",
    "thread_id",
    "version",
    "transcript",
}


def _select_columns(tbl) -> list:
    selected: list = []
    seen: set[str] = set()
    # Pass 1: PK + FK + UK + enum + business keys.
    for col in tbl.columns:
        is_fk = bool(col.foreign_keys)
        is_unique = bool(getattr(col, "unique", False))
        kind = type(col.type).__name__
        is_enum = kind.upper() == "ENUM"
        business = col.name in BUSINESS_KEY_NAMES
        if col.primary_key or is_fk or is_unique or is_enum or business:
            if col.name not in seen:
                selected.append(col)
                seen.add(col.name)
    # Cap.
    return selected[:MAX_COLS_PER_TABLE]


def render_subsystem(title: str, tables: list[str]) -> str:
    tbls = {t.name: t for t in Base.metadata.sorted_tables if t.name in tables}
    missing = [t for t in tables if t not in tbls]
    lines: list[str] = []
    lines.append(f"%% {title}")
    lines.append("erDiagram")
    for tname, tbl in tbls.items():
        lines.append(f"    {_safe(tname)} {{")
        for col in _select_columns(tbl):
            kind = _col_type(col)
            tag = ""
            if col.primary_key:
                tag = "PK"
            elif col.foreign_keys:
                tag = "FK"
            elif getattr(col, "unique", False):
                tag = "UK"
            suffix = f" {tag}" if tag else ""
            lines.append(f"        {kind} {col.name}{suffix}")
        lines.append("    }")
    # Relationships from FKs.
    seen: set[tuple[str, str, str]] = set()
    for tname, tbl in tbls.items():
        for fk in tbl.foreign_keys:
            target = fk.column.table.name
            if target not in tbls:
                continue
            key = (target, tname, fk.parent.name)
            if key in seen:
                continue
            seen.add(key)
            optional = fk.parent.nullable
            # one parent to many children
            rel = "||--o{" if optional else "||--|{"
            lines.append(f'    {target} {rel} {tname} : "{fk.parent.name}"')
    if missing:
        lines.append(f"%% NOTE missing tables: {', '.join(missing)}")
    return "\n".join(lines)


def main() -> None:
    out: list[str] = []
    for title, tables in SUBSYSTEMS:
        out.append(render_subsystem(title, tables))
        out.append("")
    print("\n".join(out))


if __name__ == "__main__":
    main()
