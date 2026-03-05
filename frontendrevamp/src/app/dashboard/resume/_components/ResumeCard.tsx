"use client";

import type { Resume } from "@/lib/types/resume";

// ── Resume card shown in the grid list ────────────────────────────────────

export default function ResumeCard({
  resume,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  isViewing,
}: {
  resume: Resume;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  isViewing: boolean;
}) {
  return (
    <div className="resume-card">
      <div
        className="resume-card__preview"
        onClick={onView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onView()}
      >
        <div className="resume-card__preview-inner">
          <div className="resume-card__preview-name">
            {resume.fullName || resume.name}
          </div>
          <div className="resume-card__preview-headline">{resume.headline}</div>
          <div className="resume-card__preview-divider" />
          <div className="resume-card__preview-body">
            {resume.summary
              ? resume.summary.slice(0, 120) + "\u2026"
              : "No summary yet."}
          </div>
        </div>
      </div>
      <div className="resume-card__info">
        <div className="resume-card__name">{resume.name}</div>
        <div className="resume-card__meta">
          {resume.targetRole && <span>{resume.targetRole}</span>}
          {resume.targetRole && (
            <span className="resume-card__sep">&middot;</span>
          )}
          <span>Updated {resume.updatedAt}</span>
        </div>
        <div className="resume-card__actions">
          <button
            className="btn btn--outline btn--sm"
            onClick={onView}
            disabled={isViewing}
          >
            {isViewing ? "Loading\u2026" : "View"}
          </button>
          <button className="btn btn--primary btn--sm" onClick={onEdit}>
            Edit
          </button>
          <button
            className="btn btn--accent btn--sm"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting\u2026" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
