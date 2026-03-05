"use client";

import { useState } from "react";

// ── Modal for naming a new resume before creation ─────────────────────────

export default function CreateResumeModal({
  onConfirm,
  onCancel,
  isLoading,
  error,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal__header">
          <h3 className="modal__title">Create New Resume</h3>
          <button
            className="modal__close"
            onClick={onCancel}
            aria-label="Close"
          >
            x
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="resume-field">
              <label className="resume-field__label">Resume Name</label>
              <input
                className="resume-field__input"
                autoFocus
                placeholder="e.g. Frontend Engineer at Acme"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
              <p className="resume-field__hint">
                Your profile data will be used to pre-fill the resume.
              </p>
            </div>
            {error && <p className="resume-field__error">{error}</p>}
          </div>
          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Creating..." : "Create Resume"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
